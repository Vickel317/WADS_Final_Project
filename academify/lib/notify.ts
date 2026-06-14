const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3001";

export interface NotificationPayload {
  notificationID: string;
  content: string;
  link: string | null;
  createdAt: string;
}

export async function emitNotificationToUser(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  const secret = process.env.SOCKET_EMIT_SECRET;
  if (!secret) return;

  try {
    await fetch(`${SOCKET_SERVER_URL}/emit-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Socket-Emit-Secret": secret,
      },
      body: JSON.stringify({ userId, notification }),
    });
  } catch {
    // Socket server may be unavailable — notification is already persisted in DB,
    // so the user will see it on next page load / poll.
  }
}
