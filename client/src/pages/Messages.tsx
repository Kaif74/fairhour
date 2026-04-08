import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { getConversationMessages, getConversations, markConversationRead } from '../api/conversations';
import { ApiConversation, ApiMessage } from '../types';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { formatRelativeDate, getAvatarUrl } from '../utils';

type LocalMessage = ApiMessage & {
  optimistic?: boolean;
  clientId?: string;
};

const formatMessageTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatPreviewTime = (timestamp?: string | null): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return formatRelativeDate(timestamp);
};

const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const refreshConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      if (data.length === 0) {
        setActiveConversationId(null);
        return;
      }

      if (!activeConversationId) {
        setActiveConversationId(data[0].id);
        return;
      }

      const stillExists = data.some((conversation) => conversation.id === activeConversationId);
      if (!stillExists) {
        setActiveConversationId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations.');
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await refreshConversations();
      setIsLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    if (!socket) return;

    const handleIncoming = (payload: {
      conversationId: string;
      message: ApiMessage;
      clientId?: string | null;
    }) => {
      setConversations((prev) => {
        const updated = prev.map((conversation) => {
          if (conversation.id !== payload.conversationId) {
            return conversation;
          }

          const unreadIncrement =
            payload.message.senderId !== user.id &&
            activeConversationIdRef.current !== conversation.id
              ? 1
              : 0;

          return {
            ...conversation,
            lastMessage: payload.message,
            lastMessageAt: payload.message.createdAt,
            unreadCount: conversation.unreadCount + unreadIncrement,
          };
        });

        return updated.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
      });

      if (payload.conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          const existingIndex = payload.clientId
            ? prev.findIndex((message) => message.id === payload.clientId)
            : -1;

          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = payload.message;
            return next;
          }

          return [...prev, payload.message];
        });

        if (payload.message.senderId !== user.id) {
          const socket = connectSocket();
          socket?.emit('mark_read', { conversationId: payload.conversationId });
        }
      }
    };

    const handleRead = (payload: { conversationId: string; readerId: string; readAt: string }) => {
      if (payload.conversationId !== activeConversationIdRef.current) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (message.senderId === user.id && !message.readAt) {
            return { ...message, readAt: payload.readAt };
          }
          return message;
        })
      );
    };

    socket.on('message_received', handleIncoming);
    socket.on('mark_read', handleRead);

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Realtime connection failed. Messages will still load.');
    });

    return () => {
      socket.off('message_received', handleIncoming);
      socket.off('mark_read', handleRead);
      socket.off('connect_error');
      disconnectSocket();
    };
  }, [user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }

      setError(null);
      setIsMessagesLoading(true);
      try {
        const data = await getConversationMessages(activeConversationId);
        setMessages(data?.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages.');
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );

      const socket = connectSocket();
      if (socket) {
        socket.emit('join_conversation', { conversationId: activeConversationId });
        socket.emit('mark_read', { conversationId: activeConversationId });
      } else {
        await markConversationRead(activeConversationId);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !activeConversationId || !user) return;
    if (activeConversation?.status === 'LOCKED') return;

    setError(null);
    const content = inputText.trim();
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage: LocalMessage = {
      id: clientId,
      conversationId: activeConversationId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
      optimistic: true,
      clientId,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              lastMessage: optimisticMessage,
              lastMessageAt: optimisticMessage.createdAt,
            }
          : conversation
      )
    );

    setInputText('');

    const socket = connectSocket();
    if (!socket) {
      setError('Realtime connection unavailable.');
      return;
    }

    socket.emit(
      'send_message',
      { conversationId: activeConversationId, content, clientId },
      (response: { success: boolean; message?: ApiMessage }) => {
        if (response?.success) {
          return;
        }

        setMessages((prev) => prev.filter((message) => message.id !== clientId));
        setError(typeof response?.message === 'string' ? response.message : 'Failed to send message.');
      }
    );
  };

  const openExchange = () => {
    if (!activeConversation?.exchangeId) return;
    navigate(`/activity?exchange=${activeConversation.exchangeId}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-20 pb-4 h-screen flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full h-full">
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden flex h-[calc(100vh-8rem)]">
            {/* Sidebar List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {isLoading ? (
                  <div className="p-6 text-sm text-gray-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No conversations yet.</div>
                ) : (
                  conversations.map((conversation) => {
                    const isActive = activeConversationId === conversation.id;
                    const statusLabel = conversation.status === 'ACTIVE' ? 'Active' : 'Completed';
                    const avatarUrl = getAvatarUrl(
                      conversation.otherUser.name,
                      conversation.otherUser.profileImageUrl
                    );
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setActiveConversationId(conversation.id)}
                        className={`p-4 flex gap-3 cursor-pointer transition-colors border-l-4 ${
                          isActive
                            ? 'bg-brand-50/30 border-brand-500'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={avatarUrl}
                            alt={conversation.otherUser.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {conversation.status === 'ACTIVE' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1 gap-2">
                            <h4
                              className={`font-bold truncate ${
                                isActive ? 'text-brand-900' : 'text-gray-900'
                              }`}
                            >
                              {conversation.otherUser.name}
                            </h4>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatPreviewTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-brand-600 mb-1 truncate">
                            {conversation.serviceTitle || 'Time Exchange'} - {statusLabel}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm truncate ${
                                conversation.unreadCount > 0
                                  ? 'font-bold text-gray-900'
                                  : 'text-gray-500'
                              }`}
                            >
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="text-xs bg-brand-600 text-white rounded-full px-2 py-0.5">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col bg-white">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex items-center">
                      <img
                        src={getAvatarUrl(
                          activeConversation.otherUser.name,
                          activeConversation.otherUser.profileImageUrl
                        )}
                        alt={activeConversation.otherUser.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {activeConversation.otherUser.name}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              activeConversation.status === 'ACTIVE'
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                          ></span>
                          {activeConversation.serviceTitle || 'Time Exchange'} -{' '}
                          {activeConversation.status === 'ACTIVE' ? 'Active' : 'Completed'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeConversation.exchangeId && (
                        <Button size="sm" variant="secondary" className="mr-2" onClick={openExchange}>
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Open Exchange
                        </Button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                    {isMessagesLoading ? (
                      <div className="text-sm text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-gray-500">No messages yet.</div>
                    ) : (
                      messages.map((message) => {
                        const isMe = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                              <div
                                className={`px-5 py-3 rounded-2xl shadow-sm ${
                                  isMe
                                    ? 'bg-brand-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <div
                                className={`flex items-center mt-1 text-xs text-gray-400 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span>{formatMessageTime(message.createdAt)}</span>
                                {isMe && (
                                  <>
                                    {message.optimistic ? (
                                      <Clock className="w-3 h-3 ml-1" />
                                    ) : message.readAt ? (
                                      <CheckCheck className="w-3 h-3 ml-1" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 ml-1" />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          activeConversation.status === 'LOCKED'
                            ? 'This conversation is read-only.'
                            : 'Type your message...'
                        }
                        disabled={activeConversation.status === 'LOCKED'}
                        className="flex-1 bg-gray-50 border-transparent focus:border-brand-300 focus:bg-white focus:ring-0 rounded-xl px-4 py-3 disabled:opacity-60"
                      />
                      <Button
                        type="submit"
                        size="md"
                        className="rounded-xl px-4 shadow-none"
                        disabled={activeConversation.status === 'LOCKED'}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                  <p>Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Messages;
