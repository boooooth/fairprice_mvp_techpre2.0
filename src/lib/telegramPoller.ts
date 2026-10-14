import { handleStartCommand } from "@/lib/telegramResponder";
import { syncTelegramMenuButtonFromEnv } from "@/lib/telegram";

// Global singleton to prevent multiple polling loops during Next.js hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __telegramPollerRunning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __telegramPollerOffset: number | undefined;
}

let isPolling = false;

/**
 * Checks for updates from Telegram via getUpdates when no webhook is set.
 * Automatically replies to any /start message with the "Open Member Pass" button!
 */
export async function pollTelegramUpdatesOnce(): Promise<number> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return 0;

  try {
    const currentOffset = global.__telegramPollerOffset || 0;
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${currentOffset}&limit=10&timeout=2`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!data.ok) {
      // If a webhook is active, Telegram returns 409 Conflict. Stop polling gracefully.
      if (data.error_code === 409) {
        return 0;
      }
      return 0;
    }

    const updates = data.result || [];
    let handledCount = 0;

    for (const update of updates) {
      // Advance offset to acknowledge this update
      global.__telegramPollerOffset = Math.max(
        global.__telegramPollerOffset || 0,
        update.update_id + 1
      );

      const message = update?.message;
      if (message && message.text) {
        const text = message.text.trim();
        if (text.startsWith("/start")) {
          const chatId = message.chat?.id;
          const fromUser = message.from;
          if (chatId && fromUser) {
            await handleStartCommand(chatId, fromUser);
            handledCount++;
          }
        }
      }
    }

    return handledCount;
  } catch (err) {
    // Network or temporary failure, silently continue
    return 0;
  }
}

/**
 * Starts the background auto-responder polling worker
 */
export function startTelegramPoller() {
  if (global.__telegramPollerRunning) return;
  global.__telegramPollerRunning = true;
  isPolling = true;

  console.log("[Telegram Poller] Background /start auto-responder initialized.");

  // Automatically sync Telegram chat menu button (side button) from .env on startup
  syncTelegramMenuButtonFromEnv().catch(() => {});

  const runLoop = async () => {
    while (isPolling) {
      try {
        await pollTelegramUpdatesOnce();
      } catch (err) {
        // Ignore loop errors
      }
      // Wait 2.5 seconds between polling iterations
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  };

  runLoop();
}
