interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
}

interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

interface PushResponse {
  data: PushTicket[];
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const validTokens = tokens.filter((t) => t.startsWith('ExponentPushToken['));
  if (validTokens.length === 0) return;

  for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
    const batch = validTokens.slice(i, i + BATCH_SIZE);
    const messages: PushMessage[] = batch.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      ...(data && { data }),
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = (await response.json()) as PushResponse;
      const errors = result.data.filter((t) => t.status === 'error');
      if (errors.length > 0) {
        console.error(`Push errors (${errors.length}):`, errors);
      }
    } catch (err) {
      console.error('Failed to send push batch:', err);
    }
  }
}
