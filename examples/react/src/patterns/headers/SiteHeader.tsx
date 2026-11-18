"use client";

import {
  Button,
  Header,
  MenuButton,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuRow,
  type HeaderProps,
} from "@harmo-ui/react";
import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

export interface SiteLink {
  label: string;
  href: string;
}

export interface SiteSection {
  label: string;
  links: (SiteLink & { description?: string; icon?: ReactNode })[];
}

export interface SiteAction extends SiteLink {
  primary?: boolean;
}

export interface SiteHeaderProps {
  logo: ReactNode;
  homeHref?: string;
  menu: (SiteLink | SiteSection)[];
  actions: SiteAction[];
  current?: string;
  scroll?: HeaderProps["scroll"];
  transparent?: boolean;
}

const Menu = ({ menu, current, vertical }: Pick<SiteHeaderProps, "menu" | "current"> & { vertical?: boolean }) => (
  <NavigationMenu aria-label="Main" orientation={vertical ? "vertical" : undefined}>
    {menu.map((item) =>
      "links" in item ? (
        <NavigationMenuItem key={item.label} label={item.label}>
          {item.links.map((link) => (
            <NavigationMenuRow
              key={link.href}
              href={link.href}
              label={link.label}
              description={link.description}
              icon={link.icon}
              current={link.href === current}
            />
          ))}
        </NavigationMenuItem>
      ) : (
        <NavigationMenuLink key={item.href} href={item.href} current={item.href === current}>
          {item.label}
        </NavigationMenuLink>
      ),
    )}
  </NavigationMenu>
);

export const SiteHeader = ({ logo, homeHref = "/", menu, actions, current, scroll, transparent }: SiteHeaderProps) => {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const escape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    setOpen(false);
    button.current?.focus();
  };

  const away = (event: FocusEvent) => {
    const to = event.relatedTarget;
    if (!open || !to || button.current?.contains(to) || panel.current?.contains(to)) return;
    setOpen(false);
  };

  return (
    <Header
      className="hsite-header"
      scroll={scroll}
      transparent={transparent}
      brand={<a href={homeHref}>{logo}</a>}
      actions={
        <>
          <div className="hsite-header-actions">
            {actions.map((action) => (
              <Button key={action.href} href={action.href} variant={action.primary ? undefined : "tertiary"}>
                {action.label}
              </Button>
            ))}
          </div>
          <MenuButton
            ref={button}
            className="hsite-header-menu"
            aria-label="Menu"
            aria-controls={panelId}
            open={open}
            onOpenChange={setOpen}
            onKeyDown={escape}
            onBlur={away}
          />
          <div
            ref={panel}
            id={panelId}
            className="hsite-header-panel"
            data-open={open ? "" : undefined}
            onKeyDown={escape}
            onBlur={away}
            onClick={(event: MouseEvent) => {
              if ((event.target as Element).closest("a")) setOpen(false);
            }}
          >
            <div className="hsite-header-panel-menu">
              <Menu menu={menu} current={current} vertical />
            </div>
            <div className="hsite-header-panel-actions">
              {actions.map((action) => (
                <Button key={action.href} href={action.href} variant={action.primary ? undefined : "secondary"}>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      }
    >
      <Menu menu={menu} current={current} />
    </Header>
  );
};
