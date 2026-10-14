export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startTelegramPoller } = await import("@/lib/telegramPoller");
      startTelegramPoller();
    } catch (err) {
      console.error("[Instrumentation] Failed to start Telegram Poller:", err);
    }
  }
}
