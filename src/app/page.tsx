"use client"

import React, { useState, useEffect, useRef } from 'react';
import StarterPage from "./StarterPage";
import Sidebar from "./Sidebar";
import ChatList from "./ChatList";
import Modal from "./Modal";
import MyProfileModal from "./MyProfileModal";
import UserProfileModal from "./UserProfileModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsModal from "./SettingsModal";
import { api, type ApiUser } from "./api";

type Attachment = {
  name: string;
  size: string;
  isImage: boolean;
  url: string;
  ext: string;
};

type Message = {
  id: number;
  date?: string;
  author: string;
  authorSubtitle?: string;
  content: string;
  time: string;
  systemMessage?: boolean;
  attachments?: Attachment[];
};

type AttachmentPreview = {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  previewUrl: string;
  ext: string;
};

const EXT_COLORS: Record<string, string> = {
  pdf: '#c0392b',
  doc: '#2980b9', docx: '#2980b9',
  zip: '#e67e22', rar: '#e67e22',
  txt: '#7f8c8d',
  xls: '#27ae60', xlsx: '#27ae60',
  ppt: '#d35400', pptx: '#d35400',
};

function extColor(ext: string) {
  return EXT_COLORS[ext.toLowerCase()] ?? '#5d6d7e';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function FileIconBadge({ ext, size = 44 }: { ext: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, backgroundColor: extColor(ext) }}
      className="rounded-xl flex items-center justify-center text-white font-bold text-[11px] uppercase shrink-0"
    >
      {ext.slice(0, 4).toUpperCase()}
    </div>
  );
}

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState<null | boolean>(null);
  const [activeChat, setActiveChat] = useState('andrey-shmelefnik');
  const [mounted, setMounted] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatValue, setNewChatValue] = useState("");
  const [myUser, setMyUser] = useState<ApiUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [contactProfileOpen, setContactProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dynamicChats, setDynamicChats] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [enterToSend, setEnterToSend] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("authUser");
    setAuthed(!!token);
    if (token) setAuthToken(token);
    if (userStr) {
      try { setMyUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const myNickname = myUser?.display_name || myUser?.username || "User";
  const myBio = myUser?.bio ?? "";

  useEffect(() => {
    const handleProfileToggle = () => { setProfileOpen(true); setSidebarOpen(false); };
    const handleNewGroupToggle = () => { setNewGroupOpen(true); setSidebarOpen(false); };
    const handleNewChatOpen = () => { setNewChatOpen(true); setSidebarOpen(false); };
    const handleSettingsToggle = () => { setSettingsOpen(true); setSidebarOpen(false); };

    window.addEventListener('toggle-profile', handleProfileToggle);
    window.addEventListener('toggle-new-group', handleNewGroupToggle);
    window.addEventListener('open-new-chat', handleNewChatOpen);
    window.addEventListener('toggle-settings', handleSettingsToggle);

    return () => {
      window.removeEventListener('toggle-profile', handleProfileToggle);
      window.removeEventListener('toggle-new-group', handleNewGroupToggle);
      window.removeEventListener('open-new-chat', handleNewChatOpen);
      window.removeEventListener('toggle-settings', handleSettingsToggle);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  if (!mounted) return null;
  if (!authed) return <StarterPage />;

  const messages: Record<string, Message[]> = {
    'andrey-shmelefnik': [
      {
        id: 1,
        date: 'March 16',
        author: 'Andrey Shmelefnik',
        authorSubtitle: 'Last seen recently',
        content: `ИДУ ТЕБЕ НА*РЕШОВ@Ю В ИГРУ TINE-LINE!

Друзья, мой проект потихоньку растёт, и сейчас мне очень нужна ваша помощь — протестировать игру и найти баги, которые я как разработчик уже могу не заметить.

ЧТО ЗА ИГРА:
Tine-Line — симулятор жизни в открытом мире на реальной карте города Кирова. Можно тренироваться (с поддержкранием по фото), покупать недвижимость, общаться в Random Chat, ездить на работу, и т.д.

ЧТО НУЖНО ДЕЛАТЬ:
- Играть, читать и всё раз за разом
- Записывать все найденные баги (с описанием и скринами по возможности)
- Делиться впечатлениями и идеями
- Предлагать, как сделовать механики из разных устройствах

КАК ПОМОЧЬ:
- Ссылка на проект (важно менять по старыми)
- Автозашдния стабул (не проверил оптимизацию)
- Важно: Играть в Mac (точно уважаться, что всё работает)

- Больше симуляторов (The Sims, Second Life и т.д.)`,
        time: '18:34',
      },
      {
        id: 2,
        author: 'Andrey Shmelefnik',
        content: '**Слава Императору! Шахматы покорены!**',
        time: '18:35',
      },
      {
        id: 3,
        author: 'You',
        content: '**Слава Императору! Шахматы покорены!**',
        time: '18:35',
      },
      {
        id: 4,
        author: 'Andrey Shmelefnik',
        content: 'Check this out!',
        time: '18:36',
        attachments: [{
          name: 'screenshot.jpg',
          size: '897.1 KB',
          isImage: true,
          url: 'https://picsum.photos/seed/vox1/400/240',
          ext: 'jpg',
        }],
      },
      {
        id: 5,
        author: 'You',
        content: '',
        time: '18:37',
        attachments: [{
          name: 'report_2026.pdf',
          size: '85.0 KB',
          isImage: false,
          url: 'https://picsum.photos/seed/vox1/400/240',
          ext: 'pdf',
        }],
      },
      {
        id: 6,
        author: 'You',
        content: '',
        time: '18:38',
        attachments: [{
          name: 'project_notes.docx',
          size: '1.3 MB',
          isImage: false,
          url: '',
          ext: 'docx',
        }],
      },
      {
        id: 7,
        author: 'Andrey Shmelefnik',
        content: '',
        time: '18:39',
        attachments: [{
          name: 'diagram.jpg',
          size: '1.2 MB',
          isImage: true,
          url: 'https://picsum.photos/seed/vox2/400/260',
          ext: 'jpg',
        }],
      },
    ],
    'chatter1': [
      {
        id: 1,
        date: 'March 16',
        author: 'Chatter1',
        content: 'Hello there!',
        time: '18:34',
      },
    ],
  };

  function getLastMsgMeta(id: string) {
    const msgs = messages[id];
    if (!msgs?.length) return { lastMessage: '', lastSender: undefined, time: undefined };
    const last = msgs[msgs.length - 1];
    return {
      lastMessage: last.content?.replace(/\*\*/g, '') || last.attachments?.[0]?.name || '',
      lastSender: last.author,
      time: last.time,
    };
  }

  const staticChats = [
    // { id: 'group', type: 'group', name: 'Group', avatar: '👥', unread: 0, status: 'seen' as const, ...getLastMsgMeta('group') },
    // { id: 'chatter1', type: 'dm', name: 'Chatter1', avatar: '👤', unread: 0, status: 'sent' as const, ...getLastMsgMeta('chatter1') },
    // { id: 'chat2', type: 'dm', name: 'Chat2', avatar: '👤', unread: 0, ...getLastMsgMeta('chat2') },
    { id: 'andrey-shmelefnik', type: 'dm', name: 'Andrey Shmelefnik', avatar: '🟣', unread: 0, active: true, status: 'seen' as const, ...getLastMsgMeta('andrey-shmelefnik') },
  ];
  const staticChatIds = new Set(staticChats.map(c => c.id));
  const chats = [
    ...staticChats,
    ...dynamicChats
      .filter(c => !staticChatIds.has(c.id))
      .map(c => ({ ...c, type: 'dm', unread: 0, ...getLastMsgMeta(c.id) })),
  ];

  const currentMessages = [...(messages[activeChat] || []), ...(chatMessages[activeChat] || [])];
  const currentChat = chats.find(c => c.id === activeChat);
  const isGroupChat = currentChat?.type === 'group';

  function sendMessage() {
    const text = messageInput.trim();
    if (!text || !activeChat) return;
    const newMsg: Message = {
      id: Date.now(),
      author: 'You',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), newMsg] }));
    setMessageInput("");
  }

  function renderContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const previews: AttachmentPreview[] = files.map(file => {
      const isImage = file.type.startsWith('image/');
      const ext = file.name.split('.').pop() || '';
      return {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: formatSize(file.size),
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        ext,
      };
    });
    setPendingAttachments(prev => [...prev, ...previews]);
    e.target.value = '';
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments(prev => {
      const item = prev.find(a => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  }

  return (
    <div className="flex h-screen bg-[#1e1e1e]">
      <Modal open={newChatOpen} onClose={() => { setNewChatOpen(false); setNewChatValue(""); setSearchResults([]); }} title="Start new chat">
        <div>
          <input
            className="w-full bg-[#1e1e2a] border border-[#303048] rounded-lg py-2 px-4 text-white mb-3"
            type="text"
            placeholder="Search by username or email..."
            value={newChatValue}
            onChange={e => {
              const q = e.target.value;
              setNewChatValue(q);
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              if (!q.trim()) { setSearchResults([]); return; }
              setSearchLoading(true);
              searchTimerRef.current = setTimeout(async () => {
                try {
                  const results = await api.searchUsers(q.trim());
                  setSearchResults(results);
                } catch {
                  setSearchResults([]);
                } finally {
                  setSearchLoading(false);
                }
              }, 300);
            }}
            autoFocus
          />
          {searchLoading && <p className="text-gray-500 text-sm mb-2">Searching…</p>}
          {searchResults.length > 0 && (
            <ul className="mb-3 max-h-48 overflow-y-auto rounded-lg border border-[#303048] divide-y divide-[#303048]">
              {searchResults.map(u => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[#2a2a3a] cursor-pointer"
                  onClick={() => {
                    setDynamicChats(prev =>
                      prev.some(c => c.id === u.username)
                        ? prev
                        : [{ id: u.username, name: u.display_name || u.username, avatar: u.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u.username)}` }, ...prev]
                    );
                    setActiveChat(u.username);
                    setNewChatOpen(false);
                    setNewChatValue("");
                    setSearchResults([]);
                  }}
                >
                  <img
                    src={u.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u.username)}`}
                    alt={u.username}
                    className="w-8 h-8 rounded-full object-cover bg-[#3a3a3a] shrink-0"
                  />
                  <div>
                    <div className="text-white text-sm font-medium">{u.display_name || u.username}</div>
                    <div className="text-gray-500 text-xs">@{u.username}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {newChatValue && !searchLoading && searchResults.length === 0 && (
            <p className="text-gray-600 text-sm mb-3">No users found.</p>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setNewChatOpen(false); setNewChatValue(""); setSearchResults([]); }} className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition font-medium">Cancel</button>
          </div>
        </div>
      </Modal>

      <MyProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userId={myUser?.id}
        token={authToken ?? undefined}
        nickname={myNickname}
        bio={myBio}
        onSaveProfile={({ display_name, bio }) => {
          const updated = { ...myUser!, display_name, bio };
          setMyUser(updated);
          localStorage.setItem("authUser", JSON.stringify(updated));
        }}
        onLogout={() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          setAuthed(false);
          setProfileOpen(false);
        }}
      />
      <UserProfileModal open={contactProfileOpen} onClose={() => setContactProfileOpen(false)} username={currentChat?.name ?? ""} />
      <CreateGroupModal open={newGroupOpen} onClose={() => setNewGroupOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        enterToSend={enterToSend}
        fontSize={fontSize}
        onSave={(s) => { setEnterToSend(s.enterToSend); setFontSize(s.fontSize); }}
      />

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
          <Sidebar onClose={() => setSidebarOpen(false)} nickname={myNickname} />
        </>
      )}

      <button
        className="absolute top-4 left-4 z-30 bg-[#232332] text-white p-2 rounded hover:bg-[#303048] shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="flex flex-1 h-full">
        <ChatList chats={chats} activeChatId={activeChat} onSelectChat={setActiveChat} />

        <div className="flex-1 flex flex-col bg-[#1E1E2A] min-w-0">
          <div className="bg-[#232332] px-6 py-[7px] border-b border-[#3a3a3a]">
            <h2
              className={`text-lg font-semibold mb-0.5 ${currentChat ? "cursor-pointer hover:text-purple-400 transition-colors" : ""}`}
              onClick={() => currentChat && setContactProfileOpen(true)}
            >
              {currentChat?.name || 'Select a chat'}
            </h2>
            {currentChat && <span className="text-[13px] text-gray-500">Last seen recently</span>}
          </div>

          <div className="flex-1 overflow-y-auto flex justify-center">
            <div className="w-full max-w-[720px] px-6 py-6">
              {currentMessages.map((msg, index) => {
                const prev = currentMessages[index - 1];
                const next = currentMessages[index + 1];
                const isOwn = msg.author === "You";
                const isFirst = !prev || prev.author !== msg.author;
                const isLast = !next || next.author !== msg.author;
                const hasAttachments = !!msg.attachments?.length;

                const roundingOwn = `${isFirst ? "mt-2" : ""} ${isLast ? "mb-2" : ""} rounded-tl-md rounded-bl-md rounded-tr-md rounded-br-md`;
                const roundingOther = `${isFirst ? "mt-2" : ""} ${isLast ? "mb-2" : ""} rounded-tr-md rounded-br-md rounded-tl-md rounded-bl-md`;

                return (
                  <div key={msg.id}>
                    {msg.date && (
                      <div className="text-center text-gray-500 text-xs mb-6 opacity-70">{msg.date}</div>
                    )}

                    <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && (
                        isLast
                          ? <img src={avatarUrl(msg.author)} alt={msg.author} className="w-9 h-9 mb-2 rounded-full object-cover bg-[#3a3a3a] shrink-0" />
                          : <div className="w-9 shrink-0" />
                      )}

                      <div className={`max-w-[520px] my-[2px] overflow-hidden
                        ${{ small: 'text-xs', medium: 'text-sm', large: 'text-base' }[fontSize]}
                        ${isOwn ? `bg-gradient-to-r from-purple-600 to-purple-700 text-white ${roundingOwn}` : `bg-[#2f2f2f] text-gray-200 ${roundingOther}`}
                        ${hasAttachments ? '' : 'px-4 py-2 whitespace-pre-wrap'}`}>

                        {hasAttachments ? (
                          <>
                            {msg.attachments!.map((att, i) =>
                              att.isImage ? (
                                <div key={i}>
                                  <img src={att.url} alt={att.name} className="w-full max-h-[260px] object-cover block" />
                                  <div className={`px-3 py-2 ${isOwn ? 'bg-black/20' : 'bg-[#272727]'}`}>
                                    <div className="text-[12px] font-medium text-white/90">{att.name}</div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[11px] text-gray-400">{att.size}</span>
                                      <span className="text-[10px] text-white/40">{msg.time}</span>
                                    </div>
                                    <span className="text-[11px] text-blue-400 cursor-pointer">OPEN WITH</span>
                                  </div>
                                </div>
                              ) : (
                                <div key={i} className="flex items-center gap-3 px-3 py-3">
                                  <FileIconBadge ext={att.ext} size={46} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-medium text-white/90 truncate">{att.name}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{att.size}</div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[11px] text-blue-400 cursor-pointer">OPEN WITH</span>
                                      <span className="text-[10px] text-white/40">{msg.time}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                            {msg.content ? (
                              <div className="px-4 py-2 whitespace-pre-wrap">{renderContent(msg.content)}</div>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {!isOwn && isFirst && isGroupChat && (
                              <div className="text-purple-400 text-sm font-semibold mb-1">{msg.author}</div>
                            )}
                            {renderContent(msg.content)}
                          </>
                        )}
                      </div>

                      {isOwn && (
                        isLast
                          ? <img src={avatarUrl(myNickname)} alt="You" className="w-9 h-9 mb-2 rounded-full object-cover bg-purple-600 shrink-0" />
                          : <div className="w-9 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Pending attachments preview strip */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 pt-3 pb-2 bg-[#1a1a28] border-t border-[#303048] flex gap-3 overflow-x-auto">
              {pendingAttachments.map(att => (
                <div key={att.id} className="relative shrink-0">
                  <button
                    onClick={() => removePendingAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white text-xs"
                  >×</button>
                  {att.isImage ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-[72px] h-[72px] rounded-xl object-cover border border-[#303048]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 w-[72px]">
                      <FileIconBadge ext={att.ext} size={52} />
                      <span className="text-[10px] text-gray-400 text-center truncate w-full">{att.name}</span>
                      <span className="text-[10px] text-gray-500">{att.size}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="px-2 py-3 bg-[#1E1E2A] border-t border-[#3a3a3a] flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
              className="hidden"
              onChange={handleFilesSelected}
            />
            <button
              className="text-xl opacity-60 hover:opacity-100 transition-opacity pl-2"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file or photo"
            >
              F
            </button>
            <input
              type="text"
              placeholder="Write a message..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => {
                const shouldSend = enterToSend ? (e.key === 'Enter' && !e.shiftKey) : (e.key === 'Enter' && e.shiftKey);
                if (shouldSend) { e.preventDefault(); sendMessage(); }
              }}
              className="flex-1 bg-[#1E1E2A] border-none px-4 py-3 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:bg-[#1E1E2A]"
            />
            <button
              onClick={sendMessage}
              className="text-xl opacity-60 hover:opacity-100 transition-opacity pr-2"
            >
              S
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
