import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let targetTelegramId: string | undefined;
    let message = "";
    let broadcast = false;
    let imageBuffer: Buffer | null = null;
    let imageName = "image.jpg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      message = (formData.get("message") as string) || "";
      broadcast = formData.get("broadcast") === "true";
      targetTelegramId = (formData.get("targetTelegramId") as string) || undefined;
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        imageBuffer = Buffer.from(await file.arrayBuffer());
        imageName = file.name || "image.jpg";
      }
    } else {
      const json = await req.json();
      message = json.message || "";
      broadcast = Boolean(json.broadcast);
      targetTelegramId = json.targetTelegramId;
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message text cannot be empty" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const cleanMessage = message.trim();

    if (broadcast) {
      // Find all Telegram users with a valid telegramId
      const recipients = await prisma.user.findMany({
        where: {
          telegramId: { not: null },
        },
      });

      if (recipients.length === 0) {
        return NextResponse.json({
          success: false,
          count: 0,
          error: "No Telegram users found in the database to broadcast to.",
        }, { status: 400 });
      }

      if (!botToken) {
        // Simulated broadcast mode
        console.log(`[SIMULATED BROADCAST] to ${recipients.length} users (image: ${imageBuffer ? imageName : "none"}): "${cleanMessage}"`);
        return NextResponse.json({
          success: true,
          count: recipients.length,
          simulated: true,
          message: `[Simulated] Broadcast ${imageBuffer ? "with photo " : ""}sent to ${recipients.length} user(s). (Add TELEGRAM_BOT_TOKEN in .env to deliver real Telegram messages).`,
        });
      }

      // Real Telegram send
      let sentCount = 0;
      const errors: string[] = [];

      for (const recipient of recipients) {
        if (recipient.telegramId) {
          const res = imageBuffer
            ? await sendTelegramPhoto(botToken, recipient.telegramId, imageBuffer, cleanMessage, imageName)
            : await sendTelegramMessage(botToken, recipient.telegramId, cleanMessage);

          if (res.success) {
            sentCount++;
          } else if (res.error) {
            errors.push(`${recipient.telegramId}: ${res.error}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        count: sentCount,
        totalEligible: recipients.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
        message: `Successfully delivered message to ${sentCount}/${recipients.length} Telegram users.`,
      });
    }

    // Single user message
    if (!targetTelegramId) {
      return NextResponse.json(
        { success: false, error: "Target Telegram ID is required" },
        { status: 400 }
      );
    }

    if (!botToken) {
      console.log(`[SIMULATED DIRECT MESSAGE] to ${targetTelegramId} (image: ${imageBuffer ? imageName : "none"}): "${cleanMessage}"`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `[Simulated] Message ${imageBuffer ? "with photo " : ""}delivered to Telegram ID ${targetTelegramId}. (To send actual messages in Telegram, set TELEGRAM_BOT_TOKEN in .env).`,
      });
    }

    const result = imageBuffer
      ? await sendTelegramPhoto(botToken, targetTelegramId, imageBuffer, cleanMessage, imageName)
      : await sendTelegramMessage(botToken, targetTelegramId, cleanMessage);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to deliver message via Telegram" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Message ${imageBuffer ? "with photo " : ""}sent to Telegram user ${targetTelegramId}!`,
    });
  } catch (error: unknown) {
    console.error("Error in /api/admin/send-message:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
