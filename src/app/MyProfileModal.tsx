"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { api } from "./api";

export default function MyProfileModal({
  open,
  onClose,
  onLogout,
  userId,
  token,
  nickname: initialNickname,
  bio: initialBio,
  onSaveProfile,
}: {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
  userId?: number;
  token?: string;
  nickname?: string;
  bio?: string;
  onSaveProfile?: (updates: { display_name: string; bio: string }) => void;
}) {
  const [displayName, setDisplayName] = useState(initialNickname ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) { setPasswordError("Enter current password"); return; }
      if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters"); return; }
      if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
    }
    setPasswordError("");
    setSaveError("");
    setSaving(true);
    try {
      if (userId && token) {
        await api.updateUser(userId, token, { display_name: displayName, bio });
      }
      onSaveProfile?.({ display_name: displayName, bio });
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="My Profile">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell something about yourself..."
            rows={3}
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-600 resize-none"
          />
        </div>

        <div className="border-t border-[#303048] pt-4">
          <div className="text-sm font-medium text-gray-300 mb-3">Change Password</div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-600"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-600"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
              className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-600"
            />
            {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
          </div>
        </div>

        {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 transition font-medium"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </Modal>
  );
}
