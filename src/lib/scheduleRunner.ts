import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";

/**
 * Calculates the next DateTime when a schedule should trigger
 */
export function calculateNextRun(
  scheduleType: string,
  targetTime: string,
  specificDate?: string | null,
  dayOfWeek?: number | null,
  fromDate: Date = new Date()
): Date | null {
  const [hoursStr, minutesStr] = targetTime.split(":");
  const hours = parseInt(hoursStr || "0", 10);
  const minutes = parseInt(minutesStr || "0", 10);

  if (scheduleType === "once") {
    if (!specificDate) return null;
    const [yearStr, monthStr, dateStr] = specificDate.split("-");
    const target = new Date(
      parseInt(yearStr, 10),
      parseInt(monthStr, 10) - 1,
      parseInt(dateStr, 10),
      hours,
      minutes,
      0,
      0
    );
    return target;
  }

  if (scheduleType === "daily") {
    const candidate = new Date(fromDate);
    candidate.setHours(hours, minutes, 0, 0);

    // If candidate time today has already passed, schedule for tomorrow
    if (candidate.getTime() <= fromDate.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  if (scheduleType === "weekly") {
    if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6) {
      return null;
    }

    const candidate = new Date(fromDate);
    candidate.setHours(hours, minutes, 0, 0);

    const currentDay = fromDate.getDay();
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;

    // If it's today but the time has already passed, push to next week
    if (daysUntil === 0 && candidate.getTime() <= fromDate.getTime()) {
      daysUntil = 7;
    }

    candidate.setDate(candidate.getDate() + daysUntil);
    return candidate;
  }

  return null;
}

/**
 * Executes an announcement schedule immediately to all Telegram users
 */
export async function dispatchScheduleNow(scheduleId: string): Promise<{
  success: boolean;
  count: number;
  totalEligible: number;
  errors?: string[];
  message: string;
}> {
  const schedule = await prisma.announcementSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    return {
      success: false,
      count: 0,
      totalEligible: 0,
      message: "Schedule not found",
    };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const cleanMessage = schedule.message.trim();

  // Find all Telegram recipients
  const recipients = await prisma.user.findMany({
    where: { telegramId: { not: null } },
  });

  if (recipients.length === 0) {
    return {
      success: false,
      count: 0,
      totalEligible: 0,
      message: "No Telegram users found to receive announcement",
    };
  }

  // Load image buffer if image is attached
  let imageBuffer: Buffer | null = null;
  const imageName = schedule.imageName || "announcement.jpg";

  if (schedule.imageUrl) {
    try {
      if (schedule.imageUrl.startsWith("data:")) {
        // Base64 data URL
        const base64Data = schedule.imageUrl.split(",")[1];
        if (base64Data) {
          imageBuffer = Buffer.from(base64Data, "base64");
        }
      } else if (schedule.imageUrl.startsWith("/")) {
        // Local public folder path
        const diskPath = path.join(process.cwd(), "public", schedule.imageUrl.slice(1));
        if (fs.existsSync(diskPath)) {
          imageBuffer = fs.readFileSync(diskPath);
        }
      } else if (schedule.imageUrl.startsWith("http://") || schedule.imageUrl.startsWith("https://")) {
        // Remote URL
        const res = await fetch(schedule.imageUrl);
        if (res.ok) {
          imageBuffer = Buffer.from(await res.arrayBuffer());
        }
      }
    } catch (err) {
      console.error("Error reading schedule image:", err);
    }
  }

  let sentCount = 0;
  const errors: string[] = [];

  if (botToken) {
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
  } else {
    // Simulated send if botToken is missing
    sentCount = recipients.length;
    console.log(`[SIMULATED SCHEDULE DISPATCH] Schedule "${schedule.title || schedule.id}" to ${recipients.length} users.`);
  }

  const now = new Date();
  let nextRun: Date | null = null;

  if (schedule.scheduleType === "once") {
    // One-time announcement has completed; deactivate
    await prisma.announcementSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: now,
        isActive: false,
      },
    });
  } else {
    // Compute next occurrence
    nextRun = calculateNextRun(
      schedule.scheduleType,
      schedule.targetTime,
      schedule.specificDate,
      schedule.dayOfWeek,
      now
    );

    await prisma.announcementSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: now,
        nextRunAt: nextRun,
      },
    });
  }

  return {
    success: true,
    count: sentCount,
    totalEligible: recipients.length,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    message: `Dispatched to ${sentCount}/${recipients.length} Telegram users. Next run: ${nextRun ? nextRun.toLocaleString() : "Completed"}`,
  };
}

/**
 * Checks all active schedules and executes any that are due
 */
export async function checkAndDispatchDueSchedules() {
  const now = new Date();

  // Find active schedules that are due
  const dueSchedules = await prisma.announcementSchedule.findMany({
    where: {
      isActive: true,
      nextRunAt: {
        not: null,
        lte: now,
      },
    },
  });

  const results = [];
  for (const schedule of dueSchedules) {
    try {
      const result = await dispatchScheduleNow(schedule.id);
      results.push({ scheduleId: schedule.id, title: schedule.title, ...result });
    } catch (err) {
      console.error(`Error executing due schedule ${schedule.id}:`, err);
    }
  }

  return results;
}
