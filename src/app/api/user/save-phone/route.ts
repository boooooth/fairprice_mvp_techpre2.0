import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid phone number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim();

    // Check if another user already has this phone number
    const existing = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (existing && existing.id !== userId) {
      // If an existing placeholder user had this phone, merge or reassign
      await prisma.user.update({
        where: { id: existing.id },
        data: { phoneNumber: null },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: cleanPhone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Phone number linked successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error in /api/user/save-phone:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
