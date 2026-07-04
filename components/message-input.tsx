"use client";

import { useState } from "react";

interface MessageInputProps {
  conversationId: string;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    // ensure conversationId still looks like a uuid
    if (!conversationId || !/^[0-9a-fA-F-]{36}$/.test(conversationId)) {
      alert("Invalid conversation identifier, please reload the page.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error sending message:", response.status, data);
        alert(`Error: ${data.error}\n${data.details || ""}`);
        return;
      }

      setMessage("");
      // Message will appear via realtime subscription
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send message. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message... (Shift+Enter for new line)"
        disabled={loading}
        style={{
          flex: 1,
          padding: 10,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "var(--theme-text)",
          fontFamily: "inherit",
          fontSize: 14,
          resize: "none",
          minHeight: 40,
          maxHeight: 100,
        }}
      />
      <button
        onClick={handleSend}
        disabled={loading || !message.trim()}
        className="theme-button"
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          minWidth: 70,
          opacity: loading || !message.trim() ? 0.6 : 1,
          cursor: loading || !message.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
