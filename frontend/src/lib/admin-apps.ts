import {
  Handshake, ShoppingCart, Gauge, Wallet, LineChart, Users, ListChecks, Globe, Settings,
  MessageSquare, Workflow, Contact, Target, LayoutTemplate, CreditCard, FlaskConical,
  TrendingUp, LayoutDashboard, CalendarCheck, Hourglass, Briefcase, CalendarDays,
  CheckSquare, Truck, Package, FileText, Images, Send, Mail, UserCog, ShieldCheck, FileSignature,
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
  module?: string;
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
      { label: "Templates", href: "/admin/templates", icon: LayoutTemplate, module: "customers", keywords: "email replies" },
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
      { label: "Books", href: "/admin/accounting", icon: Wallet, module: "accounting", keywords: "invoices bills vat transactions ledger" },
    ],
  },
  {
    id: "insights", name: "Insights", blurb: "Company overview and the CEO report", icon: LineChart, area: "Money",
    items: [
      { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard, keywords: "dashboard stats" },
      { label: "CEO report", href: "/admin/executive", icon: TrendingUp, module: "executive", keywords: "executive revenue" },
    ],
  },
  {
    id: "operations", name: "Operations", blurb: "Team tasks and supplier onboarding", icon: ListChecks, area: "Run the company",
    items: [
      { label: "Tasks",     href: "/admin/tasks",     icon: CheckSquare, module: "tasks", keywords: "todo assignments" },
      { label: "Suppliers", href: "/admin/suppliers", icon: Truck,       module: "suppliers", keywords: "vendors onboarding" },
    ],
  },
  {
    id: "people", name: "People", blurb: "Leave, probation, hiring and holidays", icon: Users, area: "Run the company",
    items: [
      { label: "Leave",     href: "/admin/leave",     icon: CalendarCheck, module: "people", keywords: "time off absence" },
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
