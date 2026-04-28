import React from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, Check, ExternalLink } from 'lucide-react';
import { getCarrier, getTrackingUrl } from '../../lib/carriers';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const steps: TimelineStep[] = [
  { 
    status: 'pending', 
    label: 'Order Requested', 
    description: 'Awaiting administrative review.',
    icon: <Clock className="w-5 h-5" />
  },
  { 
    status: 'awaiting_invoice', 
    label: 'Proforma Issued', 
    description: 'Invoice uploaded. Awaiting payment.',
    icon: <Circle className="w-5 h-5" />
  },
  { 
    status: 'awaiting_payment', 
    label: 'Payment Pending', 
    description: 'Awaiting bank transfer verification.',
    icon: <Circle className="w-5 h-5" />
  },
  { 
    status: 'processing', 
    label: 'Processing', 
    description: 'Order being prepared and verified.',
    icon: <Package className="w-5 h-5" />
  },
  { 
    status: 'shipped', 
    label: 'In Transit', 
    description: 'Dispatched via Vitorra Logistics/Carrier.',
    icon: <Truck className="w-5 h-5" />
  },
  { 
    status: 'delivered', 
    label: 'Completed', 
    description: 'Delivered and finalized.',
    icon: <CheckCircle2 className="w-5 h-5" />
  }
];

interface OrderTrackingTimelineProps {
  currentStatus: string;
  history?: { status: string; date: string; note?: string }[];
  carrier?: string;
  trackingNumber?: string;
}

export default function OrderTrackingTimeline({ currentStatus, history, carrier, trackingNumber }: OrderTrackingTimelineProps) {
  const getStatusIndex = (status: string) => {
    const idx = steps.findIndex(s => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = getStatusIndex(currentStatus);

  // Resolve carrier info
  const carrierInfo = carrier ? getCarrier(carrier) : null;
  const trackUrl = carrier && trackingNumber ? getTrackingUrl(carrier, trackingNumber) : null;

  return (
    <div className="py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-vitorra-border">
          <div 
            className="absolute top-0 left-0 w-full bg-vitorra-gold transition-all duration-1000"
            style={{ height: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="space-y-10">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;
            
            // Find date for this step from history
            const historyItem = history?.find(h => h.status === step.status);

            // Show carrier info on the shipped step
            const isShippedStep = step.status === 'shipped' && (isCurrent || isCompleted);

            return (
              <div key={idx} className="relative flex items-start gap-6 group">
                <div 
                  className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${
                    isCompleted ? 'bg-vitorra-gold border-vitorra-gold text-vitorra-gold-text' :
                    isCurrent ? 'bg-vitorra-bg border-vitorra-gold text-vitorra-gold shadow-vitorra-gold/20' :
                    'bg-vitorra-bg border-vitorra-border text-vitorra-muted'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                    <h4 className={`font-heading font-bold uppercase tracking-widest text-xs ${
                      isCurrent ? 'text-vitorra-gold' : 
                      isPending ? 'text-vitorra-muted' : 
                      'text-vitorra-text'
                    }`}>
                      {step.label}
                    </h4>
                    {historyItem && (
                      <span className="text-[10px] font-bold text-vitorra-muted/60 uppercase">
                        {new Date(historyItem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isCurrent ? 'text-vitorra-text font-medium' : 'text-vitorra-muted'} max-w-sm leading-relaxed`}>
                    {isShippedStep && carrierInfo
                      ? `Shipped via ${carrierInfo.name}${trackingNumber ? ` · ${trackingNumber}` : ''}`
                      : step.description
                    }
                  </p>
                  {/* Carrier tracking link on shipped step */}
                  {isShippedStep && trackUrl && (
                    <a
                      href={trackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-vitorra-gold/10 border border-vitorra-gold/20 rounded-lg text-xs font-bold text-vitorra-gold hover:bg-vitorra-gold/20 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> Track Package
                    </a>
                  )}
                  {isCurrent && historyItem?.note && (
                    <div className="mt-3 p-3 bg-vitorra-gold/5 border border-vitorra-gold/10 rounded-xl">
                      <p className="text-[11px] italic text-vitorra-gold/80">Admin Note: {historyItem.note}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

