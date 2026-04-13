import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { sql } from "@/lib/db/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const result = await sql`
    SELECT u.name, up.balance, up.is_sound_enabled, up.is_timer_enabled, up.avatar_url, up.tier
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = ${userId}
  `;

  return NextResponse.json(result.rows[0]);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { name, avatar_url, is_sound_enabled, is_timer_enabled } = await req.json();

  if (name) {
    await sql`UPDATE users SET name = ${name} WHERE id = ${userId}`;
  }

  await sql`
    UPDATE user_profiles 
    SET 
      avatar_url = COALESCE(${avatar_url}, avatar_url),
      is_sound_enabled = COALESCE(${is_sound_enabled}, is_sound_enabled),
      is_timer_enabled = COALESCE(${is_timer_enabled}, is_timer_enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}
