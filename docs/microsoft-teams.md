# Microsoft Teams integration

Four pieces, each switched on independently. Nothing here creates meetings,
reads calendars, or asks for Microsoft Graph permissions.

| Piece | Needs Microsoft setup? | Switched on by |
|---|---|---|
| **Chat in Teams** buttons | No | Works as soon as deployed |
| **Join in Teams** meeting links | No | Works as soon as deployed |
| **Channel alerts** | A Workflows flow in the target channel | `TEAMS_WORKFLOW_WEBHOOK_URL` |
| **Dashboard tab** in Teams | Entra app registration + app upload | `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` + the app package |

---

## 1. Chat in Teams

A "Chat in Teams" button sits next to each person in **Console → Staff**,
**Staff portal → My team**, **My supervisor** and **Colleagues**. It opens
Microsoft's documented chat deep link in a new tab, or in Teams itself when
used from the Teams tab:

```
https://teams.microsoft.com/l/chat/0/0?users=<email>&topicName=<optional>&message=<optional>
```

The address used for each person:

1. their **Microsoft 365 / Teams email** (set by an admin in Console → Staff), otherwise
2. their login email, **if** its domain is in `MICROSOFT_365_DOMAINS` (default `vitorra.org`).

Anyone without either gets a greyed-out button with a tooltip explaining why.

## 2. Meetings

**Console → Operations → Meetings**. Create the meeting in Teams or Outlook as
usual, copy its join link, and add it here with a time and audience (everyone,
or one department). Staff see upcoming meetings on their portal home page with
a **Join in Teams** button.

- Only real Teams meeting links are accepted: `https://` on `teams.microsoft.com`,
  `teams.cloud.microsoft`, `teams.live.com`, `gov.teams.microsoft.us` or
  `dod.teams.microsoft.us`, with a `/l/meetup-join/…` or `/meet/…` path. The host
  is matched exactly, so a look-alike such as `teams.microsoft.com.evil.example`
  is refused.
- Admins and Operations can add meetings. A meeting can be changed or removed
  by an admin, or by the person who added it.
- Staff only see meetings for everyone or for their own department.

## 3. Channel alerts (Workflows webhook)

Microsoft retired Office 365 connectors; the replacement is a **Workflows**
flow that receives a webhook.

**Setup (done by a Teams user in the target channel):**

1. In Teams, open the channel (e.g. *Vitorra alerts*) → **⋯** → **Workflows**.
2. Pick the template **"Send webhook alerts to a channel"**, name it *Vitorra*, and confirm the team and channel.
3. Copy the **HTTP POST URL** it shows at the end.
4. On the API server, add it to `backend/.env` as `TEAMS_WORKFLOW_WEBHOOK_URL=…`, then run `config:cache`.
5. Console → Settings → Microsoft Teams → choose the events → **Send test message**.

**What gets posted.** One short Adaptive Card per event, with a button that
opens the matching console page. The person opening it still has to sign in;
the card carries no customer email address or phone number.

| Event | When |
|---|---|
| New enquiry | Someone submits the website enquiry form |
| New contact message | Someone submits the contact form |
| New order / FET reservation | A shop order or FET reservation is placed |
| Executive report | The weekly/monthly executive report is emailed. Google Ads spend and leads are included only when synced Ads data exists for that period. |

**Payload** (what the template expects, documented by Microsoft):

```json
{
  "type": "message",
  "attachments": [{
    "contentType": "application/vnd.microsoft.card.adaptive",
    "contentUrl": null,
    "content": {
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
      "type": "AdaptiveCard", "version": "1.4",
      "body": [ { "type": "TextBlock", "text": "New enquiry — FET", "weight": "Bolder" }, { "type": "FactSet", "facts": [] } ],
      "actions": [ { "type": "Action.OpenUrl", "title": "Open in Vitorra", "url": "https://vitorra.org/admin/enquiries" } ]
    }
  }]
}
```

**Reliability.**

- Every alert is first written to the `teams_notifications` outbox, keyed so the same event is never posted twice.
- Delivery is attempted straight after the web request finishes. `teams:deliver` (every minute, on the existing `schedule:run` cron) retries failures after 1, 5 and 15 minutes, up to `TEAMS_WEBHOOK_MAX_ATTEMPTS` (default 3). Each attempt is bounded by `TEAMS_WEBHOOK_TIMEOUT` seconds.
- Errors are stored and logged with URLs and signatures stripped, so the webhook secret never lands in a log.
- If the URL is missing or Teams is down, forms, orders and reports carry on normally.

The webhook URL is never sent to the browser. The settings screen only shows whether it is configured.

## 4. Dashboard tab inside Teams

A personal tab named **Dashboard** opens `https://vitorra.org/teams/dashboard`,
which is the console Overview. It has an **Open in browser** button, and links
inside it open in the browser.

**How sign-in works**

1. Teams gives the page a Microsoft Entra token for the signed-in person (`authentication.getAuthToken()`; no pop-up, no third-party cookie).
2. The page sends it to `POST https://vitorra.org/api/auth/teams`. The server checks it and does not trust the Teams client:
   - the signature, against Microsoft's published keys for **our tenant only**;
   - the issuer `https://login.microsoftonline.com/<tenant>/v2.0`, the tenant `tid`, the audience (our client ID or Application ID URI), a v2.0 token, the `access_as_user` scope, and the expiry.
3. The person must already exist as active staff. The match is made on their Microsoft 365 email, and their Microsoft account id is pinned on first use, so a different Microsoft account can never take over that staff record.
4. The usual console rules still apply: only Admin/Operations roles open the dashboard, and **two-step verification is still asked for** if the person has it on. Sign-ins are rate-limited like the normal login and recorded in the audit log (`auth.teams_sso`).

