import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { calculateNextRun } from "@/lib/scheduleRunner";

// PATCH /api/admin/schedules/[id] - Toggles active status or edits
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.announcementSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    const newIsActive = typeof body.isActive === "boolean" ? body.isActive : !existing.isActive;

    let nextRunAt = existing.nextRunAt;
    if (newIsActive && (!nextRunAt || new Date(nextRunAt).getTime() <= Date.now())) {
      nextRunAt = calculateNextRun(
        existing.scheduleType,
        existing.targetTime,
        existing.specificDate,
        existing.dayOfWeek,
        new Date()
      );
    }

    const updated = await prisma.announcementSchedule.update({
      where: { id },
      data: {
        isActive: newIsActive,
        nextRunAt,
      },
    });

    return NextResponse.json({
      success: true,
      schedule: updated,
      message: `Schedule ${newIsActive ? "resumed" : "paused"} successfully.`,
    });
  } catch (error: unknown) {
    console.error("Error in PATCH /api/admin/schedules/[id]:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/schedules/[id] - Deletes a schedule
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.announcementSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Clean up uploaded image file if present in public/uploads/
    if (existing.imageUrl && existing.imageUrl.startsWith("/uploads/")) {
      const diskPath = path.join(process.cwd(), "public", existing.imageUrl.slice(1));
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn("Could not delete image file:", e);
        }
      }
    }

    await prisma.announcementSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/admin/schedules/[id]:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
