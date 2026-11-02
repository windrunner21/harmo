// Every component's React examples, keyed by the HTML examples' titles:
// what the build renders, the browser hydrates, and the markup test checks.

import type { ComponentType } from "react";
import { examples as avatar } from "./components/avatar.tsx";
import { examples as banner } from "./components/banner.tsx";
import { examples as breadcrumb } from "./components/breadcrumb.tsx";
import { examples as button } from "./components/button.tsx";
import { examples as checkbox } from "./components/checkbox.tsx";
import { examples as chevronToArrow } from "./components/chevron-to-arrow.tsx";
import { examples as expandChevron } from "./components/expand-chevron.tsx";
import { examples as field } from "./components/field.tsx";
import { examples as filterChip } from "./components/filter-chip.tsx";
import { examples as icons } from "./components/icons.tsx";
import { examples as input } from "./components/input.tsx";
import { examples as link } from "./components/link.tsx";
import { examples as listbox } from "./components/listbox.tsx";
import { examples as meter } from "./components/meter.tsx";
import { examples as password } from "./components/password.tsx";
import { examples as popup } from "./components/popup.tsx";
import { examples as radio } from "./components/radio.tsx";
import { examples as segmented } from "./components/segmented.tsx";
import { examples as select } from "./components/select.tsx";
import { examples as settings } from "./components/settings.tsx";
import { examples as spinner } from "./components/spinner.tsx";
import { examples as status } from "./components/status.tsx";
import { examples as switchExamples } from "./components/switch.tsx";
import { examples as tabs } from "./components/tabs.tsx";
import { examples as tag } from "./components/tag.tsx";
import { examples as textarea } from "./components/textarea.tsx";
import { examples as tooltip } from "./components/tooltip.tsx";

export const components: Record<string, Record<string, ComponentType>> = {
  avatar,
  banner,
  breadcrumb,
  button,
  checkbox,
  "chevron-to-arrow": chevronToArrow,
  "expand-chevron": expandChevron,
  field,
  "filter-chip": filterChip,
  icons,
  input,
  link,
  listbox,
  meter,
  password,
  popup,
  radio,
  segmented,
  select,
  settings,
  spinner,
  status,
  switch: switchExamples,
  tabs,
  tag,
  textarea,
  tooltip,
};
