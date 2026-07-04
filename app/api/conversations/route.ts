import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Starting POST /api/conversations ===");
    
    const supabase = await supabaseServer();
    console.log("Supabase client created");
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Current user:", user?.id);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);
    
    const { other_user_id } = body;

    if (!other_user_id) {
      return NextResponse.json(
        { error: "other_user_id is required" },
        { status: 400 }
      );
    }

    if (other_user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    // Use the database function to get or create the conversation
    console.log("Getting or creating DM conversation for user:", user.id, "with:", other_user_id);
    const { data, error: createError } = await supabase
      .rpc('get_or_create_dm', { other_user_id });

    // rpc returns whatever the function sends back; make sure we have a string
    const conversationId = data ? String(data) : null;

    if (createError || !conversationId) {
      console.error("Error getting or creating conversation:", createError, "raw data:", data);
      return NextResponse.json(
        { error: "Failed to create conversation", details: createError?.message },
        { status: 500 }
      );
    }

    console.log("Successfully got/created conversation:", conversationId);
    return NextResponse.json(
      { conversation_id: conversationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in conversation route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
