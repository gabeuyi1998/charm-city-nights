// Lightweight Socket.io v4 client over native WebSocket
// Only handles the events we need: crowd:update, checkin

const _base = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'ws://localhost:3000';
const SOCKET_URL = `${_base}/socket.io/?EIO=4&transport=websocket`;

type CrowdUpdate = { barId: string; currentCrowd: number };
type CrowdUpdateListener = (data: CrowdUpdate) => void;

let ws: WebSocket | null = null;
const crowdListeners = new Set<CrowdUpdateListener>();
const subscribedBars = new Set<string>();

function send(msg: string): void {
  if (ws?.readyState === WebSocket.OPEN) ws.send(msg);
}

function connect(): void {
  if (ws) return;

  ws = new WebSocket(SOCKET_URL);

  ws.onopen = () => {
    // Socket.io handshake: send "2probe" then upgrade
    send('2probe');
  };

  ws.onmessage = (e) => {
    const raw = String(e.data);

    // Socket.io ping → pong
    if (raw === '2') { send('3'); return; }
    if (raw === '3probe') { send('5'); return; }

    // Packet type 42 = socket.io EVENT
    if (!raw.startsWith('42')) return;

    try {
      const payload = JSON.parse(raw.slice(2)) as [string, unknown];
      const [event, data] = payload;

      if (event === 'crowd:update') {
        const update = data as CrowdUpdate;
        crowdListeners.forEach((fn) => fn(update));
      }
    } catch {
      // ignore malformed frames
    }
  };

  ws.onclose = () => {
    ws = null;
    // Reconnect after 3s
    setTimeout(() => {
      if (crowdListeners.size > 0) connect();
    }, 3000);
  };

  ws.onerror = () => ws?.close();
}

function joinBar(barId: string): void {
  if (subscribedBars.has(barId)) return;
  subscribedBars.add(barId);
  // Socket.io emit: join room "bar:<id>"
  send(`42["join",{"room":"bar:${barId}"}]`);
}

function leaveBar(barId: string): void {
  subscribedBars.delete(barId);
  send(`42["leave",{"room":"bar:${barId}"}]`);
}

export function subscribeCrowdUpdates(
  barIds: string[],
  listener: CrowdUpdateListener,
): () => void {
  connect();
  crowdListeners.add(listener);
  barIds.forEach(joinBar);

  return () => {
    crowdListeners.delete(listener);
    if (crowdListeners.size === 0) {
      barIds.forEach(leaveBar);
      ws?.close();
    }
  };
}