**Framing.**
- Only `/teams/*` may be shown inside Microsoft 365 hosts (Teams, Outlook, microsoft365.com, `*.cloud.microsoft`).
- Every other page sends `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`, so it cannot be framed by anyone else.
- These headers are set in `frontend/next.config.ts`.

### 4a. Register the Entra app (Entra admin center, one time)

1. **entra.microsoft.com** → Identity → Applications → **App registrations** → **New registration**.
   - Name: *Vitorra Teams tab*
   - Supported account types: **Accounts in this organizational directory only (single tenant)**
   - Redirect URI: none
2. On **Overview**, copy the **Application (client) ID** (it becomes `ENTRA_CLIENT_ID`) and the **Directory (tenant) ID** (it becomes `ENTRA_TENANT_ID`).
3. **Expose an API**:
   - Application ID URI → **Add** → set it to `api://vitorra.org/<client id>`.
   - **Add a scope**:
     - Scope name `access_as_user`
     - Who can consent: *Admins and users*
     - Admin consent display name: *Use Vitorra as you*
     - State: Enabled
   - **Add a client application** for each ID below, ticking the `access_as_user` scope:

     | Client | ID |
     |---|---|
     | Teams desktop & mobile | `1fec8e78-bce4-4aaf-ab1b-5451cc387264` |
     | Teams web | `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` |
     | Microsoft 365 web | `4765445b-32c6-49b0-83e6-1d93765276ca` |
     | Microsoft 365 desktop | `0ec893e0-5785-4de6-99da-4ed124e5296c` |
     | Microsoft 365 mobile / Outlook desktop | `d3590ed6-52b3-4102-aeff-aad2292ab01c` |
     | Outlook web | `bc59ab01-8403-45c6-8796-ac3ef710b3e3` |
     | Outlook mobile | `27922004-5251-4030-b22d-91ecd9a37ea4` |

4. **Manifest** (the app registration's own manifest editor): set `"requestedAccessTokenVersion": 2` (shown as `accessTokenAcceptedVersion` in the older view). Save.
5. **API permissions**: leave the default *Microsoft Graph → User.Read (delegated)*, and click **Grant admin consent** so staff are not prompted.

No client secret is needed. The server only verifies tokens; it never calls Microsoft on a user's behalf.

### 4b. Configure the API server

In `backend/.env` on the server:

```
ENTRA_TENANT_ID=<Directory (tenant) ID from step 2>
ENTRA_CLIENT_ID=<Application (client) ID from step 2>
# ENTRA_APP_ID_URI only if you used something other than api://vitorra.org/<client id>
```

Then run `$PHP artisan config:cache`. Settings → Microsoft Teams should now show **Teams tab sign-in: Configured**.

For each person who will use the tab, check that their Microsoft 365 address is correct in Console → Staff. A vitorra.org login is used automatically.

### 4c. Build and upload the app package

```
scripts/.venv/bin/python scripts/build_teams_app.py --client-id <ENTRA_CLIENT_ID> --version 1.0.0
```

This writes `teams-app/dist/vitorra-teams.zip`, containing `manifest.json` (schema v1.19, validated), `color.png` (192×192) and `outline.png` (32×32). The app id is fixed in `teams-app/app-id.txt`, so a re-upload updates the same app. Bump `--version` each time.

Upload it in **Teams admin center** (admin.teams.microsoft.com):
1. Teams apps → **Manage apps** → **Upload new app**.
2. Choose the zip, then make sure the app is **Allowed**.
3. To pin it for everyone: **Setup policies** → *Global* → **Pinned apps** → add *Vitorra*.

Or, for a quick trial by one person with custom-app upload enabled: Teams → Apps → **Manage your apps** → **Upload an app** → *Upload a custom app*.

---

## Environment variables (all server-side, `backend/.env`)

| Variable | Where the value comes from | Default |
|---|---|---|
| `TEAMS_WORKFLOW_WEBHOOK_URL` | The HTTP POST URL shown when the Workflows template is created (§3) | empty = alerts off |
| `TEAMS_WEBHOOK_TIMEOUT` | Seconds per delivery attempt | 10 |
| `TEAMS_WEBHOOK_MAX_ATTEMPTS` | Attempts before an alert is marked failed | 3 |
| `MICROSOFT_365_DOMAINS` | Comma list of login domains that are M365 accounts | `vitorra.org` |
| `ENTRA_TENANT_ID` | Entra → app registration → Overview → Directory (tenant) ID | empty = tab sign-in off |
| `ENTRA_CLIENT_ID` | Entra → app registration → Overview → Application (client) ID | empty = tab sign-in off |
| `ENTRA_APP_ID_URI` | Only if the Application ID URI differs from `api://vitorra.org/<client id>` | derived |
| `ENTRA_SSO_SCOPE` | The exposed scope name | `access_as_user` |

There is no new frontend (Vercel) variable.

## Routes

| Route | Who |
|---|---|
| `https://vitorra.org/teams/dashboard?inTeams=1` | Teams tab content URL |
| `POST /api/auth/teams` | Tab sign-in (rate-limited 8/min) |
| `GET/POST /api/admin/meetings`, `PATCH/DELETE /api/admin/meetings/{id}` | Admin + Operations |
| `GET /api/staff/meetings`, `GET /api/staff/directory` | All staff |
| `GET /api/admin/teams`, `PUT /api/admin/teams/events`, `POST /api/admin/teams/test` | Admin only |

There are no redirect or callback URLs: Teams tab SSO does not use one.
