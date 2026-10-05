import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return <main className="auth-page"><section className="auth-card"><div className="auth-mark denied"><ShieldX /></div><span className="eyebrow">Access denied</span><h1>This workspace is private</h1><p>The signed-in GitHub account is not the configured SolveLoop owner.</p><a href="/login">Use another account</a></section></main>;
}
