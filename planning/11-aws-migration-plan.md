# 11 — AWS Migration Plan (Frontend: Vercel → AWS)

**Status:** Planned, not started · **Owner:** John Oluwaseyi · **Drafted:** 31 August 2026
**Scope:** Frontend only. The Laravel backend stays on Namecheap cPanel at `api.vitorra.org` — untouched.

---

## 1. Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Hosting shape | **ECS Fargate + ALB + CloudFront** | Runs the identical `next start` we run locally. No OS to patch. Real infrastructure a junior can own. |
| Region | **eu-west-1 (Ireland)** | Cheap, full-service, ~150 ms from Kampala. CloudFront edges in Nairobi/Lagos/Johannesburg serve visitors, so origin distance barely matters. |
| DNS | **Stays at GoDaddy.** `www` CNAME → CloudFront; apex 301-forwards to `www`. | Microsoft 365 email is never in the blast radius. See §3. |
| Canonical URL | **`https://www.vitorra.org`** (changes from apex) | CloudFront has no static IP, so the bare apex cannot point at it directly. |
| Infrastructure as code | **Terraform**, in `infra/` | Reviewable in pull requests. The junior proposes changes; John merges. |
| CI/CD | **GitHub Actions + OIDC** (no stored AWS keys) | Extends the existing `.github/workflows/ci.yml`. |
| Junior's prod access | **Read + monitoring/security only** | See `12-junior-dev-onboarding.md`. |

### Why not S3 + CloudFront (the obvious cheap answer)

**It is not possible without gutting the site.** The frontend is genuinely server-rendered:

- `src/middleware.ts` runs `next-intl` locale negotiation on **every** public request (en / sw / fr).
- ISR is used throughout — `revalidate` of 600–3600s in `src/lib/api.ts`, plus `revalidate` exports in `sitemap.ts` and the shop pages.
- ~26 pages are `async` server components that fetch `api.vitorra.org` at request or build time.
- `src/app/opengraph-image.tsx` generates OG cards at runtime.
- `src/app/api/revalidate/route.ts` is a live webhook the Laravel backend calls on blog publish.

A static bucket serves none of that. We need a running Node process — hence a container.

---

## 2. What we are building

```
                     Visitor (Kampala, Lagos, London…)
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │  CloudFront  (CDN + TLS)     │  ← ACM cert, us-east-1
                   │  + AWS WAF (rate limit,      │
                   │    managed rule sets)        │
                   └──────────────┬───────────────┘
                                  │  adds secret header X-Origin-Verify
                                  ▼
                   ┌──────────────────────────────┐
                   │  Application Load Balancer   │  ← ACM cert, eu-west-1
                   │  health check: /api/health   │     403s anything without
                   └──────────────┬───────────────┘     the secret header
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │  ECS Fargate task            │
                   │  Docker: node server.js      │  ← 0.5 vCPU / 1 GB
                   │  Next.js standalone build    │
                   └──────────────┬───────────────┘
                                  │ server components fetch
                                  ▼
                        api.vitorra.org (Namecheap — unchanged)

   ECR (image registry)  ◄──  GitHub Actions  ◄──  push to master
```

---

## 3. DNS — read this twice

> ⚠ **The single hard rule: never touch the Microsoft 365 records.** Do not modify or
> delete any `MX`, `TXT` (SPF), `_domainkey` (DKIM), or `autodiscover` record on
> `vitorra.org`. Company email dies instantly if you do, and it is the kind of outage
> that is noticed by everyone before it is noticed by us.

Nameservers **stay at GoDaddy**. We change exactly two things:

| Record | Before (Vercel) | After (AWS) |
|---|---|---|
| `A` @ (apex) | `76.76.21.21` | **Deleted** — replaced by GoDaddy domain forwarding to `https://www.vitorra.org` (301, masking **off**) |
| `CNAME www` | `cname.vercel-dns.com` | `dxxxxxxxxxxxxx.cloudfront.net` |

Everything else on the zone is left alone.

**Consequence:** `www.vitorra.org` becomes the canonical URL. This is a real SEO change —
handled by the 301 plus updated canonical tags (§4, step 4). Search rankings carry over
through a 301; expect a brief wobble, not a loss.

---

## 4. Phase 1 — Make the app container-ready

*Effort: ~1 day. All of this is normal code review-able work; none of it touches AWS yet,
and none of it breaks the current Vercel deployment except step 4 (do that one at cutover).*

