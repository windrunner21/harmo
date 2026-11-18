// An app brings its own icons. These stand in for them, drawn from the HTML
// playground's SVG files, so both playgrounds show the same ones.

import { createElement, type ComponentPropsWithRef } from "react";
import analytics from "../../html/src/icons/analytics.svg" with { type: "text" };
import apple from "../../html/src/icons/apple.svg" with { type: "text" };
import book from "../../html/src/icons/book.svg" with { type: "text" };
import business from "../../html/src/icons/business.svg" with { type: "text" };
import calendar from "../../html/src/icons/calendar.svg" with { type: "text" };
import campaigns from "../../html/src/icons/campaigns.svg" with { type: "text" };
import chevron from "../../html/src/icons/chevron.svg" with { type: "text" };
import close from "../../html/src/icons/close.svg" with { type: "text" };
import copy from "../../html/src/icons/copy.svg" with { type: "text" };
import developers from "../../html/src/icons/developers.svg" with { type: "text" };
import facebook from "../../html/src/icons/facebook.svg" with { type: "text" };
import error from "../../html/src/icons/error.svg" with { type: "text" };
import github from "../../html/src/icons/github.svg" with { type: "text" };
import globe from "../../html/src/icons/globe.svg" with { type: "text" };
import google from "../../html/src/icons/google.svg" with { type: "text" };
import home from "../../html/src/icons/home.svg" with { type: "text" };
import linkedin from "../../html/src/icons/linkedin.svg" with { type: "text" };
import info from "../../html/src/icons/info.svg" with { type: "text" };
import instagram from "../../html/src/icons/instagram.svg" with { type: "text" };
import lock from "../../html/src/icons/lock.svg" with { type: "text" };
import menu from "../../html/src/icons/menu.svg" with { type: "text" };
import messages from "../../html/src/icons/messages.svg" with { type: "text" };
import microsoft from "../../html/src/icons/microsoft.svg" with { type: "text" };
import more from "../../html/src/icons/more.svg" with { type: "text" };
import openai from "../../html/src/icons/openai.svg" with { type: "text" };
import plus from "../../html/src/icons/plus.svg" with { type: "text" };
import settings from "../../html/src/icons/settings.svg" with { type: "text" };
import share from "../../html/src/icons/share.svg" with { type: "text" };
import signOut from "../../html/src/icons/sign-out.svg" with { type: "text" };
import success from "../../html/src/icons/success.svg" with { type: "text" };
import team from "../../html/src/icons/team.svg" with { type: "text" };
import tickets from "../../html/src/icons/tickets.svg" with { type: "text" };
import trash from "../../html/src/icons/trash.svg" with { type: "text" };
import user from "../../html/src/icons/user.svg" with { type: "text" };
import warning from "../../html/src/icons/warning.svg" with { type: "text" };
import arrowDown from "../../html/src/icons/arrow-down.svg" with { type: "text" };
import arrowUp from "../../html/src/icons/arrow-up.svg" with { type: "text" };
import assistant from "../../html/src/icons/assistant.svg" with { type: "text" };
import edit from "../../html/src/icons/edit.svg" with { type: "text" };
import newChat from "../../html/src/icons/new-chat.svg" with { type: "text" };
import paperclip from "../../html/src/icons/paperclip.svg" with { type: "text" };
import retry from "../../html/src/icons/retry.svg" with { type: "text" };
import stop from "../../html/src/icons/stop.svg" with { type: "text" };
import thumbsDown from "../../html/src/icons/thumbs-down.svg" with { type: "text" };
import thumbsUp from "../../html/src/icons/thumbs-up.svg" with { type: "text" };
import upload from "../../html/src/icons/upload.svg" with { type: "text" };
import x from "../../html/src/icons/x.svg" with { type: "text" };
import youtube from "../../html/src/icons/youtube.svg" with { type: "text" };

const icon = (source: string) => {
  const [, attributes = "", body = ""] =
    source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/) ?? [];
  const own = propsOf(attributes);
  const children = [...body.matchAll(/<(\w+)\b([^>]*?)\s*\/>/g)].map(
    ([, tag = "", parts = ""], index) =>
      createElement(tag, { key: index, ...propsOf(parts) }),
  );
  return (props: ComponentPropsWithRef<"svg">) => (
    <svg {...own} {...props}>
      {children}
    </svg>
  );
};

const propsOf = (source: string) =>
  Object.fromEntries(
    [...source.matchAll(/([^\s="'>/]+)(?:="([^"]*)")?/g)].map(
      ([, name, value]) => [reactName(name ?? ""), value ?? ""],
    ),
  );

// React's names for SVG attributes: stroke-width is strokeWidth.
const reactName = (name: string) =>
  name === "class"
    ? "className"
    : /^(aria|data)-/.test(name)
      ? name
      : name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export const AnalyticsIcon = icon(analytics);
export const BookIcon = icon(book);
export const BusinessIcon = icon(business);
export const CalendarIcon = icon(calendar);
export const CampaignsIcon = icon(campaigns);
export const ChevronIcon = icon(chevron);
export const CloseIcon = icon(close);
export const CopyIcon = icon(copy);
export const DevelopersIcon = icon(developers);
export const ErrorIcon = icon(error);
export const GlobeIcon = icon(globe);
export const HomeIcon = icon(home);
export const InfoIcon = icon(info);
export const LockIcon = icon(lock);
export const MenuIcon = icon(menu);
export const MessagesIcon = icon(messages);
export const MoreIcon = icon(more);
export const PlusIcon = icon(plus);
export const SettingsIcon = icon(settings);
export const ShareIcon = icon(share);
export const SignOutIcon = icon(signOut);
export const SuccessIcon = icon(success);
export const TeamIcon = icon(team);
export const TicketsIcon = icon(tickets);
export const TrashIcon = icon(trash);
export const UserIcon = icon(user);
export const WarningIcon = icon(warning);
export const FacebookIcon = icon(facebook);
export const LinkedInIcon = icon(linkedin);
export const InstagramIcon = icon(instagram);
export const YouTubeIcon = icon(youtube);
export const XIcon = icon(x);
export const AppleIcon = icon(apple);
export const GitHubIcon = icon(github);
export const GoogleIcon = icon(google);
export const MicrosoftIcon = icon(microsoft);
export const OpenAIIcon = icon(openai);
export const ArrowDownIcon = icon(arrowDown);
export const ArrowUpIcon = icon(arrowUp);
export const AssistantIcon = icon(assistant);
export const EditIcon = icon(edit);
export const NewChatIcon = icon(newChat);
export const PaperclipIcon = icon(paperclip);
export const RetryIcon = icon(retry);
export const StopIcon = icon(stop);
export const ThumbsDownIcon = icon(thumbsDown);
export const ThumbsUpIcon = icon(thumbsUp);
export const UploadIcon = icon(upload);
