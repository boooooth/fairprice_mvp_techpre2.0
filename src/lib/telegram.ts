import crypto from "crypto";

/**
 * Validates initData sent by Telegram Mini App against your Bot Token.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  if (!botToken || !initData) return false;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return false;

    urlParams.delete("hash");

    // Sort parameters alphabetically
    const params: string[] = [];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();
    const dataCheckString = params.join("\n");

    // Secret key is HMAC-SHA-256 of bot token with key "WebAppData"
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculated hash is HMAC-SHA-256 of dataCheckString with secretKey
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return calculatedHash === hash;
  } catch (err) {
    console.error("Error verifying Telegram initData:", err);
    return false;
  }
}

/**
 * Sends a message to a user or chat via Telegram Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  buttonUrl?: string,
  buttonText: string = "Open FairPrice Pass"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!botToken) {
    return {
      success: false,
      error: "TELEGRAM_BOT_TOKEN is not configured in .env",
    };
  }

  try {
    const appUrl = buttonUrl || process.env.TELEGRAM_WEBAPP_URL || process.env.NEXT_PUBLIC_APP_URL;
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    };

    if (appUrl) {
      if (appUrl.startsWith("https://t.me/") || appUrl.startsWith("tg://")) {
        body.reply_markup = {
          inline_keyboard: [
            [
              {
                text: buttonText,
                url: appUrl,
              },
            ],
          ],
        };
      } else if (appUrl.startsWith("https://")) {
        body.reply_markup = {
          inline_keyboard: [
            [
              {
                text: buttonText,
                web_app: { url: appUrl },
              },
            ],
          ],
        };
      }
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      return {
        success: false,
        error: data.description || "Telegram API rejected the message",
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a photo with an optional caption to a user or chat via Telegram Bot API
 */
export async function sendTelegramPhoto(
  botToken: string,
  chatId: string | number,
  photoBuffer: Buffer,
  caption?: string,
  fileName: string = "image.jpg",
  buttonUrl?: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!botToken) {
    return {
      success: false,
      error: "TELEGRAM_BOT_TOKEN is not configured in .env",
    };
  }

  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));

    const blob = new Blob([new Uint8Array(photoBuffer)]);
    formData.append("photo", blob, fileName);

    if (caption && caption.trim()) {
      formData.append("caption", caption.trim());
      formData.append("parse_mode", "HTML");
    }

    const appUrl =
      buttonUrl || process.env.TELEGRAM_WEBAPP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (appUrl) {
      const buttonText =
        process.env.TELEGRAM_START_BUTTON_TEXT ||
        process.env.TELEGRAM_MENU_BUTTON_TEXT ||
        "Open FairPrice App";

      let buttonObj: any = null;
      if (appUrl.startsWith("https://t.me/") || appUrl.startsWith("tg://")) {
        buttonObj = { text: buttonText, url: appUrl };
      } else if (appUrl.startsWith("https://")) {
        buttonObj = { text: buttonText, web_app: { url: appUrl } };
      }

      if (buttonObj) {
        formData.append(
          "reply_markup",
          JSON.stringify({
            inline_keyboard: [[buttonObj]],
          })
        );
      }
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!data.ok) {
      return {
        success: false,
        error: data.description || "Telegram API rejected the photo",
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sets the persistent Menu Button at the bottom of the chat to open the Mini App
 */
export async function setTelegramMenuButton(
  botToken: string,
  webAppUrl: string,
  buttonText: string = "Open Member App"
): Promise<{ success: boolean; error?: string }> {
  if (!botToken) return { success: false, error: "Missing bot token" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: buttonText,
          web_app: { url: webAppUrl },
        },
      }),
    });
    const data = await res.json();
    return { success: Boolean(data.ok), error: data.description };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Automatically synchronizes the Telegram persistent chat menu button (side button)
 * using settings defined in .env
 */
export async function syncTelegramMenuButtonFromEnv(): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const buttonText = process.env.TELEGRAM_MENU_BUTTON_TEXT || "Open Member Pass";

  if (!botToken || !webAppUrl || !webAppUrl.startsWith("https://")) {
    return { success: false, error: "Missing valid HTTPS TELEGRAM_WEBAPP_URL or bot token" };
  }

  return setTelegramMenuButton(botToken, webAppUrl, buttonText);
}

/**
 * Sets the Telegram bot webhook to a public HTTPS endpoint
 */
export async function setTelegramWebhook(
  botToken: string,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!botToken) return { success: false, error: "Missing bot token" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });
    const data = await res.json();
    return { success: Boolean(data.ok), error: data.description };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}


