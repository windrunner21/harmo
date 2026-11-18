// Written by mise run build:tokens, from the custom properties Harmo's CSS
// reads or declares: its tokens, --harmo-*, and its components' variables,
// --h*. React's style prop takes any of them without a cast, such as
// style={{ "--harmo-card-padding": "var(--harmo-space-xs)" }}. Change the CSS,
// then run the task again, rather than editing this file.

export type HarmoCustomProperty =
  | "--harmo-amber"
  | "--harmo-avatar-color-background"
  | "--harmo-avatar-size"
  | "--harmo-black"
  | "--harmo-border-radius"
  | "--harmo-border-radius-full"
  | "--harmo-border-radius-sm"
  | "--harmo-box-shadow-sm"
  | "--harmo-button-duration"
  | "--harmo-button-font-line-height"
  | "--harmo-button-font-weight"
  | "--harmo-button-secondary-box-shadow"
  | "--harmo-button-secondary-color-border"
  | "--harmo-button-secondary-color-text"
  | "--harmo-button-secondary-hover-color-border"
  | "--harmo-card-padding"
  | "--harmo-checkbox-size"
  | "--harmo-chevron-to-arrow-duration"
  | "--harmo-color-background"
  | "--harmo-color-background-active"
  | "--harmo-color-background-hover"
  | "--harmo-color-background-secondary"
  | "--harmo-color-border"
  | "--harmo-color-border-control"
  | "--harmo-color-danger"
  | "--harmo-color-danger-background"
  | "--harmo-color-danger-border"
  | "--harmo-color-danger-fill"
  | "--harmo-color-danger-fill-active"
  | "--harmo-color-danger-fill-hover"
  | "--harmo-color-focus"
  | "--harmo-color-on-danger"
  | "--harmo-color-on-primary"
  | "--harmo-color-primary"
  | "--harmo-color-primary-active"
  | "--harmo-color-primary-fill"
  | "--harmo-color-primary-fill-active"
  | "--harmo-color-primary-fill-hover"
  | "--harmo-color-primary-hover"
  | "--harmo-color-primary-tint"
  | "--harmo-color-success"
  | "--harmo-color-text"
  | "--harmo-color-text-secondary"
  | "--harmo-color-text-tertiary"
  | "--harmo-color-warning"
  | "--harmo-control-height"
  | "--harmo-control-height-small"
  | "--harmo-control-height-xsmall"
  | "--harmo-cyan"
  | "--harmo-dark-gray"
  | "--harmo-dark-purple"
  | "--harmo-dark-white"
  | "--harmo-darker-purple"
  | "--harmo-dialog-backdrop-color"
  | "--harmo-duration-fast"
  | "--harmo-duration-faster"
  | "--harmo-duration-normal"
  | "--harmo-duration-slow"
  | "--harmo-ease-in-out-cubic"
  | "--harmo-ease-out-cubic"
  | "--harmo-ease-out-quad"
  | "--harmo-ease-spring"
  | "--harmo-focus-outline"
  | "--harmo-focus-outline-offset"
  | "--harmo-font-family"
  | "--harmo-font-family-mono"
  | "--harmo-font-line-height"
  | "--harmo-font-size-2xs"
  | "--harmo-font-size-3xs"
  | "--harmo-font-size-base"
  | "--harmo-font-size-lg"
  | "--harmo-font-size-md"
  | "--harmo-font-size-sm"
  | "--harmo-font-size-xs"
  | "--harmo-font-weight-bold"
  | "--harmo-font-weight-medium"
  | "--harmo-font-weight-normal"
  | "--harmo-font-weight-semibold"
  | "--harmo-green"
  | "--harmo-icon-color"
  | "--harmo-icon-gap"
  | "--harmo-icon-hover-color"
  | "--harmo-input-box-shadow"
  | "--harmo-input-color-background"
  | "--harmo-input-color-border"
  | "--harmo-light-purple"
  | "--harmo-link-active-color-text"
  | "--harmo-link-color-text"
  | "--harmo-link-hover-color-text"
  | "--harmo-link-hover-text-decoration"
  | "--harmo-link-visited-color-text"
  | "--harmo-medium-gray"
  | "--harmo-opacity-disabled"
  | "--harmo-purple"
  | "--harmo-red"
  | "--harmo-space-2xl"
  | "--harmo-space-2xs"
  | "--harmo-space-lg"
  | "--harmo-space-md"
  | "--harmo-space-sm"
  | "--harmo-space-xl"
  | "--harmo-space-xs"
  | "--harmo-status-color-error"
  | "--harmo-status-color-info"
  | "--harmo-status-color-success"
  | "--harmo-status-color-warning"
  | "--harmo-switch-color-background"
  | "--harmo-switch-height"
  | "--harmo-switch-thumb-box-shadow"
  | "--harmo-switch-thumb-color-background"
  | "--harmo-switch-thumb-size"
  | "--harmo-switch-width"
  | "--harmo-toast-duration"
  | "--harmo-toast-ease"
  | "--harmo-toast-morph-duration"
  | "--harmo-tooltip-box-shadow"
  | "--harmo-tooltip-color-background"
  | "--harmo-tooltip-color-text"
  | "--harmo-tooltip-delay"
  | "--harmo-tooltip-hint-box-shadow"
  | "--harmo-white"
  | "--hbadge-ring"
  | "--hbanner-color"
  | "--hbutton-hold-background"
  | "--hbutton-hold-border"
  | "--hbutton-hold-color"
  | "--hbutton-hold-duration"
  | "--hbutton-press-duration"
  | "--hcalendar-day-size"
  | "--hcommand-menu-top"
  | "--hcomposer-column"
  | "--hcontrol-focus-border"
  | "--hconversation-column"
  | "--hdialog-margin"
  | "--hdialog-max-inline-size"
  | "--hdialog-scale"
  | "--hdrawer-aside-inline-size"
  | "--hdrawer-closed-opacity"
  | "--hdrawer-column"
  | "--hdrawer-direction"
  | "--hdrawer-inline-size"
  | "--hdrawer-shift"
  | "--hfield-gap"
  | "--hfile-list-progress"
  | "--hheader-height"
  | "--hheader-width"
  | "--hlanguage-picker-close"
  | "--hlanguage-picker-columns"
  | "--hlanguage-picker-open"
  | "--hlauncher-offset"
  | "--hlauncher-size"
  | "--hmessage-bubble-color"
  | "--hmessage-bubble-radius"
  | "--hmeter-color"
  | "--hnavigation-menu-height"
  | "--hnavigation-menu-room"
  | "--hnavigation-menu-shift"
  | "--hnavigation-menu-toward-start"
  | "--hnavigation-menu-width"
  | "--hoption-checkbox-size"
  | "--hpopup-pinned-height"
  | "--hpopup-pinned-left"
  | "--hpopup-pinned-top"
  | "--hpopup-pinned-width"
  | "--hpopup-slide"
  | "--hpopup-slide-direction"
  | "--hshowcase-card-fold-color"
  | "--hsidebar-collapsed-inline-size"
  | "--hsidebar-color-background"
  | "--hsidebar-inline-size"
  | "--hsidebar-toward-start"
  | "--hspinner-appear"
  | "--hspinner-delay"
  | "--hspinner-duration"
  | "--hspinner-motion"
  | "--hspinner-size"
  | "--hspinner-stroke"
  | "--hstatus-color"
  | "--hswitch-inset"
  | "--hswitch-thumb"
  | "--hswitch-travel"
  | "--hswitch-width"
  | "--htable-color-background"
  | "--htable-of-contents-gutter"
  | "--htable-of-contents-indent"
  | "--htable-of-contents-marker-size"
  | "--htable-of-contents-marker-y"
  | "--htable-of-contents-max-height"
  | "--htable-of-contents-top"
  | "--htable-of-contents-width"
  | "--htabs-highlight-opacity"
  | "--htabs-highlight-width"
  | "--htabs-highlight-x"
  | "--htabs-indicator-width"
  | "--htabs-indicator-x"
  | "--htabs-list-width"
  | "--htag-color"
  | "--htextarea-max-height"
  | "--htextarea-min-height"
  | "--htoast-body-width"
  | "--htoast-color"
  | "--htoast-content-width"
  | "--htoast-height"
  | "--htoast-index"
  | "--htoast-leave-duration"
  | "--htoast-moved-body-filter"
  | "--htoast-moved-body-opacity"
  | "--htoast-moved-height"
  | "--htoast-moved-opacity"
  | "--htoast-moved-transform"
  | "--htoast-moved-width"
  | "--htoast-offset"
  | "--htoast-width"
  | "--htoaster-front-height"
  | "--htoaster-front-width"
  | "--htoaster-lift"
  | "--htoaster-room"
  | "--htoaster-spread"
  | "--htoaster-width"
  | "--htooltip-delay"
  | "--htooltip-gap";

