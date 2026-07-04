"use client"
import {useState, useEffect} from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase/client"

import Link from "next/link";

export default function LoginPage(){
    const router = useRouter();

    const supabase = supabaseBrowser();

    const [mode, setMode] = useState < "login" | "signup" > ("login");

    const [email,setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [msg, setMsg] = useState("");
    const [retrySecondsRemaining, setRetrySecondsRemaining] = useState<number | null>(null);

    function formatTime(seconds: number) {
        if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (secs === 0) return `${mins} minute${mins === 1 ? '' : 's'}`;
        return `${mins} minute${mins === 1 ? '' : 's'} ${secs} second${secs === 1 ? '' : 's'}`;
    }

    useEffect(() => {
        if (retrySecondsRemaining == null || retrySecondsRemaining <= 0) return;
        const id = setInterval(() => {
            setRetrySecondsRemaining((prev) => {
                if (prev == null) return null;
                if (prev <= 1) {
                    clearInterval(id);
                    // Clear countdown and message when time elapsed
                    setMsg('');
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [retrySecondsRemaining]);

    type RetryHeader = {
        get?: (key: string) => string | null;
        [key: string]: unknown;
    };

    function parseRetryAfterSeconds(err: unknown): number | null {
        try {
            const getVal = (obj: unknown): string | null => {
                if (!obj || typeof obj !== 'object') return null;
                const headerObj = obj as RetryHeader;

                if (typeof headerObj.get === 'function') {
                    return headerObj.get('retry-after') ?? headerObj.get('Retry-After') ?? null;
                }

                if (typeof headerObj['retry-after'] === 'string') return headerObj['retry-after'];
                if (typeof headerObj['Retry-After'] === 'string') return headerObj['Retry-After'];
                return null;
            };

            const errObj = err as { headers?: unknown; response?: { headers?: unknown } };
            const candidates = [
                getVal(errObj.headers),
                getVal(errObj.response?.headers),
                getVal(err),
            ];

            for (const val of candidates) {
                if (!val) continue;
                const s = String(val).trim();
                if (/^\d+$/.test(s)) {
                    return parseInt(s, 10);
                }
                const dateMs = Date.parse(s);
                if (!isNaN(dateMs)) {
                    const seconds = Math.ceil((dateMs - Date.now()) / 1000);
                    return seconds > 0 ? seconds : 0;
                }
            }
        } catch {
            // ignore parsing errors
        }
        return null;
    }

    async function handleSubmit() {
        // basic validation
        if (!email || !password){
            setMsg("please enter email and password.");
            return
        }

        if (mode === 'signup') {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                console.error('signUp error:', error, { data });

                // Specific handling for email rate limits
                if (error.status === 429 || /rate limit/i.test(error.message || '')) {
                    const retrySeconds = parseRetryAfterSeconds(error);
                    let retryMsg: string;
                    if (retrySeconds != null && retrySeconds > 0) {
                        if (retrySeconds < 60) {
                            retryMsg = `Too many verification emails sent. Please wait ${retrySeconds} second${retrySeconds === 1 ? '' : 's'} and try again.`;
                        } else {
                            const mins = Math.ceil(retrySeconds / 60);
                            retryMsg = `Too many verification emails sent. Please wait about ${mins} minute${mins === 1 ? '' : 's'} and try again.`;
                        }
                    } else {
                        retryMsg = 'Too many verification emails sent. Please wait a few minutes and try again.';
                    }
                    const devMsg = `Rate limit error (${error.status ?? '429'}): ${error.message}${retrySeconds != null ? ` (retry-after: ${retrySeconds}s)` : ''}`;
                    setMsg(process.env.NODE_ENV === 'development' ? devMsg : retryMsg);
                    const initialSeconds = retrySeconds != null && retrySeconds > 0 ? retrySeconds : 120;
                    setRetrySecondsRemaining(initialSeconds);
                    return;
                }

                const displayMsg = process.env.NODE_ENV === 'development'
                    ? `Sign-up error (${error.status ?? 'unknown'}): ${error.message}`
                    : 'Error creating account. Please try again later.';
                setMsg(displayMsg);
                return;
            }

            setMsg("Account created. Please check your email to confirm");
            router.push("/login");
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('signIn error:', error, { data });
            const displayMsg = process.env.NODE_ENV === 'development'
                ? `Sign-in error (${error.status ?? 'unknown'}): ${error.message}`
                : 'Error signing in. Please check your credentials and try again.';
            setMsg(displayMsg);
            return;
        }

        router.push("/")
    }

    return (
    <main>
    <section>
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
    </section>
    <section className="theme-card" style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
    <h1>{mode === "login"?"Log in":"Sign up"}</h1>
    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
    <input
        type="email"
        value={email}
        placeholder="enter email here"
        onChange={(e) => setEmail(e.target.value)}

    />

    <input
        type="password"
        value={password}
        placeholder="enter password here"
        onChange={(e) => setPassword(e.target.value)}

    />

    <button className="theme-button" onClick={handleSubmit} disabled={retrySecondsRemaining != null && retrySecondsRemaining > 0}>
        {mode==="login"? "log in": "create account"}
    </button>

    <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
        style={{
                background: "transparent",
                border: "none",
                color: "var(--theme-text)",
                textDecoration: "underline",
                cursor: "pointer",
                }}
        >
        {mode == "login"? "Need an account? Sign up"
            : "already have an account? Log in"
        }
    </button>
    {msg && <p>{msg}</p>}
    {retrySecondsRemaining != null && retrySecondsRemaining > 0 && (
        <p>Try again in {formatTime(retrySecondsRemaining)}</p>
    )}
    </div>
    </section>
       
    </main>
)
}
