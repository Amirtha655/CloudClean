# CloudClean

An intelligent AWS Resource Lifecycle & Cost Management Platform — scans a real AWS account, maps dependencies between resources, and recommends safe cleanups with confidence scores instead of just deleting things blindly.

**Live demo:** http://13.233.99.134

> Sign up with a real email (Cognito sends an actual verification code), verify, log in, then connect an AWS account and scan it. Note: only the platform's own demo AWS account (`647106553742`) will actually scan — see [Known limitations](#known-limitations) for why.

<!-- Drop a screenshot or GIF of the landing page / dashboard / cleanup planner flow here, e.g.: docs/screenshot-dashboard.png -->

## What it does

- **Multi-region scanner** — real boto3 calls (not mocked) across EC2, EBS, Elastic IPs, Security Groups, S3, Lambda, and RDS
- **Dependency graph engine** — before you delete an EC2 instance, see exactly what else depends on it (attached EBS volumes, security groups, Elastic IPs) and a computed risk score
- **Smart recommendation engine** (rule-based over real signals, not ML) — stopped EC2 instances, empty S3 buckets, idle Lambda functions (via real 30-day CloudWatch invocation data), and unattached EBS/EIPs each get a confidence-scored action (Terminate / Delete / Release)
- **Cleanup planner with dry run** — build a plan, see dependency warnings and estimated savings/duration, preview with zero side effects, then execute for real
- **Cleanup history + PDF reports** — every run logged with who/when/what/savings, downloadable as a PDF via ReportLab
- **Real Cognito auth** — signup/verify/login against an actual Cognito User Pool, with per-user data isolation (each user only ever sees their own connected accounts and scan results)
- **Async scanning** — a full multi-region scan takes ~30-60s; it runs as a background task so the UI never blocks

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router, Recharts
**Backend:** FastAPI, SQLAlchemy, Pydantic, Boto3
**AWS:** Cognito, STS, EC2, S3, Lambda, RDS, CloudWatch, Systems Manager (deployment)
**Database:** SQLite for local dev, same models portable to Postgres/RDS

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React SPA │ ───► │  FastAPI backend │ ───► │  Real AWS APIs  │
│ (TanStack Q)│ /api │  (SQLAlchemy)    │ boto3│ EC2/S3/Lambda/  │
└─────────────┘      └──────────────────┘      │ RDS/CloudWatch  │
                              │                 └─────────────────┘
                              ▼
                      ┌──────────────┐         ┌─────────────────┐
                      │   SQLite     │         │  Cognito        │
                      │ (per-user    │         │  User Pool      │
                      │  accounts/   │◄────────┤  (real auth)    │
                      │  resources)  │         └─────────────────┘
                      └──────────────┘
```

In production, Nginx serves the built frontend and reverse-proxies `/api/*` to Uvicorn on the same instance — same-origin, no CORS needed.

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

The frontend dev server proxies `/api` to `localhost:8000`. AWS scanning uses your local AWS CLI credentials (falls back from STS role assumption to your default credentials only for the account ID in `PLATFORM_AWS_ACCOUNT_ID`).

## Deployment

Deployed to a single free-tier EC2 instance (Amazon Linux 2023) via AWS Systems Manager — no SSH required. See `deploy/setup.sh` for the full remote install script (installs Python 3.12, sets up a venv, configures Nginx + a systemd service). Secrets are pulled from SSM Parameter Store by the instance's own least-privilege IAM role at deploy time, never baked into the deployment package.

To redeploy after a code change:
```bash
npm run build --prefix frontend
# zip backend (app/ + requirements.txt) and frontend/dist, upload both to the S3 deploy bucket
# aws ssm send-command ... AWS-RunShellScript ... (see deploy/setup.sh)
```

## Known limitations

Being upfront about what's simplified in this build:

- **Scanner coverage**: covers 7 of the ~30 AWS services in the original spec (EC2/EBS/EIP/SecurityGroup, S3, Lambda, RDS). Easy to extend — each scanner is a small, isolated module under `backend/app/aws/scanners/`.
- **Cost figures are estimates**, not real AWS Cost Explorer data — Cost Explorer requires manual enablement per account with a ~24h activation delay.
- **STS fallback is scoped to one demo account**: role assumption (`sts:AssumeRole`) is the real cross-account mechanism; it only falls back to the platform's own credentials for the platform's own demo AWS account ID, so a random visitor typing an arbitrary account ID gets a clean failure rather than silently scanning someone else's data.
- **Cleanup history/templates/schedules/notifications are shared, not per-user yet** — only accounts and their resources are properly multi-tenant right now.
- **No HTTPS/custom domain** on the live demo yet — plain HTTP via public IP.
- **SQLite on a single instance** — if the EC2 instance is ever replaced, scan data resets (fine for a demo; a visitor can just reconnect and rescan).
- **No automated test suite yet** (the original spec called for Pytest + Moto coverage).

## Project structure

```
backend/
  app/
    aws/            # boto3 session handling, per-service scanners, Cognito wrapper
    core/            # settings, auth dependency
    db/              # SQLAlchemy models
    routers/         # FastAPI endpoints, one file per feature area
    schemas/         # Pydantic request/response models
frontend/
  src/
    pages/          # one file per screen (marketing, auth, app)
    components/     # shared UI primitives + layout
    hooks/          # TanStack Query hooks, one place for all API calls
deploy/
  setup.sh          # the exact remote install script run via SSM
