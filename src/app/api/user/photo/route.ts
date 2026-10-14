import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let telegramId = searchParams.get("telegramId");
    const userId = searchParams.get("userId");

    if (!telegramId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });
      telegramId = user?.telegramId || null;
    }

    if (!telegramId) {
      return NextResponse.json({ error: "No telegram ID provided" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
    }

    // 1. Get user profile photos
    const photosRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`,
      { next: { revalidate: 3600 } }
    );
    const photosData = await photosRes.json();

    if (!photosData.ok || !photosData.result?.photos?.length || !photosData.result.photos[0]?.length) {
      return NextResponse.json({ error: "No profile photo found" }, { status: 404 });
    }

    // Pick medium resolution photo (index 1 if available, otherwise 0)
    const photoArray = photosData.result.photos[0];
    const targetPhoto = photoArray[Math.min(1, photoArray.length - 1)];
    const fileId = targetPhoto.file_id;

    // 2. Get file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`,
      { next: { revalidate: 3600 } }
    );
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return NextResponse.json({ error: "Could not retrieve file path" }, { status: 404 });
    }

    // 3. Fetch image binary from Telegram file server
    const imgUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    const imgRes = await fetch(imgUrl);

    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to download photo" }, { status: 502 });
    }

    const imageBuffer = await imgRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (err: unknown) {
    console.error("Error in /api/user/photo:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
