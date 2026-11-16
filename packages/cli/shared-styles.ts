// The classes a helper's stylesheet styles for the patterns that share it, the
// ones under its own prefix, h<folder>: auth-form.css's .hauth-form and
// .hauth-form-title. Not a component's class it only places, such as .hbutton
// in :where(.hauth-form) > .hbutton, or one a comment names, so a pattern that
// uses Button but none of the helper's classes doesn't get the helper's file.
export const sharedClasses = (folder: string, css: string) => {
  const prefix = `h${folder}`;
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    ...new Set(
      [...rules.matchAll(/\.(h[a-z][a-z0-9-]*)/g)]
        .map(([, name = ""]) => name)
        .filter((name) => name === prefix || name.startsWith(`${prefix}-`)),
    ),
  ];
};
