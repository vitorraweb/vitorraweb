import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  imageUrl?: string;
  status: 'published' | 'draft';
  tags?: string[];
  category?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  image?: string;
  description?: string;
  tag?: string;
  isB2B?: boolean;
  attributes?: Record<string, string>;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface ProductSection {
  id: string;
  type: 'hero' | 'features' | 'variants' | 'specs' | 'testimonials' | 'cta' | 'content';
  title?: string;
  subtitle?: string;
  content?: string;
  items?: { icon?: string; title: string; description: string }[];
  config?: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  path: string;
  type: 'wide' | 'square';
  category?: string;
  categoryId: string;
  color?: string;
  price?: number;
  sku?: string;
  stock?: number;
  status?: 'active' | 'draft' | 'archived';
  variants?: ProductVariant[];
  sections?: ProductSection[];
  gallery?: string[];
  specs?: Record<string, string>;
  heroVideo?: string;
  accentColor?: string;
  useDynamicPage?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  orderType: 'product' | 'logistics' | 'both';
  items: { 
    id: string;
    name: string; 
    quantity: number; 
    price: number;
    instructions?: string;
  }[];
  total: number;
  estimatedValue?: number;
  status: 'pending' | 'awaiting_invoice' | 'awaiting_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  createdAt: string;
  updatedAt: string;
  
  // Logistics & Delivery
  shippingMethod: 'pickup' | 'vitorra_logistics';
  shippingAddress: string;
  billingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  
  // Documents (Offline Payment Flow)
  poDocumentUrl?: string | null;      // Customer uploads PO
  proformaUrl?: string | null;        // Admin uploads Proforma
  paymentReceiptUrl?: string | null;  // Customer uploads Receipt
  invoiceUrl?: string | null;         // Admin uploads final Invoice
  
  // Communication
  notes?: string;                     // Customer notes
  adminNotes?: string;                // Internal admin notes (private)
  statusHistory?: { status: string; date: string; note?: string }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  role: 'b2b' | 'b2c';
  joinDate: string;
  status: 'active' | 'suspended';
  totalOrders: number;
  totalSpent?: number;
  address?: string;
  billingAddress?: string;
  shippingAddress?: string;
  orders?: Order[];
  notes?: string;
}

export interface StatItem {
  stat: string;
  label: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: string[];
  email: string;
  salesEmail: string;
  phone: string;
  businessHours: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    whatsapp: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'inactive';
}

export interface Carrier {
  id: string;
  name: string;
  pattern: string;
  active: boolean;
}

export interface TaxJurisdiction {
  id: string;
  region: string;
  rate: number; // percentage, e.g. 18
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'mobile' | 'cash';
  active: boolean;
  config?: Record<string, any>;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  status: 'open' | 'closed';
  postedDate: string;
}

export interface SystemSettings {
  general: {
    companyName: string;
    supportEmail: string;
    supportPhone: string;
    logoUrl?: string;
    brandColor?: string;
    team: TeamMember[];
  };
  logistics: {
    carriers: Carrier[];
    baseDomesticRate: number;
    freeShippingThreshold: number;
    warehouseAddress: string;
  };
  financials: {
    currency: string;
    taxRates: TaxJurisdiction[];
    paymentMethods: PaymentMethod[];
    orderPrefix: string;
    nextOrderNumber: number;
  };
}

export interface PageContent {
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroDescription: string;
  homeHeroImage: string;
  ecosystemTitle: string;
  ecosystemDescription: string;
  globalImpactTitle: string;
  globalImpactDescription: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutHeroDescription: string;
  aboutHeroImage: string;
  leadershipImage: string;
  visionTitle: string;
  visionDescription: string;
  missionTitle: string;
  missionDescription: string;
  leadershipTitle: string;
  leadershipDescription: string;
  leadershipQuote: string;
  investmentPhilosophyTitle: string;
  investmentPhilosophyDescription: string;
  sealHeroVideo: string;
  coffeeHeroImage: string;
  logisticsHeroImage: string;
  logisticsFleetImage: string;
  fetHeroVideo: string;
  contactTitle: string;
  contactDescription: string;
  contactFormTitle: string;
  footerDescription: string;
  [key: string]: string;
}

