// Every component's React examples, keyed by the HTML examples' titles:
// what the build renders, the browser hydrates, and the markup test checks.

import type { ComponentType } from "react";
import { examples as accordion } from "./components/accordion.tsx";
import { examples as avatar } from "./components/avatar.tsx";
import { examples as banner } from "./components/banner.tsx";
import { examples as breadcrumb } from "./components/breadcrumb.tsx";
import { examples as button } from "./components/button.tsx";
import { examples as calendar } from "./components/calendar.tsx";
import { examples as card } from "./components/card.tsx";
import { examples as checkbox } from "./components/checkbox.tsx";
import { examples as chevronToArrow } from "./components/chevron-to-arrow.tsx";
import { examples as combobox } from "./components/combobox.tsx";
import { examples as commandMenu } from "./components/command-menu.tsx";
import { examples as copy } from "./components/copy.tsx";
import { examples as dateFilter } from "./components/date-filter.tsx";
import { examples as datePicker } from "./components/date-picker.tsx";
import { examples as dialog } from "./components/dialog.tsx";
import { examples as drawer } from "./components/drawer.tsx";
import { examples as emptyState } from "./components/empty-state.tsx";
import { examples as expandChevron } from "./components/expand-chevron.tsx";
import { examples as field } from "./components/field.tsx";
import { examples as filterBar } from "./components/filter-bar.tsx";
import { examples as fileInput } from "./components/file-input.tsx";
import { examples as fileList } from "./components/file-list.tsx";
import { examples as filterChip } from "./components/filter-chip.tsx";
import { examples as filters } from "./components/filters.tsx";
import { examples as icons } from "./components/icons.tsx";
import { examples as input } from "./components/input.tsx";
import { examples as kbd } from "./components/kbd.tsx";
import { examples as languagePicker } from "./components/language-picker.tsx";
import { examples as link } from "./components/link.tsx";
import { examples as listbox } from "./components/listbox.tsx";
import { examples as menuButton } from "./components/menu-button.tsx";
import { examples as meter } from "./components/meter.tsx";
import { examples as navigationMenu } from "./components/navigation-menu.tsx";
import { examples as otpInput } from "./components/otp-input.tsx";
import { examples as pagination } from "./components/pagination.tsx";
import { examples as password } from "./components/password.tsx";
import { examples as phoneInput } from "./components/phone-input.tsx";
import { examples as popup } from "./components/popup.tsx";
import { examples as radio } from "./components/radio.tsx";
import { examples as search } from "./components/search.tsx";
import { examples as section } from "./components/section.tsx";
import { examples as segmented } from "./components/segmented.tsx";
import { examples as select } from "./components/select.tsx";
import { examples as selectionBar } from "./components/selection-bar.tsx";
import { examples as settings } from "./components/settings.tsx";
import { examples as sidebar } from "./components/sidebar.tsx";
import { examples as spinner } from "./components/spinner.tsx";
import { examples as stat } from "./components/stat.tsx";
import { examples as status } from "./components/status.tsx";
import { examples as switchExamples } from "./components/switch.tsx";
import { examples as table } from "./components/table.tsx";
import { examples as signInForm } from "./components/sign-in-form.tsx";
import { examples as signUpForm } from "./components/sign-up-form.tsx";
import { examples as resetPassword } from "./components/reset-password.tsx";
import { examples as contactForm } from "./components/contact-form.tsx";
import { examples as accountForms } from "./components/account-forms.tsx";
import { examples as tableOfContents } from "./components/table-of-contents.tsx";
import { examples as tabs } from "./components/tabs.tsx";
import { examples as tag } from "./components/tag.tsx";
import { examples as tagList } from "./components/tag-list.tsx";
import { examples as textarea } from "./components/textarea.tsx";
import { examples as timePicker } from "./components/time-picker.tsx";
import { examples as toast } from "./components/toast.tsx";
import { examples as toolbar } from "./components/toolbar.tsx";
import { examples as tooltip } from "./components/tooltip.tsx";
import { examples as verifyCode } from "./components/verify-code.tsx";

export const components: Record<string, Record<string, ComponentType>> = {
  accordion,
  avatar,
  banner,
  breadcrumb,
  button,
  calendar,
  card,
  checkbox,
  "chevron-to-arrow": chevronToArrow,
  combobox,
  "command-menu": commandMenu,
  copy,
  "date-filter": dateFilter,
  "date-picker": datePicker,
  dialog,
  drawer,
  "empty-state": emptyState,
  "expand-chevron": expandChevron,
  field,
  "filter-bar": filterBar,
  "file-input": fileInput,
  "file-list": fileList,
  "filter-chip": filterChip,
  filters,
  icons,
  input,
  kbd,
  "language-picker": languagePicker,
  link,
  listbox,
  "menu-button": menuButton,
  meter,
  "navigation-menu": navigationMenu,
  "otp-input": otpInput,
  pagination,
  password,
  "phone-input": phoneInput,
  popup,
  radio,
  search,
  section,
  segmented,
  select,
  "selection-bar": selectionBar,
  settings,
  sidebar,
  spinner,
  stat,
  status,
  switch: switchExamples,
  table,
  "sign-in-form": signInForm,
  "sign-up-form": signUpForm,
  "reset-password": resetPassword,
  "contact-form": contactForm,
  "account-forms": accountForms,
  "table-of-contents": tableOfContents,
  tabs,
  tag,
  "tag-list": tagList,
  textarea,
  "time-picker": timePicker,
  toast,
  toolbar,
  tooltip,
  "verify-code": verifyCode,
};
