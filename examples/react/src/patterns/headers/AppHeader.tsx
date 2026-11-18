"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  EmptyState,
  Header,
  Popup,
  type HeaderProps,
} from "@harmo-ui/react";
import { useRef, type ReactNode } from "react";
import { AddIcon, BellIcon, HelpIcon, SettingsIcon } from "./icons.tsx";

export interface AppNotification {
  id: string;
  title: string;
  detail?: string;
  time: string;
  href: string;
  unread?: boolean;
  avatar?: ReactNode;
}

export interface AppCreateItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface AppHeaderProps {
  search: ReactNode;
  helpHref: string;
  settingsHref: string;
  notifications: AppNotification[];
  onMarkAllRead?: () => void;
  create: AppCreateItem[];
  scroll?: HeaderProps["scroll"];
}

export const AppHeader = ({ search, helpHref, settingsHref, notifications, onMarkAllRead, create, scroll }: AppHeaderProps) => {
  const unread = notifications.filter((notification) => notification.unread).length;
  const list = useRef<HTMLUListElement>(null);

  return (
    <Header
      className="happ-header"
      scroll={scroll}
      bordered
      actions={
        <>
          <Button variant="tertiary" href={helpHref} aria-label="Help">
            <HelpIcon className="hicon" />
          </Button>
          <Popup
            className="happ-header-notifications"
            align="end"
            trigger={
              <Button
                variant="tertiary"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                badge={unread > 0 ? <Badge variant="accent" count={unread} aria-hidden="true" /> : undefined}
              >
                <BellIcon className="hicon" />
              </Button>
            }
          >
            <div className="happ-header-notifications-head">
              <p className="happ-header-notifications-title">Notifications</p>
              {unread > 0 && onMarkAllRead && (
                <button
                  type="button"
                  className="hlink"
                  onClick={() => {
                    onMarkAllRead();
                    list.current?.querySelector<HTMLElement>(".happ-header-notification")?.focus();
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <EmptyState size="small" labelAs="p" label="You're all caught up" />
            ) : (
              <ul ref={list} className="happ-header-notifications-list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <a className="happ-header-notification" href={notification.href} data-unread={notification.unread ? "" : undefined}>
                      {notification.avatar}
                      <span className="happ-header-notification-text">
                        <span className="happ-header-notification-title">{notification.title}</span>
                        {notification.detail && <span className="happ-header-notification-detail">{notification.detail}</span>}
                        <span className="happ-header-notification-time">{notification.time}</span>
                      </span>
                      {notification.unread && <Badge dot variant="accent" role="img" aria-label="Unread" />}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Popup>
          <Button variant="tertiary" href={settingsHref} aria-label="Settings">
            <SettingsIcon className="hicon" />
          </Button>
          <DropdownMenu
            className="happ-header-create-menu"
            align="end"
            trigger={
              <Button className="happ-header-create" shape="circle" size="xsmall" aria-label="Create">
                <AddIcon className="hicon" />
              </Button>
            }
          >
            {create.map((item) => (
              <DropdownMenuItem key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </>
      }
    >
      <div className="happ-header-search">{search}</div>
    </Header>
  );
};
