# Frontend Infrastructure (Manually Created)

## Resources (NOT managed by Terraform)

### S3 Bucket: mtvgabe.com (us-east-1)
- Static website hosting enabled
- Public bucket policy set
- Deployed via GitHub Actions (aws s3 sync)

### CloudFront Distribution: mtvgabe-waitlist
- Origin: S3 website endpoint
- Alternate domains: mtvgabe.com, www.mtvgabe.com
- ACM certificate: us-east-1 (covers mtvgabe.com + www.mtvgabe.com)
- Default root object: index.html
- Price class: PriceClass_100

### ACM Certificate (us-east-1)
- Covers: mtvgabe.com, *.mtvgabe.com
- Validated via Cloudflare DNS CNAME

### Cloudflare DNS (mtvgabe.com)
- @ CNAME → CloudFront domain (proxied OFF for CloudFront to work)
- www CNAME → CloudFront domain (proxied OFF)
