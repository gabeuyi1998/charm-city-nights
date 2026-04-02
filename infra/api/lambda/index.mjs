import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const TABLE_NAME = process.env.TABLE_NAME || "CharmCityNightsWaitlist";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://mtvgabe.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { firstName, email, userType } = body;
  if (!firstName || !email || !userType) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing required fields" }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid email" }) };
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const ipAddress = event.requestContext?.http?.sourceIp || "unknown";

  try {
    await client.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        id: { S: id },
        firstName: { S: firstName },
        email: { S: email },
        userType: { S: userType },
        timestamp: { S: timestamp },
        ipAddress: { S: ipAddress },
      },
      ConditionExpression: "attribute_not_exists(email)",
    }));
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: "You're on the list!" }),
    };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: "Email already registered" }) };
    }
    console.error(err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Server error" }) };
  }
};
