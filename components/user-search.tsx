"use client";

import { useState } from "react";
import Image from "next/image";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.users || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      const response = await fetch("/api/friend-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: userId }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Friend request sent!");
      } else {
        alert(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Add friend failed:", error);
    }
  };

  return (
    <section className="theme-card" style={panelStyle}>
      <h2 style={panelTitle}>Find Friends</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or email"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--theme-text)",
          }}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="theme-button"
          style={{ padding: "10px 16px" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div style={{ overflow: "auto", maxHeight: 200 }}>
        {results.length === 0 && query && !loading && (
          <p style={{ opacity: 0.7 }}>No users found.</p>
        )}
        {results.map((user) => (
          <div
            key={user.id}
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
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username || "User"}
                    width={36}
                    height={36}
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
                <div style={{ fontWeight: 600 }}>{user.username || "Unnamed"}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{user.id.slice(0, 8)}…</div>
              </div>
            </div>
            <button
              onClick={() => handleAddFriend(user.id)}
              className="theme-button"
              style={{ padding: "6px 12px", fontSize: "0.875rem" }}
            >
              Add Friend
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// Shared styles (from page.tsx)
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