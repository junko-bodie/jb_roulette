import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { amount, action } = await req.json(); // action: 'increment' or 'decrement' or 'set'

  if (action === 'increment') {
    await sql`UPDATE user_profiles SET balance = balance + ${amount} WHERE user_id = ${userId}`;
  } else if (action === 'decrement') {
    await sql`UPDATE user_profiles SET balance = balance - ${amount} WHERE user_id = ${userId}`;
  } else if (action === 'set') {
    await sql`UPDATE user_profiles SET balance = ${amount} WHERE user_id = ${userId}`;
  }

  const result = await sql`SELECT balance FROM user_profiles WHERE user_id = ${userId}`;
  return NextResponse.json({ success: true, balance: result.rows[0].balance });
}
