"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type Friend = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

interface FriendsListProps {
  friends: Friend[];
  // second param allows callers to request a fresh conversation
  // the handler may return the conversation id when created/opened
  onFriendClick?: (
    friend: Friend,
    opts?: { forceNew?: boolean }
  ) => Promise<string | null> | string | null | void;
}

export default function FriendsList({ friends, onFriendClick }: FriendsListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  if (friends.length === 0) {
    return null;
  }

  return (
    <section className="theme-card" style={panelStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          marginBottom: isExpanded ? 6 : 0,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 style={panelTitle}>Friends ({friends.length})</h2>
        <span style={{ fontSize: "1.2em", opacity: 0.7 }}>
          {isExpanded ? "▼" : "▶"}
        </span>
      </div>

      {isExpanded && (
        <div style={{ overflow: "auto", maxHeight: 200 }}>
          {friends.map((friend) => (
            <div
              key={friend.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 8,
                borderRadius: 6,
                marginBottom: 4,
                background: selectedFriendId === friend.id ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.03)",
                border: selectedFriendId === friend.id ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setSelectedFriendId(friend.id);
                // set a search param to let the conversations list filter by friend
                const params = new URLSearchParams(Array.from(searchParams.entries()));
                params.set("f", friend.id);
                // clear selected conversation when changing friend
                params.delete("c");
                router.push(`/?${params.toString()}`);
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--theme-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "var(--theme-text)",
                  fontSize: "0.9em",
                }}
              >
                {friend.avatar_url ? (
                  <Image
                    src={friend.avatar_url}
                    alt={friend.username || "User"}
                    width={32}
                    height={32}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (friend.username || "U").slice(0, 1).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: "0.9em" }}>
                  {friend.username || "Unnamed"}
                </div>
              </div>

              {/* 3-dot menu button */}
              <div style={{ position: "relative" }}>
                <button
                  aria-label={`Options for ${friend.username || "friend"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuFor(openMenuFor === friend.id ? null : friend.id);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--theme-text)",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  ⋯
                </button>

                {openMenuFor === friend.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "110%",
                      background: "var(--theme-surface)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: 8,
                      minWidth: 160,
                      zIndex: 40,
                    }}
                  >
                    <button
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        padding: "8px 6px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuFor(null);
                        // Open the friend's profile page
                        router.push(`/profile?u=${encodeURIComponent(friend.id)}`);
                      }}
                    >
                      View profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
  fontSize: 16,
};