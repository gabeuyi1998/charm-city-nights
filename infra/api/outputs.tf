output "api_gateway_url" {
  description = "API Gateway endpoint URL — set as NEXT_PUBLIC_API_URL in .env.local and GitHub secret API_GATEWAY_URL"
  value       = "${trimsuffix(aws_apigatewayv2_stage.default.invoke_url, "/")}/waitlist"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.waitlist.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.waitlist.function_name
}
