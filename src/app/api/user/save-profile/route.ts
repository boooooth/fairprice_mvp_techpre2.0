import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, age, gender } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid age between 1 and 120" },
        { status: 400 }
      );
    }

    if (!gender || typeof gender !== "string") {
      return NextResponse.json(
        { success: false, error: "Please select a gender" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        age: parsedAge,
        gender: gender.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error in /api/user/save-profile:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
