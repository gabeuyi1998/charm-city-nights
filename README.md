# Charm City Nights

Baltimore's nightlife gamification app — earn XP, unlock badges, and discover the city after dark.

This repo contains the waitlist landing page and backend infrastructure.

## Architecture

```
                          ┌─────────────────────┐
                          │   Cloudflare DNS      │
                          │  mtvgabe.com (CNAME)  │
                          └──────────┬────────────┘
                                     │
                          ┌──────────▼────────────┐
                          │   CloudFront CDN       │
                          │  mtvgabe-waitlist dist │
                          └──────────┬────────────┘
                                     │
                          ┌──────────▼────────────┐
                          │   S3 Bucket            │
                          │   mtvgabe.com          │
                          │  (static website)      │
                          └───────────────────────┘

  Form POST ──► API Gateway (HTTP API)
                    │
               ┌────▼──────┐
               │  Lambda   │
               │  Node 20  │
               └────┬──────┘
                    │
              ┌─────▼──────┐
              │  DynamoDB   │
              │  Waitlist   │
              └────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| Backend | AWS Lambda (Node.js 20), API Gateway HTTP API |
| Database | DynamoDB (PAY_PER_REQUEST) |
| Hosting | S3 static website + CloudFront CDN |
| DNS | Cloudflare (proxy OFF — required for CloudFront) |
| IaC | Terraform >= 1.5 |
| CI/CD | GitHub Actions |

## What Was Manually Set Up vs Terraform Managed

### Manually created (not in Terraform)
- S3 bucket `mtvgabe.com` with static website hosting
- CloudFront distribution `mtvgabe-waitlist`
- ACM certificate (us-east-1) for mtvgabe.com + *.mtvgabe.com
- Cloudflare DNS records
- Terraform state bucket `mtvgabe-terraform-state`
- Terraform state lock table `mtvgabe-terraform-locks`

### Managed by Terraform (`infra/api/`)
- DynamoDB table `CharmCityNightsWaitlist`
- Lambda function `ccn-waitlist-handler`
- IAM role + policies for Lambda
- API Gateway HTTP API + routes + stage

## Local Development

```bash
cd web
npm install
npm run dev
```

The app runs at http://localhost:3000. Without `NEXT_PUBLIC_SUPABASE_URL` set, the API route returns mock data.

### Set up .env.local

```bash
cp web/.env.local.example web/.env.local
```

After running `terraform apply`, set:

```
NEXT_PUBLIC_API_URL=<value from terraform output api_gateway_url>
```

## Deployment

### 1. Deploy the backend (first time)

```bash
cd infra/api
terraform init
terraform apply
```

Copy the `api_gateway_url` output value.

### 2. Set GitHub Secrets

Go to your repo → Settings → Secrets and add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | `us-east-1` |
| `S3_BUCKET_NAME` | `mtvgabe.com` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `API_GATEWAY_URL` | Output from `terraform output api_gateway_url` |

### 3. Deploy frontend

Push to `main` — GitHub Actions builds the Next.js static export and syncs to S3, then invalidates CloudFront.

## DNS Configuration

In Cloudflare for `mtvgabe.com`:
- `@` → CNAME to CloudFront domain — **Proxy status: DNS only (OFF)**
- `www` → CNAME to CloudFront domain — **Proxy status: DNS only (OFF)**

Cloudflare proxy must be OFF because CloudFront handles HTTPS termination with its own ACM cert. Enabling the Cloudflare proxy causes cert mismatch errors.
