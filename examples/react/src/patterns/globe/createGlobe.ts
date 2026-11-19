import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Spherical,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { isLand } from "./land.ts";

export interface GlobePlace {
  lat: number;
  lon: number;
}

export interface GlobeRoute {
  from: GlobePlace;
  to: GlobePlace;
}

export interface GlobeOptions {
  routes?: GlobeRoute[];
  center?: GlobePlace;
  autoRotate?: boolean;
  dragRotate?: boolean;
  paused?: boolean;
  onUnavailable?: () => void;
}

export interface GlobeHandle {
  setPaused: (paused: boolean) => void;
  turn: (degrees: number) => void;
  destroy: () => void;
}

const radius = 20;
const distance = 80;
const fov = 32;
const dotCount = 16000;
const dotSize = 0.24;
const lightSize = 0.7;
const markerSize = 0.5;
const pixelBudget = 1024 * 1024;
const turnDuration = 400;
const spinSpeed = (Math.PI * 2) / 100;

const toVector = ({ lat, lon }: GlobePlace, length = radius) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new Vector3(
    -length * Math.sin(phi) * Math.cos(theta),
    length * Math.cos(phi),
    length * Math.sin(phi) * Math.sin(theta),
  );
};

let landTemplate: BufferGeometry | undefined;

