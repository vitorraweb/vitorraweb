"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, FileText, Download } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

type Doc = { name: string; url: string; type: string };

export default function AccountDocuments() {
  const t = useTranslations("account");
  const [list, setList] = useState<Doc[] | null>(null);

  useEffect(() => {
    apiCustomer<{ data: Doc[] }>("/account/documents").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map((d) => (
          <a
            key={d.url}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group glow-card rounded-[20px] p-6 flex items-center gap-4 hover-lift"
            style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)", border: "1px solid rgba(197,178,122,0.16)" }}
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
              <FileText className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{d.name}</p>
              <p className="text-xs" style={{ color: "#999" }}>{d.type}</p>
            </div>
            <Download className="w-5 h-5 shrink-0 transition-transform group-hover:translate-y-0.5" style={{ color: "#7A6020" }} />
          </a>
        ))}
      </div>
      <p className="text-xs mt-5" style={{ color: "#999" }}>{t("docsFoot")}</p>
    </div>
  );
}
