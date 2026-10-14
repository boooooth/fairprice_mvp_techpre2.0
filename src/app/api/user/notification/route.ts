import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, telegramId, canReceiveNotifications } = await req.json();

    if (!userId && !telegramId) {
      return NextResponse.json(
        { success: false, error: "userId or telegramId is required" },
        { status: 400 }
      );
    }

    const targetUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        canReceiveNotifications: Boolean(canReceiveNotifications),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Notifications ${updatedUser.canReceiveNotifications ? "allowed" : "disabled"} successfully`,
    });
  } catch (error: unknown) {
    console.error("Error in /api/user/notification:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
