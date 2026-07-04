"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "../../lib/supabase/client";
import { getCookie, setCookie } from "../../lib/cookies";


interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  age: number | null;
  location: string | null;
  theme_color?: string | null;
  theme_text_color?: string | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const bigint = parseInt(full, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;

const adjustColor = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    clamp(r + amount, 0, 255),
    clamp(g + amount, 0, 255),
    clamp(b + amount, 0, 255)
  );
};

const generateThemeFromColor = (color: string) => ({
  primary: color,
  secondary: adjustColor(color, 22),
  surface: adjustColor(color, -18),
  background: adjustColor(color, -32),
  text: '#f8fafc',
});

export default function MyProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newContact, setNewContact] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [themeColor, setThemeColor] = useState(() => {
    if (typeof window === 'undefined') return '#4f46e5';
    return getCookie('theme_color') || '#4f46e5';
  });
  const [themeTextColor, setThemeTextColor] = useState(() => {
    if (typeof window === 'undefined') return '#f8fafc';
    return getCookie('theme_text_color') || '#f8fafc';
  });
  const themePreview = { ...generateThemeFromColor(themeColor), text: themeTextColor };
  useEffect(() => {
    async function fetchUserAndProfile() {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabaseBrowser()
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
        setNewUsername(profile?.username || "");
        setNewContact(profile?.email || "");
        setNewAge(profile?.age?.toString() || "");
        setNewLocation(profile?.location || "");
        if (profile?.theme_color) {
          setThemeColor(profile.theme_color);
        }
        if (profile?.theme_text_color) {
          setThemeTextColor(profile.theme_text_color);
        }
      }
      setLoading(false);
    }

    fetchUserAndProfile();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCookie('theme_color', themeColor);
    setCookie('theme_text_color', themeTextColor);
  }, [themeColor, themeTextColor]);

  useEffect(() => {
    const theme = generateThemeFromColor(themeColor);
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-text', themeTextColor);
  }, [themeColor, themeTextColor]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabaseBrowser()
      .from('profiles')
      .update({ username: newUsername.trim(), email: newContact.trim(), age: newAge ? parseInt(newAge) : null })
      .eq('id', user.id);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setProfile({ ...profile!, username: newUsername.trim() });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setNewUsername(profile?.username || "");
    setEditing(false);
  };

  const handleEditContact = () => {
    setEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!user) return;

    setSaving(true);
    const ageValue = newAge ? parseInt(newAge, 10) : null;
    const updatePayload = {
      email: newContact.trim() || null,
      age: ageValue,
      location: newLocation.trim() || null,
    };

    const { error } = await supabaseBrowser()
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (error) {
      alert('Error updating contact details: ' + error.message);
    } else {
      setProfile({
        ...profile!,
        email: newContact.trim() || null,
        age: ageValue,
        location: newLocation.trim() || null,
      });
      setEditingContact(false);
    }
    setSaving(false);
  };

  const handleCancelContact = () => {
    setNewContact(profile?.email || "");
    setNewAge(profile?.age?.toString() || "");
    setNewLocation(profile?.location || "");
    setEditingContact(false);
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatar/${fileName}`;

    const { error: uploadError } = await supabaseBrowser().storage
      .from('avatar')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabaseBrowser().storage
      .from('avatar')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabaseBrowser()
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      alert('Error updating profile: ' + updateError.message);
    } else {
      setProfile({ ...profile!, avatar_url: data.publicUrl });
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <main>
        <div
          className="min-h-screen px-6 py-10 flex items-center justify-center"
          style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
        >
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <div
          className="min-h-screen px-6 py-10 flex items-center justify-center"
          style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
        >
          <p>Please log in to view your profile.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
    <div
      className="min-h-screen px-6 py-10"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className= "lg:col-span-1">
        <div className="theme-card overflow-hidden shadow-2xl">
            <div className="h-28" style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))" }}/>
            <div className="px-6 pb-6 -mt-14">
                <div className="flex flex-col items-center text-center">
                <div className="relative h-28 w-28 rounded-full border-4 border-white/10 overflow-hidden shadow-lg" style={{ background: "var(--theme-surface)" }}>
                    <Image
                      src={profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"}
                      alt="Profile"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                </div>
                  {editing ? (
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="mt-4 px-2 py-1 rounded w-full"
                      placeholder="Enter username"
                    />
                  ) : (
                    <h1>{profile?.username || "No username"}</h1>
                  )}
                <p> 2011/12/02 </p>
                <p> I love Anime and cosplay and having fun with my friends </p>

                  <div className="mt-5 flex gap-3">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="theme-button"
                          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="theme-button"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--theme-text)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleEdit}
                          className="theme-button"
                          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                        >
                          Edit profile
                        </button>
                        <button
                          type="button"
                          onClick={handleChangePhoto}
                          disabled={uploading}
                          className="theme-button"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--theme-text)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                          }}
                        >
                          {uploading ? "Uploading..." : "Change photo"}
                        </button>
                      </>
                    )}
                  </div>


        </div>
        </div>
        </div>
        </div>
      
                  <div className="theme-card mt-8 shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Contact Details</h2>
                      {!editingContact && (
                        <button
                          type="button"
                          onClick={handleEditContact}
                          className="theme-button"
                          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Email</label>
                        {editingContact ? (
                          <input
                            type="email"
                            value={newContact}
                            onChange={(e) => setNewContact(e.target.value)}
                            className="w-full px-3 py-2 rounded focus:outline-none"
                            placeholder="Enter email"
                          />
                          
                        ) : (
                          <p style={{ color: 'var(--theme-text)' }}>{profile?.email || "Not provided"}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Age</label>
                        {editingContact ? (
                          <input
                            type="number"
                            value={newAge}
                            onChange={(e) => setNewAge(e.target.value)}
                            className="w-full px-3 py-2 rounded focus:outline-none"
                            placeholder="Enter age"
                          />
                        ) : (
                          <p style={{ color: 'var(--theme-text)' }}>{profile?.age || "Not provided"}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Location</label>
                        {editingContact ? (
                          <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            className="w-full px-3 py-2 rounded focus:outline-none"
                            placeholder="Enter location"
                          />
                        ) : (
                          <p style={{ color: 'var(--theme-text)' }}>{profile?.location || "Not provided"}</p>
                        )}
                      </div>
                    </div>

                    <div className="theme-card mt-8 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Website Theme</h3>
                          <p className="text-sm" style={{ color: 'rgba(248,250,252,0.75)' }}>Pick colors for your page and text.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <label className="text-xs mb-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Primary</label>
                            <input
                              type="color"
                              value={themeColor}
                              onChange={(e) => setThemeColor(e.target.value)}
                              className="h-12 w-12 rounded-full"
                              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' }}
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <label className="text-xs mb-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Text</label>
                            <input
                              type="color"
                              value={themeTextColor}
                              onChange={(e) => setThemeTextColor(e.target.value)}
                              className="h-12 w-12 rounded-full"
                              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-3xl p-3 text-left flex flex-col items-start min-w-16 box-border overflow-hidden" style={{ backgroundColor: themePreview.primary, paddingLeft: '0.5rem' }}>
                          <p className="font-semibold mb-1" style={{ color: 'var(--theme-text)', fontSize: '0.65rem', lineHeight: '0.9rem', marginLeft: 0 }}>Primary</p>
                          <p className="mt-1" style={{ color: 'rgba(248,250,252,0.8)', fontSize: '0.7rem', lineHeight: '0.95rem', wordBreak: 'break-word', marginLeft: 0 }}>{themePreview.primary}</p>
                        </div>
                        <div className="rounded-3xl p-3 text-left flex flex-col items-start min-w-16 box-border overflow-hidden" style={{ backgroundColor: themePreview.secondary, paddingLeft: '0.25rem' }}>
                          <p className="font-semibold mb-1" style={{ color: 'var(--theme-text)', fontSize: '0.6rem', lineHeight: '0.85rem', marginLeft: 0 }}>Secondary</p>
                          <p className="mt-1" style={{ color: 'rgba(248,250,252,0.8)', fontSize: '0.65rem', lineHeight: '0.9rem', wordBreak: 'break-all', marginLeft: 0 }}>{themePreview.secondary}</p>
                        </div>
                        <div className="rounded-3xl p-3 text-left flex flex-col items-start min-w-16 box-border overflow-hidden" style={{ backgroundColor: themePreview.surface, border: '1px solid rgba(255,255,255,0.25)', paddingLeft: '0.5rem' }}>
                          <p className="font-semibold mb-1" style={{ color: 'var(--theme-text)', fontSize: '0.65rem', lineHeight: '0.9rem', marginLeft: 0 }}>Surface</p>
                          <p className="mt-1" style={{ color: 'rgba(248,250,252,0.8)', fontSize: '0.7rem', lineHeight: '0.95rem', wordBreak: 'break-word', marginLeft: 0 }}>{themePreview.surface}</p>
                        </div>
                        <div className="rounded-3xl p-3 text-left flex flex-col items-start min-w-16 box-border overflow-hidden" style={{ backgroundColor: themePreview.background, paddingLeft: '0.25rem' }}>
                          <p className="font-semibold mb-1" style={{ color: 'var(--theme-text)', fontSize: '0.6rem', lineHeight: '0.85rem', marginLeft: 0 }}>Background</p>
                          <p className="mt-1" style={{ color: 'rgba(248,250,252,0.8)', fontSize: '0.65rem', lineHeight: '0.9rem', wordBreak: 'break-all', marginLeft: 0 }}>{themePreview.background}</p>
                        </div>
                      </div>
                    </div>

                    {editingContact && (
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={handleSaveContact}
                          disabled={saving}
                          className="theme-button"
                          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelContact}
                          className="theme-button"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--theme-text)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

        <div>
        <Link href="/" >
          <button type="button" className="theme-button">Back</button>
        </Link>
        </div>
        </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />



    </main>
    )
}

//Change user name
//Add or change progile picture...DONE
//Update user details like email, phone number, gender, etc DONE
//customize options, like theme,background colours, etc
//back button to return to home page DONE
//Add a section for user bio or description DONE
//Include links to social media profiles....In Progress
//Display recent activity or posts by the user
//Allow users to manage their privacy settings
//Provide an option to delete the account if needed


//Connecy with the database, and request a change in the username DONE
//Theme should affect, button color, background color, text color, color of surface elements like cards, modals, etc. DONE