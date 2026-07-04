import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .neq("id", user.id)
    .limit(20);

  if (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }

  return NextResponse.json({ users: users || [] });
}