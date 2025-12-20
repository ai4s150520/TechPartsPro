export type NotificationMessage = {
  type?: string;
  message?: unknown;
  order_id?: string | number;
  status?: string;
  [key: string]: unknown;
};

// Connect to backend notifications WS. Returns the WebSocket instance.
export function connectNotifications(token: string, onMessage: (data: NotificationMessage) => void) {
  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss' : 'ws';
  const host = loc.host; // includes port if present

  const url = `${protocol}://${host}/ws/notifications/?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    // no-op for now; could add logging if needed
  };

  ws.onmessage = (evt) => {
    try {
      const parsed = JSON.parse(evt.data) as NotificationMessage;
      onMessage(parsed);
    } catch {
      // If message is not JSON, pass raw
      onMessage({ message: evt.data } as unknown as NotificationMessage);
    }
  };

  ws.onclose = () => {
    // no-op; caller should handle reconnect if desired
  };

  ws.onerror = () => {
    // swallow errors; page-level code can handle
  };

  return ws;
}

export default connectNotifications;
