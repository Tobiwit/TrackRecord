"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/db";

export default function Index() {
  const { currentUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    router.replace(currentUser ? "/home" : "/login");
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-hand text-2xl text-cream/60">dropping the needle…</p>
    </div>
  );
}
