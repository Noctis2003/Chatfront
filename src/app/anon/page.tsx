// kal tak the hum gareeb
// aaj hum milte nahi
"use client";
import React, { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid'; // A library to generate unique IDs
// in a chat app it is really important to have a single socket connection
// otherwise if we create a new connection on every render, it will be a mess
// why does one have to come in a formal dress for a company interview ?
// just need the parent id

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
  bong,
  bubble,
  cupid,
  faebook,
  lsdlove,
  loveu,
  love2,
  mexicanskull,
  rooster,
  angry,
  beer,
  car,
  clown,
  dislike,
  draw,   
  drug,
  emoji,
  floater,
  joint,
  lgbt,
  lighter,
  love,
  lsd,
  mushroom,
  park,
  party,
  rabbit,
  star,
  tiktok,
];

interface StyledSvg {
  src: string 
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
};

// --- Socket.IO Event Types ---
// Updated to handle complex Message objects and new reaction events
type ServerToClientEvents = {
  "chat message": (msg: Message) => void;  // these are basically event listeners
  "message updated": (updatedMessage: Message) => void; // message upadted is useless
};



type ClientToServerEvents = {
  "chat message": (roomKey: string, msg: Message) => void;
  "chat reaction": (payload: { messageId: string; emoji: string }) => void;
  "joinRoom": (roomKey: string) => void;
};
// booze booze
const availableReactions = ["👍", "👎", "😂", "😡", "😢"];