const landDots = () => {
  if (landTemplate) return landTemplate.clone();
  const positions: number[] = [];
  const phases: number[] = [];
  const turn = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < dotCount; index++) {
    const y = 1 - (index / (dotCount - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const x = Math.cos(turn * index) * ring;
    const z = Math.sin(turn * index) * ring;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (Math.atan2(z, -x) * 180) / Math.PI - 180;
    if (!isLand(lat, lon)) continue;
    positions.push(x * radius, y * radius, z * radius);
    phases.push(Math.random() * Math.PI * 2);
  }
  landTemplate = new BufferGeometry();
  landTemplate.setAttribute("position", new Float32BufferAttribute(positions, 3));
  landTemplate.setAttribute("phase", new Float32BufferAttribute(phases, 1));
  return landTemplate.clone();
};

const vertexShader = `
  uniform float uSize;
  uniform float uScale;
  uniform float uTime;
  uniform float uTwinkle;
  attribute float phase;
  varying float vAlpha;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec3 outward = normalize(normalMatrix * normalize(position));
    float facing = dot(outward, normalize(-view.xyz));
    if (facing <= 0.0) {
      vAlpha = 0.0;
      gl_PointSize = 1.0;
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      return;
    }
    float twinkle = 1.0 - uTwinkle * 0.5 * (1.0 + sin(uTime * 1.4 + phase));
    vAlpha = smoothstep(0.0, 0.4, facing) * twinkle;
    gl_PointSize = uSize * uScale / -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 offset = gl_PointCoord - 0.5;
    if (dot(offset, offset) > 0.25) discard;
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

const pointsMaterial = (size: number, twinkle: number) =>
  new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
      uSize: { value: size },
      uScale: { value: 1 },
      uTime: { value: 0 },
      uTwinkle: { value: twinkle },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });

const zeros = (count: number) => new Float32BufferAttribute(new Float32Array(count), 1);

const arcOf = ({ from, to }: GlobeRoute) => {
  const start = toVector(from).normalize();
  const end = toVector(to).normalize();
  const angle = start.angleTo(end);
  const axis = new Vector3().crossVectors(start, end);
  if (axis.lengthSq() < 1e-10) axis.set(0, 1, 0).cross(start);
  if (axis.lengthSq() < 1e-10) axis.set(1, 0, 0);
  axis.normalize();
  const lift = radius * Math.min(0.12, 0.03 + angle * 0.04);
  const points: Vector3[] = [];
  for (let step = 0; step <= 64; step++) {
    const t = step / 64;
    const point = start.clone().applyAxisAngle(axis, angle * t);
    points.push(point.multiplyScalar(radius + lift * Math.sin(Math.PI * t)));
  }
  return points;
};

const pointOn = (points: Vector3[], t: number, into: Vector3) => {
  const at = t * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(at));
  return into.lerpVectors(points[index] as Vector3, points[index + 1] as Vector3, at - index);
};

const painter = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.getContext("2d", { willReadFrequently: true });
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const build = (canvas: HTMLCanvasElement, routes: GlobeRoute[], center: GlobePlace, dragRotate: boolean) => {
  const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
  if (!context) return null;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, 1, 1, 400);
  camera.position.copy(toVector(center, distance));
  camera.lookAt(0, 0, 0);

  const sphereMaterial = new MeshBasicMaterial();
  scene.add(new Mesh(new SphereGeometry(radius - 0.4, 48, 32), sphereMaterial));

  const dotsMaterial = pointsMaterial(dotSize, 0.35);
  scene.add(new Points(landDots(), dotsMaterial));

  const arcs = routes.map(arcOf);
  const routeMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.85 });
  for (const arc of arcs) scene.add(new Line(new BufferGeometry().setFromPoints(arc), routeMaterial));

  const markersMaterial = pointsMaterial(markerSize, 0);
  const markers = new Points(
    new BufferGeometry().setFromPoints(routes.flatMap(({ from, to }) => [toVector(from), toVector(to)])),
    markersMaterial,
  );
  markers.geometry.setAttribute("phase", zeros(routes.length * 2));
  markers.visible = routes.length > 0;
  scene.add(markers);

  const lightsMaterial = pointsMaterial(lightSize, 0);
  const lights = new Points(new BufferGeometry().setFromPoints(arcs.map((arc) => arc[0] as Vector3)), lightsMaterial);
  lights.geometry.setAttribute("phase", zeros(arcs.length));
  const lightPositions = lights.geometry.getAttribute("position");
  if ("setUsage" in lightPositions) lightPositions.setUsage(DynamicDrawUsage);
  scene.add(lights);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5;
  const polar = ((90 - center.lat) * Math.PI) / 180;
  controls.minPolarAngle = Math.min(Math.PI / 2 - 0.6, polar);
  controls.maxPolarAngle = Math.max(Math.PI / 2 + 0.6, polar);
  if (dragRotate) {
    controls.cursorStyle = "grab";
    canvas.style.touchAction = "pan-y";
  } else {
    controls.disconnect();
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    sphereMaterial,
    dotsMaterial,
    routeMaterial,
    markersMaterial,
    lightsMaterial,
    lights,
    lightPositions,
    arcs,
    progress: arcs.map((_, index) => index / Math.max(arcs.length, 1)),
    point: new Vector3(),
    spherical: new Spherical(),
  };
};

type View = NonNullable<ReturnType<typeof build>>;

export const createGlobe = (
  canvas: HTMLCanvasElement,
  {
    routes = [],
    center = { lat: 20, lon: 0 },
    autoRotate = true,
    dragRotate = true,
    paused: startPaused = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    onUnavailable,
  }: GlobeOptions = {},
): GlobeHandle => {
  const container = canvas.parentElement ?? canvas;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let view: View | null | undefined;
  let paused = startPaused;
  let intersecting = false;
  let destroyed = false;
  let pending = 0;
  let last = 0;
  let sized = false;
  let colored = false;
  let turning: { from: number; to: number; start: number } | undefined;
  let queued = 0;
  let dragging = false;
  let lost = false;

  const active = () => intersecting && !document.hidden && !destroyed && !lost;
  const moving = autoRotate || routes.length > 0;
  const still = () => paused || !moving;

  const probe = document.createElement("span");
  probe.hidden = true;
  container.append(probe);
  const paint = painter();
  const colorOf = (variable: string, into: Color) => {
    probe.style.color = `var(${variable})`;
    if (!paint) return 1;
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = getComputedStyle(probe).color;
    paint.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0, alpha = 0] = paint.getImageData(0, 0, 1, 1).data;
    into.setRGB(red / 255, green / 255, blue / 255, SRGBColorSpace);
    return alpha / 255;
  };

  const recolor = (globe: View) => {
    globe.sphereMaterial.opacity = colorOf("--hglobe-sphere-color", globe.sphereMaterial.color);
    globe.sphereMaterial.transparent = globe.sphereMaterial.opacity < 1;
    globe.dotsMaterial.uniforms.uOpacity!.value = colorOf("--hglobe-dot-color", globe.dotsMaterial.uniforms.uColor!.value);
    const alpha = colorOf("--hglobe-route-color", globe.routeMaterial.color);
    globe.routeMaterial.opacity = 0.85 * alpha;
    for (const material of [globe.markersMaterial, globe.lightsMaterial]) {
      material.uniforms.uColor!.value.copy(globe.routeMaterial.color);
      material.uniforms.uOpacity!.value = alpha;
    }
  };

  const resize = (globe: View) => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return false;
    const density = Math.min(window.devicePixelRatio, 2, Math.sqrt(pixelBudget / (width * height)));
    globe.renderer.setDrawingBufferSize(width, height, density);
    globe.camera.aspect = width / height;
    globe.camera.updateProjectionMatrix();
    const scale = (height * density) / (2 * Math.tan((fov * Math.PI) / 360));
    for (const material of [globe.dotsMaterial, globe.markersMaterial, globe.lightsMaterial]) material.uniforms.uScale!.value = scale;
    return true;
  };

  const settle = () => {
    if (!view) return;
    view.controls.enableDamping = !reduced.matches;
    view.lights.visible = !still() && view.arcs.length > 0;
    view.dotsMaterial.uniforms.uTwinkle!.value = still() ? 0 : 0.35;
  };

  const face = (globe: View, theta: number) => {
    globe.spherical.setFromVector3(globe.camera.position);
    globe.spherical.theta = theta;
    globe.camera.position.setFromSpherical(globe.spherical);
    globe.camera.lookAt(0, 0, 0);
  };

  const advance = (globe: View, time: number) => {
    const seconds = last ? Math.min((time - last) / 1000, 0.1) : 0;
    last = time;
    if (turning) {
      const t = Math.min(1, (time - turning.start) / turnDuration);
      face(globe, turning.from + (turning.to - turning.from) * easeInOut(t));
      if (t >= 1) turning = undefined;
    } else if (!paused && autoRotate && !dragging) {
      face(globe, globe.spherical.setFromVector3(globe.camera.position).theta + spinSpeed * seconds);
    }
    const changed = globe.controls.update(seconds);
    if (still()) return changed;
    globe.dotsMaterial.uniforms.uTime!.value += seconds;
    globe.arcs.forEach((arc, index) => {
      const at = ((globe.progress[index] ?? 0) + seconds * 0.22) % 1;
      globe.progress[index] = at;
      pointOn(arc, at, globe.point);
      globe.lightPositions.setXYZ(index, globe.point.x, globe.point.y, globe.point.z);
    });
    if (globe.arcs.length > 0) globe.lightPositions.needsUpdate = true;
    return true;
  };

  const request = () => {
    if (!pending && active()) pending = requestAnimationFrame(frame);
  };
  const onChange = () => request();
  const onStart = () => {
    dragging = true;
    turning = undefined;
  };
  const onEnd = () => {
    dragging = false;
    request();
  };

  function frame(time: number) {
    pending = 0;
    if (!active()) return;
    if (view === undefined) {
      view = build(canvas, routes, center, dragRotate);
      if (view === null) {
        onUnavailable?.();
        return;
      }
      view.controls.addEventListener("change", onChange);
      view.controls.addEventListener("start", onStart);
      view.controls.addEventListener("end", onEnd);
      if (queued) {
        face(view, view.spherical.setFromVector3(view.camera.position).theta + (queued * Math.PI) / 180);
        queued = 0;
      }
      settle();
    }
    if (!view) return;
    if (!sized) sized = resize(view);
    if (!sized) return;
    if (!colored) {
      recolor(view);
      colored = true;
    }
    const changed = advance(view, time);
    view.renderer.render(view.scene, view.camera);
    if (!still() || turning || changed) request();
    else last = 0;
  }

  const wake = () => {
    cancelAnimationFrame(pending);
    pending = 0;
    last = 0;
    request();
  };

  const sizes = new ResizeObserver(() => {
    sized = false;
    request();
  });
  sizes.observe(container);

  const seen = new IntersectionObserver(([entry]) => {
    intersecting = entry?.isIntersecting ?? false;
    if (view) view.controls.enabled = intersecting;
    wake();
  });
  seen.observe(container);

  const onVisibility = () => wake();
  document.addEventListener("visibilitychange", onVisibility);

  const onScheme = () => {
    colored = false;
    request();
  };
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", onScheme);
  const themed = new MutationObserver(onScheme);
  themed.observe(document.documentElement, { attributes: true });
  if (document.body) themed.observe(document.body, { attributes: true });
  const host = container.closest(".hglobe");
  if (host) themed.observe(host, { attributes: true, attributeFilter: ["class", "style"] });

  let density: MediaQueryList | undefined;
  const onDensity = () => {
    sized = false;
    request();
    watchDensity();
  };
  const watchDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    density.addEventListener("change", onDensity);
  };
  watchDensity();

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(pending);
    pending = 0;
  };
  const onRestored = () => {
    lost = false;
    sized = false;
    colored = false;
    wake();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    setPaused: (next) => {
      if (paused === next) return;
      paused = next;
      settle();
      wake();
    },
    turn: (degrees) => {
      if (!view) {
        queued += degrees;
        return;
      }
      const now = performance.now();
      const from = view.spherical.setFromVector3(view.camera.position).theta;
      const left = turning ? turning.to - from : 0;
      const to = from + left - Math.PI * 2 * Math.round(left / (Math.PI * 2)) + (degrees * Math.PI) / 180;
      turning = reduced.matches ? { from: to, to, start: now - turnDuration } : { from, to, start: now };
      wake();
    },
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(pending);
      sizes.disconnect();
      seen.disconnect();
      themed.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scheme.removeEventListener("change", onScheme);
      density?.removeEventListener("change", onDensity);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      probe.remove();
      if (!view) return;
      view.controls.removeEventListener("change", onChange);
      view.controls.removeEventListener("start", onStart);
      view.controls.removeEventListener("end", onEnd);
      view.controls.dispose();
      view.scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Points || object instanceof Line) object.geometry.dispose();
      });
      for (const material of [view.sphereMaterial, view.dotsMaterial, view.routeMaterial, view.markersMaterial, view.lightsMaterial]) {
        material.dispose();
      }
      view.renderer.dispose();
      const retired = view.renderer.getContext();
      queueMicrotask(() => {
        if (!canvas.isConnected) retired.getExtension("WEBGL_lose_context")?.loseContext();
      });
    },
  };
};
