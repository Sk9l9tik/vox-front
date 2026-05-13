"use client";

import React, { useState } from "react";
import Modal from "./Modal";

export default function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const participantList = participants
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    
    // TODO: implement group creation logic
    console.log("Creating group:", { groupName, participants: participantList });
    
    setGroupName("");
    setParticipants("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Group">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Participants
          </label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="Enter usernames separated by commas..."
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: user1, user2, user3
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-600 text-white rounded-lg px-4 py-2 transition font-medium disabled:opacity-50"
            disabled={!groupName}
          >
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
}
