"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserListItemProps {
  user: User;
  listRow: React.CSSProperties;
  avatarStyle: React.CSSProperties;
}

export default function UserListItem({
  user,
  listRow,
  avatarStyle,
}: UserListItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          other_user_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Error starting conversation:",
          response.status,
          JSON.stringify(data, null, 2)
        );
        alert(`Error: ${data.error}\n${data.details || ""}`);
        return;
      }

      // make sure we always push a plain string; encode to avoid weird characters
      const cid = String(data.conversation_id);
      router.push(`/?c=${encodeURIComponent(cid)}`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        ...listRow,
        cursor: loading ? "wait" : "pointer",
        background: loading ? "rgba(255,255,255,0.08)" : "transparent",
        border: "none",
        padding: "10px",
        borderRadius: "12px",
        width: "100%",
        textAlign: "left",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div style={avatarStyle}>
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username || "User"}
            width={40}
            height={40}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          (user.username || "U").slice(0, 1).toUpperCase()
        )}
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>
          {user.username || "Unnamed user"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {user.id.slice(0, 8)}…
        </div>
      </div>
    </button>
)
};