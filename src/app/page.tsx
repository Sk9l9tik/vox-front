"use client"

import React, { useState, useEffect, useRef } from 'react';
import StarterPage from "./StarterPage";
import Sidebar from "./Sidebar";
import ChatList from "./ChatList";
import Modal from "./Modal";
import MyProfileModal from "./MyProfileModal";
import UserProfileModal from "./UserProfileModal";
import CreateGroupModal from "./CreateGroupModal";
import AddGroupMembersModal from "./AddGroupMembersModal";
import GroupProfileModal from "./GroupProfileModal";
import SettingsModal from "./SettingsModal";
import { api, type ApiUser, type ApiChat, type ApiChatEntry, type ApiMessage } from "./api";

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
  dateKey?: string;
  author: string;
  authorSubtitle?: string;
  content: string;
  time: string;
  systemMessage?: boolean;
  attachments?: Attachment[];
  status?: 'pending' | 'sent' | 'read';
};

type AttachmentPreview = {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  previewUrl: string;
  ext: string;
  file: File;
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

function todayDateKey() {
  return new Date().toLocaleDateString('en-CA');
}

function formatDateMarker(dateKey: string): string {
  const todayKey = todayDateKey();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterdayKey = yd.toLocaleDateString('en-CA');
  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
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
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [groupProfileOpen, setGroupProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatValue, setNewChatValue] = useState("");
  const [myUser, setMyUser] = useState<ApiUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [contactProfileOpen, setContactProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dynamicChats, setDynamicChats] = useState<{ id: string; chatId?: number; name: string; avatar: string; pendingRecipientId?: number; chatType?: 'private' | 'group' }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const userNameCache = useRef<Map<number, string>>(new Map());
  const [enterToSend, setEnterToSend] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [historicalMessages, setHistoricalMessages] = useState<Record<string, Message[]>>({});
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [connStatus, setConnStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const wsReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsReconnectDelay = useRef(1000);
  const wsUnmounted = useRef(false);
  const wsConnectRef = useRef<(() => void) | null>(null);
  type QueuedMsg = { chatKey: string; chatIdNum: number; text: string; tempId: number };
  const pendingQueueRef = useRef<QueuedMsg[]>([]);
  const readCursorsRef = useRef<Record<string, number>>({});
  // Always holds the latest activeChat value so WS closures can read it without stale captures
  const activeChatRef = useRef(activeChat);

  const resolveAuthor = async (senderId: number, myId: number): Promise<string> => {
    if (senderId === myId) return 'You';
    const cached = userNameCache.current.get(senderId);
    if (cached) return cached;
    try {
      const u = await api.getUser(senderId);
      const name = u.display_name || u.username;
      userNameCache.current.set(senderId, name);
      return name;
    } catch {
      return String(senderId);
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("authUser");
    setAuthed(!!token);
    if (token) setAuthToken(token);
    if (userStr) {
      try {
        const cached = JSON.parse(userStr);
        setMyUser(cached);
        // Re-fetch from server to get latest display_name/bio
        api.getUser(cached.id).then(fresh => {
          setMyUser(fresh);
          localStorage.setItem("authUser", JSON.stringify(fresh));
        }).catch(() => {});
      } catch {}
    }
  }, []);

  // Load existing chats from backend on startup
  useEffect(() => {
    if (!myUser) return;
    (async () => {
      try {
        const entries: ApiChatEntry[] = await api.getMyChats(myUser.id);
        const resolved = await Promise.all(
          entries.map(async (chat) => {
            if (chat.type === 'private') {
              const otherId = chat.members?.find(id => id !== myUser.id);
              if (otherId) {
                try {
                  const other = await api.getUser(otherId);
                  userNameCache.current.set(other.id, other.display_name || other.username);
                  return {
                    id: String(chat.id),
                    chatId: chat.id,
                    chatType: 'private' as const,
                    name: other.display_name || other.username,
                    avatar: other.avatar_url ??
                      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(other.username)}`,
                  };
                } catch {}
              }
              return { id: String(chat.id), chatId: chat.id, chatType: 'private' as const, name: `Chat ${chat.id}`, avatar: '' };
            }
            return {
              id: String(chat.id),
              chatId: chat.id,
              chatType: 'group' as const,
              name: chat.name ?? `Group ${chat.id}`,
              avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=group${chat.id}`,
            };
          })
        );
        setDynamicChats(resolved);

        // Pre-fetch messages for all chats so the sidebar shows last messages immediately
        resolved.forEach(chat => {
          const chatIdNum = parseInt(chat.id);
          if (isNaN(chatIdNum)) return;
          api.getChatMessages(chatIdNum).then(async ({ messages: rawMsgs }) => {
            if (!rawMsgs.length) return;
            const apiMsgs = [...rawMsgs].reverse();
            const mapped = await Promise.all(apiMsgs.map(async (m: ApiMessage) => ({
              id: m.id,
              author: await resolveAuthor(m.sender_id, myUser.id),
              content: m.text,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              dateKey: new Date(m.created_at).toLocaleDateString('en-CA'),
              attachments: m.attachment_url ? [{ name: 'attachment', size: '', isImage: true, url: m.attachment_url, ext: '' }] : undefined,
            })));
            setHistoricalMessages(prev => ({ ...prev, [chat.id]: mapped }));
          }).catch(() => {});
        });
      } catch {}
    })();
  }, [myUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!authToken || !myUser) return;
    wsUnmounted.current = false;
    const token = authToken;
    const userId = myUser.id;

    function connect() {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
      if (wsReconnectTimer.current) { clearTimeout(wsReconnectTimer.current); wsReconnectTimer.current = null; }

      const ws = new WebSocket(`ws://${window.location.hostname}:8080/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }));
        setConnStatus('connected');
        wsReconnectDelay.current = 1000;
        // Re-fetch active chat cursor to pick up read receipts missed during disconnect
        const chatIdNum = parseInt(activeChatRef.current);
        if (!isNaN(chatIdNum)) {
          api.getChatMessages(chatIdNum, 50, userId).then(({ others_cursor }) => {
            if (others_cursor != null) {
              const chatKey = String(chatIdNum);
              readCursorsRef.current[chatKey] = Math.max(readCursorsRef.current[chatKey] ?? 0, others_cursor);
              const markRead = (msgs: Message[]) => msgs.map(m =>
                m.author === 'You' && m.id > 0 && m.id <= others_cursor! ? { ...m, status: 'read' as const } : m
              );
              setChatMessages(prev => ({ ...prev, [chatKey]: markRead(prev[chatKey] ?? []) }));
              setHistoricalMessages(prev => ({ ...prev, [chatKey]: markRead(prev[chatKey] ?? []) }));
            }
          }).catch(() => {});
        }
        // Flush queued messages
        const queue = pendingQueueRef.current.splice(0);
        queue.forEach(item => {
          const fd = new FormData();
          fd.append('chat_id', String(item.chatIdNum));
          fd.append('sender_id', String(userId));
          fd.append('text', item.text);
          fetch('/api/messages/send', { method: 'POST', body: fd })
            .then(async r => {
              if (r.ok) {
                const json = await r.json();
                setChatMessages(prev => {
                  const msgs = prev[item.chatKey];
                  if (!msgs) return prev;
                  const cursor = readCursorsRef.current[item.chatKey] ?? 0;
                  const status = json.id <= cursor ? 'read' : 'sent';
                  return { ...prev, [item.chatKey]: msgs.map(m => m.id === item.tempId ? { ...m, id: json.id, status } : m) };
                });
              }
            })
            .catch(() => pendingQueueRef.current.push(item));
        });
      };

      ws.onmessage = async (e) => {
        try {
          const raw = e.data instanceof Blob ? await (e.data as Blob).text() : e.data as string;
          const data = JSON.parse(raw);
          if (data.type === 'auth_ok' || data.type === 'error') return;

          // Read receipt — update my sent messages to 'read'
          if (data.type === 'read-message' && data.payload) {
            const { last_read, readed_by, chat_id } = data.payload;
            if (readed_by !== userId && chat_id != null) {
              const chatKey = String(chat_id);
              // Remember cursor so pending→sent transitions can pick it up retroactively
              readCursorsRef.current[chatKey] = Math.max(readCursorsRef.current[chatKey] ?? 0, last_read);
              const markRead = (msgs: Message[]) => msgs.map(m =>
                m.author === 'You' && m.id > 0 && m.id <= last_read ? { ...m, status: 'read' as const } : m
              );
              setChatMessages(prev => ({ ...prev, [chatKey]: markRead(prev[chatKey] ?? []) }));
              setHistoricalMessages(prev => ({ ...prev, [chatKey]: markRead(prev[chatKey] ?? []) }));
            }
            return;
          }

          // Group membership notification — add the group to sidebar for new members
          if (data.type === 'group_added' && data.chat) {
            const chatKey = String(data.chat.id);
            setDynamicChats(prev => {
              if (prev.some(c => c.id === chatKey)) return prev;
              return [{
                id: chatKey,
                chatId: data.chat.id,
                chatType: 'group' as const,
                name: data.chat.name ?? `Group ${data.chat.id}`,
                avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=group${data.chat.id}`,
              }, ...prev];
            });
            return;
          }

          if (data.type !== 'new-message' || !data.payload) return;

          const msg = data.payload;
          if (msg.chat_id == null || msg.sender_id == null) return;

          // Skip own messages — shown optimistically on send
          if (msg.sender_id === userId) return;

          const chatKey = String(msg.chat_id);
          resolveAuthor(msg.sender_id, userId).then(author => {
            const newMsg: Message = {
              id: msg.id ?? Date.now(),
              author,
              content: msg.text ?? '',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              dateKey: todayDateKey(),
              attachments: msg.attachment_url ? [{
                name: msg.attachment_name || 'attachment',
                size: msg.attachment_size ? formatSize(msg.attachment_size) : '',
                isImage: (msg.attachment_type as string | undefined)?.startsWith('image/') ?? true,
                url: `/api/files/${msg.attachment_url}`,
                ext: (msg.attachment_name as string | undefined)?.split('.').pop() || '',
              }] : undefined,
            };
            setChatMessages(prev => ({
              ...prev,
              [chatKey]: [...(prev[chatKey] ?? []), newMsg],
            }));
            // If the user is actively viewing this chat, send a read receipt immediately
            if (chatKey === activeChatRef.current && newMsg.id) {
              fetch('/api/messages/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: newMsg.id, user_id: userId }),
              }).catch(() => {});
            }
          });
          // Add unknown chat to sidebar — fetch real chat info to determine type
          setDynamicChats(prev => {
            if (prev.some(c => c.id === chatKey)) return prev;
            (async () => {
              try {
                const chatInfo = await api.getChat(msg.chat_id);
                if (chatInfo.type === 'group') {
                  const name = chatInfo.name ?? `Group ${msg.chat_id}`;
                  const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=group${msg.chat_id}`;
                  setDynamicChats(p => p.some(c => c.id === chatKey) ? p : [{ id: chatKey, chatId: msg.chat_id, chatType: 'group' as const, name, avatar }, ...p]);
                } else {
                  const other = await api.getUser(msg.sender_id);
                  const name = other.display_name || other.username;
                  const avatar = other.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(other.username)}`;
                  setDynamicChats(p => p.some(c => c.id === chatKey) ? p : [{ id: chatKey, chatId: msg.chat_id, chatType: 'private' as const, name, avatar }, ...p]);
                }
              } catch {}
            })();
            return prev;
          });
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!wsUnmounted.current) {
          setConnStatus(navigator.onLine ? 'reconnecting' : 'offline');
          wsReconnectTimer.current = setTimeout(() => {
            wsReconnectDelay.current = Math.min(wsReconnectDelay.current * 2, 30000);
            connect();
          }, navigator.onLine ? wsReconnectDelay.current : 5000);
        }
      };

      ws.onerror = () => {};
    }

    wsConnectRef.current = connect;
    connect();

    return () => {
      wsUnmounted.current = true;
      if (wsReconnectTimer.current) clearTimeout(wsReconnectTimer.current);
      wsConnectRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [authToken, myUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Online / offline reconnect trigger
  useEffect(() => {
    const goOnline = () => {
      if (wsConnectRef.current) {
        setConnStatus('reconnecting');
        wsConnectRef.current();
      }
    };
    const goOffline = () => setConnStatus('offline');
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const myNickname = myUser?.display_name || myUser?.username || "User";
  const myBio = myUser?.bio ?? "";

  useEffect(() => {
    const chatIdNum = parseInt(activeChat);
    if (isNaN(chatIdNum) || !myUser) return;
    (async () => {
      try {
        const { messages: rawMsgs, others_cursor } = await api.getChatMessages(chatIdNum, 50, myUser.id);
        const apiMsgs = [...rawMsgs].reverse();
        const mapped: Message[] = await Promise.all(apiMsgs.map(async (m: ApiMessage) => ({
          id: m.id,
          author: await resolveAuthor(m.sender_id, myUser.id),
          content: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateKey: new Date(m.created_at).toLocaleDateString('en-CA'),
          status: m.sender_id === myUser.id
            ? (others_cursor != null && m.id <= others_cursor ? 'read' : 'sent') as Message['status']
            : undefined,
          attachments: m.attachment_url ? [{
            name: m.attachment_name || 'attachment',
            size: m.attachment_size ? formatSize(m.attachment_size) : '',
            isImage: m.attachment_type?.startsWith('image/') ?? true,
            url: `/api/files/${m.attachment_url}`,
            ext: m.attachment_name?.split('.').pop() || '',
          }] : undefined,
        })));
        // Seed cursor so pending→sent transitions that race with WS see it immediately
        if (others_cursor != null) {
          readCursorsRef.current[activeChat] = Math.max(readCursorsRef.current[activeChat] ?? 0, others_cursor);
        }
        setHistoricalMessages(prev => ({ ...prev, [activeChat]: mapped }));
        // Mark all visible messages as read
        if (apiMsgs.length > 0) {
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: apiMsgs[apiMsgs.length - 1].id, user_id: myUser.id }),
          }).catch(() => {});
        }
      } catch {}
    })();
  }, [activeChat, myUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the ref in sync so the WS closure always sees the current active chat
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

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
  }, [chatMessages, historicalMessages, activeChat]);

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
    const all = [...(messages[id] ?? []), ...(historicalMessages[id] ?? []), ...(chatMessages[id] ?? [])];
    if (!all.length) return { lastMessage: '', lastSender: undefined, time: undefined };
    const last = all[all.length - 1];
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
      .map(c => ({ ...c, type: c.chatType === 'group' ? 'group' : 'dm', unread: 0, ...getLastMsgMeta(c.id) })),
  ];

  const seenMsgIds = new Set<number>();
  const currentMessages = [
    ...(messages[activeChat] || []),
    ...(historicalMessages[activeChat] || []),
    ...(chatMessages[activeChat] || []),
  ].filter(m => { if (seenMsgIds.has(m.id)) return false; seenMsgIds.add(m.id); return true; });
  const currentChat = chats.find(c => c.id === activeChat);
  const isGroupChat = currentChat?.type === 'group';

  async function sendMessage() {
    const text = messageInput.trim();
    if (!text && pendingAttachments.length === 0) return;
    if (!activeChat || !myUser) return;

    const attachments = [...pendingAttachments];
    setMessageInput('');
    setPendingAttachments([]);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const pendingChat = dynamicChats.find(c => c.id === activeChat && c.pendingRecipientId != null);

    if (pendingChat) {
      const firstAtt = attachments[0];
      const fd = new FormData();
      fd.append('sender_id', String(myUser.id));
      fd.append('recipient_id', String(pendingChat.pendingRecipientId!));
      fd.append('text', text || (firstAtt?.name ?? ''));
      if (firstAtt) fd.append('attachment', firstAtt.file, firstAtt.name);

      const capturedKey = activeChat;
      const tempId = Date.now() + Math.random();
      const optMsg: Message = {
        id: tempId, author: 'You', content: text, time: now, status: 'pending', dateKey: todayDateKey(),
        attachments: firstAtt ? [{ name: firstAtt.name, size: firstAtt.size, isImage: firstAtt.isImage, url: firstAtt.previewUrl || '', ext: firstAtt.ext }] : undefined,
      };
      setChatMessages(prev => ({ ...prev, [capturedKey]: [...(prev[capturedKey] ?? []), optMsg] }));

      try {
        const resp = await fetch('/api/messages/send-init', { method: 'POST', body: fd });
        if (resp.ok) {
          const json = await resp.json();
          if (json.chat_id) {
            const newKey = String(json.chat_id);
            setDynamicChats(prev => prev.map(c =>
              c.id === capturedKey
                ? { ...c, id: newKey, chatId: json.chat_id, pendingRecipientId: undefined }
                : c
            ));
            setChatMessages(prev => {
              const result: Record<string, Message[]> = {};
              for (const [k, v] of Object.entries(prev)) {
                if (k === capturedKey) {
                  result[newKey] = v.map(m => m.id === tempId ? { ...m, id: json.id || m.id, status: 'sent' as const } : m);
                } else {
                  result[k] = v;
                }
              }
              return result;
            });
            setActiveChat(prev => prev === capturedKey ? newKey : prev);
          }
        }
      } catch {}
      return;
    }

    const chatIdNum = parseInt(activeChat);
    if (isNaN(chatIdNum)) return;
    const capturedKey = activeChat;

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        const msgText = i === 0 ? text : '';
        const tempId = Date.now() + Math.random() + i * 0.001;
        const fd = new FormData();
        fd.append('chat_id', String(chatIdNum));
        fd.append('sender_id', String(myUser.id));
        fd.append('text', msgText);
        fd.append('attachment', att.file, att.name);

        const optMsg: Message = {
          id: tempId, author: 'You', content: msgText, time: now, status: 'pending', dateKey: todayDateKey(),
          attachments: [{ name: att.name, size: att.size, isImage: att.isImage, url: att.previewUrl || '', ext: att.ext }],
        };
        setChatMessages(prev => ({ ...prev, [capturedKey]: [...(prev[capturedKey] ?? []), optMsg] }));

        fetch('/api/messages/send', { method: 'POST', body: fd })
          .then(async r => {
            if (r.ok) {
              const json = await r.json();
              setChatMessages(prev => {
                const msgs = prev[capturedKey];
                if (!msgs) return prev;
                const cursor = readCursorsRef.current[capturedKey] ?? 0;
                const status = json.id <= cursor ? 'read' : 'sent';
                return { ...prev, [capturedKey]: msgs.map(m => m.id === tempId ? { ...m, id: json.id, status } : m) };
              });
            }
          })
          .catch(() => {});
      }
    } else {
      const tempId = Date.now() + Math.random();
      const optMsg: Message = { id: tempId, author: 'You', content: text, time: now, status: 'pending', dateKey: todayDateKey() };
      setChatMessages(prev => ({ ...prev, [capturedKey]: [...(prev[capturedKey] ?? []), optMsg] }));

      if (!navigator.onLine) {
        pendingQueueRef.current.push({ chatKey: capturedKey, chatIdNum, text, tempId });
        return;
      }

      const fd = new FormData();
      fd.append('chat_id', String(chatIdNum));
      fd.append('sender_id', String(myUser.id));
      fd.append('text', text);

      fetch('/api/messages/send', { method: 'POST', body: fd })
        .then(async r => {
          if (r.ok) {
            const json = await r.json();
            setChatMessages(prev => {
              const msgs = prev[capturedKey];
              if (!msgs) return prev;
              const cursor = readCursorsRef.current[capturedKey] ?? 0;
              const status = json.id <= cursor ? 'read' : 'sent';
              return { ...prev, [capturedKey]: msgs.map(m => m.id === tempId ? { ...m, id: json.id, status } : m) };
            });
          }
        })
        .catch(() => {
          setConnStatus('reconnecting');
          pendingQueueRef.current.push({ chatKey: capturedKey, chatIdNum, text, tempId });
        });
    }
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
        file,
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
                    if (!myUser) return;
                    const avatar = u.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u.username)}`;
                    const name = u.display_name || u.username;
                    const chatId = `pending-${u.id}`;
                    setDynamicChats(prev =>
                      prev.some(c => c.id === chatId)
                        ? prev
                        : [{ id: chatId, name, avatar, pendingRecipientId: u.id }, ...prev]
                    );
                    setActiveChat(chatId);
                    setNewChatOpen(false);
                    setNewChatValue('');
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
                    <div className="text-gray-500 text-xs">@{u.display_name || u.username}</div>
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
        username={myUser?.username}
        onSaveProfile={({ display_name, bio, username }) => {
          const updated = { ...myUser!, display_name, bio, username };
          setMyUser(updated);
          localStorage.setItem("authUser", JSON.stringify(updated));
        }}
        onLogout={() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          setAuthed(false);
          setMyUser(null);
          setAuthToken(null);
          setActiveChat('andrey-shmelefnik');
          setDynamicChats([]);
          setChatMessages({});
          setHistoricalMessages({});
          readCursorsRef.current = {};
          userNameCache.current.clear();
          setProfileOpen(false);
        }}
      />
      <UserProfileModal open={contactProfileOpen} onClose={() => setContactProfileOpen(false)} username={currentChat?.name ?? ""} />
      <CreateGroupModal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        myUser={myUser}
        onGroupCreated={(chat) => {
          setDynamicChats(prev =>
            prev.some(c => c.id === chat.id) ? prev : [{
              id: chat.id, chatId: chat.chatId, name: chat.name,
              avatar: chat.avatar, chatType: 'group' as const,
            }, ...prev]
          );
          setActiveChat(chat.id);
        }}
      />
      <AddGroupMembersModal
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        chatId={parseInt(activeChat)}
        myUserId={myUser?.id}
      />
      <GroupProfileModal
        open={groupProfileOpen}
        onClose={() => setGroupProfileOpen(false)}
        chatId={parseInt(activeChat)}
        groupName={currentChat?.name ?? ''}
        myUserId={myUser?.id}
        onAddMembers={() => setAddMembersOpen(true)}
      />
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
          <div className="bg-[#232332] px-6 py-[7px] border-b border-[#3a3a3a] flex items-center justify-between">
            <div>
              <h2
                className={`text-lg font-semibold mb-0.5 ${currentChat ? "cursor-pointer hover:text-purple-400 transition-colors" : ""}`}
                onClick={() => {
                  if (!currentChat) return;
                  if (isGroupChat) setGroupProfileOpen(true);
                  else setContactProfileOpen(true);
                }}
              >
                {currentChat?.name || 'Select a chat'}
              </h2>
              {currentChat && (
                isGroupChat
                  ? <span className="text-[13px] text-gray-500">Group chat</span>
                  : <span className="text-[13px] text-gray-500">Last seen recently</span>
              )}
            </div>
          </div>

          {connStatus !== 'connected' && (
            <div className={`px-4 py-1 text-xs text-center font-medium ${connStatus === 'offline' ? 'bg-red-900/70 text-red-200' : 'bg-yellow-900/70 text-yellow-200'}`}>
              {connStatus === 'offline' ? 'No internet connection' : 'Connecting…'}
            </div>
          )}

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

                const showDateMarker =
                  msg.date ||
                  (msg.dateKey && (!prev?.dateKey || prev.dateKey !== msg.dateKey));
                const dateLabel = msg.date || (msg.dateKey ? formatDateMarker(msg.dateKey) : '');

                return (
                  <div key={msg.id}>
                    {showDateMarker && dateLabel && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#3a3a3a]" />
                        <span className="text-gray-500 text-xs px-2 select-none">{dateLabel}</span>
                        <div className="flex-1 h-px bg-[#3a3a3a]" />
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && (
                        isLast
                          ? <div className="w-10 h-10 mb-2 rounded-full bg-[#3a3a53] shrink-0 overflow-hidden"><img src={avatarUrl(currentChat?.name ?? msg.author)} alt={msg.author} className="w-full h-full object-cover" /></div>
                          : <div className="w-10 shrink-0" />
                      )}

                      <div className={`max-w-[520px] my-[2px] overflow-hidden
                        ${{ small: 'text-xs', medium: 'text-sm', large: 'text-base' }[fontSize]}
                        ${isOwn ? `bg-gradient-to-r from-purple-800 to-purple-900 text-white ${roundingOwn}` : `bg-[#2f2f2f] text-gray-200 ${roundingOther}`}
                        ${hasAttachments ? '' : 'relative px-4 py-2 whitespace-pre-wrap'}`}>

                        {hasAttachments ? (
                          <>
                            {msg.attachments!.map((att, i) =>
                              att.isImage ? (
                                <div key={i}>
                                  <img src={att.url} alt={att.name} className="w-full max-h-[260px] object-cover block" />
                                  <div className={`px-3 py-2 ${isOwn ? 'bg-black/20' : 'bg-[#272727]'}`}>
                                    <div className="text-[12px] font-medium text-white/90">{att.name}</div>
                                    <div className="flex items-center mt-0.5">
                                      <span className="text-[11px] text-gray-400">{att.size}</span>
                                    </div>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.name} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">OPEN WITH</a>
                                  </div>
                                </div>
                              ) : (
                                <div key={i} className="flex items-center gap-3 px-3 py-3">
                                  <FileIconBadge ext={att.ext} size={46} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-medium text-white/90 truncate">{att.name}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{att.size}</div>
                                    <div className="flex items-center mt-1">
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.name} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">OPEN WITH</a>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                            {msg.content ? (
                              <div className="relative px-4 py-2 whitespace-pre-wrap">
                                {renderContent(msg.content)}
                                <span className={`inline-block ${isOwn ? 'w-[60px]' : 'w-[46px]'}`} />
                                <span className="absolute bottom-[4px] right-2 flex items-center gap-0.5 select-none leading-none">
                                  <span className="text-[10px] text-white/60">{msg.time}</span>
                                  {isOwn && (msg.status === 'read' ? <span className="text-[10px] text-blue-400">✓✓</span> : msg.status === 'sent' ? <span className="text-[10px] text-white/60">✓</span> : msg.status === 'pending' ? <span className="text-[10px] text-white/40">·</span> : null)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-end items-center gap-0.5 px-3 pb-1.5">
                                <span className="text-[10px] text-white/60 select-none">{msg.time}</span>
                                {isOwn && (msg.status === 'read' ? <span className="text-[10px] text-blue-400 select-none">✓✓</span> : msg.status === 'sent' ? <span className="text-[10px] text-white/60 select-none">✓</span> : msg.status === 'pending' ? <span className="text-[10px] text-white/40 select-none">·</span> : null)}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {!isOwn && isFirst && isGroupChat && (
                              <div className="text-purple-400 text-sm font-semibold mb-1">{msg.author}</div>
                            )}
                            {renderContent(msg.content)}
                            <span className={`inline-block ${isOwn ? 'w-[60px]' : 'w-[46px]'}`} />
                            <span className="absolute bottom-[4px] right-2 flex items-center gap-0.5 select-none leading-none">
                              <span className="text-[10px] text-white/60">{msg.time}</span>
                              {isOwn && (msg.status === 'read' ? <span className="text-[10px] text-blue-400">✓✓</span> : msg.status === 'sent' ? <span className="text-[10px] text-white/60">✓</span> : msg.status === 'pending' ? <span className="text-[10px] text-white/40">·</span> : null)}
                            </span>
                          </>
                        )}
                      </div>

                      {isOwn && (
                        isLast
                          ? <div className="w-10 h-10 mb-2 rounded-full bg-purple-600 shrink-0 overflow-hidden"><img src={avatarUrl(myNickname)} alt="You" className="w-full h-full object-cover" /></div>
                          : <div className="w-10 shrink-0" />
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
