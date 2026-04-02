# Zip the Lambda source
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "ccn-waitlist-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Basic Lambda logging policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB + SES policy
resource "aws_iam_role_policy" "lambda_dynamo" {
  name = "ccn-lambda-dynamo-ses-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:Scan"]
        Resource = aws_dynamodb_table.waitlist.arn
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "waitlist" {
  function_name    = "ccn-waitlist-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.waitlist.name
      ALLOWED_ORIGIN = "https://${var.domain}"
      SES_SENDER     = "hello@${var.domain}"
    }
  }

  tags = {
    Project     = "charm-city-nights"
    Environment = var.environment
  }
}

# Launch blast Lambda (invoke manually from AWS Console when app is ready to ship)
resource "aws_lambda_function" "blast" {
  function_name    = "ccn-waitlist-blast"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "blast.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 900  # 15 min — enough for large subscriber lists

  environment {
    variables = {
      TABLE_NAME    = aws_dynamodb_table.waitlist.name
      SES_SENDER    = "hello@${var.domain}"
      APP_STORE_URL = "https://${var.domain}"
      PLAY_STORE_URL = "https://${var.domain}"
    }
  }

  tags = {
    Project     = "charm-city-nights"
    Environment = var.environment
  }
}
