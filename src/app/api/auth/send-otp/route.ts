import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in OtpCode table
    await prisma.otpCode.create({
      data: {
        phoneNumber: cleanPhone,
        code,
        expiresAt,
      },
    });

    console.log(`[SMS OTP Generated] Phone: ${cleanPhone}, Code: ${code}`);

    // In a real production environment with Twilio / Infobip, you'd trigger SMS API here:
    // await twilioClient.messages.create({ to: cleanPhone, from: ..., body: `Your code is ${code}` });

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      debugCode: code, // Displayed in UI test pill for instant frictionless testing
    });
  } catch (error: unknown) {
    console.error("Error in /api/auth/send-otp:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
