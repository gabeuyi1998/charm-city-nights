import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

const TABLE_NAME = process.env.TABLE_NAME || "CharmCityNightsWaitlist";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://mtvgabe.com";
const SES_SENDER = process.env.SES_SENDER || "hello@mtvgabe.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

async function getNextPosition() {
  const result = await dynamo.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: { email: { S: "__counter__" } },
    UpdateExpression: "ADD #pos :inc",
    ExpressionAttributeNames: { "#pos": "position" },
    ExpressionAttributeValues: { ":inc": { N: "1" } },
    ReturnValues: "UPDATED_NEW",
  }));
  return parseInt(result.Attributes?.position?.N ?? "1", 10);
}

function buildWelcomeEmail(email, position, bonusXP) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#131313;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#131313;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1C1B1B;border-radius:16px;border:1px solid rgba(255,92,0,0.3);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#FF5C00,#E9C349);padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:36px;font-weight:900;color:#131313;letter-spacing:3px;text-transform:uppercase;">CHARM CITY NIGHTS</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#131313;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Baltimore&apos;s Nightlife App</p>
        </td></tr>
        <tr><td style="padding:40px 32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🦀</div>
          <h2 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#E5E2E1;letter-spacing:2px;text-transform:uppercase;">You&apos;re On The List!</h2>
          <p style="margin:0 0 24px;color:#E4BEB1;opacity:0.7;font-size:15px;">Welcome to the crew, Baltimore.</p>
          <div style="background:#0E0E0E;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid rgba(233,195,73,0.2);">
            <p style="margin:0 0 4px;font-size:13px;color:#E9C349;text-transform:uppercase;letter-spacing:2px;">Your Waitlist Position</p>
            <p style="margin:0;font-size:48px;font-weight:900;color:#FF5C00;">#${position}</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="padding:8px;">
              <div style="background:#0E0E0E;border-radius:10px;padding:14px 16px;text-align:left;display:flex;align-items:center;">
                <span style="font-size:20px;margin-right:12px;">⚡</span>
                <span style="color:#E5E2E1;font-size:14px;"><strong style="color:#E9C349;">${bonusXP} Bonus XP</strong> waiting on launch day</span>
              </div>
            </td></tr>
            <tr><td style="padding:8px;">
              <div style="background:#0E0E0E;border-radius:10px;padding:14px 16px;text-align:left;">
                <span style="font-size:20px;margin-right:12px;">🏅</span>
                <span style="color:#E5E2E1;font-size:14px;"><strong style="color:#E9C349;">3 Exclusive Early Adopter Badges</strong> unlocked</span>
              </div>
            </td></tr>
            <tr><td style="padding:8px;">
              <div style="background:#0E0E0E;border-radius:10px;padding:14px 16px;text-align:left;">
                <span style="font-size:20px;margin-right:12px;">🎯</span>
                <span style="color:#E5E2E1;font-size:14px;"><strong style="color:#E9C349;">Priority Access</strong> before the public</span>
              </div>
            </td></tr>
          </table>
          <p style="margin:0 0 20px;color:#E4BEB1;opacity:0.6;font-size:13px;line-height:1.6;">
            We&apos;ll email you the moment Charm City Nights is ready to download.<br>
            Check-in at bars, earn badges, build bar crawls, dominate the night.
          </p>
          <a href="https://mtvgabe.com" style="display:inline-block;background:linear-gradient(135deg,#FF5C00,#E9C349);color:#131313;font-weight:800;font-size:14px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:50px;">Share With Friends 🦀</a>
        </td></tr>
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#E4BEB1;opacity:0.3;font-size:12px;">© 2026 Charm City Nights · Baltimore, MD · <a href="https://mtvgabe.com" style="color:#FF5C00;text-decoration:none;">mtvgabe.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

  const { email, crabs_found = 0 } = body;
  if (!email) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Email is required" }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid email" }) };
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const ipAddress = event.requestContext?.http?.sourceIp || "unknown";
  const bonusXP = 500 + (Number(crabs_found) || 0) * 50;

  let position;
  try {
    position = await getNextPosition();
    await dynamo.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        id: { S: id },
        email: { S: email },
        crabs_found: { N: String(crabs_found) },
        bonus_xp: { N: String(bonusXP) },
        position: { N: String(position) },
        timestamp: { S: timestamp },
        ipAddress: { S: ipAddress },
      },
      ConditionExpression: "attribute_not_exists(email)",
    }));
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: "Email already registered", alreadyJoined: true }) };
    }
    console.error("DynamoDB error:", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Server error" }) };
  }

  // Send welcome email via SES (non-blocking — don't fail the request if email fails)
  try {
    await ses.send(new SendEmailCommand({
      Source: `Charm City Nights <${SES_SENDER}>`,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "You're on the Charm City Nights waitlist 🦀", Charset: "UTF-8" },
        Body: { Html: { Data: buildWelcomeEmail(email, position, bonusXP), Charset: "UTF-8" } },
      },
    }));
  } catch (err) {
    // Log but don't fail — signup still succeeded
    console.error("SES send failed:", err.message);
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, position, bonusXP, crabsFound: Number(crabs_found) }),
  };
};
