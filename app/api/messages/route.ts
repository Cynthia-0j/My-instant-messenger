import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversation_id, content } = await request.json();

    // simple sanity check – we expect a uuid string
    if (
      !conversation_id ||
      typeof conversation_id !== "string" ||
      !/^[0-9a-fA-F-]{36}$/.test(conversation_id)
    ) {
      console.warn("Invalid conversation_id received:", conversation_id);
      return NextResponse.json(
        { error: "conversation_id and content are required" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Verify user is a member of this conversation
    console.log("Checking membership for user", user.id, "conversation", conversation_id);
    const { data: memberCheck, error: memberError } = await supabase
      .from("conversation_members")
      // conversation_members doesn’t have its own id column – just use
      // conversation_id (or *) so the select succeeds
      .select("conversation_id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id)
      .single();

    console.log("membership query result", { memberCheck, memberError });

    if (memberError || !memberCheck) {
      // include some diagnostic info for development
      return NextResponse.json(
        {
          error: "Not a member of this conversation",
          details: {
            conversation_id,
            memberCheck,
            memberError: memberError?.message || memberError,
          },
        },
        { status: 403 }
      );
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
      })
      .select("id")
      .single();

    if (insertError || !newMessage) {
      console.error("Error sending message:", insertError);
      return NextResponse.json(
        { error: "Failed to send message", details: insertError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message_id: newMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
