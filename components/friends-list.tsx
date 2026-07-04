"use client";

import { useState } from "react";
import Image from "next/image";

type Friend = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

interface FriendsListProps {
  friends: Friend[];
  onFriendClick?: (friend: Friend) => void;
}

export default function FriendsList({ friends, onFriendClick }: FriendsListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

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
                cursor: onFriendClick ? "pointer" : "default",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setSelectedFriendId(friend.id);
                onFriendClick?.(friend);
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