"use client";

import { MessageSquareText, Video } from "lucide-react";
import { openTeamsLink, teamsChatUrl } from "@/lib/teams";

/* "Chat in Teams" / "Join in Teams" buttons. Both open Teams in a new
   window (or, inside the Vitorra tab in Teams, in Teams itself). */

export function TeamsChatButton({ email, name, compact = false }: { email: string | null | undefined; name: string; compact?: boolean }) {
  if (!email) {
    return (
      <span className="c-btn opacity-50 cursor-not-allowed" title={`No Microsoft 365 email on file for ${name}. An admin can add it under Settings → Staff.`} aria-disabled="true">
        <MessageSquareText className="w-4 h-4" />{compact ? null : "Chat in Teams"}
      </span>
    );
  }
  return (
    <a
      href={teamsChatUrl(email)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void openTeamsLink(teamsChatUrl(email)); }}
      className="c-btn"
      title={`Chat with ${name} in Microsoft Teams`}
      aria-label={`Chat with ${name} in Microsoft Teams`}
    >
      <MessageSquareText className="w-4 h-4" />{compact ? null : "Chat in Teams"}
    </a>
  );
}

export function TeamsJoinButton({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); void openTeamsLink(url); }}
      className="c-btn c-btn-primary"
      aria-label={`Join ${title} in Microsoft Teams`}
    >
      <Video className="w-4 h-4" />Join in Teams
    </a>
  );
}
