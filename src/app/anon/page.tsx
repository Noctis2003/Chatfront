"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';

import bong from "../../../public/svg/bong.svg";
import bubble from "../../../public/svg/bubble.svg";
import cupid from "../../../public/svg/cupid.svg";
import faebook from "../../../public/svg/faebook.svg";
import lsdlove from "../../../public/svg/lsdlove.svg";
import loveu from "../../../public/svg/loveu.svg";
import love2 from "../../../public/svg/love2.svg";
import mexicanskull from "../../../public/svg/mexicanskull.svg";
import rooster from "../../../public/svg/rooster.svg";
import angry from "../../../public/svg/angry.svg";
import beer from "../../../public/svg/beer.svg";
import car from "../../../public/svg/car.svg";
import clown from "../../../public/svg/clown.svg";
import dislike from "../../../public/svg/dislike.svg";
import draw from "../../../public/svg/draw.svg";
import drug from "../../../public/svg/drug.svg";
import emoji from "../../../public/svg/emoji.svg";
import floater from "../../../public/svg/floater.svg";
import joint from "../../../public/svg/joint.svg";
import lgbt from "../../../public/svg/lgbt.svg";
import lighter from "../../../public/svg/lighter.svg";
import love from "../../../public/svg/love.svg";
import lsd from "../../../public/svg/lsd.svg";
import mushroom from "../../../public/svg/mushroom.svg";
import park from "../../../public/svg/park.svg";
import party from "../../../public/svg/party.svg";
import rabbit from "../../../public/svg/rabbit.svg";
import star from "../../../public/svg/star.svg";
import tiktok from "../../../public/svg/tiktok.svg";

const svgs = [
  bong, bubble, cupid, faebook, lsdlove, loveu, love2, mexicanskull, rooster,
  angry, beer, car, clown, dislike, draw, drug, emoji, floater, joint, lgbt,
  lighter, love, lsd, mushroom, park, party, rabbit, star, tiktok,
];

interface StyledSvg {
  src: string;
  style: React.CSSProperties;
}

type Reaction = {
  emoji: string;
  count: number;
};

type Message = {
  id: string;
  roomKey: string;
  author: string;
  text: string;
  timestamp: string;
  replyTo?: string;
  reactions: Reaction[];
  myReaction?: string | null;
  dominantReaction?: string | null;
};

type ServerToClientEvents = {
  "chat message": (msg: Message) => void;
  "message updated": (updatedMessage: Message) => void;
};

type ClientToServerEvents = {
  "chat message": (roomKey: string, msg: Message) => void;
  "chat reaction": (payload: { messageId: string; emoji: string }) => void;
  "joinRoom": (roomKey: string) => void;
};

const availableReactions = ["👍", "👎", "😂", "😡", "😮"];
const reactionColors: Record<string, string> = {
  '👍': '#4CAF50', // green — positive/approval
  '👎': '#D2B48C', // brown — disapproval/meh
  '😂': '#FFD700', // gold — joy/laughter
  '😡': '#F44336', // red — anger
  '😢': '#5C9BD6', // muted blue — sadness
  '😮': '#E100FF', // cyan — shocked
};

// Helper: apply an optimistic reaction change to a message's reactions array.
// userPrev = the emoji the user had before (or null), userNext = new emoji (or null for remove).
function applyOptimisticReaction(
  reactions: Reaction[],
  prevEmoji: string | null,
  nextEmoji: string | null
): Reaction[] {
  let updated = reactions.map(r => ({ ...r })); // shallow clone each

  // Decrement the old emoji count
  if (prevEmoji) {
    updated = updated
      .map(r => r.emoji === prevEmoji ? { ...r, count: r.count - 1 } : r)
      .filter(r => r.count > 0);
  }

  // Increment (or add) the new emoji count
  if (nextEmoji) {
    const existing = updated.find(r => r.emoji === nextEmoji);
    if (existing) {
      updated = updated.map(r =>
        r.emoji === nextEmoji ? { ...r, count: r.count + 1 } : r
      );
    } else {
      updated = [...updated, { emoji: nextEmoji, count: 1 }];
    }
  }

  return updated;
}


