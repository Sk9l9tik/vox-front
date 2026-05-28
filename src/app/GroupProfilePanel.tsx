"use client";

import React, { useEffect, useState } from "react";
import { api, type ApiUser } from "./api";

function groupAvatarUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/240`;
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

export default function GroupProfilePanel({
  chatId,
  groupName,
  myUserId,
  onBack,
  onAddMembers,
}: {
  chatId: number;
  groupName: string;
  myUserId?: number;
  onBack: () => void;
  onAddMembers: () => void;
}) {
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    api.getChatMembers(chatId)
      .then(({ user_ids }) => Promise.all(user_ids.map(id => api.getUser(id))))
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chatId]);

  return (
    <div className="flex flex-col h-full bg-[#1a1a28] border-r border-[#3a3a3a] w-[320px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-[11px] border-b border-[#3a3a3a] bg-[#232332]">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          aria-label="Back"
        >
          ←
        </button>
        <span className="text-white font-semibold text-base">Group Info</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-4">
          <img
            src={groupAvatarUrl(groupName)}
            alt={groupName}
            className="w-20 h-20 rounded-full object-cover bg-[#3a3a3a]"
          />
          <div className="text-white text-lg font-semibold text-center">{groupName}</div>
          <div className="text-gray-500 text-sm">Group</div>
        </div>

        {/* Add member button */}
        <div className="px-4 pb-4">
          <button
            onClick={onAddMembers}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
          >
            + Add Member
          </button>
        </div>

        {/* Members list */}
        <div className="px-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
          {loading ? (
            <div className="text-gray-600 text-sm text-center py-4">Loading…</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {members.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#2a2a3a] transition-colors">
                  <img
                    src={u.avatar_url ?? avatarUrl(u.username)}
                    alt={u.username}
                    className="w-9 h-9 rounded-full object-cover bg-[#3a3a53] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {u.display_name || u.username}
                      {u.id === myUserId && <span className="text-gray-500 font-normal"> (you)</span>}
                    </div>
                    <div className="text-gray-500 text-xs truncate">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
