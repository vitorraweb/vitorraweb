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
  documentUrl?: string;
  documentName?: string;
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
  
  // Payment Tracking (Quote-to-Order)
  paymentStatus?: 'unpaid' | 'proforma_sent' | 'awaiting_payment' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque' | 'other';
  paymentDate?: string;
  paymentAmount?: number;             // Actual amount received
  paymentReference?: string;          // Bank ref / Mobile Money ID
  quotedTotal?: number;               // Original quoted amount

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
  // Extended fields
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  remote?: 'on-site' | 'hybrid' | 'remote';
  benefits?: string[];
  skills?: string[];
  applicationEmail?: string;
  applicationUrl?: string;
  deadline?: string;
  priority?: 'normal' | 'urgent' | 'critical';
  category?: string;
  positions?: number;
}

export interface SystemSettings {
  general: {
    companyName: string;
    companyTagline?: string;
    supportEmail: string;
    supportPhone: string;
    whatsapp?: string;
    logoUrl?: string;
    brandColor?: string;
    address?: string;
    businessHours?: string;
    website?: string;
    registrationNumber?: string;
    team: TeamMember[];
  };
  logistics: {
    carriers: Carrier[];
    baseDomesticRate: number;
    freeShippingThreshold: number;
    warehouseAddress: string;
    estimatedDomesticDays?: number;
    estimatedInternationalDays?: number;
  };
  quoting: {
    quoteValidityDays: number;
    minimumOrderValue: number;
    autoConfirmOrders: boolean;
    requirePO: boolean;
    defaultPaymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60';
    cancellationWindowHours: number;
  };
  banking: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName?: string;
    swiftCode?: string;
    bankAddress?: string;
    currency: string;
    additionalInstructions?: string;
  };
  invoicing: {
    companyTIN?: string;
    invoicePrefix: string;
    proformaPrefix: string;
    invoiceFooter?: string;
    proformaValidityDays: number;
    showBankDetailsOnInvoice: boolean;
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
  version: 5.3,
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
        { id: 'fet-small-cars', name: 'FET - PRO - FI (Small Cars)', price: 937500, sku: 'FET-PRO-FI-SC', stock: 100, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Downsizing', description: 'Polo, Fiesta class — 1.0L R3 Turbo, 90–120 HP, 160–200 Nm', attributes: { 'Vehicle Class': 'Small Cars', 'Displacement': '1.0L', 'Cylinders': 'R3', 'Turbo': 'Turbo', 'Power': '90 – 120 HP', 'Torque': '160 – 200 Nm', 'Typical Vehicles': 'Polo, Fiesta', 'Market Role': 'Downsizing', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-compact-14', name: 'FET - PRO - FI (Compact 1.4–1.5L)', price: 937500, sku: 'FET-PRO-FI-C14', stock: 100, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'EU-Standard', description: 'Golf, A3 class — 1.4–1.5L R4 Turbo, 120–170 HP, 200–250 Nm', attributes: { 'Vehicle Class': 'Compact Class', 'Displacement': '1.4 – 1.5L', 'Cylinders': 'R4', 'Turbo': 'Turbo', 'Power': '120 – 170 HP', 'Torque': '200 – 250 Nm', 'Typical Vehicles': 'Golf, A3', 'Market Role': 'EU-Standard', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-compact-20', name: 'FET - PRO - FI (Compact 1.8–2.0L)', price: 937500, sku: 'FET-PRO-FI-C20', stock: 80, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Sporty', description: 'GTI, i30N class — 1.8–2.0L R4 Turbo, 180–300 HP, 300–400 Nm', attributes: { 'Vehicle Class': 'Compact Class', 'Displacement': '1.8 – 2.0L', 'Cylinders': 'R4', 'Turbo': 'Turbo', 'Power': '180 – 300 HP', 'Torque': '300 – 400 Nm', 'Typical Vehicles': 'GTI, i30N', 'Market Role': 'Sporty', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16" or SAE 1/2"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-midrange-20', name: 'FET - PRO - FI (Mid-Range 2.0L)', price: 937500, sku: 'FET-PRO-FI-MR20', stock: 80, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Sweet Spot', description: 'Passat, 3er class — 2.0L R4 Turbo, 190–320 HP, 320–450 Nm', attributes: { 'Vehicle Class': 'Mid-Range', 'Displacement': '2.0L', 'Cylinders': 'R4', 'Turbo': 'Turbo', 'Power': '190 – 320 HP', 'Torque': '320 – 450 Nm', 'Typical Vehicles': 'Passat, 3er', 'Market Role': 'Sweet Spot', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16" or SAE 1/2"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-midrange-25', name: 'FET - PRO - FII (Mid-Range 2.5L)', price: 1687500, sku: 'FET-PRO-FII-MR25', stock: 50, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Performance', description: 'RS3 class — 2.5L R5 Turbo, 350–400 HP, 420–480 Nm', attributes: { 'Vehicle Class': 'Mid-Range', 'Displacement': '2.5L', 'Cylinders': 'R5', 'Turbo': 'Turbo', 'Power': '350 – 400 HP', 'Torque': '420 – 480 Nm', 'Typical Vehicles': 'RS3', 'Market Role': 'Performance', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 5/16" or SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-upper-30', name: 'FET - PRO - FII (Upper Class 3.0L)', price: 1687500, sku: 'FET-PRO-FII-UC30', stock: 40, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Premium', description: '5er, E-Klasse class — 3.0L R6/V6 Turbo, 280–450 HP, 400–600 Nm', attributes: { 'Vehicle Class': 'Upper Class', 'Displacement': '3.0L', 'Cylinders': 'R6 / V6', 'Turbo': 'Turbo', 'Power': '280 – 450 HP', 'Torque': '400 – 600 Nm', 'Typical Vehicles': '5er, E-Klasse', 'Market Role': 'Premium', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-upper-40', name: 'FET - PRO - FIII (Upper Class 4.0L V8)', price: 2812500, sku: 'FET-PRO-FIII-UC40', stock: 25, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Luxury', description: 'S-Klasse class — 4.0L V8 Biturbo, 450–650 HP, 600–850 Nm', attributes: { 'Vehicle Class': 'Upper Class', 'Displacement': '4.0L', 'Cylinders': 'V8', 'Turbo': 'Biturbo', 'Power': '450 – 650 HP', 'Torque': '600 – 850 Nm', 'Typical Vehicles': 'S-Klasse', 'Market Role': 'Luxury', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-suv-compact', name: 'FET - PRO - FII (SUV Compact)', price: 1687500, sku: 'FET-PRO-FII-SUVC', stock: 60, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Mass Market', description: 'Tiguan, Q3 class — 1.5–2.0L R4 Turbo, 150–250 HP, 250–400 Nm', attributes: { 'Vehicle Class': 'SUV Compact', 'Displacement': '1.5 – 2.0L', 'Cylinders': 'R4', 'Turbo': 'Turbo', 'Power': '150 – 250 HP', 'Torque': '250 – 400 Nm', 'Typical Vehicles': 'Tiguan, Q3', 'Market Role': 'Mass Market', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 5/16" or SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-suv-large', name: 'FET - PRO - FII (Large SUV)', price: 1687500, sku: 'FET-PRO-FII-SUVL', stock: 40, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Long Distance', description: 'X5, GLE class — 3.0L R6/V6 Turbo, 300–450 HP, 500–650 Nm', attributes: { 'Vehicle Class': 'Large SUV', 'Displacement': '3.0L', 'Cylinders': 'R6 / V6', 'Turbo': 'Turbo', 'Power': '300 – 450 HP', 'Torque': '500 – 650 Nm', 'Typical Vehicles': 'X5, GLE', 'Market Role': 'Long Distance', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-suv-perf', name: 'FET - PRO - FIII (SUV Performance)', price: 2812500, sku: 'FET-PRO-FIII-SUVP', stock: 20, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'High Performance', description: 'X5M, G63 class — 4.0L V8 Biturbo, 500–650 HP, 700–900 Nm', attributes: { 'Vehicle Class': 'SUV Performance', 'Displacement': '4.0L', 'Cylinders': 'V8', 'Turbo': 'Biturbo', 'Power': '500 – 650 HP', 'Torque': '700 – 900 Nm', 'Typical Vehicles': 'X5M, G63', 'Market Role': 'High Performance', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-sports-20', name: 'FET - PRO - FII (Sports Cars 2.0L)', price: 1687500, sku: 'FET-PRO-FII-SP20', stock: 35, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Lightweight', description: 'Supra 2.0 class — 2.0L R4 Turbo, 250–320 HP, 350–420 Nm', attributes: { 'Vehicle Class': 'Sports Cars', 'Displacement': '2.0L', 'Cylinders': 'R4', 'Turbo': 'Turbo', 'Power': '250 – 320 HP', 'Torque': '350 – 420 Nm', 'Typical Vehicles': 'Supra 2.0', 'Market Role': 'Lightweight Construction', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-sports-30', name: 'FET - PRO - FII (Sports Cars 3.0L)', price: 1687500, sku: 'FET-PRO-FII-SP30', stock: 30, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Performance', description: 'Supra 3.0, 911 class — 3.0L R6 Turbo, 350–510 HP, 500–650 Nm', attributes: { 'Vehicle Class': 'Sports Cars', 'Displacement': '3.0L', 'Cylinders': 'R6', 'Turbo': 'Turbo', 'Power': '350 – 510 HP', 'Torque': '500 – 650 Nm', 'Typical Vehicles': 'Supra, 911', 'Market Role': 'Performance', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-supersport', name: 'FET - PRO - FIII (Supersport Cars)', price: 2812500, sku: 'FET-PRO-FIII-SS', stock: 10, isB2B: false, image: 'https://fuelecotech.com/assets/img/usecases/pkw.jpg', tag: 'Emotion', description: 'Ferrari, Lamborghini class — 4.0–6.5L V8–V12 NA/Turbo, 600–1000+ HP, 700–1000+ Nm', attributes: { 'Vehicle Class': 'Supersport Cars', 'Displacement': '4.0 – 6.5L', 'Cylinders': 'V8 – V12', 'Turbo': 'NA / Turbo', 'Power': '600 – 1000+ HP', 'Torque': '700 – 1000+ Nm', 'Typical Vehicles': 'Ferrari, Lamborghini', 'Market Role': 'Emotion', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€750.00' } },
        // ─── COMMERCIAL VEHICLES ────────────────────────────────────
        { id: 'fet-van-16', name: 'FET - PRO - FI (Van 1.6L)', price: 937500, sku: 'FET-PRO-FI-V16', stock: 80, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: 'Shuttle/Taxi', description: 'Mini bus / Van up to 3.5t — 1.6L R4, 95–135 PS, 260–320 Nm', attributes: { 'Vehicle Class': 'Mini Bus / Van', 'Weight Class': 'up to 3.5 tons', 'Displacement': '1.6L', 'Cylinders': 'R4', 'Power': '95 – 135 PS', 'Torque': '260 – 320 Nm', 'Typical Application': 'Shuttle, Taxi', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-van-20', name: 'FET - PRO - FI (Van 2.0L)', price: 937500, sku: 'FET-PRO-FI-V20', stock: 80, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: 'Standard Transport', description: 'Mini bus / Van up to 3.5t — 2.0L R4, 110–190 PS, 300–450 Nm', attributes: { 'Vehicle Class': 'Mini Bus / Van', 'Weight Class': 'up to 3.5 tons', 'Displacement': '2.0L', 'Cylinders': 'R4', 'Power': '110 – 190 PS', 'Torque': '300 – 450 Nm', 'Typical Application': 'Standard Transport', 'FET Designation': 'FET - PRO - FI', 'Line Size': 'SAE 5/16" or SAE 1/2"', 'RRP (EUR)': '€250.00' } },
        { id: 'fet-van-22', name: 'FET - PRO - FII (Van 2.2L)', price: 1687500, sku: 'FET-PRO-FII-V22', stock: 60, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: 'Payload', description: 'Mini bus / Van up to 3.5t — 2.2–2.3L R4, 120–180 PS, 320–450 Nm', attributes: { 'Vehicle Class': 'Mini Bus / Van', 'Weight Class': 'up to 3.5 tons', 'Displacement': '2.2 – 2.3L', 'Cylinders': 'R4', 'Power': '120 – 180 PS', 'Torque': '320 – 450 Nm', 'Typical Application': 'Payload-oriented', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-van-30', name: 'FET - PRO - FII (Van 3.0L V6)', price: 1687500, sku: 'FET-PRO-FII-V30', stock: 40, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: 'Trailer/Mountains', description: 'Mini bus / Van up to 3.5t — 3.0L V6, 190–258 PS, 440–600 Nm', attributes: { 'Vehicle Class': 'Mini Bus / Van', 'Weight Class': 'up to 3.5 tons', 'Displacement': '3.0L', 'Cylinders': 'V6', 'Power': '190 – 258 PS', 'Torque': '440 – 600 Nm', 'Typical Application': 'Trailer / Mountains', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-trans-20', name: 'FET - PRO - FII (Transporter 2.0L)', price: 1687500, sku: 'FET-PRO-FII-T20', stock: 50, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: 'Local Transport', description: 'Transporter / Sprinter 3.5–5.0t — 2.0–2.3L R4, 130–180 PS, 350–450 Nm', attributes: { 'Vehicle Class': 'Transporter / Sprinter', 'Weight Class': '3.5 – 5.0 tons', 'Displacement': '2.0 – 2.3L', 'Cylinders': 'R4', 'Power': '130 – 180 PS', 'Torque': '350 – 450 Nm', 'Typical Application': 'Local transport', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-trans-30', name: 'FET - PRO - FII (Transporter 3.0L)', price: 1687500, sku: 'FET-PRO-FII-T30', stock: 40, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/transporter.jpg', tag: '5t-Class', description: 'Transporter / Sprinter 3.5–5.0t — 3.0L V6, 190–210 PS, 450–600 Nm', attributes: { 'Vehicle Class': 'Transporter / Sprinter', 'Weight Class': '3.5 – 5.0 tons', 'Displacement': '3.0L', 'Cylinders': 'V6', 'Power': '190 – 210 PS', 'Torque': '450 – 600 Nm', 'Typical Application': '5t-class', 'FET Designation': 'FET - PRO - FII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€450.00' } },
        { id: 'fet-ltruck-30', name: 'FET - PRO - FIII (Light Truck 3.0L)', price: 2812500, sku: 'FET-PRO-FIII-LT30', stock: 30, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'City Distribution', description: 'Light trucks 5–12t — 3.0–4.5L R4, 160–210 PS, 600–800 Nm', attributes: { 'Vehicle Class': 'Light Trucks', 'Weight Class': '5.0 – 12 tons', 'Displacement': '3.0 – 4.5L', 'Cylinders': 'R4', 'Power': '160 – 210 PS', 'Torque': '600 – 800 Nm', 'Typical Application': 'City / Distribution', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-ltruck-60', name: 'FET - PRO - FIII (Light Truck 6.0L)', price: 2812500, sku: 'FET-PRO-FIII-LT60', stock: 25, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Distribution', description: 'Light trucks 5–12t — 6.0–6.7L R6, 220–320 PS, 800–1,200 Nm', attributes: { 'Vehicle Class': 'Light Trucks', 'Weight Class': '5.0 – 12 tons', 'Displacement': '6.0 – 6.7L', 'Cylinders': 'R6', 'Power': '220 – 320 PS', 'Torque': '800 – 1,200 Nm', 'Typical Application': 'Distribution traffic', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2" or 5/8"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-mtruck-77', name: 'FET - PRO - FIII (Medium Truck 7.7L)', price: 2812500, sku: 'FET-PRO-FIII-MT77', stock: 20, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Regional', description: 'Medium trucks 12–18t — 7.7–8.0L R6, 250–350 PS, 1,100–1,400 Nm', attributes: { 'Vehicle Class': 'Medium Trucks', 'Weight Class': '12 – 18 tons', 'Displacement': '7.7 – 8.0L', 'Cylinders': 'R6', 'Power': '250 – 350 PS', 'Torque': '1,100 – 1,400 Nm', 'Typical Application': 'Regional / Long-distance', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2" or 5/8"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-mtruck-90', name: 'FET - PRO - FIII (Medium Truck 9.0L)', price: 2812500, sku: 'FET-PRO-FIII-MT90', stock: 15, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Heavy Distributor', description: 'Medium trucks 12–18t — 9.0L R6, 300–430 PS, 1,400–1,700 Nm', attributes: { 'Vehicle Class': 'Medium Trucks', 'Weight Class': '12 – 18 tons', 'Displacement': '9.0L', 'Cylinders': 'R6', 'Power': '300 – 430 PS', 'Torque': '1,400 – 1,700 Nm', 'Typical Application': 'Heavy distributor', 'FET Designation': 'FET - PRO - FIII', 'Line Size': 'SAE 1/2" or 5/8"', 'RRP (EUR)': '€750.00' } },
        { id: 'fet-htruck-10', name: 'FET - PRO - FIV (Heavy Truck 10L)', price: 5437500, sku: 'FET-PRO-FIV-HT10', stock: 15, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Long-Distance', description: 'Heavy trucks up to 40t — 10–12L R6, 350–430 PS, 1,800–2,100 Nm', attributes: { 'Vehicle Class': 'Heavy Trucks', 'Weight Class': 'up to 40 tons', 'Displacement': '10 – 12L', 'Cylinders': 'R6', 'Power': '350 – 430 PS', 'Torque': '1,800 – 2,100 Nm', 'Typical Application': 'Long-distance traffic', 'FET Designation': 'FET - PRO - FIV', 'Line Size': 'SAE 5/8" or 3/4"', 'RRP (EUR)': '€1,450.00' } },
        { id: 'fet-htruck-12', name: 'FET - PRO - FIV (Heavy Truck 12L)', price: 5437500, sku: 'FET-PRO-FIV-HT12', stock: 10, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Long-Distance', description: 'Heavy trucks up to 40t — 12–13L R6, 420–540 PS, 2,100–2,600 Nm', attributes: { 'Vehicle Class': 'Heavy Trucks', 'Weight Class': 'up to 40 tons', 'Displacement': '12 – 13L', 'Cylinders': 'R6', 'Power': '420 – 540 PS', 'Torque': '2,100 – 2,600 Nm', 'Typical Application': 'Long-distance traffic', 'FET Designation': 'FET - PRO - FIV', 'Line Size': 'SAE 5/8" or 3/4"', 'RRP (EUR)': '€1,450.00' } },
        { id: 'fet-htruck-15', name: 'FET - PRO - FIV (Heavy Truck 15L)', price: 5437500, sku: 'FET-PRO-FIV-HT15', stock: 8, isB2B: true, image: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg', tag: 'Heavy Load', description: 'Heavy trucks up to 40t — 15–16L R6/V8, 520–660 PS, 2,700–3,300 Nm', attributes: { 'Vehicle Class': 'Heavy Trucks', 'Weight Class': 'up to 40 tons', 'Displacement': '15 – 16L', 'Cylinders': 'R6 / V8', 'Power': '520 – 660 PS', 'Torque': '2,700 – 3,300 Nm', 'Typical Application': 'Heavy load', 'FET Designation': 'FET - PRO - FIV', 'Line Size': 'SAE 5/8" or 3/4"', 'RRP (EUR)': '€1,450.00' } }
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
      companyTagline: "Driving Sustainable Growth Across Africa",
      supportEmail: "ops@vitorra.com",
      supportPhone: "+256 700 000 000",
      whatsapp: "+256 700 000 000",
      brandColor: "#CFB53B",
      address: "Kampala, Uganda",
      businessHours: "Mon-Fri 8:00 AM - 5:00 PM (EAT)",
      website: "https://vitorra.com",
      registrationNumber: "",
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
      warehouseAddress: "Vitorra Hub 1 - EBB",
      estimatedDomesticDays: 3,
      estimatedInternationalDays: 14
    },
    quoting: {
      quoteValidityDays: 14,
      minimumOrderValue: 50000,
      autoConfirmOrders: false,
      requirePO: false,
      defaultPaymentTerms: 'net_30' as const,
      cancellationWindowHours: 48
    },
    banking: {
      bankName: 'Stanbic Bank Uganda',
      accountName: 'Vitorra Holdings Limited',
      accountNumber: '9030005678901',
      branchName: 'Kampala Main Branch',
      swiftCode: 'SBICUGKX',
      bankAddress: 'Plot 17, Hannington Road, Kampala',
      currency: 'UGX',
      additionalInstructions: 'Please include your Order ID as payment reference.'
    },
    invoicing: {
      companyTIN: '',
      invoicePrefix: 'INV-',
      proformaPrefix: 'PRO-',
      invoiceFooter: 'Payment is due within the agreed terms. Thank you for your business.',
      proformaValidityDays: 14,
      showBankDetailsOnInvoice: true
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
    const localData = localStorage.getItem('vitorra_cms_state_v4');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Force update pageContent if version is older (Brand Voice & Layout Fixes)
        if (!parsed.version || parsed.version < 5.3) {
          console.warn("CMS: Outdated state version detected. Patching content + products...");
          setState({
            ...parsed,
            pageContent: defaultState.pageContent,
            companyInfo: defaultState.companyInfo,
            blogs: defaultState.blogs,
            products: defaultState.products,
            settings: { ...(parsed.settings || {}), banking: defaultState.settings.banking },
            version: 5.3
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
            version: 5.3,
          });

          for (const cat of defaultState.categories) await setDoc(doc(db, 'categories', cat.id), cat);
          for (const prod of defaultState.products) await setDoc(doc(db, 'products', prod.id), prod);
          for (const c of defaultState.customers) await setDoc(doc(db, 'customers', c.id), c);
          for (const blog of defaultState.blogs) await setDoc(doc(db, 'blogs', blog.id), blog);
        } else {
          // Patch existing Firebase data if outdated
          const data = docSnap.data();
          if (!data.version || data.version < 5.3) {
            console.log("Firestore state out of date. Patching cloud data to v5.3...");
            for (const prod of defaultState.products) {
              await setDoc(doc(db, 'products', prod.id), prod);
            }
            for (const blog of defaultState.blogs) {
              await setDoc(doc(db, 'blogs', blog.id), blog);
            }
            await updateDoc(contentRef, { version: 5.3 });
          }
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
      localStorage.setItem('vitorra_cms_state_v4', JSON.stringify(state));
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
