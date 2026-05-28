"use client";

import React, { useState, useRef } from "react";
import Modal from "./Modal";
import { api, type ApiUser } from "./api";

export default function AddGroupMembersModal({
  open,
  onClose,
  chatId,
  myUserId,
  onMembersAdded,
}: {
  open: boolean;
  onClose: () => void;
  chatId: number;
  myUserId?: number;
  onMembersAdded?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ApiUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchUsers(q.trim());
        setSearchResults(
          results.filter(u => u.id !== myUserId && !selectedUsers.some(s => s.id === u.id))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }

  function addUser(user: ApiUser) {
    setSelectedUsers(prev => prev.some(u => u.id === user.id) ? prev : [...prev, user]);
    setSearchResults(prev => prev.filter(u => u.id !== user.id));
    setSearchQuery("");
  }

  function removeUser(userId: number) {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUsers.length) return;
    setLoading(true);
    setError("");
    try {
      await api.addGroupMembers(chatId, selectedUsers.map(u => u.id));
      onMembersAdded?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedUsers([]);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Members">
      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(u => (
                <span key={u.id} className="flex items-center gap-1 bg-purple-700/40 text-purple-200 text-xs px-2 py-1 rounded-full">
                  {u.display_name || u.username}
                  <button type="button" onClick={() => removeUser(u.id)} className="ml-1 text-purple-300 hover:text-white leading-none">×</button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search users by username..."
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-500"
            autoFocus
          />
          {searchLoading && <p className="text-gray-500 text-xs mt-1">Searching…</p>}
          {searchResults.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-[#303048] divide-y divide-[#303048]">
              {searchResults.map(u => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[#2a2a3a] cursor-pointer"
                  onClick={() => addUser(u)}
                >
                  <img
                    src={u.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u.username)}`}
                    alt={u.username}
                    className="w-7 h-7 rounded-full object-cover bg-[#3a3a3a] shrink-0"
                  />
                  <div>
                    <div className="text-white text-sm">{u.display_name || u.username}</div>
                    <div className="text-gray-500 text-xs">@{u.username}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <p className="text-gray-600 text-xs mt-1">No users found.</p>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-600 text-white rounded-lg px-4 py-2 transition font-medium disabled:opacity-50"
            disabled={!selectedUsers.length || loading}
          >
            {loading ? "Adding…" : "Add Members"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
