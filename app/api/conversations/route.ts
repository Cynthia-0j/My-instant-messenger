import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

    const forceNew = Boolean(body.force_new);

    if (forceNew) {
      console.log("Force-creating a new conversation for user:", user.id, "with:", other_user_id);

      // Use the admin client to bypass RLS for creation
      try {
        const admin = supabaseAdmin();

        // Create a new conversations row
        const { data: convData, error: convError } = await admin
          .from("conversations")
          .insert({ is_group: false, title: null })
          .select("id")
          .single();

        if (convError || !convData?.id) {
          console.error("Failed to create conversation row (admin):", convError, convData);
          return NextResponse.json(
            { error: "Failed to create conversation", details: JSON.stringify(convError || convData) },
            { status: 500 }
          );
        }

        const newConvId = String((convData as any).id);

        // Insert members for both users
        const { data: membersData, error: membersError } = await admin
          .from("conversation_members")
          .insert([
            { conversation_id: newConvId, user_id: user.id },
            { conversation_id: newConvId, user_id: other_user_id },
          ]);

        if (membersError) {
          console.error("Failed to insert conversation members (admin):", membersError, membersData);
          return NextResponse.json(
            { error: "Failed to add members", details: JSON.stringify(membersError) },
            { status: 500 }
          );
        }

        return NextResponse.json({ conversation_id: newConvId }, { status: 201 });
      } catch (err) {
        console.error("Admin client error while creating conversation:", err);
        return NextResponse.json({ error: "Admin client error", details: String(err) }, { status: 500 });
      }
    }

    // Use the database function to get or create the conversation (default behavior)
    console.log("Getting or creating DM conversation for user:", user.id, "with:", other_user_id);
    const { data, error: createError } = await supabase.rpc("get_or_create_dm", { other_user_id });

    // rpc returns whatever the function sends back; make sure we have a string
    const conversationId = data ? String(data) : null;

    if (createError || !conversationId) {
      console.error("Error getting or creating conversation:", createError, "raw data:", data);
      return NextResponse.json(
        { error: "Failed to create conversation", details: JSON.stringify(createError || data) },
        { status: 500 }
      );
    }

    console.log("Successfully got/created conversation:", conversationId);
    return NextResponse.json({ conversation_id: conversationId }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in conversation route:", error);
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : String(error);
    return NextResponse.json(
      { error: "Internal server error", details },
      { status: 500 }
    );
  }
}
