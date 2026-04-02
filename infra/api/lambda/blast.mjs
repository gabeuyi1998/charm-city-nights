/**
 * CCN Launch Blast — send "It's live!" email to all waitlist subscribers
 * Invoke manually from AWS Console or via EventBridge when the app ships.
 *
 * Usage: AWS Console → Lambda → ccn-waitlist-blast → Test (empty payload {})
 */
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

const TABLE_NAME = process.env.TABLE_NAME || "CharmCityNightsWaitlist";
const SES_SENDER = process.env.SES_SENDER || "hello@mtvgabe.com";
const APP_STORE_URL = process.env.APP_STORE_URL || "https://mtvgabe.com";
const PLAY_STORE_URL = process.env.PLAY_STORE_URL || "https://mtvgabe.com";

function buildLaunchEmail() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#131313;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#131313;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1C1B1B;border-radius:16px;border:1px solid rgba(255,92,0,0.5);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#FF5C00,#E9C349);padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:36px;font-weight:900;color:#131313;letter-spacing:3px;text-transform:uppercase;">IT&apos;S LIVE 🎉</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#131313;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Charm City Nights is ready</p>
        </td></tr>
        <tr><td style="padding:40px 32px;text-align:center;">
          <div style="font-size:56px;margin-bottom:16px;">🦀</div>
          <h2 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#E5E2E1;letter-spacing:2px;text-transform:uppercase;">Baltimore, The Night Is Yours</h2>
          <p style="margin:0 0 28px;color:#E4BEB1;opacity:0.7;font-size:15px;line-height:1.7;">
            You&apos;ve been waiting. The app is here.<br>
            Check-in at bars, earn badges, build bar crawls, and run the night.
          </p>
          <a href="${APP_STORE_URL}" style="display:inline-block;background:linear-gradient(135deg,#FF5C00,#E9C349);color:#131313;font-weight:800;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:50px;margin-bottom:12px;">Download on iOS 🍎</a>
          <br>
          <a href="${PLAY_STORE_URL}" style="display:inline-block;background:#2A2A2A;color:#E5E2E1;font-weight:700;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:50px;margin-top:8px;border:1px solid rgba(255,92,0,0.3);">Download on Android 🤖</a>
          <p style="margin:28px 0 0;color:#E4BEB1;opacity:0.4;font-size:12px;">Your early adopter badges and bonus XP are waiting inside the app.</p>
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

// Sleep helper for SES rate limiting (14 emails/sec in sandbox)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const handler = async () => {
  const html = buildLaunchEmail();
  let sent = 0;
  let failed = 0;
  let lastKey;

  do {
    const scanResult = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "email <> :counter",
      ExpressionAttributeValues: { ":counter": { S: "__counter__" } },
      ProjectionExpression: "email",
      ExclusiveStartKey: lastKey,
      Limit: 25,
    }));

    for (const item of scanResult.Items ?? []) {
      const email = item.email?.S;
      if (!email) continue;
      try {
        await ses.send(new SendEmailCommand({
          Source: `Charm City Nights <${SES_SENDER}>`,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: "🦀 Charm City Nights is LIVE — Download Now!", Charset: "UTF-8" },
            Body: { Html: { Data: html, Charset: "UTF-8" } },
          },
        }));
        sent++;
        // Stay within SES rate limit
        await sleep(75);
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err.message);
        failed++;
      }
    }

    lastKey = scanResult.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Blast complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};
