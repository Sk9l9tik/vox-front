"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.register({ username, email, password });
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e1e] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Vox</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-[#232332] rounded-2xl p-8 flex flex-col gap-4 border border-[#303048]">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="yourname"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors mt-1"
          >
            {loading ? "Creating account…" : "Register"}
          </button>

          <p className="text-gray-500 text-sm text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
