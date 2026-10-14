import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, syncTelegramMenuButtonFromEnv } from "@/lib/telegram";

export interface TelegramFromUser {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Automatically responds to a user who clicks 'START' or sends /start to the bot.
 * Pre-registers the customer in the database and sends back an instant
 * pass button so they NEVER need to scan again!
 */
export async function handleStartCommand(
  chatId: number | string,
  fromUser: TelegramFromUser,
  appUrlOverride?: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { success: false, error: "Missing TELEGRAM_BOT_TOKEN" };
  }

  const telegramIdStr = String(fromUser.id);
  const firstName = fromUser.first_name || "Customer";
  const lastName = fromUser.last_name || "";
  const username = fromUser.username || null;

  try {
    // 1. Ensure customer record exists in the database
    let user = await prisma.user.findUnique({
      where: { telegramId: telegramIdStr },
    });

    if (!user) {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      const initialRole = adminCount === 0 ? "admin" : "user";

      user = await prisma.user.create({
        data: {
          telegramId: telegramIdStr,
          firstName,
          lastName: lastName || null,
          telegramUsername: username,
          authProvider: "telegram",
          canReceiveNotifications: true,
          role: initialRole,
        },
      });
      console.log(`[Telegram Auto-Responder] Registered new user ${telegramIdStr} (${firstName})`);
    } else {
      // Update names and notification permission if existing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          telegramUsername: username || user.telegramUsername,
          canReceiveNotifications: true,
        },
      });
    }

    // 2. Resolve the Web App URL from override or .env
    const appUrl =
      appUrlOverride ||
      process.env.TELEGRAM_WEBAPP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    // 3. Compose friendly welcome message from .env or default
    const customMessage = process.env.TELEGRAM_START_MESSAGE;
    const welcomeText = customMessage
      ? customMessage
          .replace(/\\n/g, "\n")
          .replace(/\{firstName\}/g, firstName)
          .replace(/\{name\}/g, firstName)
          .replace(/\{lastName\}/g, lastName)
          .replace(/\{username\}/g, username || firstName)
      : `<b>Welcome to FairPrice, ${firstName}!</b>\n\nYour digital membership is ready. Tap the button below to access your member pass, earn reward points, and claim exclusive vouchers:`;

    // 4. Resolve button label from .env
    const buttonText =
      process.env.TELEGRAM_START_BUTTON_TEXT ||
      process.env.TELEGRAM_MENU_BUTTON_TEXT ||
      "Open FairPrice Member Pass";

    // 5. Send the message with the WebApp button
    const result = await sendTelegramMessage(
      botToken,
      chatId,
      welcomeText,
      appUrl && appUrl.startsWith("https://") ? appUrl : undefined,
      buttonText
    );

    // 6. Asynchronously sync the side / menu button in Telegram from .env
    syncTelegramMenuButtonFromEnv().catch((err) => {
      console.warn("[Telegram Responder] Menu button sync warning:", err);
    });

    return { success: result.success, user, error: result.error };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Telegram Auto-Responder Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
