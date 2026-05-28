"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { api, type ApiUser } from "./api";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function groupAvatarUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/240`;
}

export default function GroupProfileModal({
  open,
  onClose,
  chatId,
  groupName,
  myUserId,
  onAddMembers,
}: {
  open: boolean;
  onClose: () => void;
  chatId: number;
  groupName: string;
  myUserId?: number;
  onAddMembers: () => void;
}) {
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !chatId) return;
    setLoading(true);
    api.getChatMembers(chatId)
      .then(({ user_ids }) => Promise.all(user_ids.map(id => api.getUser(id))))
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, chatId]);

  return (
    <Modal open={open} onClose={onClose} title={groupName}>
      <div className="flex flex-col items-center gap-4 py-2">
        <img
          src={groupAvatarUrl(groupName)}
          alt={groupName}
          className="w-20 h-20 rounded-full object-cover bg-[#3a3a3a]"
        />
        <div className="text-xl font-semibold text-white">{groupName}</div>

        <button
          onClick={() => { onClose(); onAddMembers(); }}
          className="w-full mt-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          + Add Member
        </button>

        <div className="w-full">
          <div className="text-sm text-gray-400 mb-2 font-medium">
            {members.length} participant{members.length !== 1 ? 's' : ''}
          </div>
          {loading ? (
            <div className="text-gray-500 text-sm text-center py-2">Loading…</div>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {members.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[#2a2a3a]">
                  <img
                    src={u.avatar_url ?? avatarUrl(u.username)}
                    alt={u.username}
                    className="w-8 h-8 rounded-full object-cover bg-[#3a3a53] shrink-0"
                  />
                  <div>
                    <div className="text-white text-sm font-medium">
                      {u.display_name || u.username}
                      {u.id === myUserId && <span className="text-gray-500 font-normal"> (you)</span>}
                    </div>
                    <div className="text-gray-500 text-xs">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
