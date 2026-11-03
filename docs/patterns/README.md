# Patterns

Reusable compositions built from Harmo primitives. Patterns arrange controls
and text for a recurring product situation; they are not primitive controls
and do not replace the individual components they contain.

| Pattern | Page |
| --- | --- |
| Settings list | [settings.md](settings.md) |

## Loading the CSS

`@harmo-ui/css` (`index.css`) contains the token defaults, every component, and
every pattern. For per-file imports, load `tokens.css` once, then the pattern
and the controls it holds.

| File | Also load |
| --- | --- |
| `settings.css` | The controls it holds, such as `switch.css` |