interface CMSState {
  pageContent: PageContent;
  products: Product[];
  blogs: BlogPost[];
  customers: Customer[];
  orders: Order[];
  jobs: JobPosting[];
  stats: StatItem[];
  companyInfo: CompanyInfo;
  coreValues: { title: string; description: string }[];
  investmentPillars: { title: string; description: string }[];
  categories: ProductCategory[];
  settings: SystemSettings;
  version: number;
}

const defaultState: CMSState = {
  pageContent: {
    homeHeroTitle: "Driving Africa's",
    homeHeroSubtitle: "Economic Transformation.",
    homeHeroDescription: "We are a forward-thinking holding company delivering innovative technologies, superior products, and dependable logistics solutions to international markets. Driving digital transformation and sustainable trade across Africa.",
    homeHeroImage: '/images/home_bg.png',
    ecosystemTitle: "Our Portfolio",
    ecosystemDescription: "A portfolio of specialized subsidiaries united by a shared commitment to sustainable growth and global innovation.",
    globalImpactTitle: "Global Impact. Solid Foundations.",
    globalImpactDescription: "Rooted in Kampala, Uganda, we leverage regional expertise to identify global opportunities, facilitating international trade and innovation.",
    aboutHeroTitle: "Building",
    aboutHeroSubtitle: "Africa.",
    aboutHeroDescription: "We are a forward-thinking company delivering innovative technologies and dependable logistics solutions to international markets. Our mission is to enhance healthcare, mobility, and environmental sustainability across Africa.",
    aboutHeroImage: '/images/about_hero_highres.png',
    leadershipImage: '/images/leadership.png',
    visionTitle: "Our Vision",
    visionDescription: "To become a leading African holding company driving innovation, digital transformation, sustainable trade, and cross-border economic growth.",
    missionTitle: "Our Mission",
    missionDescription: "To deliver globally tested technologies and build scalable platforms that enhance healthcare, mobility, environmental sustainability, logistics, and agricultural exports across Africa.",
    leadershipTitle: "Executive Leadership",
    leadershipDescription: "Our team brings together decades of extensive experience across international markets and specialized sectors. We are united by a common goal: to build sustainable businesses that contribute to economic development.",
    leadershipQuote: "\"Lasting value is built through small, consistent steps toward a shared goal.\"",
    investmentPhilosophyTitle: "Investment Strategy",
    investmentPhilosophyDescription: "We focus on businesses with solid fundamentals and scalable models that have the potential to lead their markets. Our approach is collaborative: we provide not just capital, but the strategic guidance and operational support needed to grow.",
    sealHeroVideo: 'https://cdn.shopify.com/videos/c/vp/9658a6ea35be4814a83fe106e3c9b714/9658a6ea35be4814a83fe106e3c9b714.HD-1080p-4.8Mbps-59154649.mp4',
    coffeeHeroImage: '/images/coffee_hero.png',
    logisticsHeroImage: '/images/logistics_hero.png',
    logisticsFleetImage: '/images/logistics_fleet.png',
    fetHeroVideo: 'https://fuelecotech.com/assets/video/hero/hero-desktop.mp4',
    contactTitle: "Contact Us",
    contactDescription: "Get in touch with our team to discuss investment opportunities, distribution partnerships, or product inquiries.",
    contactFormTitle: "Send an Inquiry",
    footerDescription: "Our products redefine standards through innovation and precision. They are built to perform across diverse markets, combining advanced technology with dependable quality to deliver exceptional results",
  },
  version: 4.5,
  stats: [
    { stat: "4+", label: "Portfolio" },
    { stat: "15+", label: "Global Markets" },
    { stat: "100%", label: "Quality Assured" },
    { stat: "24/7", label: "Customer Support" },
  ],
  companyInfo: {
    name: "Vitorra Holdings Limited",
    tagline: "VITORRA",
    address: ["Padre Pio House, Plot 32", "Lumumba Avenue", "Kampala, Uganda"],
    email: "support@vitorra.org",
    salesEmail: "sales@vitorraholdings.com",
    phone: "+256 740 026 118",
    businessHours: "Monday - Friday: 9:00 AM - 5:00 PM EAT",
    socialLinks: { linkedin: "https://linkedin.com", twitter: "https://twitter.com", facebook: "https://facebook.com", instagram: "https://instagram.com", whatsapp: "https://wa.me/256740026294" }
  },
  coreValues: [
    { title: "Integrity", description: "We operate with unyielding transparency and ethical rigor." },
    { title: "Global Standard", description: "Deep local roots married to international excellence." },
    { title: "Agility", description: "We move with decisive intent, anticipating market shifts." }
  ],
  investmentPillars: [
    { title: "Strategic Alignment", description: "Every subsidiary must seamlessly empower our broader ecosystem." },
    { title: "Operational Excellence", description: "We implement relentless standards and battle-tested processes." },
    { title: "Sustainable Dominance", description: "We prioritize long-term, unshakeable value creation." }
  ],
  categories: [
    { id: 'SEAL', name: 'SEAL', icon: 'ShieldCheck', color: 'text-red-500', description: 'Advanced hemostatic wound care' },
    { id: 'coffee', name: 'Coffee', icon: 'Leaf', color: 'text-emerald-400', description: 'Superior Arabica bulk supply' },
    { id: 'FET', name: 'FET', icon: 'Globe', color: 'text-vitorra-gold', description: 'Fuel efficiency technology' },
    { id: 'logistics', name: 'Logistics', icon: 'Truck', color: 'text-blue-400', description: 'Supply chain & freight' },
  ],
  products: [
    {
      id: "logistics", name: "Vitorra Logistics", description: "The unyielding backbone of our global operations.", icon: "Truck", imageUrl: "/images/logistics_hero.png", path: "/products/logistics", type: "wide", category: "Logistics", categoryId: "logistics", status: 'active',
      variants: [{ id: 'standard-freight', name: 'Standard Freight', price: 850000, sku: 'LOG-STD-001', stock: 999 }]
    },
    {
      id: "coffee", name: "Vitorra Coffee", description: "Direct Export Arabica Supply.", icon: "Leaf", imageUrl: "/images/vitorra_coffee_bag.png", path: "/products/coffee", type: "square", category: "Coffee", categoryId: "coffee", status: 'active',
      variants: [
        { id: 'arabica-retail', name: 'Highland Arabica (250g Retail)', price: 34000, sku: 'VC-ARB-250', stock: 250, isB2B: false, image: '/images/vitorra_coffee_bag.png' },
        { id: 'arabica-bulk', name: 'Wholesale Arabica (60kg Bulk Export)', price: 1200000, sku: 'VC-ARB-BULK', stock: 50, isB2B: true, image: '/images/coffee_beans.png' }
      ]
    },
    {
      id: "seal", name: "SEAL Wound Care", description: "Rapid Hemostatic Technology.", icon: "ShieldCheck", imageUrl: "https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Seal_OTC_6d7f6137-8e71-4c6b-97a0-e98d58bc5a50.jpg", path: "/products/seal", type: "square", category: "SEAL", categoryId: "SEAL", status: 'active',
      variants: [
        { id: 'otc-spray', name: 'SEAL™ OTC Spray (1.5 oz)', price: 148000, sku: 'SEAL-OTC-001', stock: 500, isB2B: false, image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Seal_OTC_6d7f6137-8e71-4c6b-97a0-e98d58bc5a50.jpg?v=1766107863&width=600&height=600&crop=center' },
        { id: 'pro-spray', name: 'SEAL™ PRO Spray (2.5 oz)', price: 259000, sku: 'SEAL-PRO-001', stock: 250, isB2B: true, image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Seal_Pro_68a2e37a-db5f-4e15-9a8a-fe619ad33c1c.jpg?v=1766109372&width=600&height=600&crop=center' },
        { id: 'pet-spray', name: 'HemoSEAL™ Pet Spray (2.8 oz)', price: 203500, sku: 'SEAL-PET-001', stock: 300, isB2B: false, image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/SEAL_HemoSEAL.jpg?v=1766775431&width=600&height=600&crop=center' }
      ]
    },
    {
      id: "fet", name: "Fuel Eco Tech", description: "Fuel Ecosystem Efficiency Systems.", icon: "Globe", imageUrl: "/images/fet_vehicles.png", path: "/products/fet", type: "wide", category: "FET", categoryId: "FET", status: 'active',
      variants: [
        { id: 'passenger', name: 'FET Passenger Module', price: 950000, sku: 'FET-PASS-001', stock: 75, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg' },
        { id: 'commercial', name: 'FET Commercial / Fleet Module', price: 4250000, sku: 'FET-IND-001', stock: 20, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg' }
      ]
    }
  ],
  blogs: [
    {
      id: 'fet-lab-test',
      title: 'FET System Impresses in Laboratory Test',
      excerpt: 'The published article describes a standardized WLTC and constant-speed test. The potential is particularly evident at steady speeds – up to 15% savings during constant-speed driving.',
      content: `The innovative fuel optimisation system Fuel Eco Tech (FET) was subjected to a comprehensive WLTC and constant-speed test under standardised laboratory conditions. The results confirm clear reductions in fuel consumption and emissions.\n\nFuel Eco Tech is integrated into the fuel line after the fuel filter and before the high-pressure pump or injection system. It acts physically on the fuel through targeted structuring, homogenisation and potential molecular effects.\n\nIn the test, the system was installed in a diesel vehicle with modern injection technology. Five WLTC cycles and subsequent constant-speed runs at 50, 80 and 130 km/h were performed both with and without FET.\n\nAt constant speed, average consumption values were measurably and consistently reduced. Fuel efficiency increased significantly with partly double-digit improvement values in peak data. Emissions also decreased continuously under constant load conditions.\n\nThe test result is clear: passed. Fuel Eco Tech reduces fuel consumption and lowers emissions, making it ideal for vehicles with high mileage.`,
      date: 'July 2025',
      author: 'Vitorra Technical Team',
      imageUrl: 'https://fuelecotech.com/assets/img/news/labortest.jpg',
      status: 'published' as const,
      tags: ['FET', 'Lab Test', 'WLTC', 'Certification'],
    },
  ],
  customers: [],
  orders: [],
  jobs: [],
  settings: {
    general: {
      companyName: "Vitorra Holdings Limited",
      supportEmail: "ops@vitorra.com",
      supportPhone: "+256 700 000 000",
      brandColor: "#CFB53B",
      team: [
        { id: '1', name: 'Admin', email: 'admin@vitorra.com', role: 'Super Admin', status: 'active' }
      ]
    },
    logistics: {
      carriers: [
        { id: 'dhl', name: 'DHL Express', pattern: 'https://dhl.com/track/{{ID}}', active: true },
        { id: 'fedex', name: 'FedEx Global', pattern: 'https://fedex.com/track/{{ID}}', active: true }
      ],
      baseDomesticRate: 15000,
      freeShippingThreshold: 2000000,
      warehouseAddress: "Vitorra Hub 1 - EBB"
    },
    financials: {
      currency: "UGX",
      orderPrefix: "VIT-",
      nextOrderNumber: 10052,
      taxRates: [
        { id: 'eac', region: 'East Africa (EAC)', rate: 18 },
        { id: 'eu', region: 'European Union', rate: 21 },
        { id: 'global', region: 'Rest of World', rate: 0 }
      ],
      paymentMethods: [
        { id: 'bank', name: 'Bank Wire Transfer', type: 'bank', active: true }
      ]
    }
  }
};


interface CMSContextType {
  state: CMSState;
  updatePageContent: (key: string, value: string) => Promise<void>;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  updateSocialLinks: (links: Partial<CompanyInfo['socialLinks']>) => Promise<void>;
  updateStats: (stats: StatItem[]) => Promise<void>;
  updateCoreValues: (values: { title: string; description: string }[]) => Promise<void>;
  updateInvestmentPillars: (pillars: { title: string; description: string }[]) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addBlog: (blog: BlogPost) => Promise<void>;
  updateBlog: (id: string, blog: Partial<BlogPost>) => Promise<void>;
  removeBlog: (id: string) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  updateCategory: (id: string, category: Partial<ProductCategory>) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  addJob: (job: JobPosting) => Promise<void>;
  updateJob: (id: string, job: Partial<JobPosting>) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CMSState>(defaultState);

  useEffect(() => {
    // 1. Try to load from LocalStorage first (for mock mode or fast initial load)
    const localData = localStorage.getItem('vitorra_cms_state_v3');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Force update pageContent if version is older (Brand Voice & Layout Fixes)
        if (!parsed.version || parsed.version < 4.5) {
          console.warn("CMS: Outdated state version detected. Patching content...");
          setState({
            ...parsed,
            pageContent: defaultState.pageContent,
            companyInfo: defaultState.companyInfo,
            blogs: defaultState.blogs,
            version: 4.5
          });
        } else {
          setState(parsed);
        }
      } catch (e) {
        console.error("Failed to load local CMS state:", e);
      }
    }

    if (!db) return;

    const setupFirestore = async () => {
      try {
        const contentRef = doc(db, 'system', 'content');
        const docSnap = await getDoc(contentRef);

        if (!docSnap.exists()) {
          console.log("Seeding initial data into Firebase...");
          await setDoc(contentRef, {
            pageContent: defaultState.pageContent,
            companyInfo: defaultState.companyInfo,
            stats: defaultState.stats,
            coreValues: defaultState.coreValues,
            investmentPillars: defaultState.investmentPillars,
            version: 2.4,
          });

          for (const cat of defaultState.categories) await setDoc(doc(db, 'categories', cat.id), cat);
          for (const prod of defaultState.products) await setDoc(doc(db, 'products', prod.id), prod);
          for (const c of defaultState.customers) await setDoc(doc(db, 'customers', c.id), c);
        }

        // Real-time listener for core system content
        onSnapshot(contentRef, (d) => {
          if (d.exists()) {
            setState(prev => ({
              ...prev,
              pageContent: d.data()?.pageContent || prev.pageContent,
              companyInfo: d.data()?.companyInfo || prev.companyInfo,
              stats: d.data()?.stats || prev.stats,
              coreValues: d.data()?.coreValues || prev.coreValues,
              investmentPillars: d.data()?.investmentPillars || prev.investmentPillars,
            }));
          }
        }, (err) => console.warn("Firestore sync error (content):", err.code));

        // System Settings
        onSnapshot(doc(db, 'system', 'settings'), (d) => {
          if (d.exists()) {
            setState(prev => ({ ...prev, settings: { ...prev.settings, ...d.data() } as SystemSettings }));
          } else {
            setDoc(doc(db, 'system', 'settings'), defaultState.settings).catch(() => {});
          }
        }, (err) => console.warn("Firestore sync error (settings):", err.code));

        // Products, Categories, Customers, Blogs, Orders
        onSnapshot(collection(db, 'products'), s => {
          setState(prev => ({ ...prev, products: s.docs.map(d => ({ id: d.id, ...d.data() } as Product)) }));
        }, (err) => console.warn("Firestore sync error (products):", err.code));
        onSnapshot(collection(db, 'categories'), s => {
          setState(prev => ({ ...prev, categories: s.docs.map(d => ({ id: d.id, ...d.data() } as ProductCategory)) }));
        }, (err) => console.warn("Firestore sync error (categories):", err.code));
        onSnapshot(collection(db, 'users'), s => {
          setState(prev => ({ 
            ...prev, 
            customers: s.docs.map(d => {
              const u = d.data();
              return {
                id: d.id,
                name: u.displayName || 'Unknown',
                email: u.email || '',
                phone: u.phone || '',
                companyName: u.company?.name || '',
                taxId: u.company?.taxId || '',
                role: u.role || 'b2c',
                joinDate: u.createdAt || new Date().toISOString(),
                status: u.status || 'active',
                totalOrders: prev.orders.filter(o => o.customerId === d.id).length,
                totalSpent: prev.orders.filter(o => o.customerId === d.id).reduce((sum, o) => sum + o.total, 0)
              } as Customer;
            }) 
          }));
        }, (err) => console.warn("Firestore sync error (users mapping to customers):", err.code));
        onSnapshot(collection(db, 'blogs'), s => {
          setState(prev => ({ ...prev, blogs: s.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost)) }));
        }, (err) => console.warn("Firestore sync error (blogs):", err.code));
        onSnapshot(collection(db, 'orders'), s => {
          const orders = s.docs.map(d => ({ id: d.id, ...d.data() } as Order));
          setState(prev => ({ ...prev, orders }));
        }, (err) => console.warn("Firestore sync error (orders):", err.code));
        onSnapshot(collection(db, 'jobs'), s => {
          setState(prev => ({ ...prev, jobs: s.docs.map(d => ({ id: d.id, ...d.data() } as JobPosting)) }));
        }, (err) => console.warn("Firestore sync error (jobs):", err.code));
      } catch (err) {
        console.error("Firestore sync error:", err);
      }
    };

    setupFirestore();

    // 2. Cross-tab synchronization via LocalStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vitorra_cms_state' && e.newValue) {
        try {
          console.log("Cross-tab sync: New data detected");
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse cross-tab sync data:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Proactive Hydration: Backfill customers from existing orders if registry is empty
  useEffect(() => {
    const hydrate = async () => {
      if (db && state.orders.length > 0 && state.customers.length === 0) {
        console.log("CMS: Proactive customer hydration starting...");
        for (const o of state.orders) {
          if (!o.customerId) continue;
          try {
            const cRef = doc(db, 'customers', o.customerId);
            const cSnap = await getDoc(cRef);
            if (!cSnap.exists()) {
              await setDoc(cRef, {
                id: o.customerId,
                name: o.customerName || 'Legacy Customer',
                email: o.customerEmail || '',
                role: 'b2c',
                joinDate: 'Jan 2026',
                status: 'active',
                totalOrders: 1,
                totalSpent: o.total,
                lastOrder: o.date
              });
            }
          } catch (e) { /* Silent catch */ }
        }
      }
    };
    hydrate();
  }, [state.orders.length, state.customers.length, db]);

  // Persistence for reliability across refreshes/tabs
  useEffect(() => {
    if (state !== defaultState) {
      localStorage.setItem('vitorra_cms_state_v3', JSON.stringify(state));
    }
  }, [state]);

  // Write actions
  const updatePageContent = async (key: string, value: string) => {
    if (!db) { setState(prev => ({ ...prev, pageContent: { ...prev.pageContent, [key]: value } })); return; }
    await updateDoc(doc(db, 'system', 'content'), { [`pageContent.${key}`]: value });
  };

  const updateCompanyInfo = async (info: Partial<CompanyInfo>) => {
    if (!db) { setState(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, ...info } })); return; }
    await updateDoc(doc(db, 'system', 'content'), { companyInfo: { ...state.companyInfo, ...info } });
  };

  const updateSocialLinks = async (links: Partial<CompanyInfo['socialLinks']>) => {
    if (!db) { setState(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, socialLinks: { ...prev.companyInfo.socialLinks, ...links } } })); return; }
    await updateDoc(doc(db, 'system', 'content'), { 'companyInfo.socialLinks': { ...state.companyInfo.socialLinks, ...links } });
  };

  const updateStats = async (stats: StatItem[]) => {
    if (!db) { setState(prev => ({ ...prev, stats })); return; }
    await updateDoc(doc(db, 'system', 'content'), { stats });
  };
  const updateCoreValues = async (values: { title: string; description: string }[]) => {
    if (!db) { setState(prev => ({ ...prev, coreValues: values })); return; }
    await updateDoc(doc(db, 'system', 'content'), { coreValues: values });
  };
  const updateInvestmentPillars = async (pillars: { title: string; description: string }[]) => {
    if (!db) { setState(prev => ({ ...prev, investmentPillars: pillars })); return; }
    await updateDoc(doc(db, 'system', 'content'), { investmentPillars: pillars });
  };

  const addProduct = async (product: Product) => {
    if (!db) { setState(prev => ({ ...prev, products: [...prev.products, product] })); return; }
    await setDoc(doc(db, 'products', product.id), product);
  };
  const updateProduct = async (id: string, u: Partial<Product>) => {
    if (!db) { setState(prev => ({ ...prev, products: prev.products.map(p => p.id === id ? { ...p, ...u } : p) })); return; }
    await updateDoc(doc(db, 'products', id), u);
  };
  const removeProduct = async (id: string) => {
    if (!db) { setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) })); return; }
    await deleteDoc(doc(db, 'products', id));
  };

  const addBlog = async (blog: BlogPost) => {
    if (!db) { setState(prev => ({ ...prev, blogs: [blog, ...prev.blogs] })); return; }
    await setDoc(doc(db, 'blogs', blog.id), blog);
  };
  const updateBlog = async (id: string, u: Partial<BlogPost>) => {
    if (!db) { setState(prev => ({ ...prev, blogs: prev.blogs.map(b => b.id === id ? { ...b, ...u } : b) })); return; }
    await updateDoc(doc(db, 'blogs', id), u);
  };
  const removeBlog = async (id: string) => {
    if (!db) { setState(prev => ({ ...prev, blogs: prev.blogs.filter(b => b.id !== id) })); return; }
    await deleteDoc(doc(db, 'blogs', id));
  };

  const addCustomer = async (customer: Customer) => {
    // Unused from admin panel normally, but map appropriately if used
    if (!db) { setState(prev => ({ ...prev, customers: [customer, ...prev.customers] })); return; }
    await setDoc(doc(db, 'users', customer.id), {
      uid: customer.id,
      displayName: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      createdAt: customer.joinDate,
      status: customer.status,
      company: { name: customer.companyName, taxId: customer.taxId, registrationNo: '', website: '' }
    }, { merge: true });
  };
  const updateCustomer = async (id: string, u: Partial<Customer>) => {
    if (!db) { setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === id ? { ...c, ...u } : c) })); return; }
    const userUpdate: any = {};
    if (u.name !== undefined) userUpdate.displayName = u.name;
    if (u.email !== undefined) userUpdate.email = u.email;
    if (u.phone !== undefined) userUpdate.phone = u.phone;
    if (u.status !== undefined) userUpdate.status = u.status;
    if (u.role !== undefined) userUpdate.role = u.role;
    if (u.companyName !== undefined) userUpdate['company.name'] = u.companyName;
    if (u.taxId !== undefined) userUpdate['company.taxId'] = u.taxId;
    await updateDoc(doc(db, 'users', id), userUpdate);
  };
  const removeCustomer = async (id: string) => {
    if (!db) { setState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) })); return; }
    await deleteDoc(doc(db, 'users', id));
  };

  const addOrder = async (order: Order) => {
    const timestamp = new Date().toISOString();
    const finalOrder = {
      ...order,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: order.status || 'pending',
    };

    // 1. Optimistic local update
    setState(prev => ({ ...prev, orders: [finalOrder, ...prev.orders] }));

    if (db) {
      try {
        // 2. Central registry
        await setDoc(doc(db, 'orders', finalOrder.id), finalOrder);

        // 3. User subcollection sync (Portal visibility)
        if (finalOrder.customerId) {
          await setDoc(doc(db, 'users', finalOrder.customerId, 'orders', finalOrder.id), finalOrder)
            .catch(e => console.error("Portal sync error:", e));

          // 4. Update customer metrics for Admin visibility
          const customerRef = doc(db, 'customers', finalOrder.customerId);
          const snap = await getDoc(customerRef);
          if (snap.exists()) {
            const data = snap.data();
            await updateDoc(customerRef, {
              totalOrders: (data.totalOrders || 0) + 1,
              totalSpent: (data.totalSpent || 0) + finalOrder.total,
              lastOrder: finalOrder.date
            });
          } else {
            // First time this customer is seen (Guest or first purchase)
            await setDoc(customerRef, {
              id: finalOrder.customerId,
              name: finalOrder.customerName || 'New Customer',
              email: finalOrder.customerEmail || '',
              role: finalOrder.customerId.length > 20 ? 'b2c' : 'b2b', // Heuristic
              joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              status: 'active',
              totalOrders: 1,
              totalSpent: finalOrder.total,
              lastOrder: finalOrder.date
            });
          }
        }
      } catch (err) {
        console.error("Firebase addOrder failed:", err);
      }
    }
  };

  const updateOrder = async (id: string, u: Partial<Order>) => {
    const updatedAt = new Date().toISOString();
    const updateData = { ...u, updatedAt };

    // 1. Always update local state immediately (Optimistic UI)
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === id ? { ...o, ...updateData } as Order : o)
    }));

    if (db) {
      try {
        // 2. Update central orders collection
        await updateDoc(doc(db, 'orders', id), updateData);

        // 3. Sync to user subcollection if customerId exists
        const currentOrder = state.orders.find(o => o.id === id);
        if (currentOrder?.customerId) {
          await updateDoc(doc(db, 'users', currentOrder.customerId, 'orders', id), updateData)
            .catch(() => { }); // Silent catch for subcollection sync
        }
      } catch (err) {
        console.error("Firebase updateOrder failed:", err);
      }
    }
  };

  const updateCategory = async (id: string, u: Partial<ProductCategory>) => {
    if (!db) { setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...u } : c) })); return; }
    await updateDoc(doc(db, 'categories', id), u);
  };

  const updateSettings = async (u: Partial<SystemSettings>) => {
    if (!db) { setState(prev => ({ ...prev, settings: { ...prev.settings, ...u } as SystemSettings })); return; }
    await updateDoc(doc(db, 'system', 'settings'), u);
  };

  const addJob = async (job: JobPosting) => {
    if (!db) { setState(prev => ({ ...prev, jobs: [job, ...prev.jobs] })); return; }
    await setDoc(doc(db, 'jobs', job.id), job);
  };
  const updateJob = async (id: string, u: Partial<JobPosting>) => {
    if (!db) { setState(prev => ({ ...prev, jobs: prev.jobs.map(j => j.id === id ? { ...j, ...u } : j) })); return; }
    await updateDoc(doc(db, 'jobs', id), u);
  };
  const removeJob = async (id: string) => {
    if (!db) { setState(prev => ({ ...prev, jobs: prev.jobs.filter(j => j.id !== id) })); return; }
    await deleteDoc(doc(db, 'jobs', id));
  };

  return (
    <CMSContext.Provider value={{
      state,
      updatePageContent, updateCompanyInfo, updateSocialLinks,
      updateStats, updateCoreValues, updateInvestmentPillars,
      addProduct, updateProduct, removeProduct,
      addBlog, updateBlog, removeBlog,
      addCustomer, updateCustomer, removeCustomer,
      addOrder, updateOrder, updateCategory, updateSettings,
      addJob, updateJob, removeJob
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (context === undefined) throw new Error('useCMS must be used within a CMSProvider');
  return context;
}