### Step 1 — Add standalone output and `sharp`  ✅ **done**

`frontend/next.config.ts`, inside `nextConfig`:

```ts
const nextConfig: NextConfig = {
  // Emits .next/standalone — a self-contained server with only the node_modules
  // actually reached at runtime. Turns a ~1.2 GB image into ~200 MB.
  output: "standalone",
  turbopack: { root: path.resolve(__dirname) },
  images: { /* unchanged */ },
};
```

Then pin sharp: **`npm install sharp@^0.34.5`**.

Next 16 already declares `sharp` as an *optional* dependency, so it is usually present — but
an optional dependency can be silently skipped (`npm ci --omit=optional`, a platform with no
prebuilt binary), and image optimization then degrades with no error. Declaring it directly
makes it required.

⚠ **Match Next's range exactly.** Installing plain `sharp` resolves to `0.35.x`, which does
*not* satisfy Next's `^0.34.5`, so npm keeps **two** copies — 34 MB on disk, both shipped in
the image. Pinning `^0.34.5` dedupes to one.

### Step 2 — Add a health check endpoint  ✅ **done**

New file `frontend/src/app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";

/* The ALB target group polls this to decide whether a container is alive.
   Kept deliberately dumb: it proves the Node server is up and answering, and
   nothing more. It must NEVER call the Laravel API — if it did, a backend blip
   would make the ALB conclude our healthy frontend containers were sick and
   kill them, turning a partial outage into a total one. */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
```

`src/middleware.ts` already excludes `/api`, so locale negotiation will not intercept it. Good.

### Step 3 — Add the Dockerfile  ✅ **done**

The real files are `frontend/Dockerfile` and `frontend/.dockerignore` — read those rather
than a copy here. Three things about them are non-obvious and were learned the hard way:

**Node 24, not 22.** `package-lock.json` is generated by **npm 11** (what the team runs).
npm 10 — which `node:22-alpine` ships — rejects that lockfile with a spurious
"out of sync" error and `npm ci` fails. Verified directly:

| Lockfile | Runtime | `npm ci` |
|---|---|---|
| npm 11-generated | `node:22-alpine` (npm 10.9.8) | fails |
| npm 11-generated | `node:24-alpine` (npm 11.19.0) | works |

⚠ **The CI workflow still pins Node 22.** It passes today only because it uses the more
forgiving `npm install`. Move `.github/workflows/ci.yml` to Node 24 so CI, Docker and local
development share one npm major — otherwise the lockfile churns and a developer running
`npm ci` on Node 22 hits a confusing failure.

**The Sentry token is a BuildKit secret, not an `ARG`.** An `ARG`/`ENV` is recorded in the
builder stage's layer metadata; anyone who can read the build cache can read the token.
Docker's own linter flags it (`SecretsUsedInArgOrEnv`). Build with:

```bash
docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN .
```

The build still succeeds with no token — `next.config.ts` skips the upload.

**Build inside Linux, never copy a local `.next` in.** Next's standalone tracer copies only
the *build platform's* native binaries. A macOS build traces `@img/sharp-darwin-arm64`;
that container would fail on Fargate. This is why `.dockerignore` excludes `.next`.

> **Lockfile note.** `.github/workflows/ci.yml` uses `npm install` rather than `npm ci`
> because the committed lockfile had drifted — it was missing `@swc/helpers@0.5.23`, so
> `npm ci` failed everywhere, including locally. Regenerating it with a matching npm fixed
> that for Docker, CI and macOS alike:
>
> ```bash
> docker run --rm -v "$PWD/frontend":/app -w /app node:24-alpine npm install --package-lock-only
> ```
>
> Use `node:24-alpine`, not 22 — npm 10 silently strips the `libc` fields that tell npm
> whether to install the musl or glibc build of `sharp`.

### Step 4 — Switch the canonical URL to `www` ⚠ **do this at cutover, not before**

| File | Change |
|---|---|
| `frontend/src/lib/constants.ts` | `SITE_URL = "https://www.vitorra.org"` |
| `frontend/src/app/layout.tsx` | `metadataBase: new URL("https://www.vitorra.org")` and `openGraph.url` |

`sitemap.ts` and `robots.ts` both derive from `SITE_URL`, so they follow automatically.

### Step 5 — Backend environment (one variable, three consequences)

On the Namecheap box, `backend/.env`:

```
FRONTEND_URL=https://www.vitorra.org
```

This single variable drives **three** separate things (`backend/config/services.php`):

