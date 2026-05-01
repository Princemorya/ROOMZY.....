import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, Clock, User, Check, CheckCheck } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Message, Chat } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialChatId = searchParams.get('chatId');
  
  const [chats, setChats] = useState<(Chat & { otherUser?: any })[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatList = await Promise.all(
          snapshot.docs.map(async d => {
            const chat = { id: d.id, ...d.data() } as Chat;
            const otherId = chat.participants.find(p => p !== user.uid);
            if (!otherId) return { ...chat, otherUser: null };
            const otherSnap = await getDoc(doc(db, 'users', otherId));
            return { ...chat, otherUser: otherSnap.data() };
          })
        );
        // Sort by updatedAt desc
        chatList.sort((a, b) => b.updatedAt - a.updatedAt);
        setChats(chatList);
        
        if (initialChatId && !activeChat) {
          setActiveChat(initialChatId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error processing chats:", err);
        setLoading(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages and mark as read
  useEffect(() => {
    if (!activeChat || !user) return;

    // Mark unread messages as read
    const markAsRead = async () => {
      const messagesRef = collection(db, 'chats', activeChat, 'messages');
      const qUnread = query(
        messagesRef, 
        where('receiverId', '==', user.uid), 
        where('read', '==', false)
      );
      const unreadSnap = await getDocs(qUnread);
      if (!unreadSnap.empty) {
        const batch = writeBatch(db);
        unreadSnap.docs.forEach(d => {
          batch.update(d.ref, { read: true });
        });
        await batch.commit();
      }
    };

    markAsRead();

    // Listen for messages
    const messagesRef = collection(db, 'chats', activeChat, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      setMessages(msgList);
      
      // Also mark incoming messages as read if chat is active
      const hasNewUnread = snapshot.docChanges().some(change => 
        change.type === 'added' && 
        change.doc.data().receiverId === user.uid && 
        !change.doc.data().read
      );
      if (hasNewUnread) markAsRead();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `chats/${activeChat}/messages`);
    });

    return () => unsubscribe();
  }, [activeChat, user]);

  const handleTyping = async (text: string) => {
    setNewMessage(text);
    if (!activeChat || !user) return;

    await updateDoc(doc(db, 'chats', activeChat), {
      [`typing.${user.uid}`]: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await updateDoc(doc(db, 'chats', activeChat), {
        [`typing.${user.uid}`]: false
      });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const chat = chats.find(c => c.id === activeChat);
    const receiverId = chat?.participants.find(p => p !== user.uid);

    try {
      const message = {
        chatId: activeChat,
        senderId: user.uid,
        receiverId,
        content: newMessage,
        timestamp: Date.now(),
        read: false
      };
      
      setNewMessage('');
      
      // Clear typing status immediately
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await updateDoc(doc(db, 'chats', activeChat), {
        [`typing.${user.uid}`]: false
      });

      await addDoc(collection(db, 'chats', activeChat, 'messages'), message);
      
      await updateDoc(doc(db, 'chats', activeChat), {
        lastMessage: newMessage,
        updatedAt: Date.now()
      });
      
    } catch (err) {
      console.error(err);
    }
  };

  const activeChatData = chats.find(c => c.id === activeChat);
  const isOtherTyping = activeChatData?.typing?.[activeChatData.participants.find(p => p !== user?.uid)!];

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-3xl border border-neutral-100 bg-white">
      {/* Sidebar: Chat List */}
      <div className="w-80 border-r border-neutral-100 flex flex-col">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              placeholder="Search chats..."
              className="w-full rounded-xl bg-neutral-50 px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 transition-all text-left relative",
                activeChat === chat.id ? "bg-orange-50" : "hover:bg-neutral-50"
              )}
            >
              {activeChat === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />}
              <div className="h-12 w-12 rounded-full border-2 border-white shadow-sm bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 overflow-hidden shrink-0">
                {chat.otherUser?.photoURL ? (
                  <img src={chat.otherUser.photoURL} className="h-full w-full object-cover" alt="" />
                ) : (
                  chat.otherUser?.displayName?.[0] || '?'
                )}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="font-bold text-neutral-900 truncate">{chat.otherUser?.displayName}</h3>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider shrink-0">
                    {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {chat.typing?.[chat.participants.find(p => p !== user?.uid)!] ? (
                    <span className="text-xs font-bold text-orange-600 animate-pulse">Typing...</span>
                  ) : (
                    <p className="text-xs text-neutral-500 truncate">{chat.lastMessage || 'Start a conversation'}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-grow flex flex-col bg-neutral-50/30">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 overflow-hidden">
                  {activeChatData?.otherUser?.photoURL ? (
                    <img src={activeChatData.otherUser.photoURL} className="h-full w-full object-cover" alt="" />
                  ) : (
                    activeChatData?.otherUser?.displayName[0]
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 leading-none">{activeChatData?.otherUser?.displayName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Active Now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col group",
                    msg.senderId === user?.uid ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] rounded-2xl p-4 shadow-sm relative",
                    msg.senderId === user?.uid 
                      ? "bg-orange-600 text-white rounded-tr-none" 
                      : "bg-white border border-neutral-100 rounded-tl-none"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  </div>
                  <div className={cn(
                    "mt-1.5 flex items-center gap-2",
                    msg.senderId === user?.uid ? "flex-row" : "flex-row-reverse"
                  )}>
                    <span className="text-[10px] text-neutral-400 font-bold">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderId === user?.uid && (
                      <div className="flex items-center">
                        {msg.read ? (
                          <CheckCheck className="h-3 w-3 text-orange-600" />
                        ) : (
                          <Check className="h-3 w-3 text-neutral-300" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isOtherTyping && (
                <div className="flex items-start">
                  <div className="bg-white border border-neutral-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex gap-1">
                    <div className="h-1.5 w-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 bg-neutral-300 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-neutral-100">
              <div className="relative">
                <input 
                  value={newMessage}
                  onChange={e => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 py-4 pl-6 pr-16 outline-none focus:ring-2 focus:ring-orange-100 transition-all font-medium text-sm"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 disabled:opacity-50 disabled:bg-neutral-200 transition-all shadow-lg shadow-orange-100"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow space-y-4">
            <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <MessageSquare className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-neutral-900">Your Inbox</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">Click on a conversation to start chatting with your property host or tenants.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
