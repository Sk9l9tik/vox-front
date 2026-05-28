"use client";

import React from "react";
import Link from "next/link";

export default function StarterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#1e1e1e] px-4">
      <div className="bg-[#232332] border border-[#303048] rounded-2xl p-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-4xl font-bold text-white mb-3">Vox</h1>
        <p className="mb-8 text-gray-400 text-center text-sm">
          The open chat for everyone — log in or register to start chatting.
        </p>
        <div className="flex gap-3 w-full">
          <Link href="/login" className="flex-1">
            <span className="block text-center py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors">
              Login
            </span>
          </Link>
          <Link href="/register" className="flex-1">
            <span className="block text-center py-2.5 bg-[#1e1e2a] hover:bg-[#2a2a3a] text-purple-400 border border-[#303048] rounded-lg font-semibold transition-colors">
              Register
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
