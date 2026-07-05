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

    const { recipient_id, content } = await request.json();

    if (!recipient_id || typeof recipient_id !== "string") {
      return NextResponse.json({ error: "recipient_id is required" }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Use the existing DM helper to find or create the one-on-one conversation.
    const { data: conversationId, error: convoError } = await supabase.rpc("get_or_create_dm", {
      other_user_id: recipient_id,
    });

    if (convoError || !conversationId) {
      console.error("Error locating or creating conversation:", convoError);
      return NextResponse.json(
        { error: "Failed to locate or create conversation", details: JSON.stringify(convoError) },
        { status: 500 }
      );
    }

    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select("id")
      .single();

    if (insertError || !newMessage) {
      console.error("Error sending message:", insertError);
      return NextResponse.json(
        { error: "Failed to send message", details: JSON.stringify(insertError) },
        { status: 500 }
      );
    }

    return NextResponse.json({ message_id: newMessage.id }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
