"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "var(--theme-background)", color: "var(--theme-text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Bar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "var(--theme-surface)",
        }}
      >
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--theme-primary)" }}>
          Chat App
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/landing" style={{ textDecoration: "none" }}>
            <button
              className="theme-button"
              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
            >
              Home
            </button>
          </Link>

          <button
            onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--theme-text)",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            About
          </button>

          <Link href="/login" style={{ textDecoration: "none" }}>
            <button
              className="theme-button"
              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
            >
              Login
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 2rem",
          background: `linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)`,
        }}
      >
        <h1 style={{ fontSize: "3.5rem", fontWeight: "bold", marginBottom: "1rem", color: "var(--theme-primary)" }}>
          Welcome to Chat App
        </h1>

        <p style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "rgba(248,250,252,0.85)", maxWidth: "600px" }}>
          Connect with friends and family in real-time. Customizable themes, seamless messaging, and a beautiful interface.
        </p>

        <Link href="/login" style={{ textDecoration: "none" }}>
          <button
            className="theme-button"
            style={{
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </Link>
      </section>

      {/* About Section */}
      <section
        id="about"
        style={{
          padding: "4rem 2rem",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem", textAlign: "center", color: "var(--theme-primary)" }}>
            About This Platform
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
            {/* Feature 1 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
                Real-Time Messaging
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Send and receive messages instantly with real-time synchronization across all your devices.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
                Customizable Themes
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Choose your own color theme to personalize your experience. Your theme preference is saved automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
               Easy Profile Management
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Upload a profile picture, set your username, and share contact details with your friends.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
                Group Conversations
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Create group chats and chat with multiple people at once. Organize conversations effortlessly.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
                Secure & Private
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Your messages and data are secured with industry-standard authentication and encryption.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className="theme-card"
              style={{
                padding: "2rem",
                borderRadius: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "var(--theme-primary)" }}>
                User Directory
              </h3>
              <p style={{ color: "rgba(248,250,252,0.75)", lineHeight: "1.6" }}>
                Browse a directory of users and easily start direct messages with friends and colleagues.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "rgba(248,250,252,0.85)" }}>
              Ready to start connecting?
            </p>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button
                className="theme-button"
                style={{
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                Sign Up or Login
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          textAlign: "center",
          backgroundColor: "var(--theme-surface)",
          fontSize: "0.9rem",
          color: "rgba(248,250,252,0.6)",
        }}
      >
        <p>© 2026 Chat App. All rights reserved. Personalize your experience with custom themes.</p>
      </footer>
    </main>
  );
}