export default function Chat(): React.ReactElement {
  const [messageInput, setMessageInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  // State to track which message we are replying to
  const [replyingTo, setReplyingTo] = useState<Message | null>(null); 
  const [styledSvgs, setStyledSvgs] = useState<StyledSvg[]>([]);
  const [chatMode, setChatMode] = useState<'local' | 'global'>('local');
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [loading,setloading]=useState<boolean>(true);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);
  useEffect(() => {
    const user = `${localStorage.getItem("room_key") || 'anonymous'}` + Math.floor(Math.random() * 100000);
    setCurrentUser(user);
  }, [roomKey]);

  
  // what are these kinda events ?
  // These are Socket.IO events for real-time communication
  // "chat message": Sent when a new chat message is created
  // "message updated": Sent when an existing message is updated (e.g., a reaction is added)
  // scrolltobottom function
  // to keep the chat scrolled to the latest message
  // loadmore function 
  // i do not want it to run on the first render



  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null); // to prevent multiple connections
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isNearBottom = (): boolean => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 150; // px from the bottom
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const scrollToBottom = () => {
    if (!isNearBottom()) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
// how do they work and why do they work?
  useEffect(() => {
    const numSvgs = svgs.length;
    const numCols = 6;
    const numRows = Math.ceil(numSvgs / numCols);
   
    setRoomKey(localStorage.getItem("room_key"));
  // let us ser3t messages now 
    const newSvgs = svgs.map((src, index) => {
      const row = Math.floor(index / numCols);
      const col = index % numCols;

      // Add a random offset within each grid cell for a more organic look
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

  
useEffect(() => {
  const intervalId = setInterval(() => {
   didMount.current = true;
  }, 1000);

  return () => {
    clearInterval(intervalId);
  };
}, []);
  useEffect(() => {
    // Simulate getting online user count (replace with real socket event)
    const randomUsers = Math.floor(Math.random() * 50) + 15; // 15-64 users
    setOnlineUsers(randomUsers);
      
    // You can replace this with a real socket event like:
    // socket.on("user count", (count) => setOnlineUsers(count));
  }, []);

  

  useEffect(() => {
    // --- Socket Connection and Event Handlers ---
    const socket = io("https://chatserverv0-0-1.onrender.com/");
    socketRef.current = socket;  

    // this will basically update the the messages on once recieved on the server on the client side
    const newMessageHandler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Listener for updates to existing messages (e.g., new reactions)
    const updateMessageHandler = (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    };

  // Listener for new messages
    socket.on("chat message", newMessageHandler);
    socket.on("message updated", updateMessageHandler);
    // Cleanup on unmount
    // this will prevent memory leaks
    // say when the user navigates away from the chat page
    // then we need to clean up the socket connections
    
    return () => {
      socket.off("chat message", newMessageHandler);
      socket.off("message updated", updateMessageHandler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

 
 
 
 
 
 
 
 const loadMoreMessages = async () => {
      if (!cursor || loading) return;
      const el= containerRef.current;
      if(!el) return;
      setloading(true);
      const prevScrollHeight = el.scrollHeight;
      const res=await fetch(`/api/messages?room=${roomKey}&cursor=${cursor}`);
      const data=await res.json();
      console.log("Loaded more messages:", data);
      setMessages((prevMessages) => [...data.messages, ...prevMessages]);
      setCursor(data.nextCursor);
      setHasMoreMessages(!!data.nextCursor);
      setloading(false);
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight;
      }
      );
    };
 
  useEffect(() => {
    setloading(true);
    if (roomKey && socketRef.current) {
      console.log("Joining room:", roomKey);
      socketRef.current?.emit('joinRoom', roomKey );
    }

    const fetchMessages = async () => {
      if (!roomKey) return;
      const res = await fetch(`/api/messages?room=${roomKey}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched messages:", data);
        setMessages(data.messages);
        setCursor(data.nextCursor);
        setHasMoreMessages(!!data.nextCursor);
        
       
      } else {
        console.error("Failed to fetch messages for room:", roomKey);
      }
  
    };
    fetchMessages();
    
    setloading(false);
    
  }, [roomKey]);
 
  useEffect(() => {
    setRoomKey(localStorage.getItem("room_key"));
  }, []);

 

useEffect(() => {
 
  scrollToBottom();
 
}, [messages]);
  
  // this is the primary cause of all the scroll related bugs

  

  // --- Event Emitters ---
  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // Construct the new message object
    const newMessage: Message = {
      id: uuidv4(),
      author: currentUser,
      text: messageInput,
      roomKey: roomKey || 'global',
      timestamp: String(new Date()), // this is a mismatch here that is causing the bug here
      reactions: [],
      ...(replyingTo && { replyTo: replyingTo.id }), // Add replyTo field if replying
    };

    if (roomKey) {
      socketRef.current?.emit("chat message", roomKey, newMessage);
    }
    setMessageInput("");
    setReplyingTo(null); // Reset reply state after sending
  };

  const sendReaction = (messageId: string, emoji: string) => {
    alert(`You reacted with ${emoji}`);
    socketRef.current?.emit("chat reaction", { messageId, emoji });
  };


  useEffect(() => {

  const sentinel = topSentinelRef.current;
  const container = containerRef.current;

  if (!sentinel || !container) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        hasMoreMessages &&
        !loading &&
        didMount.current 
        
      ) {
        loadMoreMessages();
      }
    },
    {
      root: container,
      threshold: 0.1, // more reliable than 1.0
    }
  );

  observer.observe(sentinel);

  return () => observer.disconnect();
}, [hasMoreMessages, loading, cursor]);

  return (
    <div className="h-full relative bg-gray-900 text-white font-sans grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] overflow-hidden">
      {/* Left Sidebar */}
      <div className="fixed h-full w-full overflow-hidden z-50 pointer-events-none flex ">
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
      <div className="hidden md:flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/10 p-4">
        <div className="font-bold text-xl mb-6">Anon</div>
        
        {/* Chat Mode Switch */}
        <div className="relative z-10 mb-6">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 shadow-lg">
            <div className="flex">
              <button
                onClick={() => setRoomKey(localStorage.getItem("room_key") || '')}
                className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  roomKey !== 'global'
                    ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {roomKey ? `${localStorage.getItem("room_key")}` : 'No Room'}
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

        {/* Online Users Counter */}
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
            {/* Chat Mode Switch for mobile */}
            <div className="relative z-10">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 shadow-lg">
                <div className="flex">
                  <button
                    onClick={() => setChatMode('local')}
                    className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      chatMode === 'local'
                        ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    
                    Local
                  </button>
                  <button
                    onClick={() => setChatMode('global')}
                    className={`w-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      chatMode === 'global'
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

        {/* Messaghas finally been debugged and is working fine nowes Display Area */}
      { /* Autism is Autisming */}
        <div ref={containerRef} className="relative z-10 flex-grow p-4 overflow-y-auto  ">
          <div ref={topSentinelRef}></div>
          {loading && <div className="text-center text-gray-500">Loading messages...</div>}
          <div className="space-y-3">
            {messages
              .filter(m => !m.replyTo) // Show only top-level messages
              .map((reply) => {
                const replies = messages.filter(msg => msg.replyTo === reply.id);
                
                return (
                  <div key={reply.id}>
                    {/* Main Message */}
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-blue-400 text-sm">{reply.author}</span>
                        <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
  {new Date(reply.timestamp).toLocaleString("en-IN")}
</span>
                      </div>
                      
                      {/* Message Text */}
                      <p className="text-gray-200 text-sm mb-3">{reply.text}</p>
                      
                      {/* Actions Bar */}
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setReplyingTo(reply)}
                          className="text-xs text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>Reply</span>
                        </button>
                        
                        {/* Reactions */}
                        <div className="flex items-center space-x-2">
                          {availableReactions.map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => sendReaction(reply.id, emoji)}
                              className="text-xs hover:scale-110 transition-transform opacity-60 hover:opacity-100"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        
                        {/* Reaction Display */}
                        {reply.reactions.length > 0 && (
                          <div className="flex items-center space-x-1 ml-2">
                            {reply.reactions.map((reaction) => (
                              <span key={reaction.emoji} className="bg-gray-700 rounded-full px-2 py-0.5 text-xs">
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Single Level Replies */}
                    {replies.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-600 pl-4">
                        {replies.map((reply) => (
                          <div key={reply.id} className="bg-white/3 rounded-lg p-3 hover:bg-white/8 transition-colors">
                            {/* Reply Header */}
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-blue-400 text-sm">{reply.author}</span>
                              <span className="text-xs text-gray-500">•</span>
                             <span className="text-xs text-gray-500">
  {new Date(reply.timestamp).toLocaleString("en-IN")}
</span>
                            </div>
                            
                            {/* Reply Text */}
                            <p className="text-gray-200 text-sm mb-3">{reply.text}</p>
                            
                            {/* Reply Actions */}
                            <div className="flex items-center space-x-4">
                              
                              {/* Reactions for replies */}
                              <div className="flex items-center space-x-2">
                                {availableReactions.map(emoji => (
                                  <button 
                                    key={emoji}
                                    onClick={() => sendReaction(reply.id, emoji)}
                                    className="text-xs hover:scale-110 transition-transform opacity-60 hover:opacity-100"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              
                              {/* Reply Reaction Display */}
                              {reply.reactions.length > 0 && (
                                <div className="flex items-center space-x-1 ml-2">
                                  {reply.reactions.map((reaction) => (
                                    <span key={reaction.emoji} className="bg-gray-700 rounded-full px-2 py-0.5 text-xs">
                                      {reaction.emoji} {reaction.count}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
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
          {/* Shows who you are replying to */}
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
       
        <div className="relative z-10 p-4 text-center ">
            <h3 className="font-semibold text-lg text-white/80">Welcome!</h3>
            <div className="text-sm text-white/60 mt-2 text-left">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Anonymous & location-based: messages are visible to users in the same room or area. Do not assume messages are private.
                </li>
                <li>
                  Stay civil: no harassment, hate speech, doxxing, threats, or calls for illegal activity. Keep the space respectful.
                </li>
                <li>
                  Safety & moderation: we may log metadata (IP, timestamps) to prevent abuse. Abusive behavior may result in account or IP restrictions.
                </li>
                <li>
                  Privacy: avoid posting personal data (emails, phone numbers, addresses). This is an anonymous space — protect your identity.
                </li>
                <li>
                  Ephemeral mindset: messages may not be stored permanently. Treat the chat like a public, short-lived conversation.
                </li>
                <li>
                  Report problems: if you see abusive content, use any available report controls or contact moderators. Provide timestamps for faster action.
                </li>
                <li>
                  No legal advice: we are not responsible for the consequences of the content shared here.
                </li>
                <li>
                  Have fun, be creative, and respect others — that keeps this community healthy.
                </li>
              </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
// the code 