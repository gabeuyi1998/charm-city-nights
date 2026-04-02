# HTTP API Gateway
resource "aws_apigatewayv2_api" "waitlist" {
  name          = "ccn-waitlist-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${var.domain}", "https://www.${var.domain}"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }
}

# Lambda integration
resource "aws_apigatewayv2_integration" "waitlist" {
  api_id                 = aws_apigatewayv2_api.waitlist.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.waitlist.invoke_arn
  payload_format_version = "2.0"
}

# POST /waitlist route
resource "aws_apigatewayv2_route" "waitlist" {
  api_id    = aws_apigatewayv2_api.waitlist.id
  route_key = "POST /waitlist"
  target    = "integrations/${aws_apigatewayv2_integration.waitlist.id}"
}

# Auto-deploy stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.waitlist.id
  name        = "$default"
  auto_deploy = true
}

# Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.waitlist.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.waitlist.execution_arn}/*/*"
}