1. **`services.frontend.revalidate_url`** — where Laravel POSTs on blog publish. Get this
   wrong and published posts silently take up to 30 minutes to appear.
2. **`services.flutterwave.frontend_url`** — the payment **return URL**. Get this wrong and
   customers pay successfully but never land back on the confirmation page.
3. **Email and invoice links** — `InvoiceMail`, `ReservationConfirmation`,
   `NewsletterController` unsubscribe links.

After changing it: `php artisan config:cache`, then verify with
`/opt/alt/php83/usr/bin/php artisan flutterwave:status`.

#### The revalidation secret — set 2026-08-31, keep the three copies in sync

`FRONTEND_REVALIDATE_SECRET` was **never set in production**. `FrontendRevalidator`
returns early when it is empty, before the try block, so nothing was ever sent and
nothing was ever logged — every blog post since the feature shipped took the full ISR
window (30 minutes) to appear. Fixed on 2026-08-31; verified end to end:

```
url: https://vitorra.org/api/revalidate
secret length: 64
status: 200
```

The same value now lives in three places and **all three must match**:

| Where | Name |
|---|---|
| Namecheap `backend/.env` | `FRONTEND_REVALIDATE_SECRET` |
| Vercel env (until cutover) | `REVALIDATE_SECRET` |
| AWS Secrets Manager `vitorra-prod/revalidate-secret` | injected as `REVALIDATE_SECRET` |

Retrieve it with:

```bash
aws secretsmanager get-secret-value --secret-id vitorra-prod/revalidate-secret \
  --query SecretString --output text --profile vitorra-prod
```

⚠ At cutover, `FRONTEND_URL` changes to `https://www.vitorra.org`, which changes the
revalidate URL with it. Re-run the check above afterwards — a 200 before and a
connection error after means that variable, not the secret.

**CORS needs no change** — `backend/config/cors.php` already allows both apex and `www`.

---

## 5. Phase 2 — Build the infrastructure (Terraform)

*Effort: ~2 days. Files are numbered so they read top-to-bottom as a story.*

```
infra/
├── README.md              ← how to run it, in plain language
├── 00-provider.tf         ← AWS provider, S3 state backend, DynamoDB lock table
├── 10-network.tf          ← VPC, 2 public subnets, security groups
├── 20-ecr.tf              ← image registry + lifecycle policy (keep last 10)
├── 30-alb.tf              ← load balancer, target group, HTTPS listener
├── 40-ecs.tf              ← cluster, task definition, service
├── 50-cloudfront.tf       ← distribution, cache behaviours, ACM cert
├── 60-waf.tf              ← web ACL, managed rules, rate limiting
├── 70-monitoring.tf       ← CloudWatch dashboard, alarms, SNS topic
├── 80-iam-github-oidc.tf  ← the role GitHub Actions assumes
├── 90-budgets.tf          ← cost alerts
└── envs/{staging,prod}.tfvars
```

### Networking — a deliberate, defensible shortcut

Fargate tasks go in **public subnets with `assign_public_ip = true`**, and their security
group allows inbound **only** from the ALB's security group.

This sounds wrong to anyone who has been taught "app servers belong in private subnets", so
here is the reasoning, because the junior will and should ask:

- A task in a *private* subnet needs a **NAT Gateway** to pull images from ECR and to reach
  `api.vitorra.org`. A NAT Gateway costs **~$32/month plus data charges** — comfortably the
  single largest line item in this whole architecture, and more than the compute it serves.
- The alternative, VPC endpoints for ECR/S3/CloudWatch/Secrets, costs roughly the same.
- A public IP is not itself an exposure. The security group is the actual boundary, and it
  permits nothing except the ALB. Nothing on the internet can open a connection to the task.

Revisit this if we ever add a database in-VPC. Until then it is the right trade.

### CloudFront cache behaviours

| Path pattern | Policy | Notes |
|---|---|---|
| `/_next/static/*` | `CachingOptimized`, TTL 1 year | Filenames are content-hashed — safe to cache forever |
| `/_next/image*` | `CachingOptimized` + forward query strings | |
| `/downloads/*`, `/team/*` | `CachingOptimized` | Static PDFs and photos |
| `*` (default) | **`CachingDisabled`** | See the warning below |

