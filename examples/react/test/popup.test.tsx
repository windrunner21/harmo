import { describe, expect, test } from "bun:test";
import { useContext, type KeyboardEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Popup, PopupTriggerContext } from "../../../packages/react/src/Popup.tsx";

// What docs/components/popup.md says of the React Popup's trigger: your
// onKeyDown on it runs first, and then what's in the popup takes the key, as
// a Select's list does, unless yours called preventDefault(). A Down on the
// trigger, after one render, which keeps what each got.
const pressDown = (onKeyDown: (event: KeyboardEvent<HTMLElement>) => void) => {
  const calls: string[] = [];
  let pressed: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  const Trigger = (props: { onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void }) => {
    pressed = props.onKeyDown;
    return null;
  };
  const List = () => {
    const trigger = useContext(PopupTriggerContext);
    if (trigger) trigger.keys.current = (event) => calls.push(`list ${event.key}`);
    return null;
  };
  renderToStaticMarkup(
    <Popup
      trigger={
        <Trigger
          onKeyDown={(event) => {
            calls.push(`app ${event.key}`);
            onKeyDown(event);
          }}
        />
      }
    >
      <List />
    </Popup>,
  );

  let prevented = false;
  pressed?.({
    key: "ArrowDown",
    nativeEvent: { key: "ArrowDown" },
    get defaultPrevented() {
      return prevented;
    },
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as KeyboardEvent<HTMLElement>);
  return calls;
};

describe("Popup", () => {
  test("your onKeyDown on its trigger runs before what's in the popup takes the key", () => {
    expect(pressDown(() => {})).toEqual(["app ArrowDown", "list ArrowDown"]);
  });

  test("preventDefault() in your onKeyDown on its trigger keeps the key from what's in the popup", () => {
    expect(pressDown((event) => event.preventDefault())).toEqual(["app ArrowDown"]);
  });
});
