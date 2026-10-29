import {
  Handshake, ShoppingCart, Gauge, Wallet, LineChart, Users, ListChecks, Globe, Settings,
  MessageSquare, Workflow, Contact, Target, LayoutTemplate, CreditCard, FlaskConical,
  TrendingUp, LayoutDashboard, CalendarCheck, Hourglass, Briefcase, CalendarDays,
  CheckSquare, Truck, Package, FileText, Images, Send, Mail, UserCog, ShieldCheck, FileSignature, FolderLock, FileCheck, Megaphone, Mails, Layers, Palette, Flame, Video, UserCircle, ClipboardCheck, CalendarRange,
} from "lucide-react";
import { canAccess, type AdminUser } from "@/lib/auth";

/* ─── The console's app registry ──────────────────────────────────────────────
   Modelled on how Odoo organises a large back office: the panel is a set of
   *apps* (Sales, Accounting, People…), each with its own short menu, rather
   than one 25-link sidebar. The launcher at /admin shows the apps; inside an
   app the top bar shows only that app's menu.

   Every menu item keeps its access rule (module / adminOnly). An app is shown
   only if the user can open at least one of its items, and its tile opens the
   first item they can reach.                                                */

export type AppIcon = typeof Handshake;

export type MenuItem = {
  label: string;
  href: string;
  icon: AppIcon;
  /** Several modules: holding any one of them opens the item. */
  module?: string | string[];
  adminOnly?: boolean;
  /** Extra words the command palette matches on. */
  keywords?: string;
};

export type AdminApp = {
  id: string;
  name: string;
  /** One line on the launcher tile. */
  blurb: string;
  icon: AppIcon;
  area: AppArea;
  items: MenuItem[];
};

export type AppArea = "Sell" | "Money" | "Run the company" | "Publish" | "Administer";
export const APP_AREAS: AppArea[] = ["Sell", "Money", "Run the company", "Publish", "Administer"];

