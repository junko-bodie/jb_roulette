import { initDatabase } from "@/lib/db/setup";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: "Database tables created successfully!" });
  } catch (error: any) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize database" },
      { status: 500 }
    );
  }
}
