"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/db";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPickPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result as string);
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = signup({ displayName, username, email, password, profilePictureUrl: picture ?? undefined });
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    router.push("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="paper relative rounded-sm w-full max-w-sm p-8" style={{ transform: "rotate(0.5deg)" }}>
        <span className="tape -top-3 left-10 rotate-[-4deg]" aria-hidden />
        <span className="tape -top-3 right-10 rotate-[3deg]" aria-hidden />

        <h1 className="font-title text-4xl text-ink text-center">Start the Record</h1>
        <p className="font-hand text-xl text-sepia text-center mt-1 rotate-[-1deg]">
          every era deserves liner notes
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="display name"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoComplete="username"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            autoComplete="email"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="new-password"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          <label className="block text-sm text-ink-soft">
            <span className="font-hand text-lg text-sepia">profile picture (optional)</span>
            <input type="file" accept="image/*" onChange={onPickPicture} className="block mt-1 text-xs" />
          </label>
          <p className="text-xs text-ink-soft italic">
            You can connect Spotify later from Settings.
          </p>
          {error && <p className="text-sm text-burgundy italic">{error}</p>}
          <button type="submit" className="btn-vintage w-full rounded-sm py-2.5 text-lg">
            Press the First Track
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-5">
          Already on the record?{" "}
          <Link href="/login" className="underline hover:text-burgundy">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
