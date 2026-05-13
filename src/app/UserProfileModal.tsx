"use client";

import React from "react";
import Modal from "./Modal";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

export default function UserProfileModal({
  open,
  onClose,
  username,
  bio,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  bio?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Profile">
      <div className="flex flex-col items-center gap-4 py-2">
        <img
          src={avatarUrl(username)}
          alt={username}
          className="w-20 h-20 rounded-full object-cover bg-[#3a3a3a]"
        />
        <div className="text-center">
          <div className="text-xl font-semibold text-white">{username}</div>
          {bio ? (
            <p className="text-sm text-gray-400 mt-2 max-w-xs text-center whitespace-pre-wrap">{bio}</p>
          ) : (
            <p className="text-sm text-gray-600 mt-2 italic">No bio yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
