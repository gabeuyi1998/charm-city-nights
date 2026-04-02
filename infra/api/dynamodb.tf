resource "aws_dynamodb_table" "waitlist" {
  name         = "CharmCityNightsWaitlist"
  billing_mode = "PAY_PER_REQUEST"  # free tier friendly, no provisioned capacity charges
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = {
    Project     = "charm-city-nights"
    Environment = var.environment
  }
}
