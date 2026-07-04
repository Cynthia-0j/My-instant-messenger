import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

interface ProfileUpdatePayload {
  username?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  age?: number;
  location?: string;
  website?: string;
  bio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ProfileUpdatePayload;

    const updateData = {
      id: user.id,
      username: body.username,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      gender: body.gender,
      birthday: body.birthday,
      age: body.age,
      location: body.location,
      website: body.website,
      bio: body.bio,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(updateData, { onConflict: "id" })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to save profile", details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