export default function Chat(): React.ReactElement {
  const [messageInput, setMessageInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [styledSvgs, setStyledSvgs] = useState<StyledSvg[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [loading, setloading] = useState<boolean>(true);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Track which emoji the current user has set per message: { [messageId]: emoji | null }
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({});

const forceScrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
};

  // Set current user once on mount
  useEffect(() => {
    const user = `${localStorage.getItem("room_key") || 'anonymous'}` + Math.floor(Math.random() * 100000);
    setCurrentUser(user);
    setRoomKey(localStorage.getItem("room_key"));
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('chat_id');
    if (storedToken) {
      setToken(storedToken);
    } else {
      fetch('/api/genid')
        .then(res => res.json())
        .then(data => {
          localStorage.setItem('chat_id', data.token);
          setToken(data.token);
        });
    }
  }, []);

  // Background SVGs layout
  useEffect(() => {
    const numSvgs = svgs.length;
    const numCols = 6;
    const numRows = Math.ceil(numSvgs / numCols);

    const newSvgs = svgs.map((src, index) => {
      const row = Math.floor(index / numCols);
      const col = index % numCols;
      const left = ((col + Math.random() * 0.8 + 0.1) / numCols) * 100;
      const top = ((row + Math.random() * 0.8 + 0.1) / numRows) * 100;
      const transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
      return {
        src,
        style: {
          position: "absolute" as const,
          top: `${top}%`,
          left: `${left}%`,
          transform,
        },
      };
    });
    setStyledSvgs(newSvgs);
  }, []);

  // Fake online users count
  useEffect(() => {
    const randomUsers = Math.floor(Math.random() * 50) + 15;
    setOnlineUsers(randomUsers);
  }, []);

  // Socket setup — only once on mount
  useEffect(() => {
    const socket = io("https://chatserver-713317371199.asia-south2.run.app/",{
      auth: { currentRoom: localStorage.getItem('room_key') }
    });
    socketRef.current = socket;

    const newMessageHandler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const updateMessageHandler = (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    };

    socket.on("chat message", newMessageHandler);
    socket.on("message updated", updateMessageHandler);

    return () => {
      socket.off("chat message", newMessageHandler);
      socket.off("message updated", updateMessageHandler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Room switch — reset ALL pagination state before fetching
  useEffect(() => {
  if (!roomKey || !token) return; // wait until token is ready
  
  setMessages([]);
  setCursor(null);
  setHasMoreMessages(false);
  setUserReactions({});
  didMount.current = false;

  if (socketRef.current) {
    socketRef.current.emit('joinRoom', roomKey);
  }

  const fetchMessages = async () => {
    setloading(true);
    try {
    
      const res = await fetch(`/api/messages?room=${roomKey}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        console.log("Fetched messages for room:", roomKey, data.messages);
         console.log("Initial messages loaded:", data.messages);
        // Seed userReactions so active emoji state is correct on load
        const seedReactions: Record<string, string | null> = {};
        for (const msg of data.messages) {
          if (msg.myReaction) seedReactions[msg.id] = msg.myReaction;
        }
        setUserReactions(seedReactions);

        setCursor(data.nextCursor);
        setHasMoreMessages(!!data.nextCursor);
      }
    } finally {
      setloading(false);
      console.log("Initial fetch completed, loading set to false");
      requestAnimationFrame(() => forceScrollToBottom());
      setTimeout(() => { didMount.current = true; }, 500);
    }
  };

  fetchMessages();
}, [roomKey, token]); // token added here

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreMessages && !loading && didMount.current) {
          loadMoreMessages();
        }
      },
      { root: container, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreMessages, loading, cursor]);

  const isNearBottom = (): boolean => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 150;
  };

  const scrollToBottom = () => {
    if (!isNearBottom()) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreMessages = async () => {
    if (!cursor || loading) return;
    const el = containerRef.current;
    if (!el) return;

    setloading(true);
    const prevScrollHeight = el.scrollHeight;

    const res = await fetch(`/api/messages?room=${roomKey}&cursor=${cursor}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // Seed userReactions for the older messages
    setUserReactions(prev => {
      const updated = { ...prev };
      for (const msg of data.messages) {
        if (msg.myReaction) updated[msg.id] = msg.myReaction;
      }
      return updated;
    });

    setMessages((prevMessages) => [...data.messages, ...prevMessages]);
    setCursor(data.nextCursor);
    setHasMoreMessages(!!data.nextCursor);
    setloading(false);

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - prevScrollHeight;
    });
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: uuidv4(),
      author: currentUser,
      text: messageInput,
      roomKey: roomKey || 'global',
      timestamp: String(new Date()),
      reactions: [],
      ...(replyingTo && { replyTo: replyingTo.id }),
    };

    if (roomKey) {
      socketRef.current?.emit("chat message", roomKey, newMessage);
    }
    setMessageInput("");
    setReplyingTo(null);
  };

  /**
   * Optimistic reaction handler:
   * 1. Compute the next state immediately
   * 2. Update local messages + userReactions state
   * 3. Fire API call in the background
   * 4. On failure, roll back both states
   */
  const sendReaction = async (messageId: string, emoji: string) => {
    if (!token) return;

    const prevEmoji = userReactions[messageId] ?? null;
    // Toggle off if clicking the same emoji, otherwise switch to new one
    const nextEmoji = prevEmoji === emoji ? null : emoji;

    // --- Snapshot for rollback ---
    const prevMessages = messages;
    const prevUserReactions = userReactions;

    // --- Optimistic update ---
    setUserReactions(prev => ({ ...prev, [messageId]: nextEmoji }));
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, reactions: applyOptimisticReaction(msg.reactions, prevEmoji, nextEmoji) }
          : msg
      )
    );

    // --- API call ---
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userSecret: token, emoji }),
      });

      if (!res.ok) throw new Error('Reaction API failed');
    } catch (err) {
      // --- Rollback on failure ---
      console.error('Reaction failed, rolling back:', err);
      setMessages(prevMessages);
      setUserReactions(prevUserReactions);
    }
  };

  // Reusable reaction bar component logic
  const ReactionBar = ({ message }: { message: Message }) => {
    const myReaction = userReactions[message.id] ?? null;

    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {availableReactions.map(emojiChar => {
            const isActive = myReaction === emojiChar;
            return (
              <button
                key={emojiChar}
                onClick={() => sendReaction(message.id, emojiChar)}
                className={`text-xs transition-all duration-150 rounded-full px-1 py-0.5
                  ${isActive
                    ? 'scale-125 opacity-100 bg-blue-500/30 ring-1 ring-blue-400/60'
                    : 'hover:scale-110 opacity-60 hover:opacity-100'
                  }`}
                title={isActive ? `Remove ${emojiChar}` : `React with ${emojiChar}`}
              >
                {emojiChar}
              </button>
            );
          })}
        </div>
        {message.reactions.length > 0 && (
          <div className="flex items-center space-x-1">
           
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full relative bg-gray-900 text-white font-sans grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] overflow-hidden">
      {/* Background SVGs */}
      <div className="fixed h-full w-full overflow-hidden z-50 pointer-events-none flex">
        {styledSvgs.map((svg, index) => (
          <Image
            key={index}
            src={svg.src}
            alt="background-icon"
            className="w-[40px] opacity-20"
            style={svg.style}
            width={40}
            height={40}
          />
        ))}
      </div>

      {/* Left Sidebar */}
      <div className="hidden md:flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/10 p-4">
        <div className="font-bold text-xl mb-6">Anon</div>

        <div className="relative z-10 mb-6">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 shadow-lg">
            <div className="flex">
              <button
                onClick={() => setRoomKey(localStorage.getItem("room_key") || 'global')}
                className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  roomKey !== 'global'
                    ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {roomKey ? `${localStorage.getItem("room_key")}` : 'global'}
              </button>
              <button
                onClick={() => setRoomKey('global')}
                className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  roomKey === 'global'
                    ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Global
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/70 text-sm">
                {onlineUsers} user{onlineUsers !== 1 ? 's' : ''} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="relative flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">AnonChat</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70 text-sm">{onlineUsers} online</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 shadow-lg">
              <div className="flex">
                <button
                  onClick={() => setRoomKey(localStorage.getItem("room_key") || 'global')}
                  className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    roomKey !== 'global'
                      ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {roomKey ? `${localStorage.getItem("room_key")}` : 'global'}
                </button>
                <button
                  onClick={() => setRoomKey('global')}
                  className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    roomKey === 'global'
                      ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Global
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Display Area */}
        <div ref={containerRef} className="relative z-10 flex-grow p-4 overflow-y-auto">
          <div ref={topSentinelRef}></div>
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-400">Loading messages...</span>
            </div>
          )}
          <div className="space-y-3">
            {messages
              .filter(m => !m.replyTo)
              .map((message) => {
                const replies = messages.filter(msg => msg.replyTo === message.id);
                return (
                  <div key={message.id}>
                    {/* Main Message */}
                    <div   style={{
      backgroundColor: message.dominantReaction
        ? `${reactionColors[message.dominantReaction]}22`
        : undefined,
      transition: 'background-color 0.4s ease',
    }} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-blue-400 text-sm">{message.author}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm mb-3">{message.text}</p>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="text-xs text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>Reply</span>
                        </button>
                        <ReactionBar message={message} />
                      </div>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-600 pl-4">
                        {replies.map((reply) => (
                          <div   style={{
      backgroundColor: reply.dominantReaction
        ? `${reactionColors[reply.dominantReaction]}22`
        : undefined,
      transition: 'background-color 0.4s ease',
    }} key={reply.id} className="bg-white/3 rounded-lg p-3 hover:bg-white/8 transition-colors">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-blue-400 text-sm">{reply.author}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.timestamp).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm mb-3">{reply.text}</p>
                            <ReactionBar message={reply} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area */}
        <div className="relative z-10 p-4 backdrop-blur-md bg-white/5 border-t border-white/20 bottom-0">
          {replyingTo && (
            <div className="text-sm text-gray-400 mb-2 px-2">
              Replying to <span className="font-semibold text-blue-400">@{replyingTo.author}</span>
              <button onClick={() => setReplyingTo(null)} className="ml-2 text-red-500 font-bold">
                [Cancel]
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-center space-x-4">
            <input
              className="flex-grow backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-white placeholder-white/60"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="group relative backdrop-blur-md bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 border border-blue-400/30 rounded-full p-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              disabled={!messageInput.trim()}
            >
              <svg
                className="w-5 h-5 text-white transform group-hover:translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-l border-white/10 overflow-hidden">
        <div className="relative z-10 p-4 text-center">
          <h3 className="font-semibold text-lg text-white/80">Welcome!</h3>
          <div className="text-sm text-white/60 mt-2 text-left">
            <ul className="list-disc list-inside space-y-2">
              <li>Anonymous & location-based: messages are visible to users in the same room or area. Do not assume messages are private.</li>
              <li>Stay civil: no harassment, hate speech, doxxing, threats, or calls for illegal activity. Keep the space respectful.</li>
              <li>Safety & moderation: we may log metadata (IP, timestamps) to prevent abuse. Abusive behavior may result in account or IP restrictions.</li>
              <li>Privacy: avoid posting personal data (emails, phone numbers, addresses). This is an anonymous space — protect your identity.</li>
              <li>Ephemeral mindset: messages may not be stored permanently. Treat the chat like a public, short-lived conversation.</li>
              <li>Report problems: if you see abusive content, use any available report controls or contact moderators. Provide timestamps for faster action.</li>
              <li>No legal advice: we are not responsible for the consequences of the content shared here.</li>
              <li>Have fun, be creative, and respect others — that keeps this community healthy.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
