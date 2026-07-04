import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch incoming requests (where user is receiver)
  const { data: incomingRequests, error: incomingError } = await supabase
    .from("friend_requests")
    .select("id, sender_id, status")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (incomingError) {
    console.error("Fetch incoming requests error:", incomingError);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }

  // Fetch outgoing requests (where user is sender)
  const { data: outgoingRequests, error: outgoingError } = await supabase
    .from("friend_requests")
    .select("id, receiver_id, status")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  if (outgoingError) {
    console.error("Fetch outgoing requests error:", outgoingError);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }

  // Fetch accepted friends
  const { data: acceptedRequests, error: acceptedError } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status")
    .or(`and(sender_id.eq.${user.id},status.eq.accepted),and(receiver_id.eq.${user.id},status.eq.accepted)`);

  if (acceptedError) {
    console.error("Fetch accepted requests error:", acceptedError);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }

  // Collect all user IDs we need profiles for
  const userIds = new Set<string>();
  (incomingRequests || []).forEach((req) => userIds.add(req.sender_id));
  (outgoingRequests || []).forEach((req) => userIds.add(req.receiver_id));
  (acceptedRequests || []).forEach((req) => {
    userIds.add(req.sender_id);
    userIds.add(req.receiver_id);
  });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", Array.from(userIds));

  if (profileError) {
    console.error("Fetch profiles error:", profileError);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const profileMap = new Map<string, { id: string; username: string | null; avatar_url: string | null }>();
  (profiles || []).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  // Format incoming requests
  const formattedIncoming = (incomingRequests || []).map((request) => ({
    id: request.id,
    sender: profileMap.get(request.sender_id) || {
      id: request.sender_id,
      username: "Unknown",
      avatar_url: null,
    },
  }));

  // Format outgoing requests
  const formattedOutgoing = (outgoingRequests || []).map((request) => ({
    id: request.id,
    receiver: profileMap.get(request.receiver_id) || {
      id: request.receiver_id,
      username: "Unknown",
      avatar_url: null,
    },
  }));

  // Format friends list
  const friends = (acceptedRequests || []).map((request) => {
    const friendId = request.sender_id === user.id ? request.receiver_id : request.sender_id;
    return profileMap.get(friendId) || {
      id: friendId,
      username: "Unknown",
      avatar_url: null,
    };
  });

  return NextResponse.json({
    incoming: formattedIncoming,
    outgoing: formattedOutgoing,
    friends: friends,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiver_id } = await request.json();

  if (!receiver_id || receiver_id === user.id) {
    return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from("friend_requests")
    .select("id")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Friend request already exists" }, { status: 400 });
  }

  const { error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: user.id,
      receiver_id,
      status: "pending",
    });

  if (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { request_id, action } = await request.json(); // action: 'accept' or 'reject'

  if (!request_id || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = action === "accept" ? "accepted" : "rejected";

  const { error } = await supabase
    .from("friend_requests")
    .update({ status })
    .eq("id", request_id)
    .eq("receiver_id", user.id); // Only receiver can accept/reject

  if (error) {
    console.error("Update friend request error:", error);
    return NextResponse.json({ error: "Failed to update friend request" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}