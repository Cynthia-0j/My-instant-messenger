
import LogoutButton from "@/components/logout-button";
import MessageInput from "@/components/message-input";
import MessageList from "@/components/message-list";
import UserSearch from "@/components/user-search";
import FriendsSection from "@/components/friends-section";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import Menu from "@/components/menu-list";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type Conversation = {
  id: string;
  is_group: boolean;
  title: string | null;
  created_at: string;
};

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: Profile | null; // nested select alias
};

export default async function HomePage({
    searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const params = await searchParams;
  
  const supabase = await supabaseServer()
  const {
    data: {user},
  } = await supabase.auth.getUser()
  
  if (!user){
    redirect("/landing")
  }

  // 2) Load "my profile" from profiles table
  const { data: meProfile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", user.id)
    .single<Profile>();

  type MembershipRow = {
    conversation_id: string;
    conversations: Conversation | null;
  };

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      conversations (
        id,
        is_group,
        title,
        created_at
      )
    `)
    .eq("user_id", user.id);

  const convRows = (memberships || []) as unknown as MembershipRow[];
  const conversations: Conversation[] =
    convRows.map((m) => m.conversations!).filter(Boolean);
    
   // 5) Choose an "active conversation"
  // - If URL has ?c=..., use that
  // - else use the first conversation
  const activeConversationId =
    params.c ? decodeURIComponent(params.c) : conversations[0]?.id || null;

  // 6) Load messages for the active conversation (if any)
  let messages: Message[] = [];
  let activeMembers: Profile[] = [];

  if (activeConversationId) {
    // Messages + sender profile (nested join via FK messages.sender_id -> profiles.id)
    // Messages + sender profile
    const { data: msgData } = await supabase
      .from("messages")
      .select("id, content, created_at, sender_id, sender:profiles(id,username,avatar_url)")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    messages = ((msgData || []) as unknown) as Message[];

    // Members in this conversation (so we can show header / participants)
    type MemberRow = { user: Profile };
    const { data: memberData } = await supabase
      .from("conversation_members")
      .select("user:profiles(id,username,avatar_url)")
      .eq("conversation_id", activeConversationId);

    activeMembers =
      (((memberData || []) as unknown) as MemberRow[])
        .map((row) => row.user)
        .filter((u): u is Profile => Boolean(u));
  }

  // ---------- UI ----------
  return (
    <main style={{ padding: 16 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Messaging App</h1>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            Signed in as:{" "}
            <strong>{meProfile?.username || user.email}</strong>
   {/*         <LogoutButton />*/}

          </div>
        </div>
        {/*for the profile button */}
                
        {/*<Link href="/profile" >
          <button type="button" className="theme-button">My Profile</button>
        </Link>
    
        <Link href="/login" style={{ textDecoration: "underline" }}>
          Go to login
        </Link>*/}

        <Menu /> {/* Add the Menu component here */}  
        </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 320px 1fr",
          gap: 12,
          height: "75vh",
        }}
      >
        {/* LEFT: USER SEARCH */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <UserSearch />
          <FriendsSection />
        </div>

        {/* MIDDLE: CONVERSATIONS */}
        <section className="theme-card" style={panelStyle}>
          <h2 style={panelTitle}>Conversations</h2>
          <p style={panelHint}>
            Click a conversation to load messages
          </p>

          <div style={{ overflow: "auto" }}>
            {conversations.length === 0 && (
              <div style={{ opacity: 0.8 }}>
                No conversations yet.
                <br />
                Next step: create one when you click a user.
              </div>
            )}

            {conversations.map((c) => {
              const isActive = c.id === activeConversationId;

              return (
                <Link
                  key={c.id}
                  href={`/?c=${c.id}`}
                  style={{
                    ...listRow,
                    textDecoration: "none",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  }}
                >
                  <div style={avatarStyle}>
                    {(c.title || "C").slice(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {c.title || (c.is_group ? "Group chat" : "Direct message")}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* RIGHT: MESSAGES */}
        <section className="theme-card" style={{ ...panelStyle, display: "flex", flexDirection: "column" }}>
          <h2 style={panelTitle}>Messages</h2>

          {!activeConversationId ? (
            <div style={{ opacity: 0.8, flex: 1 }}>
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.85 }}>
                Participants:{" "}
                {activeMembers.length
                  ? activeMembers
                      .map((m) => m.username || "Unnamed")
                      .join(", ")
                  : "Loading..."}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <MessageList
                  key={activeConversationId} // remount when conversation changes
                  conversationId={activeConversationId}
                  initialMessages={messages}
                  currentUserId={user.id}
                />

                <MessageInput conversationId={activeConversationId} />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// ---------- Small shared styles ----------
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

const panelHint: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 12,
  opacity: 0.75,
};

const listRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  padding: 10,
  borderRadius: 12,
};

const avatarStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  opacity: 0.9,
};