> ⚠ **The locale trap — the bug most likely to embarrass us.**
> `next-intl` decides language from the `NEXT_LOCALE` cookie and the `Accept-Language`
> header, then redirects `/` → `/sw` or `/fr`. If CloudFront caches that redirect without
> varying on those two values, **the first visitor's language is served to every subsequent
> visitor.** A Swahili speaker arrives first and the whole world gets a Swahili homepage.
>
> Start with `CachingDisabled` on HTML. It is correct, and ISR already caches on the origin
> so pages are still fast. Only later, and only deliberately, add a custom cache policy whose
> key includes the `NEXT_LOCALE` cookie and the `Accept-Language` header.
>
> **This is measured, not theoretical.** Against the built container, the same URL `/`
> returns three different responses:
>
> | Request to `/` | Response |
> |---|---|
> | `Accept-Language: en` | `200` — English, served inline |
> | `Accept-Language: sw` | `307` → `/sw` |
> | `Cookie: NEXT_LOCALE=sw` | `307` → `/sw` |

**Origin request policy: `AllViewer`** (not `AllViewerExceptHostHeader`). Next.js builds
redirect URLs from the incoming `Host`; if CloudFront rewrites `Host` to the ALB's DNS name,
middleware redirects will send visitors to an `elb.amazonaws.com` address.

### Stop people bypassing CloudFront

The ALB has a public DNS name. Without protection, anyone who finds it can skip CloudFront
and therefore skip the WAF entirely.

Fix: CloudFront adds a custom origin header `X-Origin-Verify: <random secret>`. An ALB
listener rule returns a fixed `403` to any request lacking it. Store the secret in Secrets
Manager and rotate it occasionally. *(Good first security task for the junior.)*

### Secrets

`REVALIDATE_SECRET` goes in **AWS Secrets Manager**, referenced from the ECS task definition
via the `secrets` block — **not** `environment`. Values in `environment` are visible to
anyone who can call `ecs:DescribeTaskDefinition`, which includes read-only users.

---

## 6. Phase 3 — Deployment pipeline

*Effort: ~1 day.* Add a `deploy` job to the existing `.github/workflows/ci.yml`.

**Use GitHub OIDC — never store an AWS access key in GitHub secrets.** GitHub presents a
short-lived signed token; AWS trusts it for one specific repository and branch, and issues
credentials that expire in an hour. Nothing long-lived exists to leak.

```yaml
  deploy:
    name: Deploy frontend to AWS
    needs: [frontend, backend]
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # required for OIDC
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/vitorra-github-deploy
          aws-region: eu-west-1

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and push image
        working-directory: frontend
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
        run: |
          IMAGE="$REGISTRY/vitorra-frontend:${{ github.sha }}"
          docker build \
            --platform linux/amd64 --provenance=false --sbom=false \
            --build-arg NEXT_PUBLIC_API_URL=https://api.vitorra.org/api \
            --build-arg NEXT_PUBLIC_SENTRY_DSN=${{ secrets.SENTRY_DSN }} \
            --build-arg NEXT_PUBLIC_SENTRY_ENVIRONMENT=production \
            --build-arg NEXT_PUBLIC_ONLINE_PAYMENTS=${{ vars.ONLINE_PAYMENTS }} \
            --build-arg SENTRY_ORG=${{ secrets.SENTRY_ORG }} \
            --build-arg SENTRY_PROJECT=${{ secrets.SENTRY_PROJECT }} \
            --build-arg SENTRY_AUTH_TOKEN=${{ secrets.SENTRY_AUTH_TOKEN }} \
            -t "$IMAGE" .
          docker push "$IMAGE"
          echo "IMAGE=$IMAGE" >> "$GITHUB_ENV"

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster vitorra-prod \
            --service vitorra-frontend \
            --force-new-deployment
          aws ecs wait services-stable \
            --cluster vitorra-prod --services vitorra-frontend
```

ECS performs a **rolling deployment**: it starts the new container, waits for the ALB health
check to pass, shifts traffic, then stops the old one. Zero downtime, and an automatic stop
if the new container never becomes healthy.

---

## 7. The ISR caching constraint — know this before scaling up

Next.js keeps its ISR cache **on each container's own filesystem**. `revalidatePath()` in
`/api/revalidate` therefore only clears the cache of *the one container that received the
webhook*.

**Run exactly one Fargate task** and this is a non-issue — it behaves identically to today.

The moment we run **two or more**, publishing a blog post updates one container while the
other keeps serving the old version for up to 30 minutes, seemingly at random. CloudFront
invalidation does **not** fix this: the next request lands on a stale container and re-caches
the stale page.

