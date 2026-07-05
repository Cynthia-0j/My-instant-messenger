
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
  searchParams: Promise<{ c?: string; f?: string }>;
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

  // 5) We now store messages in the existing messages table by conversation_id.
  // If URL has ?f=<friendId>, load the one-on-one DM and its history.
  const selectedFriendId = params.f ? decodeURIComponent(params.f) : null;

  let messages: Message[] = [];
  let activeMembers: Profile[] = [];
  let conversationId: string | null = null;

  if (selectedFriendId) {
    const { data: conversationData, error: conversationError } = await supabase.rpc("get_or_create_dm", {
      other_user_id: selectedFriendId,
    });

    if (conversationError) {
      console.error("Error finding or creating DM conversation:", conversationError);
    } else {
      conversationId = conversationData as string;
    }

    if (conversationId) {
      const { data: msgData } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, sender:profiles(id,username,avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);

      messages = ((msgData || []) as unknown) as Message[];
    }

    const { data: friendProfile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", selectedFriendId)
      .single<Profile>();

    activeMembers = [meProfile].concat(friendProfile ? [friendProfile] : []);
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
          gridTemplateColumns: "280px 1fr",
          gap: 12,
          height: "75vh",
        }}
      >
        {/* LEFT: USER SEARCH */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <UserSearch />
          <FriendsSection />
        </div>

        {/* conversations column removed - using friend-based messages instead */}

        {/* RIGHT: MESSAGES */}
        <section className="theme-card" style={{ ...panelStyle, display: "flex", flexDirection: "column" }}>
          <h2 style={panelTitle}>Messages</h2>

          {!selectedFriendId ? (
            <div style={{ opacity: 0.8, flex: 1 }}>
              Select a friend to view messages.
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
                  key={conversationId || selectedFriendId} // remount when selected friend or conversation changes
                  conversationId={conversationId}
                  initialMessages={messages}
                  currentUserId={user.id}
                />

                <MessageInput friendId={selectedFriendId!} />
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

