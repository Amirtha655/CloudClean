# CloudClean

An AWS resource lifecycle & cost tool — scans a real AWS account, maps dependencies between resources, and recommends safe cleanups with confidence scores instead of just deleting things blindly.

**Live demo:** http://13.233.99.134 — sign up with a real email, verify, log in, connect an AWS account, scan it.

<!-- Drop a screenshot or GIF of the landing page / dashboard / cleanup planner flow here -->

## What it does

- **Multi-region scanner** — real boto3 calls across EC2, EBS, Elastic IPs, Security Groups, S3, Lambda, and RDS. Any AWS account can be scanned by setting up a cross-account IAM role (see below).
- **Dependency graph** — before you delete an EC2 instance, see exactly what else depends on it (EBS volumes, security groups, Elastic IPs) and a computed risk score.
- **Smart recommendations** — rule-based over real signals (stopped state, empty buckets, zero CloudWatch invocations, unattached volumes), not ML. Each gets a confidence score and an action: Terminate / Delete / Release.
- **Cleanup planner with dry run** — build a plan, see dependency warnings and estimated savings, preview with zero side effects, then execute for real.
- **Cleanup history + PDF reports** — every run you actually execute is logged and downloadable as a PDF.
- **Real Cognito auth** — real signup/verify/login, with per-user data isolation.
- **Async scanning** — a scan runs in the background so the UI never blocks.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · TanStack Query · Recharts
FastAPI · SQLAlchemy · Boto3 · SQLite
AWS: Cognito, STS, EC2, S3, Lambda, RDS, CloudWatch, Systems Manager (deployment)

## Connecting a real AWS account

CloudClean scans an account by assuming a cross-account IAM role via STS — no long-lived access keys ever touch the app. Any AWS account can be connected once its owner sets up the trust role below.

### 1. Pick an External ID

Any random string you'll remember, e.g. `cloudclean-ext-8841`. This is a shared secret that stops someone else from guessing your role ARN and assuming it themselves.

### 2. Create the role

**CLI:**
```bash
# trust-policy.json
cat > trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::647106553742:role/CloudCleanEC2Role" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "sts:ExternalId": "cloudclean-ext-8841" } }
  }]
}
EOF

aws sts get-caller-identity   # confirm you're authenticated as the account you want scanned
aws iam create-role \
  --role-name CloudCleanReadOnly \
  --assume-role-policy-document file://trust-policy.json
```
Copy the `Arn` from the output — you'll need it in step 4.

**Console:** IAM → Roles → Create role → **Custom trust policy** → paste the same JSON (with your own External ID) → Next → skip permissions for now → name it `CloudCleanReadOnly` → Create role. Copy the **ARN** shown at the top of the role's page.

### 3. Attach read-only permissions

```bash
cat > scan-permissions.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ec2:DescribeInstances", "ec2:DescribeVolumes",
      "ec2:DescribeAddresses", "ec2:DescribeSecurityGroups",
      "s3:ListAllMyBuckets", "s3:GetBucketLocation",
      "s3:ListBucket", "s3:GetBucketTagging",
      "lambda:ListFunctions", "lambda:ListTags",
      "cloudwatch:GetMetricStatistics", "rds:DescribeDBInstances"
    ],
    "Resource": "*"
  }]
}
EOF

aws iam put-role-policy \
  --role-name CloudCleanReadOnly \
  --policy-name scan-readonly \
  --policy-document file://scan-permissions.json
```
No `Delete*`/`Terminate*`/`Modify*` actions anywhere — CloudClean's "cleanup" only ever marks rows in its own database, it never calls a destructive AWS API.

**Console:** on the role's page → **Add permissions** → **Create inline policy** → JSON tab → paste the policy above → name it `scan-readonly` → Create policy.

### 4. Connect it in CloudClean

Log in → **AWS Accounts** → Connect New Account:

| Field | Value |
|---|---|
| Account name | anything |
| AWS Account ID | your 12-digit account ID (`aws sts get-caller-identity`) |
| Role ARN | from step 2 |
| External ID | from step 1 |

Click **Connect account**, optionally **Validate**, then **Scan now**. Status goes `pending` → `scanning` → `connected`, and real resources appear in Dashboard/Resource Explorer once it's done (~30-90s depending on how much Lambda you have).

**Troubleshooting:** status flips to `error` on Validate/Scan → almost always a mismatched Role ARN or External ID (both are case-sensitive, check them character-for-character). `AccessDenied` on a specific call → add the missing action to `scan-permissions.json` and re-run step 3.

## Running locally

```bash
# Backend
cd backend
python -m venv .venv && .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt
# create .env with COGNITO_USER_POOL_ID / COGNITO_APP_CLIENT_ID / COGNITO_APP_CLIENT_SECRET / AWS_REGION / PLATFORM_AWS_ACCOUNT_ID
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

Runs on a single free-tier EC2 instance (Amazon Linux 2023) behind Nginx, deployed via AWS Systems Manager — no SSH. Secrets come from SSM Parameter Store, fetched by the instance's own IAM role; nothing sensitive is baked into the deploy package. See `deploy/setup.sh`.

## Known limitations

- Scanner covers EC2/EBS/EIP/SecurityGroup, S3, Lambda, RDS — not the full ~30-service AWS surface.
- Cost figures are estimates, not real AWS Cost Explorer data.
- Cleanup history and templates are shared, not yet per-user (accounts and resources are).
- No HTTPS/custom domain yet.
- No automated test suite yet.
