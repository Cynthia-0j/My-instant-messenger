"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import FriendRequests from "./friend-requests";
import FriendsList from "./friends-list";

type Friend = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type FriendRequestData = {
  incoming: { id: string; sender: Friend }[];
  outgoing: { id: string; receiver: Friend }[];
  friends: Friend[];
};

export default function FriendsSection() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friend-requests");
      const data: FriendRequestData = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  useEffect(() => {
    fetchFriends();

    // Set up real-time subscription for friend requests
    const supabase = supabaseBrowser();
    const channel = supabase.channel("friend-requests-friends");
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          console.log("Friend request change:", payload);
          // Refresh friends when any change occurs
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const router = useRouter();

  const handleFriendClick = async (friend: Friend) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: friend.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Error starting conversation:", response.status, data);
        alert(`Error: ${data.error || "Unable to open chat"}`);
        return;
      }

      const cid = String(data.conversation_id);
      router.push(`/?c=${encodeURIComponent(cid)}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      alert("Unable to open chat. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FriendRequests />
      <FriendsList friends={friends} onFriendClick={handleFriendClick} />
    </div>
  );
}