# IAM — permission sets

## `VitorraObserver`

The production permission set for the junior engineer. Composition:

| Layer | What |
|---|---|
| AWS managed | `ReadOnlyAccess` |
| Inline | `vitorra-observer-inline.json` — monitoring/security **allows**, plus the **denies** that close what `ReadOnlyAccess` leaves open |

### Why the denies exist

`ReadOnlyAccess` is much broader than the name suggests. On its own it grants:

- `secretsmanager:Get*` — which **includes `GetSecretValue`**. Every database
  password, API key and webhook secret in the account, readable.
- `ssm:Get*` — SecureString parameters, decrypted.
- `s3:GetObject` on **every** bucket, including the Terraform state bucket, which
  stores secrets in plaintext.

So `ReadOnlyAccess` alone would hand a new hire every credential we have. An explicit
`Deny` always beats any `Allow`, in this policy or any other, which is what makes the
boundary hold. The `kms:Decrypt` deny is the backstop: even if a read slips through
somewhere, encrypted material stays unreadable.

### What he *can* do

Own monitoring outright (dashboards, alarms, log queries, retention, Synthetics
canaries), route alerts (SNS), and run the security tooling (WAF, GuardDuty, Security
Hub, Inspector, Access Analyzer). That is the whole job description from
`planning/12-junior-dev-onboarding.md`, and nothing in it requires reading a secret.

### Deliberate design notes

- **`iam:PassRole` is denied via `NotResource`**, not blanket-denied. Creating a
  Synthetics canary requires passing an execution role; allowing only
  `vitorra-synthetics-*` lets him build uptime checks without being able to attach a
  privileged role to anything else.
- **`cloudwatch:SetAlarmState` is allowed** on purpose. Week 2 of onboarding is
  "break staging and prove the alarm fires" — an untested alarm is a decoration.
- **`logs:DeleteLogGroup` is denied** while `logs:PutRetentionPolicy` is allowed. He
  should manage log cost by setting retention, not by destroying evidence.
- **`wafv2:*` is fully allowed**, including delete. Tuning rules is his remit, and
  everything is Terraform-managed, so a mistake is recoverable by re-applying.

### Known frictions (expected, not bugs)

- **KMS-encrypted SNS topics won't work** for alerting — `kms:GenerateDataKey` is
  denied. Use an unencrypted topic; alarm notifications carry no sensitive data.
- **Some console pages that call `ssm:GetParameters`** (e.g. EC2 AMI pickers) will
  show an error. He is not launching EC2, so this is acceptable.
- If a legitimate task is blocked, the fix is a **narrow, reviewed exception** — never
  swapping in `AdministratorAccess`.

## Staging

No custom permission set. He gets the predefined **`AdministratorAccess`** on
`vitorra-staging`, and should be able to build, break and rebuild it freely. The
account boundary is what makes that safe.

## Applying it (console)

IAM Identity Center → **Permission sets** → *Create permission set* →
**Custom permission set**:

1. **AWS managed policies** → attach `ReadOnlyAccess`
2. **Inline policy** → paste `vitorra-observer-inline.json`
3. Name `VitorraObserver`, session duration **4 hours**
4. Create, then assign to **`vitorra-prod` only** — never to staging

> This will move into Terraform in Phase 2. It is documented as console steps because
> it is needed before the infrastructure exists.
