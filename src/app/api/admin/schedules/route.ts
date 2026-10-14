import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { calculateNextRun, checkAndDispatchDueSchedules } from "@/lib/scheduleRunner";
import { startTelegramPoller } from "@/lib/telegramPoller";

// GET /api/admin/schedules - Lists all schedules and runs due ones
export async function GET() {
  try {
    startTelegramPoller();
    // Check and trigger any schedules that are due
    await checkAndDispatchDueSchedules();

    const schedules = await prisma.announcementSchedule.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: unknown) {
    console.error("Error in GET /api/admin/schedules:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/schedules - Creates a new announcement schedule
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title: string | undefined;
    let message = "";
    let scheduleType = "daily";
    let targetTime = "09:00";
    let specificDate: string | undefined;
    let dayOfWeek: number | undefined;
    let imageUrl: string | undefined;
    let imageName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string) || undefined;
      message = (formData.get("message") as string) || "";
      scheduleType = (formData.get("scheduleType") as string) || "daily";
      targetTime = (formData.get("targetTime") as string) || "09:00";
      specificDate = (formData.get("specificDate") as string) || undefined;
      const dayOfWeekVal = formData.get("dayOfWeek");
      dayOfWeek = dayOfWeekVal !== null ? parseInt(dayOfWeekVal as string, 10) : undefined;

      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        imageUrl = `/uploads/${safeName}`;
        imageName = file.name;
      }
    } else {
      const json = await req.json();
      title = json.title;
      message = json.message || "";
      scheduleType = json.scheduleType || "daily";
      targetTime = json.targetTime || "09:00";
      specificDate = json.specificDate;
      dayOfWeek = json.dayOfWeek !== undefined ? Number(json.dayOfWeek) : undefined;
      imageUrl = json.imageUrl;
      imageName = json.imageName;
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Announcement message cannot be empty" },
        { status: 400 }
      );
    }

    if (scheduleType === "once" && !specificDate) {
      return NextResponse.json(
        { success: false, error: "Specific date is required for one-time announcements" },
        { status: 400 }
      );
    }

    if (scheduleType === "weekly" && (dayOfWeek === undefined || isNaN(dayOfWeek))) {
      return NextResponse.json(
        { success: false, error: "Day of the week is required for weekly announcements" },
        { status: 400 }
      );
    }

    // Calculate initial nextRunAt
    const nextRunAt = calculateNextRun(
      scheduleType,
      targetTime,
      specificDate,
      dayOfWeek,
      new Date()
    );

    const schedule = await prisma.announcementSchedule.create({
      data: {
        title: title?.trim() || null,
        message: message.trim(),
        imageUrl: imageUrl || null,
        imageName: imageName || null,
        scheduleType,
        targetTime,
        specificDate: specificDate || null,
        dayOfWeek: dayOfWeek !== undefined && !isNaN(dayOfWeek) ? dayOfWeek : null,
        isActive: true,
        nextRunAt,
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: `Announcement scheduled successfully! Next run: ${nextRunAt ? nextRunAt.toLocaleString() : "Pending"}`,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/admin/schedules:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
