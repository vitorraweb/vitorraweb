"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, FileText, Download } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

type OrderDoc = { name: string; url: string; type: string; order_reference?: string; generated_at?: string };
type Literature = { name: string; url: string; type: string };
type DocsResponse = { order_documents: OrderDoc[]; product_literature: Literature[] };

export default function AccountDocuments() {
  const t = useTranslations("account");
  const [docs, setDocs] = useState<DocsResponse | null>(null);

  useEffect(() => {
    apiCustomer<{ data: DocsResponse }>("/account/documents").then((r) => setDocs(r.data)).catch(() => setDocs({ order_documents: [], product_literature: [] }));
  }, []);

  if (!docs) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  return (
    <div>
      {docs.order_documents.length > 0 && (
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3 text-ink-muted">{t("docsOrderDocuments")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docs.order_documents.map((d) => (
              <a
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-frame p-6 flex items-center gap-4 bg-paper border border-line"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-frame shrink-0 bg-paper-deep text-gold-ink">
                  <FileText className="w-6 h-6" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{d.name}</p>
                  <p className="text-xs text-ink-muted">{d.order_reference ?? d.type}</p>
                </div>
                <Download className="w-5 h-5 shrink-0 transition-transform group-hover:translate-y-0.5 text-gold-ink" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3 text-ink-muted">{t("docsProductLiterature")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.product_literature.map((d) => (
            <a
              key={d.url}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-frame p-6 flex items-center gap-4 bg-paper border border-line"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-frame shrink-0 bg-paper-deep text-gold-ink">
                <FileText className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">{d.name}</p>
                <p className="text-xs text-ink-muted">{d.type}</p>
              </div>
              <Download className="w-5 h-5 shrink-0 transition-transform group-hover:translate-y-0.5 text-gold-ink" />
            </a>
          ))}
        </div>
      </div>

      <p className="text-xs mt-5 text-ink-muted">{t("docsFoot")}</p>
    </div>
  );
}
