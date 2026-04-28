/* ═══════════════════════════════════════════════════════════════════
   Carrier Registry — Vitorra Shipping Partners
   
   Each carrier has a tracking URL template where {trackingNumber}
   is replaced with the actual tracking number to generate a 
   direct deep-link to the carrier's live tracking page.
   ═══════════════════════════════════════════════════════════════════ */

export interface Carrier {
  id: string;
  name: string;
  region: 'uganda' | 'east_africa' | 'international';
  trackingUrl: string; // Use {trackingNumber} as placeholder
  logo?: string;
  color: string;
}

export const CARRIERS: Carrier[] = [
  // ─── Uganda ─────────────────────────────────────────────────────
  {
    id: 'vitorra_express',
    name: 'Vitorra Express',
    region: 'uganda',
    trackingUrl: '',
    color: '#b49b32',
  },
  {
    id: 'posta_uganda',
    name: 'Posta Uganda',
    region: 'uganda',
    trackingUrl: 'https://www.ugapost.co.ug/track?id={trackingNumber}',
    color: '#e53e3e',
  },
  {
    id: 'safeboda',
    name: 'SafeBoda Delivery',
    region: 'uganda',
    trackingUrl: '',
    color: '#f6ad55',
  },

  // ─── East Africa ────────────────────────────────────────────────
  {
    id: 'sendy',
    name: 'Sendy',
    region: 'east_africa',
    trackingUrl: 'https://app.sendyit.com/track/{trackingNumber}',
    color: '#3182ce',
  },
  {
    id: 'aramex',
    name: 'Aramex',
    region: 'east_africa',
    trackingUrl: 'https://www.aramex.com/us/en/track/shipment?q={trackingNumber}',
    logo: 'https://www.aramex.com/favicon.ico',
    color: '#e53e3e',
  },

  // ─── International ──────────────────────────────────────────────
  {
    id: 'dhl',
    name: 'DHL',
    region: 'international',
    trackingUrl: 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id={trackingNumber}',
    logo: 'https://www.dhl.com/favicon.ico',
    color: '#ffcc00',
  },
  {
    id: 'fedex',
    name: 'FedEx',
    region: 'international',
    trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}',
    logo: 'https://www.fedex.com/favicon.ico',
    color: '#4d148c',
  },
  {
    id: 'ups',
    name: 'UPS',
    region: 'international',
    trackingUrl: 'https://www.ups.com/track?tracknum={trackingNumber}',
    logo: 'https://www.ups.com/favicon.ico',
    color: '#351c15',
  },
  {
    id: 'tnt',
    name: 'TNT (FedEx)',
    region: 'international',
    trackingUrl: 'https://www.tnt.com/express/en_gc/site/tracking.html?searchType=con&cons={trackingNumber}',
    color: '#ff6600',
  },
  {
    id: 'dpd',
    name: 'DPD',
    region: 'international',
    trackingUrl: 'https://tracking.dpd.de/status/en_US/parcel/{trackingNumber}',
    color: '#dc0032',
  },
  {
    id: 'royal_mail',
    name: 'Royal Mail',
    region: 'international',
    trackingUrl: 'https://www.royalmail.com/track-your-item#/tracking-results/{trackingNumber}',
    color: '#d4351c',
  },
  {
    id: 'usps',
    name: 'USPS',
    region: 'international',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={trackingNumber}',
    color: '#333366',
  },
  {
    id: 'warehouse_pickup',
    name: 'Warehouse Pickup',
    region: 'uganda',
    trackingUrl: '',
    color: '#718096',
  },
  {
    id: 'other',
    name: 'Other',
    region: 'international',
    trackingUrl: '',
    color: '#a0aec0',
  },
];

/** Group carriers by region for select dropdowns */
export const CARRIER_GROUPS = [
  { label: '🇺🇬 Uganda', carriers: CARRIERS.filter(c => c.region === 'uganda') },
  { label: '🌍 East Africa', carriers: CARRIERS.filter(c => c.region === 'east_africa') },
  { label: '✈️ International', carriers: CARRIERS.filter(c => c.region === 'international') },
];

/** Find a carrier by ID */
export function getCarrier(id: string): Carrier | undefined {
  return CARRIERS.find(c => c.id === id);
}

/** Build a tracking URL for a given carrier + tracking number */
export function getTrackingUrl(carrierId: string, trackingNumber: string): string | null {
  const carrier = getCarrier(carrierId);
  if (!carrier || !carrier.trackingUrl) return null;
  return carrier.trackingUrl.replace('{trackingNumber}', encodeURIComponent(trackingNumber));
}

/** Get region label */
export function getRegionLabel(region: string): string {
  switch (region) {
    case 'uganda': return 'Uganda';
    case 'east_africa': return 'East Africa';
    case 'international': return 'International';
    default: return region;
  }
}