export const ADMIN_APPS: AdminApp[] = [
  {
    id: "sales", name: "Sales", blurb: "Enquiries, pipeline, customers, prospecting and quotations", icon: Handshake, area: "Sell",
    items: [
      { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare, module: "enquiries", keywords: "leads quote requests inbox" },
      { label: "Pipeline",  href: "/admin/pipeline",  icon: Workflow,      module: "customers", keywords: "deals stages board kanban" },
      { label: "Customers", href: "/admin/customers", icon: Contact,       module: "customers", keywords: "contacts clients crm" },
      { label: "Prospects", href: "/admin/prospects", icon: Target,        module: "prospects", keywords: "outreach campaign leads list" },
      { label: "Quotations", href: "/admin/quotations", icon: FileSignature, module: "quotations", keywords: "quote proforma coffee fet export offer" },
      { label: "Reply templates", href: "/admin/templates", icon: LayoutTemplate, module: "customers", keywords: "email replies saved answers" },
      { label: "Contracts", href: "/admin/contracts", icon: FileCheck, module: ["prospects", "quotations", "accounting"], keywords: "contract agreement sign signature fet" },
      { label: "Documents", href: "/admin/sales-documents", icon: FolderLock, module: ["prospects", "quotations", "accounting"], keywords: "contract agreement fet sales terms" },
    ],
  },
  {
    id: "marketing", name: "Marketing", blurb: "Email campaigns, markets, templates and lead priorities", icon: Mails, area: "Sell",
    items: [
      { label: "Campaigns", href: "/admin/marketing/campaigns", icon: Mails, module: "prospects", keywords: "email campaign newsletter send blast" },
      { label: "Markets", href: "/admin/marketing/markets", icon: Layers, module: "prospects", keywords: "audience segment list contacts" },
      { label: "Templates", href: "/admin/marketing/templates", icon: Palette, module: "prospects", keywords: "email design builder template" },
      { label: "Lead priorities", href: "/admin/marketing/priorities", icon: Flame, module: "prospects", keywords: "decision engine score hot leads focus" },
    ],
  },
  {
    id: "orders", name: "Orders", blurb: "Orders, part-payments and payment records", icon: ShoppingCart, area: "Sell",
    items: [
      { label: "Orders",   href: "/admin/orders",   icon: ShoppingCart, module: "orders", keywords: "sales installments" },
      { label: "Payments", href: "/admin/payments", icon: CreditCard,   adminOnly: true, keywords: "gateway transactions" },
    ],
  },
  {
    id: "fet", name: "Fuel Eco Tech", blurb: "Savings reports and vehicle trials", icon: Gauge, area: "Sell",
    items: [
      { label: "Savings",    href: "/admin/fet",        icon: Gauge,        module: "fet", keywords: "fuel calculator reports" },
      { label: "Trials",     href: "/admin/fet-trials", icon: FlaskConical, module: "fet_trials", keywords: "test fleet vehicle" },
    ],
  },
  {
    id: "accounting", name: "Accounting", blurb: "Books, invoices, bills, VAT and budgets", icon: Wallet, area: "Money",
    items: [
      { label: "Books", href: "/admin/accounting", icon: Wallet, module: "accounting", keywords: "invoices bills vat transactions ledger stock inventory receipts scan phone" },
    ],
  },
  {
    id: "insights", name: "Insights", blurb: "Company overview, website visitors, the Executive report and Google Ads", icon: LineChart, area: "Money",
    items: [
      { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard, keywords: "dashboard stats" },
      { label: "Executive report", href: "/admin/executive", icon: TrendingUp, module: "executive", keywords: "executive ceo revenue report" },
      { label: "Website",   href: "/admin/website",   icon: Globe, module: "google_ads", keywords: "visitors traffic analytics posthog live sessions replays pages" },
      { label: "Google Ads", href: "/admin/google-ads", icon: Megaphone, module: "google_ads", keywords: "adwords ads advertising spend campaigns cpc clicks search terms marketing" },
    ],
  },
  {
    id: "operations", name: "Operations", blurb: "Team tasks, meetings and supplier onboarding", icon: ListChecks, area: "Run the company",
    items: [
      { label: "Tasks",     href: "/admin/tasks",     icon: CheckSquare, module: "tasks", keywords: "todo assignments" },
      { label: "Suppliers", href: "/admin/suppliers", icon: Truck,       module: "suppliers", keywords: "vendors onboarding" },
      { label: "Meetings",  href: "/admin/meetings",  icon: Video,       keywords: "teams microsoft join call" },
    ],
  },
  {
    id: "me", name: "My work", blurb: "Your leave, monthly reports, documents and team", icon: UserCircle, area: "Run the company",
    items: [
      { label: "Home",          href: "/admin/me",           icon: LayoutDashboard, keywords: "my portal staff self service supervisor" },
      { label: "My leave",      href: "/admin/me/leave",     icon: CalendarCheck,   keywords: "apply leave time off holiday request balance" },
      { label: "My reports",    href: "/admin/me/reports",   icon: ClipboardCheck,  keywords: "monthly report checklist" },
      { label: "Team calendar", href: "/admin/me/calendar",  icon: CalendarRange,   keywords: "who is away absence" },
      { label: "My documents",  href: "/admin/me/documents", icon: FolderLock,      keywords: "contract hr files" },
    ],
  },
  {
    id: "people", name: "People", blurb: "Employees, leave, announcements, probation and hiring", icon: Users, area: "Run the company",
    items: [
      { label: "Overview",  href: "/admin/people",    icon: LayoutDashboard, module: "people", keywords: "hr dashboard headcount birthdays contracts" },
      { label: "Employees", href: "/admin/people/employees", icon: Contact, module: "people", keywords: "staff records hr emergency contact contract" },
      { label: "Leave",     href: "/admin/leave",     icon: CalendarCheck, module: "people", keywords: "time off absence" },
      { label: "Leave calendar", href: "/admin/people/calendar", icon: CalendarRange, module: "people", keywords: "who is away absence schedule" },
      { label: "Announcements",  href: "/admin/people/announcements", icon: Megaphone, module: "people", keywords: "notices news staff" },
      { label: "Probation", href: "/admin/probation", icon: Hourglass,     module: "people", keywords: "new staff reports" },
      { label: "Careers",   href: "/admin/careers",   icon: Briefcase,     module: "people", keywords: "jobs hiring recruitment cv applicants" },
      { label: "Holidays",  href: "/admin/holidays",  icon: CalendarDays,  module: "people", keywords: "public holidays events" },
    ],
  },
  {
    id: "website", name: "Website", blurb: "Products, blog, media, newsletter and messages", icon: Globe, area: "Publish",
    items: [
      { label: "Products",   href: "/admin/products",   icon: Package,  module: "products", keywords: "catalogue coffee prices" },
      { label: "Blog",       href: "/admin/blog",       icon: FileText, module: "blog", keywords: "posts articles" },
      { label: "Media",      href: "/admin/media",      icon: Images,   module: "media", keywords: "images uploads" },
      { label: "Newsletter", href: "/admin/newsletter", icon: Send,     module: "newsletter", keywords: "subscribers broadcast" },
      { label: "Messages",   href: "/admin/messages",   icon: Mail,     module: "messages", keywords: "contact form inbox" },
    ],
  },
  {
    id: "settings", name: "Settings", blurb: "Staff, permissions, settings and the audit trail", icon: Settings, area: "Administer",
    items: [
      { label: "Staff",        href: "/admin/staff",    icon: UserCog,     adminOnly: true, keywords: "users roles permissions team" },
      { label: "Settings",     href: "/admin/settings", icon: Settings,    adminOnly: true, keywords: "tax currency shipping notifications security" },
      { label: "Activity log", href: "/admin/audit",    icon: ShieldCheck, adminOnly: true, keywords: "audit trail history" },
    ],
  },
];

/* Pages that live outside any app menu but still belong to one. */
const EXTRA_ROUTES: { href: string; app: string; label: string; module?: string; adminOnly?: boolean }[] = [
  { href: "/admin/users",   app: "settings", label: "Users", adminOnly: true },
  { href: "/admin/invoices", app: "accounting", label: "Invoice", module: "accounting" },
  { href: "/admin/profile", app: "",         label: "Profile & security" },
  { href: "/admin/me/team", app: "me",       label: "My team" },
];

/** Flat list, longest href first, for active-route detection and guards. */
export const ALL_ITEMS: (MenuItem & { app: string })[] = [
  ...ADMIN_APPS.flatMap((a) => a.items.map((i) => ({ ...i, app: a.id }))),
  ...EXTRA_ROUTES.map((r) => ({ ...r, icon: Settings })),
].sort((a, b) => b.href.length - a.href.length);

export function routeFor(pathname: string) {
  return ALL_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
}

export function appFor(pathname: string): AdminApp | undefined {
  const r = routeFor(pathname);
  return r ? ADMIN_APPS.find((a) => a.id === r.app) : undefined;
}

export function visibleApps(user: AdminUser | null) {
  return ADMIN_APPS
    .map((a) => ({ ...a, items: a.items.filter((i) => canAccess(user, i)) }))
    .filter((a) => a.items.length > 0);
}