If and when traffic justifies a second task, the fix is a **shared cache handler** — a
`cacheHandler` entry in `next.config.ts` backed by Redis or S3, so all containers read and
write one cache. Budget roughly half a day plus ~$10/month.

Until then: **`desired_count = 1`**, with autoscaling deliberately left off. During a rolling
deploy two tasks briefly coexist; a blog post published in that ~60-second window could be
stale on one of them. That is an acceptable risk for a site that publishes a few posts a month.

---

## 8. Phase 4 — Staging soak

*Effort: 3 days of elapsed time, minimal hands-on.*

Deploy the identical stack as `staging`, sharing the production ALB via a host-based listener
rule (saves a second $17/month load balancer).

Reach it at `staging.vitorra.org` — a **new** CNAME at GoDaddy. Adding a subdomain is safe;
it touches nothing Microsoft 365 uses.

Walk the whole site before touching production DNS:

- [ ] Homepage, all four product pages, About, Contact, Blog list + a post
- [ ] Language switching: `/` → `/sw` → `/fr` (careers). Confirm **two different browsers get
      their own language** — this is the CloudFront locale trap from §5
- [ ] `/enquire` submits and the team receives the email
- [ ] `/admin` login, including 2FA
- [ ] `/staff` login and `/account` customer login
- [ ] `/careers` job board + CV upload
- [ ] `/display` reception kiosk renders and self-refreshes
- [ ] Blog publish from `/admin/blog` appears live within seconds (proves `/api/revalidate`)
- [ ] `next/image` returns optimized images, not 500s (proves `sharp`)
- [ ] Sentry receives a deliberately thrown test error
- [ ] Lighthouse score is within a few points of the current Vercel site

---

## 9. Phase 5 — Cutover

**Pick a low-traffic window: Sunday morning, Kampala time.**

**T-48 hours**
1. Lower the TTL on the GoDaddy `A @` and `CNAME www` records to **600 seconds**. Wait a full
   day so the old TTL expires from resolvers worldwide.

**T-1 hour**
2. Confirm staging is green on every item in §8.
3. Verify the ACM certificate covering `www.vitorra.org` is **Issued** in **us-east-1**
   (CloudFront will not accept a certificate from any other region — this catches people out).

**T-0**
4. Merge the `www` canonical change (Phase 1, step 4) and let it deploy.
5. On the backend: set `FRONTEND_URL=https://www.vitorra.org`, then `php artisan config:cache`.
6. At GoDaddy: point `CNAME www` at the CloudFront domain.
7. At GoDaddy: delete the apex `A` record and enable domain forwarding
   `vitorra.org` → `https://www.vitorra.org`, **301 permanent, masking off**.
8. **Do not touch anything else in the zone.**

**T+15 minutes — verify**
```bash
dig +short www.vitorra.org                       # → *.cloudfront.net
curl -sI https://vitorra.org | head -5           # → 301 to https://www.vitorra.org
curl -sI https://www.vitorra.org | head -5       # → 200
curl -s  https://www.vitorra.org/api/health      # → {"status":"ok"}
curl -sI https://www.vitorra.org/sitemap.xml     # → 200, www URLs inside
```
Then, by hand: submit a test enquiry, log into `/admin`, publish and delete a draft blog post,
and run `php artisan flutterwave:status` on the backend.

**T+1 day**
9. Add `https://www.vitorra.org` as a property in Google Search Console and submit the sitemap.
10. Watch CloudWatch and Sentry for 5xx spikes.

**T+14 days**
11. Only now, delete the Vercel project. Keep it until then — it is the rollback.

### Rollback

At any point, revert `CNAME www` at GoDaddy to `cname.vercel-dns.com` and restore the apex
`A` record to `76.76.21.21`. With a 600-second TTL, recovery takes about ten minutes. The
Vercel deployment stays live and warm throughout, so there is nothing to rebuild.

---

## 10. What this costs

Estimates for eu-west-1 at current low traffic. Actual figures will land within ~20%.

| Item | Monthly |
|---|---|
| Fargate — 0.5 vCPU / 1 GB, 1 task, always on | $20 |
| Application Load Balancer | $18 |
| CloudFront | $0 — 1 TB/month free tier, indefinitely |
| ECR storage (10 images) | $0.20 |
| Secrets Manager (2 secrets) | $0.80 |
| CloudWatch logs, dashboard, alarms | $1 |
| AWS WAF (web ACL + 4 managed rule groups) | $10 |
| GuardDuty | $5 |
| **Production total** | **~$55** |
| Staging — Fargate Spot, shared ALB, off nights/weekends | ~$5 |
| **Grand total** | **~$60/month** |

