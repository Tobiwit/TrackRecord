"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/db";
import { Vinyl } from "@/components/Vinyl";
import { Butterfly, MoonFace, Sprig, SunFace } from "@/components/Ornaments";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* collage scatter around the card */}
      <span className="absolute top-[8%] left-[12%] text-sepia/50 rotate-[-14deg] hidden sm:block" aria-hidden>
        <Sprig className="w-14 h-24" />
      </span>
      <span className="absolute bottom-[10%] right-[10%] text-sepia/50 rotate-[10deg] hidden sm:block" aria-hidden>
        <SunFace className="w-20 h-20" />
      </span>
      <span className="absolute top-[14%] right-[16%] text-sepia/45 rotate-[6deg] hidden sm:block" aria-hidden>
        <MoonFace className="w-14 h-14" />
      </span>

      <div className="paper relative rounded-sm w-full max-w-sm p-8" style={{ transform: "rotate(-0.6deg)" }}>
        <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[2deg]" aria-hidden />

        {/* on-card decorations */}
        <span className="absolute -bottom-5 -right-5" aria-hidden>
          <Vinyl size={76} labelColor="#7d3b3f" />
        </span>
        <span className="absolute top-4 left-4 text-sepia/70 rotate-[-8deg]" aria-hidden>
          <Butterfly className="w-10 h-10" />
        </span>
        <span className="absolute bottom-16 left-3 text-sepia/50 rotate-[16deg]" aria-hidden>
          <Sprig className="w-7 h-12" />
        </span>

        <h1 className="font-title text-[2.6rem] leading-none text-ink text-center">Track Record</h1>
        <p className="cutout text-[11px] rotate-[-1.5deg] mt-2 mx-auto block w-fit">
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

        <p className="text-center text-[15px] text-ink-soft mt-5">
          New here?{" "}
          <Link href="/signup" className="underline hover:text-burgundy">
            Start your track record
          </Link>
        </p>

        <p className="font-hand text-center text-sepia mt-4 text-lg rotate-[-1deg]">
          testing? try <span className="font-type not-italic text-sm">test / admin</span>
        </p>
      </div>
    </div>
  );
}
