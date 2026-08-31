# 13 — Junior Developer Onboarding & Infrastructure Ownership

**Status:** Ready to run · **Manager:** John Oluwaseyi (IT Officer)
**Drafted:** 31 August 2026 · **Pairs with:** `12-aws-migration-plan.md`

---

## 1. The idea in one paragraph

We are moving the website onto our own AWS infrastructure. That creates real, ongoing work
— watching that the site is up, keeping it secure, and keeping the bill honest — which is
exactly what this hire says he is good at. Rather than inventing training exercises, we hand
him a genuine area of the business to own, with guardrails tight enough that he cannot
accidentally break production while he learns. Over twelve weeks he goes from read-only
observer to the person who knows first when something is wrong.

**Deliberate sequencing:** he does **not** need to be here before the migration starts. Ideal
timing is that he joins around Phase 4 (staging soak) so his first week is spent on a system
that is running but not yet carrying customers.

---

## 2. What he owns, and what he does not

| | |
|---|---|
| **Owns outright** | CloudWatch dashboards and alarms · AWS WAF rules and tuning · GuardDuty and Security Hub findings · Sentry triage · uptime checks · the monthly cost report · the incident log |
| **Contributes via pull request** | Terraform changes in `infra/` · application code · anything in `.github/workflows/` |
| **Does not touch** | Production secrets · IAM policies · DNS at GoDaddy · the Namecheap backend server · database contents |

### Production IAM role — `VitorraObserver`

```
✅  ReadOnlyAccess                      (AWS managed policy)
✅  cloudwatch:*, logs:*                 dashboards, alarms, log queries
✅  wafv2:*                              write and tune WAF rules
✅  guardduty:*, securityhub:*           manage findings
✅  ce:*, budgets:Describe*              cost visibility

❌  ecs:UpdateService, ecs:DeleteService  no changing what is running
❌  ec2:*, elasticloadbalancing:Modify*   no changing the network
❌  secretsmanager:GetSecretValue         cannot read secrets, even as admin-adjacent
❌  iam:*                                 no privilege escalation
❌  s3:DeleteObject on the Terraform state bucket
```

**Staging is different: he gets `AdministratorAccess` there.** He should be able to build
things, break things, and rebuild them without asking permission. That is where learning
happens. Production is where it is applied.

---

## 3. Before day one

| # | Task | Owner |
|---|---|---|
| 1 | Create `@vitorra.org` email account | John |
| 2 | GitHub: add to `vitorraweb/vitorraweb` with **write** access (not admin) | John |
| 3 | AWS: IAM user in the `Observers` group, **MFA mandatory before first login** | John |
| 4 | Add to Sentry (member), and to the alerts distribution list | John |
| 5 | Share the reading list below | John |
| 6 | Sign the standard confidentiality agreement — this platform holds HR files, medical notes, supplier bank details and customer data | HR / Victor |

**Reading list, in this order — expect roughly half a day:**
1. `PROGRESS.md` — what the business actually does, in plain language
2. `planning/12-aws-migration-plan.md` — the infrastructure he is inheriting
3. `planning/09-ops-runbook.md` — how the platform is operated today
4. `CLAUDE.md` §Security Hardening — what we already protect and why

---

## 4. Week by week

Every week ends with something real that exists and works. No week ends with "he read about it".

### Week 1 — Understand the business, watch a deploy

*Goal: he can explain to a non-technical person what Vitorra sells and what breaks if the site
goes down.*

- Sit with Victor (Operations) and Thurayya (Marketing) for an hour each. What does a customer
  enquiry actually turn into? Why does FET matter more than the others right now?
- Read the codebase tour, run the frontend locally, submit a test enquiry end to end.
- Log into AWS read-only. Find the running Fargate task, the ALB, the CloudFront distribution.
  Follow one HTTP request through all three by reading the logs.
- **Shadow, do not touch:** watch John run a deploy to staging start to finish.

**Deliverable:** a one-page written description of what happens between a visitor clicking
*Enquire* and the marketing team getting an email. Written for Solomon — that is, no jargon.
This tests comprehension far better than any quiz.

### Week 2 — Monitoring, on staging

*Goal: we can see the system's health on one screen.*

- Build a CloudWatch dashboard for **staging**, covering:
  - ALB — request count, 5xx rate, target response time (p50 / p95 / p99)
  - ECS — CPU and memory utilisation, running task count
  - CloudFront — requests, cache hit ratio, 4xx/5xx rate
- Create an SNS topic and subscribe the team email to it.
- Set the first alarms, with thresholds he must **justify in writing**:
  - 5xx rate above 1% over 5 minutes
  - p95 response time above 3 seconds over 10 minutes
  - Running task count below 1 for 2 minutes
  - Health check failing
- **Break staging on purpose** and confirm the alarm fires and the email arrives. An untested
  alarm is not a monitor, it is a decoration.

**Deliverable:** the staging dashboard, plus alarms proven to fire.

### Week 3 — Promote monitoring to production

*Goal: we find out about problems before a customer tells us.*

