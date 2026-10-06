"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Inbox, Send, Paperclip, X } from "lucide-react";
import { apiCustomer, uploadCustomer, downloadCustomerFile } from "@/lib/customer-auth";

type Attachment = { index: number; name: string; size: number };
type Communication = {
  id: number;
  direction: "inbound" | "outbound";
  channel: "email" | "portal";
  subject: string | null;
  body: string;
  attachments: Attachment[];
  created_at: string;
};

const date = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AccountMessages() {
  const t = useTranslations("account");
  const [list, setList] = useState<Communication[] | null>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => apiCustomer<{ data: Communication[] }>("/account/communications").then((r) => setList(r.data)).catch(() => setList([]));

  useEffect(() => {
    load();
    apiCustomer("/account/communications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("body", body.trim());
      files.forEach((f) => form.append("attachments[]", f));
      const res = await uploadCustomer<{ data: Communication }>("/account/communications", form);
      setList((l) => (l ? [...l, res.data] : [res.data]));
      setBody("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (!list) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  return (
    <div className="space-y-6">
      {list.length === 0 ? (
        <div className="bg-paper rounded-frame border border-line p-14 text-center">
          <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-paper-deep text-gold-ink"><Inbox className="w-6 h-6" /></span>
          <p className="text-base font-semibold mb-1 text-ink">{t("noMessages")}</p>
          <p className="text-sm text-ink-muted">{t("noMessagesSub")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => {
            const mine = c.direction === "inbound";
            return (
              <div key={c.id} className={`rounded-frame p-5 max-w-[85%] ${mine ? "ml-auto bg-paper-deep border-l-2 border-gold" : "bg-paper border border-line"}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-ink">{mine ? t("messagesFromYou") : t("messagesFromVitorra")}</span>
                  {mine && c.channel === "email" && <span className="t-label text-[0.625rem] text-ink-muted">{t("viaEmail")}</span>}
                  {mine && c.channel === "portal" && <span className="t-label text-[0.625rem] text-ink-muted">{t("viaPortal")}</span>}
                  <span className="text-xs ml-auto text-ink-muted">{date(c.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">{c.body}</p>
                {c.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.attachments.map((a) => (
                      <button key={a.index}
                        onClick={() => downloadCustomerFile(`/account/communications/${c.id}/attachments/${a.index}`, a.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-paper-deep text-ink-soft">
                        <Paperclip className="w-3 h-3" />{a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-paper rounded-frame border border-line p-5">
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder={t("replyPlaceholder")}
          className="w-full text-sm rounded-edge px-3 py-2.5 border min-h-24 outline-none border-line-strong bg-paper-deep" />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-paper-deep text-gold-ink">
                <Paperclip className="w-3 h-3" />{f.name}
                <button onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => setFiles((fs) => [...fs, ...Array.from(e.target.files ?? [])])} />
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-paper-deep text-ink-soft">
            <Paperclip className="w-3.5 h-3.5" />{t("attachFile")}
          </button>
          <button onClick={send} disabled={sending || !body.trim()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50 bg-ink text-paper">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? t("sending") : t("sendReply")}
          </button>
        </div>
      </div>
    </div>
  );
}
