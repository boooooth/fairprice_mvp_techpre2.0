import { NextResponse } from "next/server";
import { dispatchScheduleNow } from "@/lib/scheduleRunner";

// POST /api/admin/schedules/[id]/run - Immediately triggers a schedule
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await dispatchScheduleNow(id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in POST /api/admin/schedules/[id]/run:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
