import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startTelegramPoller } from "@/lib/telegramPoller";

export async function GET() {
  try {
    // Start background /start auto-responder poller if not already active
    startTelegramPoller();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const totalUsers = users.length;
    const telegramUsers = users.filter((u) => u.authProvider === "telegram").length;
    const webUsers = users.filter((u) => u.authProvider === "web").length;
    const notificationAllowed = users.filter((u) => u.canReceiveNotifications).length;
    const admins = users.filter((u) => u.role === "admin").length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        telegramUsers,
        webUsers,
        notificationAllowed,
        admins,
      },
      users,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/admin/users:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "userId and role are required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error in PATCH /api/admin/users:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/admin/users:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
