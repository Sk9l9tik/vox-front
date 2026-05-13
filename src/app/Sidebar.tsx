"use client";

export default function Sidebar({
  onClose,
  nickname = "User",
}: {
  onClose: () => void;
  nickname?: string;
}) {
  return (
    <aside className="fixed z-50 top-0 left-0 w-64 h-full bg-[#232332] shadow-xl">
      {/* HEADER */}
      <div className="p-4 flex items-center gap-3 border-b border-[#2a2a3a]">
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(nickname)}`}
          alt={nickname}
          className="w-10 h-10 rounded-full object-cover bg-[#3a3a3a] shrink-0"
        />
        <span>{nickname}</span>
      </div>

      {/* MENU */}
      <nav>
        <button 
          className="w-full text-left px-4 py-3 hover:bg-[#2a2a3a]"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-profile'))}>
          My Profile
        </button>
        <button 
          className="w-full text-left px-4 py-3 hover:bg-[#2a2a3a]"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-new-group'))}>
          New Group
        </button>
        <button 
          className="w-full text-left px-4 py-3 hover:bg-[#2a2a3a]"
          onClick={() => window.dispatchEvent(new CustomEvent('open-new-chat'))}>
          New Chat
        </button>
        <button 
          className="w-full text-left px-4 py-3 hover:bg-[#2a2a3a]"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-settings'))}>
          Settings 
        </button>
      </nav>

      {/* FOOTER */}
      <div className="absolute bottom-2 left-4 text-xs text-gray-500">
        Version 0.0.0
      </div>
    </aside>
  );
}
