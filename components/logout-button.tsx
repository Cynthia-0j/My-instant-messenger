"use client";
import {useRouter} from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = supabaseBrowser();

    async function logout() {
        await supabase.auth.signOut();

        router.push('/landing');

    }
    return (
        <button onClick={logout} className="theme-button">
            Logout
        </button>
    );
}
