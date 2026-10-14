import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, username } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const cleanName = (username || "").trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter a username of at least 2 characters" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: cleanName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error in /api/user/save-name:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
