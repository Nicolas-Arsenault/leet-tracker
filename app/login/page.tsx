import { BrainCircuit, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Github = Code2;

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-card"><div className="auth-mark"><BrainCircuit /></div><span className="eyebrow">Private workspace</span><h1>SolveLoop</h1><p>Sign in with the authorized GitHub account to open your problem log.</p><Button asChild className="primary-button auth-button"><a href="/auth/login"><Github /> Continue with GitHub</a></Button><small>Access is restricted to the configured owner.</small></section></main>;
}
