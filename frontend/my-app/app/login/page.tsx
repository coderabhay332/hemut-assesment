"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      if (typeof window !== "undefined" && data.access_token) {
        localStorage.setItem("hemut_admin_token", data.access_token);
        localStorage.setItem("hemut_is_admin", "1");
      }

      router.push("/forum");
    } catch (err) {
      setError("Network error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 text-sm">
      <h1 className="text-base font-semibold mb-1 tracking-tight">
        Admin Login
      </h1>
      <p className="text-[11px] text-neutral-400 mb-4">
        Login with your registered admin credentials.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
            placeholder="admin@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-[11px] text-red-400 font-medium">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-4 py-2 rounded-lg bg-cyan-500 text-neutral-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}


