"use client";

import { BrainCircuit, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";

const Github = Code2;

export default function LoginPage() {
  const signIn = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };
  return <main className="auth-page"><section className="auth-card"><div className="auth-mark"><BrainCircuit /></div><span className="eyebrow">Private workspace</span><h1>SolveLoop</h1><p>Sign in with the authorized GitHub account to open your problem log.</p><Button className="primary-button auth-button" onClick={() => void signIn()}><Github /> Continue with GitHub</Button><small>Access is restricted to the configured owner.</small></section></main>;
}
