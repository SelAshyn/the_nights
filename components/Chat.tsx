'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================
type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_name: string;
  user2_name: string;
  updated_at: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

// ============================================
// CHAT COMPONENT
// ============================================
export function Chat() {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    initChat();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      markAsRead();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Session error (this is expected if offline):', error.message);
        return;
      }
      if (session?.user) {
        setUserId(session.user.id);
        loadConversations();
      }
    } catch (err) {
      console.warn('Chat init error (network issue):', err);
    }
  };

  // ============================================
  // DATA LOADING
  // ============================================
  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        // Silently handle - table might not exist yet
        setConversations([]);
        return;
      }

      // Fetch names from profiles for each conversation
      if (data && data.length > 0) {
        const conversationsWithNames = await Promise.all(
          data.map(async (conv) => {
            const otherUserId = conv.user1_id === session.user.id ? conv.user2_id : conv.user1_id;

            // Get the other user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', otherUserId)
              .single();

            // Update conversation with actual name
            return {
              ...conv,
              user1_name: conv.user1_id === session.user.id
                ? session.user.user_metadata?.full_name || session.user.email || 'You'
                : profile?.full_name || profile?.email || 'User',
              user2_name: conv.user2_id === session.user.id
                ? session.user.user_metadata?.full_name || session.user.email || 'You'
                : profile?.full_name || profile?.email || 'User'
            };
          })
        );
        setConversations(conversationsWithNames);
      } else {
        setConversations(data || []);
      }

      // Get unread count
      const { data: countData, error: countError } = await supabase.rpc('get_unread_count', {
        p_user_id: session.user.id
      });

      if (countError) {
        console.error('Error getting unread count:', countError);
      } else {
        setUnreadCount(countData || 0);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error?.message || error || 'Unknown error');
    }
  };

  const loadMessages = async () => {
    if (!activeConversation) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // ============================================
  // ACTIONS
  // ============================================
  const markAsRead = async () => {
    if (!activeConversation) return;

    try {
      await supabase.rpc('mark_conversation_read', {
        p_conversation_id: activeConversation.id
      });
      loadConversations(); // Refresh unread count
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: userId,
          content: input.trim()
        });

      if (error) throw error;
      setInput('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getOtherUser = (conv: Conversation) => {
    if (conv.user1_id === userId) {
      return { id: conv.user2_id, name: conv.user2_name || 'User' };
    }
    return { id: conv.user1_id, name: conv.user1_name || 'User' };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // RENDER: CLOSED STATE
  // ============================================
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl shadow-teal-500/30 z-50 transition-all hover:scale-110"
        aria-label="Open chat"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // ============================================
  // RENDER: CONVERSATION LIST
  // ============================================
  if (!activeConversation) {
    return (
      <div className="fixed bottom-6 left-6 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-500/30 w-[400px] h-[500px] flex flex-col z-50">
        {/* Header */}
        <div className="p-4 border-b border-teal-500/30 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Messages</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="w-full p-4 rounded-xl hover:bg-slate-700/50 transition-colors text-left mb-2 border border-transparent hover:border-teal-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-teal-500/20">
                        {other.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{other.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: CHAT WINDOW
  // ============================================
  const otherUser = getOtherUser(activeConversation);

  return (
    <div className="fixed bottom-6 w-[450px] left-6 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-500/30 h-[500px] flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-teal-500/30 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveConversation(null)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {otherUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold">{otherUser.name}</h3>
              <p className="text-xs text-white/80">Online</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveConversation(null);
              setIsOpen(false);
            }}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.sender_id === userId
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-slate-700/50 backdrop-blur-sm border border-teal-500/30 text-white'
              }`}
            >
              <p className="text-sm break-words">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender_id === userId ? 'text-white/70' : 'text-slate-400'
                }`}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-teal-500/30 bg-slate-800/90 rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-teal-500/30 bg-slate-700/50 backdrop-blur-sm text-white placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-full px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-teal-500/20"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

