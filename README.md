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

CloudClean scans an account by assuming a cross-account IAM role via STS — no long-lived access keys. To scan your own account: create a role that trusts CloudClean's platform role with an External ID, attach a read-only permissions policy, then connect it in the app with the role ARN and External ID. Ask in-app or see `deploy/setup.sh` for the exact policy documents used on the platform side.

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
