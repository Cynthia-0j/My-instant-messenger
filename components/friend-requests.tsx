"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import FriendRequestItem from "./friend-request-item";

type IncomingRequest = {
  id: string;
  sender: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
};

type OutgoingRequest = {
  id: string;
  receiver: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
};

type FriendRequestData = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
  friends: { id: string; username: string | null; avatar_url: string | null }[];
};

// Shared styles
const panelStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 12,
  overflow: "hidden",
  background: "var(--theme-surface)",
};

const panelTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: 6,
  fontSize: 18,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--theme-text)",
};

export default function FriendRequests() {
  const [data, setData] = useState<FriendRequestData>({ incoming: [], outgoing: [], friends: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomingExpanded, setIncomingExpanded] = useState(true);
  const [outgoingExpanded, setOutgoingExpanded] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchRequests = async () => {
    setError(null);
    try {
      const response = await fetch("/api/friend-requests");
      const responseData = await response.json();
      if (!response.ok) {
        console.error("Failed to fetch requests:", responseData);
        setError(responseData.error || "Unable to load friend requests.");
        setData({ incoming: [], outgoing: [], friends: [] });
      } else {
        setData(responseData);
      }
    } catch (fetchError) {
      console.error("Failed to fetch requests:", fetchError);
      setError("Unable to load friend requests.");
      setData({ incoming: [], outgoing: [], friends: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription for friend requests
    const supabase = supabaseBrowser();
    const channel = supabase.channel("friend-requests");
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
          // Refresh requests when any change occurs
          fetchRequests();
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

  const handleUpdate = () => {
    fetchRequests(); // Refresh after accept/reject
  };

  const totalRequests = data.incoming.length + data.outgoing.length;

  if (totalRequests === 0 && !loading) {
    return null;
  }

  return (
    <section className="theme-card" style={panelStyle}>
      <h2 style={panelTitle}>Friend Requests ({totalRequests})</h2>
      {error && (
        <p style={{ color: "#f87171", opacity: 0.9, marginBottom: 8 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ opacity: 0.7 }}>Loading...</p>
      ) : (
        <div>
          {/* Incoming Requests */}
          {data.incoming.length > 0 && (
            <div style={{ marginBottom: data.outgoing.length > 0 ? 16 : 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  marginBottom: incomingExpanded ? 8 : 0,
                  padding: "4px 0",
                }}
                onClick={() => setIncomingExpanded(!incomingExpanded)}
              >
                <h3 style={sectionTitle}>Incoming ({data.incoming.length})</h3>
                <span style={{ fontSize: "1.1em", opacity: 0.7 }}>
                  {incomingExpanded ? "▼" : "▶"}
                </span>
              </div>

              {incomingExpanded && (
                <div style={{ overflow: "auto", maxHeight: 200 }}>
                  {data.incoming.map((request) => (
                    <FriendRequestItem
                      key={request.id}
                      request={request}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outgoing Requests */}
          {data.outgoing.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  marginBottom: outgoingExpanded ? 8 : 0,
                  padding: "4px 0",
                }}
                onClick={() => setOutgoingExpanded(!outgoingExpanded)}
              >
                <h3 style={sectionTitle}>Outgoing ({data.outgoing.length})</h3>
                <span style={{ fontSize: "1.1em", opacity: 0.7 }}>
                  {outgoingExpanded ? "▼" : "▶"}
                </span>
              </div>

              {outgoingExpanded && (
                <div style={{ overflow: "auto", maxHeight: 150 }}>
                  {data.outgoing.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 4,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "var(--theme-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "var(--theme-text)",
                            fontSize: "0.8em",
                          }}
                        >
                          {request.receiver.avatar_url ? (
                            <Image
                              src={request.receiver.avatar_url}
                              alt={request.receiver.username || "User"}
                              width={28}
                              height={28}
                              style={{
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            (request.receiver.username || "U").slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "0.85em" }}>
                            {request.receiver.username || "Unnamed"}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Pending</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}