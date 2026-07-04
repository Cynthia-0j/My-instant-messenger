"use client";

import { useState } from "react";
import Image from "next/image";

type FriendRequest = {
  id: string;
  sender: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
};

interface FriendRequestItemProps {
  request: FriendRequest;
  onUpdate: () => void;
}

export default function FriendRequestItem({ request, onUpdate }: FriendRequestItemProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "accept" | "reject") => {
    setLoading(true);
    try {
      const response = await fetch("/api/friend-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id, action }),
      });
      const data = await response.json();
      if (data.success) {
        onUpdate(); // Refresh the list
      } else {
        alert(data.error || "Failed to update request");
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--theme-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "var(--theme-text)",
          }}
        >
          {request.sender.avatar_url ? (
            <Image
              src={request.sender.avatar_url}
              alt={request.sender.username || "User"}
              width={36}
              height={36}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            (request.sender.username || "U").slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{request.sender.username || "Unnamed"}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Sent you a friend request</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => handleAction("accept")}
          disabled={loading}
          className="theme-button"
          style={{ padding: "6px 12px", fontSize: "0.875rem", background: "var(--theme-primary)" }}
        >
          {loading ? "..." : "Accept"}
        </button>
        <button
          onClick={() => handleAction("reject")}
          disabled={loading}
          style={{
            padding: "6px 12px",
            fontSize: "0.875rem",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--theme-text)",
            borderRadius: "9999px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Reject"}
        </button>
      </div>
    </div>
  );
}