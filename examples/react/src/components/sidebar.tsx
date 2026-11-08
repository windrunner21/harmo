import {
  Button,
  Drawer,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarSub,
} from "@harmo-ui/react";
import { useState, type CSSProperties, type MouseEvent } from "react";
import {
  AnalyticsIcon,
  CampaignsIcon,
  DevelopersIcon,
  HomeIcon,
  MenuIcon,
  MessagesIcon,
  MoreIcon,
  SettingsIcon,
  TicketsIcon,
} from "../app-icons.tsx";

export const examples = {
  Default: () => {
    // Your router knows the page you're on; here a click only moves it.
    const [path, setPath] = useState("/tickets");
    const go = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPath(event.currentTarget.getAttribute("href") ?? "");
    };

    return (
      <div style={{ blockSize: "36rem" }}>
        <Sidebar
          aria-label="Main"
          collapseLabel="Collapse"
          expandLabel="Expand"
          header={
            <SidebarGroup>
              <SidebarItem
                href="/account"
                icon={
                  <span
                    className="havatar"
                    style={{ "--harmo-avatar-size": "20px" } as CSSProperties}
                    aria-hidden="true"
                  >
                    A
                  </span>
                }
                current={path === "/account"}
                onClick={go}
              >
                Acme Support
              </SidebarItem>
            </SidebarGroup>
          }
          footer={
            <SidebarGroup>
              <SidebarItem
                href="/developers"
                icon={<DevelopersIcon className="hicon" />}
                current={path === "/developers"}
                onClick={go}
              >
                Developers
              </SidebarItem>
              <SidebarItem
                href="/settings"
                icon={<SettingsIcon className="hicon" />}
                current={path === "/settings"}
                onClick={go}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          }
        >
          <SidebarGroup>
            <SidebarItem
              href="/home"
              icon={<HomeIcon className="hicon" />}
              current={path === "/home"}
              onClick={go}
            >
              Home
            </SidebarItem>
            <SidebarItem
              href="/analytics"
              icon={<AnalyticsIcon className="hicon" />}
              current={path === "/analytics"}
              onClick={go}
            >
              Analytics
            </SidebarItem>
            <SidebarItem
              href="/messages"
              icon={<MessagesIcon className="hicon" />}
              badge="3"
              aria-label="Messages 3 unread"
              current={path === "/messages"}
              onClick={go}
            >
              Messages
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Tools">
            <SidebarItem
              href="/tickets"
              icon={<TicketsIcon className="hicon" />}
              current={path === "/tickets"}
              onClick={go}
            >
              Tickets
            </SidebarItem>
            <SidebarSub label="Campaigns" icon={<CampaignsIcon className="hicon" />}>
              <SidebarItem href="/campaigns/runs" current={path === "/campaigns/runs"} onClick={go}>
                Runs
              </SidebarItem>
              <SidebarItem href="/campaigns/templates" current={path === "/campaigns/templates"} onClick={go}>
                Templates
              </SidebarItem>
            </SidebarSub>
            <SidebarSub label="More" icon={<MoreIcon className="hicon" />}>
              <SidebarItem href="/quick-replies" current={path === "/quick-replies"} onClick={go}>
                Quick replies
              </SidebarItem>
              <SidebarItem href="/snippets" current={path === "/snippets"} onClick={go}>
                Snippets
              </SidebarItem>
            </SidebarSub>
          </SidebarGroup>
        </Sidebar>
      </div>
    );
  },

  "One group at a time": () => {
    // Your router knows the page you're on; here a click only moves it.
    const [path, setPath] = useState("/tickets");
    const go = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPath(event.currentTarget.getAttribute("href") ?? "");
    };

    return (
      <div style={{ blockSize: "36rem" }}>
        <Sidebar
          aria-label="Main"
          exclusive
          header={
            <SidebarGroup>
              <SidebarItem
                href="/account"
                icon={
                  <span
                    className="havatar"
                    style={{ "--harmo-avatar-size": "20px" } as CSSProperties}
                    aria-hidden="true"
                  >
                    A
                  </span>
                }
                current={path === "/account"}
                onClick={go}
              >
                Acme Support
              </SidebarItem>
            </SidebarGroup>
          }
          footer={
            <SidebarGroup>
              <SidebarItem
                href="/developers"
                icon={<DevelopersIcon className="hicon" />}
                current={path === "/developers"}
                onClick={go}
              >
                Developers
              </SidebarItem>
              <SidebarItem
                href="/settings"
                icon={<SettingsIcon className="hicon" />}
                current={path === "/settings"}
                onClick={go}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          }
        >
          <SidebarGroup>
            <SidebarItem
              href="/home"
              icon={<HomeIcon className="hicon" />}
              current={path === "/home"}
              onClick={go}
            >
              Home
            </SidebarItem>
            <SidebarItem
              href="/analytics"
              icon={<AnalyticsIcon className="hicon" />}
              current={path === "/analytics"}
              onClick={go}
            >
              Analytics
            </SidebarItem>
            <SidebarItem
              href="/messages"
              icon={<MessagesIcon className="hicon" />}
              badge="3"
              aria-label="Messages 3 unread"
              current={path === "/messages"}
              onClick={go}
            >
              Messages
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Tools">
            <SidebarItem
              href="/tickets"
              icon={<TicketsIcon className="hicon" />}
              current={path === "/tickets"}
              onClick={go}
            >
              Tickets
            </SidebarItem>
            <SidebarSub label="Campaigns" icon={<CampaignsIcon className="hicon" />}>
              <SidebarItem href="/campaigns/runs" current={path === "/campaigns/runs"} onClick={go}>
                Runs
              </SidebarItem>
              <SidebarItem href="/campaigns/templates" current={path === "/campaigns/templates"} onClick={go}>
                Templates
              </SidebarItem>
            </SidebarSub>
            <SidebarSub label="More" icon={<MoreIcon className="hicon" />}>
              <SidebarItem href="/quick-replies" current={path === "/quick-replies"} onClick={go}>
                Quick replies
              </SidebarItem>
              <SidebarItem href="/snippets" current={path === "/snippets"} onClick={go}>
                Snippets
              </SidebarItem>
            </SidebarSub>
          </SidebarGroup>
        </Sidebar>
      </div>
    );
  },

  Collapsed: () => {
    // Your router knows the page you're on; here a click only moves it.
    const [path, setPath] = useState("/tickets");
    const go = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPath(event.currentTarget.getAttribute("href") ?? "");
    };

    return (
      <div style={{ blockSize: "36rem" }}>
        <Sidebar
          aria-label="Main"
          defaultCollapsed
          header={
            <SidebarGroup>
              <SidebarItem
                href="/account"
                icon={
                  <span
                    className="havatar"
                    style={{ "--harmo-avatar-size": "20px" } as CSSProperties}
                    aria-hidden="true"
                  >
                    A
                  </span>
                }
                current={path === "/account"}
                onClick={go}
              >
                Acme Support
              </SidebarItem>
            </SidebarGroup>
          }
          footer={
            <SidebarGroup>
              <SidebarItem
                href="/developers"
                icon={<DevelopersIcon className="hicon" />}
                current={path === "/developers"}
                onClick={go}
              >
                Developers
              </SidebarItem>
              <SidebarItem
                href="/settings"
                icon={<SettingsIcon className="hicon" />}
                current={path === "/settings"}
                onClick={go}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          }
        >
          <SidebarGroup>
            <SidebarItem
              href="/home"
              icon={<HomeIcon className="hicon" />}
              current={path === "/home"}
              onClick={go}
            >
              Home
            </SidebarItem>
            <SidebarItem
              href="/analytics"
              icon={<AnalyticsIcon className="hicon" />}
              current={path === "/analytics"}
              onClick={go}
            >
              Analytics
            </SidebarItem>
            <SidebarItem
              href="/messages"
              icon={<MessagesIcon className="hicon" />}
              badge="3"
              aria-label="Messages 3 unread"
              current={path === "/messages"}
              onClick={go}
            >
              Messages
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Tools">
            <SidebarItem
              href="/tickets"
              icon={<TicketsIcon className="hicon" />}
              current={path === "/tickets"}
              onClick={go}
            >
              Tickets
            </SidebarItem>
            <SidebarSub label="Campaigns" icon={<CampaignsIcon className="hicon" />}>
              <SidebarItem href="/campaigns/runs" current={path === "/campaigns/runs"} onClick={go}>
                Runs
              </SidebarItem>
              <SidebarItem href="/campaigns/templates" current={path === "/campaigns/templates"} onClick={go}>
                Templates
              </SidebarItem>
            </SidebarSub>
            <SidebarSub label="More" icon={<MoreIcon className="hicon" />}>
              <SidebarItem href="/quick-replies" current={path === "/quick-replies"} onClick={go}>
                Quick replies
              </SidebarItem>
              <SidebarItem href="/snippets" current={path === "/snippets"} onClick={go}>
                Snippets
              </SidebarItem>
            </SidebarSub>
          </SidebarGroup>
        </Sidebar>
      </div>
    );
  },

  "In a drawer": () => {
    // Your router knows the page you're on; here a click only moves it.
    const [path, setPath] = useState("/tickets");
    const go = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPath(event.currentTarget.getAttribute("href") ?? "");
    };

    return (
      <Drawer
        id="menu-drawer"
        label="Menu"
        closeLabel="Close"
        closedby="any"
        style={{ "--hdrawer-inline-size": "18rem" } as CSSProperties}
        trigger={
          <Button variant="secondary">
            <MenuIcon className="hicon" />
            Menu
          </Button>
        }
      >
        <Sidebar
          aria-label="Main"
          exclusive
          footer={
            <SidebarGroup>
              <SidebarItem
                href="/developers"
                icon={<DevelopersIcon className="hicon" />}
                current={path === "/developers"}
                onClick={go}
              >
                Developers
              </SidebarItem>
              <SidebarItem
                href="/settings"
                icon={<SettingsIcon className="hicon" />}
                current={path === "/settings"}
                onClick={go}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          }
        >
          <SidebarGroup>
            <SidebarItem
              href="/home"
              icon={<HomeIcon className="hicon" />}
              current={path === "/home"}
              onClick={go}
            >
              Home
            </SidebarItem>
            <SidebarItem
              href="/analytics"
              icon={<AnalyticsIcon className="hicon" />}
              current={path === "/analytics"}
              onClick={go}
            >
              Analytics
            </SidebarItem>
            <SidebarItem
              href="/messages"
              icon={<MessagesIcon className="hicon" />}
              badge="3"
              aria-label="Messages 3 unread"
              current={path === "/messages"}
              onClick={go}
            >
              Messages
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Tools">
            <SidebarItem
              href="/tickets"
              icon={<TicketsIcon className="hicon" />}
              current={path === "/tickets"}
              onClick={go}
            >
              Tickets
            </SidebarItem>
            <SidebarSub label="Campaigns" icon={<CampaignsIcon className="hicon" />}>
              <SidebarItem href="/campaigns/runs" current={path === "/campaigns/runs"} onClick={go}>
                Runs
              </SidebarItem>
              <SidebarItem href="/campaigns/templates" current={path === "/campaigns/templates"} onClick={go}>
                Templates
              </SidebarItem>
            </SidebarSub>
            <SidebarSub label="More" icon={<MoreIcon className="hicon" />}>
              <SidebarItem href="/quick-replies" current={path === "/quick-replies"} onClick={go}>
                Quick replies
              </SidebarItem>
              <SidebarItem href="/snippets" current={path === "/snippets"} onClick={go}>
                Snippets
              </SidebarItem>
            </SidebarSub>
          </SidebarGroup>
        </Sidebar>
      </Drawer>
    );
  },
};
