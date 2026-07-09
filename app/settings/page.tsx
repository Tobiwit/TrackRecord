"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { UserAvatar } from "@/components/Avatar";
import { logout, resetDemoData, updateProfile, useStore } from "@/lib/db";
import { spotifyConfigured } from "@/lib/spotify";

export default function SettingsPage() {
  return (
    <Shell>
      <SettingsInner />
    </Shell>
  );
}

function SettingsInner() {
  const { currentUser } = useStore();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!currentUser) return null;

  function onPickPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile(currentUser.id, { profilePictureUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <h2 className="font-title text-3xl md:text-4xl text-ink">Backstage</h2>
      <p className="font-hand text-2xl text-sepia rotate-[-1.5deg] origin-left">profile, wiring, and the exit door</p>

      {/* profile */}
      <section className="paper rounded-sm p-5 mt-6 relative" style={{ transform: "rotate(-0.3deg)" }}>
        <span className="tape -top-2.5 left-8 rotate-[-3deg]" aria-hidden />
        <h3 className="font-heading text-xl text-ink">Profile</h3>
        <div className="flex items-center gap-4 mt-3">
          <UserAvatar user={currentUser} size={56} />
          <div className="flex-1">
            <input
              value={name ?? currentUser.displayName}
              onChange={(e) => setName(e.target.value)}
              className="vintage w-full rounded-sm px-3 py-2"
            />
            <p className="text-xs text-ink-soft mt-1">@{currentUser.username} · {currentUser.email}</p>
          </div>
        </div>
        <label className="block mt-3 text-sm text-ink-soft">
          <span className="font-hand text-lg text-sepia">change picture</span>
          <input type="file" accept="image/*" onChange={onPickPicture} className="block mt-1 text-xs" />
        </label>
        <button
          onClick={() => {
            if (name !== null) updateProfile(currentUser.id, { displayName: name.trim() || currentUser.displayName });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="btn-vintage rounded-sm px-4 py-2 mt-3"
        >
          {saved ? "Saved ♪" : "Save"}
        </button>
      </section>

      {/* spotify */}
      <section className="paper rounded-sm p-5 mt-5 relative" style={{ transform: "rotate(0.3deg)" }}>
        <h3 className="font-heading text-xl text-ink">Spotify</h3>
        {spotifyConfigured() ? (
          <>
            <p className="text-[15px] text-ink mt-1">
              <span className="font-type text-xs uppercase tracking-wider text-olive border border-olive/50 rounded-sm px-1.5 py-0.5 mr-2">
                active
              </span>
              Song search runs on the real Spotify catalog.
            </p>
            <p className="text-sm text-ink-soft mt-2">
              Playback uses Spotify&apos;s embedded player on each entry — everyone hears a 30-second
              preview, and if this browser is logged into Spotify you&apos;ll hear the full track. (Spotify
              no longer offers direct preview audio to new apps, so the embed is the real deal.)
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-soft mt-1">
            Not configured — the app is spinning its own house catalog instead. To enable real
            search, set <code className="text-xs bg-espresso/10 px-1 rounded">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> and{" "}
            <code className="text-xs bg-espresso/10 px-1 rounded">SPOTIFY_CLIENT_SECRET</code> in{" "}
            <code className="text-xs bg-espresso/10 px-1 rounded">.env.local</code>, then restart the dev
            server (see README).
          </p>
        )}
      </section>

      {/* privacy */}
      <section className="paper rounded-sm p-5 mt-5 relative" style={{ transform: "rotate(-0.2deg)" }}>
        <h3 className="font-heading text-xl text-ink">Privacy</h3>
        <ul className="text-sm text-ink-soft mt-2 space-y-1 list-disc list-inside">
          <li>Your entries are visible only to accepted friends.</li>
          <li>Real photos of people you date are never displayed — only stylized avatars.</li>
          <li>In demo mode, everything lives in your browser&apos;s local storage. Nothing leaves your device.</li>
        </ul>
      </section>

      {/* danger zone */}
      <section className="paper rounded-sm p-5 mt-5 relative" style={{ transform: "rotate(0.2deg)" }}>
        <h3 className="font-heading text-xl text-ink">The exit door</h3>
        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn-vintage rounded-sm px-4 py-2"
          >
            Log out
          </button>
          <button
            onClick={() => {
              if (window.confirm("Reset all demo data? Your local entries will be replaced by the seeded demo.")) {
                resetDemoData();
                router.push("/login");
              }
            }}
            className="text-sm underline text-burgundy/80 hover:text-burgundy self-center"
          >
            reset demo data
          </button>
        </div>
      </section>
    </div>
  );
}