- Recreate the dashboard and alarms for production.
- Add a **CloudWatch Synthetics canary** hitting `https://www.vitorra.org/api/health` every
  5 minutes from two regions. (Or UptimeRobot's free tier — cheaper and adequate.)
- Finish wiring **Sentry** — the DSNs are already configured (`PROGRESS.md` item 15); make
  errors actually arrive, set up alert rules, and establish a triage habit.
- Write `planning/13-incident-runbook.md`: what to check, in order, when the site is down.

**Deliverable:** production monitoring live. `PROGRESS.md` items 15 and 19 closed.

### Week 4 — Security baseline

*Goal: attacks and misconfigurations are visible.*

- Enable **GuardDuty** and **Security Hub** (AWS Foundational Security Best Practices).
- Triage every finding. Most will be noise — the skill being learned is telling noise from
  signal, and writing down why each was dismissed.
- Tune the **WAF**: confirm the managed rule sets are not blocking legitimate traffic, and
  check the rate-limit rule is not throttling the Laravel revalidate webhook from Namecheap
  (gotcha #10 in the migration plan).
- Implement the `X-Origin-Verify` header check so the ALB cannot be reached around CloudFront.

**Deliverable:** a written security posture report — what is enabled, what it found, what was
dismissed and why.

### Weeks 5–6 — Cost ownership

*Goal: Solomon knows what we spend and why, without asking.*

- Set up AWS Budgets with alerts at $50 / $75 / $100.
- Enable Cost Anomaly Detection.
- Enforce the tagging policy (`Project`, `Env`, `Owner`) and verify Cost Explorer can split
  the bill by environment.
- Schedule staging to shut down outside 08:00–18:00 EAT on weekdays.

**Deliverable:** a monthly one-page cost report, in business language, that Solomon can read
in ninety seconds. This is a recurring duty, not a one-off.

### Weeks 7–8 — First infrastructure changes

*Goal: he can propose and defend a change to production infrastructure.*

- Learn Terraform against the **staging** stack: destroy it, rebuild it from code, understand
  what state is and why the lock table exists.
- First production pull request — something small and genuinely useful. Good candidates:
  a CloudWatch log retention policy (logs currently grow forever and cost money), or an ECR
  lifecycle rule.
- **The rule: he writes the plan output into the PR description and explains it.** If he
  cannot explain what `terraform plan` says it will do, it does not get merged.

**Deliverable:** one merged Terraform PR, authored and explained by him.

### Weeks 9–12 — Real responsibility

- Second on-call: alerts reach both of you; he responds first, John backs him up.
- Owns the weekly review — dashboards, Sentry, GuardDuty, cost.
- Runs a **game day**: John breaks staging without warning, he diagnoses and documents it.
- Picks up one substantial item from the `PROGRESS.md` backlog. Strong candidates that suit
  his stated strengths: **Cloudflare Turnstile anti-spam** (item 14) or **automated database
  backups** (Known issue #6).

---

## 5. The never-do list

Print this. It is short on purpose, and every line is here because breaking it causes damage
that is expensive or impossible to undo.

1. **Never rotate `APP_KEY` on the production backend.** Every encrypted file — HR documents,
   medical notes, supplier bank details, 2FA secrets — becomes permanently unreadable. There
   is no recovery.
2. **Never touch the Microsoft 365 DNS records at GoDaddy** — any `MX`, `TXT`/SPF,
   `_domainkey`/DKIM, or `autodiscover` record. Company email stops immediately.
3. **Never change the nameservers on `vitorra.org`.** Same reason.
4. **Never commit a secret**, including into a Terraform `.tfvars` file. Secrets live in AWS
   Secrets Manager.
5. **Never run `terraform apply` against production from a laptop.** Production applies go
   through a reviewed pull request.
6. **Never `docker build` a production image with staging build arguments.** `NEXT_PUBLIC_*`
   values are baked into the bundle; the mistake is invisible until customers hit the wrong API.
7. **Never disable an alarm to stop it being noisy.** Fix the cause, or change the threshold
   and write down why.

---

## 6. How we know it worked

Assessed at the end of month three, against evidence rather than impressions:

| | Expected |
|---|---|
| **Monitoring** | We learn about incidents from an alarm, not from a customer or from Solomon |
| **Security** | GuardDuty and Security Hub are clean, or every open finding has a written reason |
| **Cost** | The monthly report has landed three times without being chased |
| **Autonomy** | He has diagnosed at least one real incident with John only observing |
| **Judgement** | He has said "I don't know, let me check" at least once. Genuinely — a junior who never says it is guessing |
| **Contribution** | At least two merged pull requests he can explain line by line |

**If it is not working**, the signal is usually one of: alarms configured but never tested;
findings dismissed without reasoning; or a reluctance to ask questions. All three are
correctable if named early, which is the point of the weekly review.

---

## 7. Weekly rhythm

| When | What | Duration |
|---|---|---|
| Monday | Review the weekend's alarms, Sentry issues, GuardDuty findings | 30 min |
| Wednesday | 1:1 with John — blockers, what he is learning, what he is unsure about | 45 min |
| Friday | Update the dashboard and incident log; note anything unresolved | 30 min |
| Month end | Cost report to John, forwarded to Solomon | 1 hour |

---

## 8. Note for Solomon

Framed in business terms, for the CEO report:

> We are moving the website onto infrastructure we own and control, rather than renting it
> from a service that makes the decisions for us. It costs a little more each month — roughly
> $60 instead of $20 — and in exchange we can see exactly what we are spending, we are no
> longer exposed to another company changing its prices or its terms, and we have somewhere to
> run future systems as the business grows.
>
> The new junior developer takes over watching it. Today, if the website went down at night,
> we would find out when a customer told us. Within a month of him starting, we will get an
> automatic alert within minutes, at any hour. He also takes on keeping the site protected
> against attack and reporting monthly on what we spend.
>
> He starts with permission to watch everything and change nothing. He earns the ability to
> make changes gradually, and every change is reviewed before it goes live. Given the platform
> now holds staff records, supplier bank details and company accounts, that caution is
> deliberate.
