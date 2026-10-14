import { NextResponse } from "next/server";
import { setTelegramMenuButton, setTelegramWebhook } from "@/lib/telegram";

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ success: false, error: "TELEGRAM_BOT_TOKEN not configured" });
  }

  try {
    const [meRes, webhookRes, menuRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getMe`).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${botToken}/getChatMenuButton`).then((r) => r.json()),
    ]);

    return NextResponse.json({
      success: true,
      bot: meRes.result,
      webhook: webhookRes.result,
      menuButton: menuRes.result,
      currentConfiguredAppUrl:
        process.env.TELEGRAM_WEBAPP_URL || process.env.NEXT_PUBLIC_APP_URL || null,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ success: false, error: "TELEGRAM_BOT_TOKEN not configured" });
  }

  try {
    const body = await req.json();
    const { webAppUrl, buttonText = "Open FairPrice Pass", enableWebhook = false } = body;

    if (!webAppUrl || !webAppUrl.startsWith("https://")) {
      return NextResponse.json({
        success: false,
        error: "A valid HTTPS URL is required (e.g. https://your-domain.com)",
      });
    }

    // 1. Update the process env for runtime
    process.env.TELEGRAM_WEBAPP_URL = webAppUrl;

    // 2. Set the persistent chat menu button
    const menuResult = await setTelegramMenuButton(botToken, webAppUrl, buttonText);

    // 3. Set the webhook if requested
    let webhookResult = null;
    if (enableWebhook) {
      const webhookEndpoint = `${webAppUrl.replace(/\/$/, "")}/api/telegram/webhook`;
      webhookResult = await setTelegramWebhook(botToken, webhookEndpoint);
    }

    return NextResponse.json({
      success: true,
      webAppUrl,
      menuButton: menuResult,
      webhook: webhookResult,
      message: "Telegram Bot configured with instant Open Pass button!",
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
