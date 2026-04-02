# SES domain identity — verifies mtvgabe.com so we can send from any @mtvgabe.com address
resource "aws_ses_domain_identity" "main" {
  domain = var.domain
}

# Output the TXT record value — add this in Cloudflare to complete verification
output "ses_domain_verification_token" {
  description = "Add this as a TXT record in Cloudflare: Name = _amazonses.mtvgabe.com, Value = below"
  value       = aws_ses_domain_identity.main.verification_token
}

# DKIM records for better deliverability
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

output "ses_dkim_tokens" {
  description = "Add these 3 CNAME records in Cloudflare for DKIM (improves inbox delivery)"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}
