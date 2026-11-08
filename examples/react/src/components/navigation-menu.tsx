import {
  MenuButton,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuRow,
  Popup,
} from "@harmo-ui/react";
import {
  AnalyticsIcon,
  CampaignsIcon,
  DevelopersIcon,
  MessagesIcon,
  TicketsIcon,
  UserIcon,
} from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <div style={{ minBlockSize: "18rem" }}>
      <NavigationMenu aria-label="Main">
        <NavigationMenuLink href="/product">Product</NavigationMenuLink>
        <NavigationMenuItem label="Solutions">
          <NavigationMenuRow href="/solutions/commerce" icon={<AnalyticsIcon className="hicon" />} label="Commerce" description="Drive sales and convert chats" />
          <NavigationMenuRow href="/solutions/support" icon={<MessagesIcon className="hicon" />} label="Customer support" description="Resolve queries fast" />
          <NavigationMenuRow href="/solutions/marketing" icon={<CampaignsIcon className="hicon" />} label="Marketing" description="Ignite leads and engagement" />
        </NavigationMenuItem>
        <NavigationMenuItem label="Resources">
          <NavigationMenuRow href="/developers" icon={<DevelopersIcon className="hicon" />} label="Developers" description="API keys and webhooks" />
          <NavigationMenuRow href="/customers" icon={<UserIcon className="hicon" />} label="Customers" description="Trusted by top teams" />
          <NavigationMenuRow href="/contact" icon={<TicketsIcon className="hicon" />} label="Contact us" description="Get help quickly" />
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  ),

  "Current page": () => (
    <div style={{ minBlockSize: "18rem" }}>
      <NavigationMenu aria-label="Main">
        <NavigationMenuLink href="/product">Product</NavigationMenuLink>
        <NavigationMenuLink href="/pricing" current>
          Pricing
        </NavigationMenuLink>
        <NavigationMenuItem label="Resources">
          <NavigationMenuRow href="/developers" icon={<DevelopersIcon className="hicon" />} label="Developers" description="API keys and webhooks" />
          <NavigationMenuRow href="/customers" icon={<UserIcon className="hicon" />} label="Customers" description="Trusted by top teams" />
          <NavigationMenuRow href="/contact" icon={<TicketsIcon className="hicon" />} label="Contact us" description="Get help quickly" />
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  ),

  "On a phone": () => (
    <Popup trigger={<MenuButton aria-label="Menu" />} style={{ inlineSize: "18rem" }}>
      <NavigationMenu aria-label="Main" orientation="vertical">
        <NavigationMenuLink href="/product">Product</NavigationMenuLink>
        <NavigationMenuItem label="Solutions">
          <NavigationMenuRow href="/solutions/commerce" icon={<AnalyticsIcon className="hicon" />} label="Commerce" description="Drive sales and convert chats" />
          <NavigationMenuRow href="/solutions/support" icon={<MessagesIcon className="hicon" />} label="Customer support" description="Resolve queries fast" />
          <NavigationMenuRow href="/solutions/marketing" icon={<CampaignsIcon className="hicon" />} label="Marketing" description="Ignite leads and engagement" />
        </NavigationMenuItem>
        <NavigationMenuItem label="Resources">
          <NavigationMenuRow href="/developers" icon={<DevelopersIcon className="hicon" />} label="Developers" description="API keys and webhooks" />
          <NavigationMenuRow href="/customers" icon={<UserIcon className="hicon" />} label="Customers" description="Trusted by top teams" />
          <NavigationMenuRow href="/contact" icon={<TicketsIcon className="hicon" />} label="Contact us" description="Get help quickly" />
        </NavigationMenuItem>
      </NavigationMenu>
    </Popup>
  ),

  "Right to left": () => (
    <div style={{ minBlockSize: "18rem" }}>
      <NavigationMenu aria-label="الرئيسية">
        <NavigationMenuLink href="/product">المنتج</NavigationMenuLink>
        <NavigationMenuItem label="الحلول">
          <NavigationMenuRow href="/solutions/commerce" icon={<AnalyticsIcon className="hicon" />} label="التجارة" description="زد مبيعاتك عبر المحادثات" />
          <NavigationMenuRow href="/solutions/support" icon={<MessagesIcon className="hicon" />} label="دعم العملاء" description="أجب عن الأسئلة بسرعة" />
        </NavigationMenuItem>
        <NavigationMenuItem label="الموارد">
          <NavigationMenuRow href="/developers" icon={<DevelopersIcon className="hicon" />} label="المطورون" description="مفاتيح الواجهة البرمجية" />
          <NavigationMenuRow href="/contact" icon={<TicketsIcon className="hicon" />} label="اتصل بنا" description="احصل على المساعدة بسرعة" />
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  ),
};
