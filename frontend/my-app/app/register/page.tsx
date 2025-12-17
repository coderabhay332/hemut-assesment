"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        return;
      }

      if (typeof window !== "undefined" && data.access_token) {
        localStorage.setItem("hemut_admin_token", data.access_token);
        localStorage.setItem("hemut_is_admin", "1");
      }

      setSuccess("Registration successful! Redirecting to forum...");
      setTimeout(() => {
        router.push("/forum");
      }, 1500);
    } catch (err) {
      setError("Network error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 text-sm">
      <h1 className="text-base font-semibold mb-1 tracking-tight">
        Register
      </h1>
      <p className="text-[11px] text-neutral-400 mb-4">
        Create a new admin account. After registration, you'll be automatically logged in.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
            placeholder="jane_doe"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
            placeholder="you@example.com"
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
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-300">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-[11px] text-red-400 font-medium">{error}</p>
        )}
        {success && (
          <p className="text-[11px] text-emerald-400 font-medium">{success}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}


