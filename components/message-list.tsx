"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: Profile | null;
};

interface MessageListProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export default function MessageList({
  conversationId,
  initialMessages,
  currentUserId,
}: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);


  useEffect(() => {
    if (!conversationId) return;

    // Clean up previous channel if exists
    if (channelRef.current) {
      const supabase = supabaseBrowser();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // use the shared browser client for realtime
    const supabase = supabaseBrowser();

    const channel = supabase.channel(`public:messages:${conversationId}`);
    channelRef.current = channel;

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        console.log("realtime payload received", payload);
        setMessages((prev) => [...prev, payload.new as Message]);
      }
    );

    channel.subscribe((status: string) => {
      console.log("supabase realtime subscription status", status);
    });

    return () => {
      if (channelRef.current) {
        console.log("removing realtime channel", channelRef.current);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);


  // whenever messages change, try to scroll the container to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div ref={containerRef} style={{ flex: 1, overflow: "auto", marginBottom: 12 }}>
        {messages.length === 0 ? (
          <div style={{ opacity: 0.8 }}>
            No messages yet.
            <br />
            Start the conversation below!
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const senderName = m.sender?.username || "Unknown";

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: 520,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: mine ? "rgba(255,255,255,0.08)" : "var(--theme-surface)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {mine ? "You" : senderName} • {new Date(m.created_at).toLocaleTimeString("en-US", { hour12: false })}
                  </div>
                  <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
