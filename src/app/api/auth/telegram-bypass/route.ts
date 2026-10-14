import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramWebAppData } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { initData, telegramUser, canReceiveNotifications } = await req.json();

    if (!telegramUser || !telegramUser.id) {
      return NextResponse.json(
        { success: false, error: "Missing Telegram user information" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log(`[Telegram Bypass Attempt] User ID: ${telegramUser.id}, Name: ${telegramUser.first_name}, Username: ${telegramUser.username}`);

    if (botToken && initData) {
      const isValid = verifyTelegramWebAppData(initData, botToken);
      console.log(`[Telegram HMAC Verification] valid = ${isValid}`);
      if (!isValid) {
        console.warn("[Telegram HMAC] Signature did not match. Ensure BOT_TOKEN belongs to this exact bot.");
        // In local development, we allow authentication if the telegram user payload is valid
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { success: false, error: "Invalid Telegram authentication data" },
            { status: 401 }
          );
        }
      }
    }

    const telegramIdStr = String(telegramUser.id);

    // Look for existing user
    let user = await prisma.user.findUnique({
      where: { telegramId: telegramIdStr },
    });

    if (user) {
      // Update notification permission & names if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          canReceiveNotifications:
            canReceiveNotifications !== undefined
              ? Boolean(canReceiveNotifications)
              : user.canReceiveNotifications,
          firstName: telegramUser.first_name || user.firstName,
          lastName: telegramUser.last_name || user.lastName,
          telegramUsername: telegramUser.username || user.telegramUsername,
          photoUrl: telegramUser.photo_url || user.photoUrl,
        },
      });
    } else {
      // If this is the first user or no admin exists, assign admin role
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      const initialRole = adminCount === 0 ? "admin" : "user";

      // Create new user immediately from Telegram profile
      user = await prisma.user.create({
        data: {
          telegramId: telegramIdStr,
          firstName: telegramUser.first_name || "Telegram User",
          lastName: telegramUser.last_name || null,
          telegramUsername: telegramUser.username || null,
          photoUrl: telegramUser.photo_url || null,
          authProvider: "telegram",
          canReceiveNotifications: Boolean(canReceiveNotifications),
          role: initialRole,
        },
      });
    }

    const isNew = !user.age || !user.gender;

    return NextResponse.json({
      success: true,
      message: "Telegram user authenticated (OTP bypassed)",
      isNew,
      user,
    });
  } catch (error: unknown) {
    console.error("Error in /api/auth/telegram-bypass:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
