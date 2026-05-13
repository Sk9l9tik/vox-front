"use client";
import React, { useState } from "react";

export default function ChatList({
  chats,
  activeChatId,
  onSelectChat
}: {
  chats: Array<{
    id: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
    lastSender?: string;
    time?: string;
    unread?: number;
    active?: boolean;
    status?: "sent" | "seen";
  }>;
  activeChatId: string;
  onSelectChat: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? chats.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : chats;

  return (
    <div className="w-[320px] bg-[#232332] h-full border-r border-[#3a3a3a] flex flex-col">
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-3 ml-9">
        <div className="relative">
          <input
            className="w-full rounded-md bg-[#1e1e2a] border border-[#303048] text-white/80 px-4 py-2 pl-2 text-sm outline-none focus:border-purple-500 transition-colors"
            placeholder="Search chats…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {/*
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">🔍</span>
          */}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm leading-none"
            >✕</button>
          )}
        </div>
      </div>
      {/* Chat Items */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {filtered.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">No chats found.</p>
        )}
        {filtered.map(chat => (
          <div
            key={chat.id}
            className={`flex items-start w-full px-4 py-3 gap-3 cursor-pointer transition-all
              ${chat.id === activeChatId ?
                "bg-[#232345]" : "hover:bg-[#222242]"}`}
            onClick={() => onSelectChat(chat.id)}
          >
            {/* Avatar */}
            <img
              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(chat.name)}`}
              alt={chat.name}
              className="min-w-[40px] h-10 w-10 rounded-full object-cover bg-[#3a3a53] shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {/* Top row: name + checks + time */}
              <div className="flex items-center justify-between gap-2">
                <div className={`text-sm font-medium truncate ${chat.id === activeChatId ? "text-white" : "text-white/90"}`}>
                  {chat.name}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {chat.status === "sent" && (
                    <span className="text-gray-400 text-xs">✓</span>
                  )}
                  {chat.status === "seen" && (
                    <span className="text-blue-400 text-xs">✓✓</span>
                  )}
                  {chat.time && (
                    <div className="text-xs text-gray-400 font-mono">{chat.time}</div>
                  )}
                </div>
              </div>
              {/* Bottom row: message + unread */}
              <div className="flex items-center justify-between gap-1">
                <div className="text-[13px] text-gray-400 truncate min-w-0">
                  {chat.lastSender && (
                    <span className="text-gray-300">{chat.lastSender}: </span>
                  )}
                  {chat.lastMessage}
                </div>
                {(chat.unread ?? 0) > 0 && (
                  <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center bg-purple-600 text-white shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