> **Be clear-eyed about this: it is more expensive than Vercel Pro at $20/month.** We are not
> buying a lower bill. We are buying control of our own infrastructure, a platform our junior
> engineer can actually operate, and the freedom to run other workloads on it later. If pure
> cost were the goal, staying on Vercel would win. That is a legitimate business trade — it
> just should be made with open eyes rather than discovered on the first invoice.

**Cost controls, configured on day one:**
- AWS Budget alerting by email at **$50 / $75 / $100**
- Cost Anomaly Detection on the whole account
- Mandatory tags — `Project=vitorra`, `Env=prod|staging`, `Owner` — so Cost Explorer can
  break the bill down by environment
- Staging on Fargate Spot, scheduled off outside 08:00–18:00 EAT on weekdays

---

## 11. The gotchas, collected

Ranked by how likely they are to actually bite.

1. **CloudFront serving one visitor's language to everyone.** Start with `CachingDisabled` on
   HTML. §5.
2. **ACM certificate in the wrong region.** CloudFront requires **us-east-1**, regardless of
   where everything else lives. The ALB needs a *separate* certificate in eu-west-1.
3. **`NEXT_PUBLIC_*` baked in at build time.** Staging and production are different images.
   Changing an ECS environment variable will not change them.
4. **`FRONTEND_URL` on the backend.** One variable, three failure modes — revalidation,
   Flutterwave return URL, email links. §4 step 5.
5. **ISR cache is per-container.** Stay at one task until a shared cache handler exists. §7.
6. **Health check hitting the API.** Keep `/api/health` dumb, or a backend blip takes down the
   frontend too.
7. **The ALB is publicly reachable.** Enforce the `X-Origin-Verify` header or the WAF is
   decorative.
8. **Duplicate `sharp`.** Next 16 already ships it as an optional dependency at `^0.34.5`.
   Installing an unpinned `sharp` resolves to `0.35.x`, satisfies neither, and ships two
   copies of a 16 MB native library. Pin `^0.34.5`.
9. **npm major mismatch.** The lockfile is npm 11; npm 10 rejects it outright. Keep Docker,
   CI and laptops on the same npm major.
10. **WAF blocking the revalidate webhook.** Laravel POSTs to `/api/revalidate` from a single
    Namecheap IP. Confirm the rate-limit rule does not throttle it; allow-list that IP if needed.

---

## 11b. Image size — measured

The built image is **~470 MB**, not the ~200 MB first estimated:

| Layer | Size |
|---|---|
| `public/` — product photography (49 MB), video (12 MB), hero art (11 MB) | 76 MB |
| `node_modules` traced into standalone (sharp/libvips dominates) | 55 MB |
| `.next` build output | 19 MB |
| `node:24-alpine` base + apk packages | ~320 MB |

Acceptable at one task and infrequent deploys — CloudFront caches the static assets, so the
origin serves them only on a cache miss. If deploys start feeling slow, the first win is
moving `public/` to S3 and adding a CloudFront behaviour for it, which would cut the image
by roughly a sixth.

---

## 12. Timeline

| Phase | Work | Elapsed |
|---|---|---|
| 1 — Container-ready | Dockerfile, health route, standalone, sharp | 1 day |
| 2 — Terraform | Network, ECR, ALB, ECS, CloudFront, WAF | 2 days |
| 3 — Pipeline | GitHub OIDC + deploy job | 1 day |
| 4 — Staging soak | Deploy + walk the checklist | 3 days |
| 5 — Cutover | DNS + verification | 1 day |
| 6 — Watch | Monitor, then delete Vercel | 14 days |
| | **Hands-on** | **~7 days** |
| | **Calendar, including soak** | **~3 weeks** |

---

## 13. What this also completes

This migration closes several long-standing items from `PROGRESS.md`:

- **#15 — Wire up Sentry.** DSNs are configured; this deployment makes them live.
- **#19 — Uptime alerts, CI/CD.** CloudWatch alarms and the GitHub Actions deploy job.
- **Known issue #5 — no error or uptime monitoring.** Resolved.
- **Known issue #7 — no CI/CD pipeline.** Resolved for the frontend.

Still outstanding after this, and explicitly **not** in scope: automated database backups
(Known issue #6) — the database lives on Namecheap with the backend and needs its own plan.
