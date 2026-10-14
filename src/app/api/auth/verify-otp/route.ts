import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    const cleanCode = code.trim();

    // Verify OTP in database
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber: cleanPhone,
        code: cleanCode,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    const isNew = !user || !user.age || !user.gender;

    if (!user) {
      // If this is the first user or no admin exists, assign admin role
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      const initialRole = adminCount === 0 ? "admin" : "user";

      // Create partial user record
      user = await prisma.user.create({
        data: {
          phoneNumber: cleanPhone,
          authProvider: "web",
          role: initialRole,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      isNew,
      user,
    });
  } catch (error: unknown) {
    console.error("Error in /api/auth/verify-otp:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
