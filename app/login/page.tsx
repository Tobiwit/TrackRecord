"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/db";
import { Vinyl } from "@/components/Vinyl";
import { MoodIcon } from "@/components/MoodIcon";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(usernameOrEmail, password);
    if (res.ok) router.push("/home");
    else setError(res.error ?? "Something went wrong.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="paper relative rounded-sm w-full max-w-sm p-8" style={{ transform: "rotate(-0.6deg)" }}>
        <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[2deg]" aria-hidden />

        {/* decorations */}
        <span className="absolute -bottom-4 -right-4 opacity-90" aria-hidden>
          <Vinyl size={72} labelColor="#7d3b3f" />
        </span>
        <span className="absolute top-3 left-3 text-espresso/40" aria-hidden>
          <MoodIcon moodKey="moon" className="w-6 h-6" />
        </span>
        <span className="absolute bottom-4 left-4 text-espresso/40" aria-hidden>
          <MoodIcon moodKey="rose" className="w-6 h-6" />
        </span>

        <h1 className="font-heading text-4xl text-ink text-center tracking-wide">Track Record</h1>
        <p className="font-hand text-xl text-espresso/80 text-center mt-1">
          you could write songs about this bs
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="email or username"
            autoComplete="username"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
            className="vintage w-full rounded-sm px-3 py-2"
          />
          {error && <p className="text-sm text-burgundy italic">{error}</p>}
          <button type="submit" className="btn-vintage w-full rounded-sm py-2.5 text-lg">
            Open the Record
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-5">
          New here?{" "}
          <Link href="/signup" className="underline hover:text-burgundy">
            Start your track record
          </Link>
        </p>

        <p className="font-hand text-center text-espresso/60 mt-4 text-sm">
          testing? try <span className="font-body not-italic">test / admin</span>
        </p>
      </div>
    </div>
  );
}
