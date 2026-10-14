import { NextResponse } from "next/server";
import { handleStartCommand } from "@/lib/telegramResponder";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    const message = update?.message;
    if (message && message.text) {
      const text = message.text.trim();

      // Check if user clicked 'START' or typed /start
      if (text.startsWith("/start")) {
        const chatId = message.chat?.id;
        const fromUser = message.from;

        if (chatId && fromUser) {
          // Resolve dynamic domain from headers if not specified in env
          const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
          const proto = req.headers.get("x-forwarded-proto") || "https";
          const dynamicUrl = host ? `${proto}://${host}` : undefined;

          await handleStartCommand(chatId, fromUser, dynamicUrl);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Error processing Telegram webhook:", error);
    // Return 200 OK so Telegram doesn't retry bad payloads repeatedly
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 });
  }
}

export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const isConfigured = Boolean(botToken);

  return NextResponse.json({
    status: "active",
    botConfigured: isConfigured,
    endpoint: "/api/telegram/webhook",
    description: "Telegram Webhook receiver for automated /start welcome messages and instant pass launching.",
  });
}