declare module "react" {
  interface CSSProperties {
    "--harmo-amber"?: string | number;
    "--harmo-avatar-color-background"?: string | number;
    "--harmo-avatar-size"?: string | number;
    "--harmo-black"?: string | number;
    "--harmo-border-radius"?: string | number;
    "--harmo-border-radius-full"?: string | number;
    "--harmo-border-radius-sm"?: string | number;
    "--harmo-box-shadow-sm"?: string | number;
    "--harmo-button-duration"?: string | number;
    "--harmo-button-font-line-height"?: string | number;
    "--harmo-button-font-weight"?: string | number;
    "--harmo-button-secondary-box-shadow"?: string | number;
    "--harmo-button-secondary-color-border"?: string | number;
    "--harmo-button-secondary-color-text"?: string | number;
    "--harmo-button-secondary-hover-color-border"?: string | number;
    "--harmo-card-padding"?: string | number;
    "--harmo-checkbox-size"?: string | number;
    "--harmo-chevron-to-arrow-duration"?: string | number;
    "--harmo-color-background"?: string | number;
    "--harmo-color-background-active"?: string | number;
    "--harmo-color-background-hover"?: string | number;
    "--harmo-color-background-secondary"?: string | number;
    "--harmo-color-border"?: string | number;
    "--harmo-color-border-control"?: string | number;
    "--harmo-color-danger"?: string | number;
    "--harmo-color-danger-background"?: string | number;
    "--harmo-color-danger-border"?: string | number;
    "--harmo-color-danger-fill"?: string | number;
    "--harmo-color-danger-fill-active"?: string | number;
    "--harmo-color-danger-fill-hover"?: string | number;
    "--harmo-color-focus"?: string | number;
    "--harmo-color-on-danger"?: string | number;
    "--harmo-color-on-primary"?: string | number;
    "--harmo-color-primary"?: string | number;
    "--harmo-color-primary-active"?: string | number;
    "--harmo-color-primary-fill"?: string | number;
    "--harmo-color-primary-fill-active"?: string | number;
    "--harmo-color-primary-fill-hover"?: string | number;
    "--harmo-color-primary-hover"?: string | number;
    "--harmo-color-primary-tint"?: string | number;
    "--harmo-color-success"?: string | number;
    "--harmo-color-text"?: string | number;
    "--harmo-color-text-secondary"?: string | number;
    "--harmo-color-text-tertiary"?: string | number;
    "--harmo-color-warning"?: string | number;
    "--harmo-control-height"?: string | number;
    "--harmo-control-height-small"?: string | number;
    "--harmo-control-height-xsmall"?: string | number;
    "--harmo-cyan"?: string | number;
    "--harmo-dark-gray"?: string | number;
    "--harmo-dark-purple"?: string | number;
    "--harmo-dark-white"?: string | number;
    "--harmo-darker-purple"?: string | number;
    "--harmo-dialog-backdrop-color"?: string | number;
    "--harmo-duration-fast"?: string | number;
    "--harmo-duration-faster"?: string | number;
    "--harmo-duration-normal"?: string | number;
    "--harmo-duration-slow"?: string | number;
    "--harmo-ease-in-out-cubic"?: string | number;
    "--harmo-ease-out-cubic"?: string | number;
    "--harmo-ease-out-quad"?: string | number;
    "--harmo-ease-spring"?: string | number;
    "--harmo-focus-outline"?: string | number;
    "--harmo-focus-outline-offset"?: string | number;
    "--harmo-font-family"?: string | number;
    "--harmo-font-family-mono"?: string | number;
    "--harmo-font-line-height"?: string | number;
    "--harmo-font-size-2xs"?: string | number;
    "--harmo-font-size-3xs"?: string | number;
    "--harmo-font-size-base"?: string | number;
    "--harmo-font-size-lg"?: string | number;
    "--harmo-font-size-md"?: string | number;
    "--harmo-font-size-sm"?: string | number;
    "--harmo-font-size-xs"?: string | number;
    "--harmo-font-weight-bold"?: string | number;
    "--harmo-font-weight-medium"?: string | number;
    "--harmo-font-weight-normal"?: string | number;
    "--harmo-font-weight-semibold"?: string | number;
    "--harmo-green"?: string | number;
    "--harmo-icon-color"?: string | number;
    "--harmo-icon-gap"?: string | number;
    "--harmo-icon-hover-color"?: string | number;
    "--harmo-input-box-shadow"?: string | number;
    "--harmo-input-color-background"?: string | number;
    "--harmo-input-color-border"?: string | number;
    "--harmo-light-purple"?: string | number;
    "--harmo-link-active-color-text"?: string | number;
    "--harmo-link-color-text"?: string | number;
    "--harmo-link-hover-color-text"?: string | number;
    "--harmo-link-hover-text-decoration"?: string | number;
    "--harmo-link-visited-color-text"?: string | number;
    "--harmo-medium-gray"?: string | number;
    "--harmo-opacity-disabled"?: string | number;
    "--harmo-purple"?: string | number;
    "--harmo-red"?: string | number;
    "--harmo-space-2xl"?: string | number;
    "--harmo-space-2xs"?: string | number;
    "--harmo-space-lg"?: string | number;
    "--harmo-space-md"?: string | number;
    "--harmo-space-sm"?: string | number;
    "--harmo-space-xl"?: string | number;
    "--harmo-space-xs"?: string | number;
    "--harmo-status-color-error"?: string | number;
    "--harmo-status-color-info"?: string | number;
    "--harmo-status-color-success"?: string | number;
    "--harmo-status-color-warning"?: string | number;
    "--harmo-switch-color-background"?: string | number;
    "--harmo-switch-height"?: string | number;
    "--harmo-switch-thumb-box-shadow"?: string | number;
    "--harmo-switch-thumb-color-background"?: string | number;
    "--harmo-switch-thumb-size"?: string | number;
    "--harmo-switch-width"?: string | number;
    "--harmo-toast-duration"?: string | number;
    "--harmo-toast-ease"?: string | number;
    "--harmo-toast-morph-duration"?: string | number;
    "--harmo-tooltip-box-shadow"?: string | number;
    "--harmo-tooltip-color-background"?: string | number;
    "--harmo-tooltip-color-text"?: string | number;
    "--harmo-tooltip-delay"?: string | number;
    "--harmo-tooltip-hint-box-shadow"?: string | number;
    "--harmo-white"?: string | number;
    "--hbadge-ring"?: string | number;
    "--hbanner-color"?: string | number;
    "--hbutton-hold-background"?: string | number;
    "--hbutton-hold-border"?: string | number;
    "--hbutton-hold-color"?: string | number;
    "--hbutton-hold-duration"?: string | number;
    "--hbutton-press-duration"?: string | number;
    "--hcalendar-day-size"?: string | number;
    "--hcommand-menu-top"?: string | number;
    "--hcomposer-column"?: string | number;
    "--hcontrol-focus-border"?: string | number;
    "--hconversation-column"?: string | number;
    "--hdialog-margin"?: string | number;
    "--hdialog-max-inline-size"?: string | number;
    "--hdialog-scale"?: string | number;
    "--hdrawer-aside-inline-size"?: string | number;
    "--hdrawer-closed-opacity"?: string | number;
    "--hdrawer-column"?: string | number;
    "--hdrawer-direction"?: string | number;
    "--hdrawer-inline-size"?: string | number;
    "--hdrawer-shift"?: string | number;
    "--hfield-gap"?: string | number;
    "--hfile-list-progress"?: string | number;
    "--hheader-height"?: string | number;
    "--hheader-width"?: string | number;
    "--hlanguage-picker-close"?: string | number;
    "--hlanguage-picker-columns"?: string | number;
    "--hlanguage-picker-open"?: string | number;
    "--hlauncher-offset"?: string | number;
    "--hlauncher-size"?: string | number;
    "--hmessage-bubble-color"?: string | number;
    "--hmessage-bubble-radius"?: string | number;
    "--hmeter-color"?: string | number;
    "--hnavigation-menu-height"?: string | number;
    "--hnavigation-menu-room"?: string | number;
    "--hnavigation-menu-shift"?: string | number;
    "--hnavigation-menu-toward-start"?: string | number;
    "--hnavigation-menu-width"?: string | number;
    "--hoption-checkbox-size"?: string | number;
    "--hpopup-pinned-height"?: string | number;
    "--hpopup-pinned-left"?: string | number;
    "--hpopup-pinned-top"?: string | number;
    "--hpopup-pinned-width"?: string | number;
    "--hpopup-slide"?: string | number;
    "--hpopup-slide-direction"?: string | number;
    "--hshowcase-card-fold-color"?: string | number;
    "--hsidebar-collapsed-inline-size"?: string | number;
    "--hsidebar-color-background"?: string | number;
    "--hsidebar-inline-size"?: string | number;
    "--hsidebar-toward-start"?: string | number;
    "--hspinner-appear"?: string | number;
    "--hspinner-delay"?: string | number;
    "--hspinner-duration"?: string | number;
    "--hspinner-motion"?: string | number;
    "--hspinner-size"?: string | number;
    "--hspinner-stroke"?: string | number;
    "--hstatus-color"?: string | number;
    "--hswitch-inset"?: string | number;
    "--hswitch-thumb"?: string | number;
    "--hswitch-travel"?: string | number;
    "--hswitch-width"?: string | number;
    "--htable-color-background"?: string | number;
    "--htable-of-contents-gutter"?: string | number;
    "--htable-of-contents-indent"?: string | number;
    "--htable-of-contents-marker-size"?: string | number;
    "--htable-of-contents-marker-y"?: string | number;
    "--htable-of-contents-max-height"?: string | number;
    "--htable-of-contents-top"?: string | number;
    "--htable-of-contents-width"?: string | number;
    "--htabs-highlight-opacity"?: string | number;
    "--htabs-highlight-width"?: string | number;
    "--htabs-highlight-x"?: string | number;
    "--htabs-indicator-width"?: string | number;
    "--htabs-indicator-x"?: string | number;
    "--htabs-list-width"?: string | number;
    "--htag-color"?: string | number;
    "--htextarea-max-height"?: string | number;
    "--htextarea-min-height"?: string | number;
    "--htoast-body-width"?: string | number;
    "--htoast-color"?: string | number;
    "--htoast-content-width"?: string | number;
    "--htoast-height"?: string | number;
    "--htoast-index"?: string | number;
    "--htoast-leave-duration"?: string | number;
    "--htoast-moved-body-filter"?: string | number;
    "--htoast-moved-body-opacity"?: string | number;
    "--htoast-moved-height"?: string | number;
    "--htoast-moved-opacity"?: string | number;
    "--htoast-moved-transform"?: string | number;
    "--htoast-moved-width"?: string | number;
    "--htoast-offset"?: string | number;
    "--htoast-width"?: string | number;
    "--htoaster-front-height"?: string | number;
    "--htoaster-front-width"?: string | number;
    "--htoaster-lift"?: string | number;
    "--htoaster-room"?: string | number;
    "--htoaster-spread"?: string | number;
    "--htoaster-width"?: string | number;
    "--htooltip-delay"?: string | number;
    "--htooltip-gap"?: string | number;
  }
}
