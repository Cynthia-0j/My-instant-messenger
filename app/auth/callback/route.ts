import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * This route runs when Supabase redirects back to your site
 * after an auth flow that returns a "code" (OAuth / magic link).
 *
 * Example redirect:
 * /auth/callback?code=...
 */
export async function GET(request: Request) {
  // request.url is the full URL the user hit (including query params)
  const { searchParams, origin } = new URL(request.url);

  // "code" is a short-lived value Supabase gives us after auth
  const code = searchParams.get("code");

  // If there's no code, we can't exchange it for a session
  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();

  // Create a server client that can write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // This is the key step:
  // exchange the code for a session and store session cookies
  await supabase.auth.exchangeCodeForSession(code);

  // Send the user to the protected area after successful login
  return NextResponse.redirect(`${origin}/`);
}