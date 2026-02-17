"use client";

import { useState, useEffect, useCallback } from "react";

type Message = {
  id: string;
  roomKey: string;
  author: string;
  text: string;
  timestamp: string;
  replyTo?: string;
};

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadOlder = useCallback(
    async () => {
      if (loading || !hasMore) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/messages?chatId=${chatId}${cursor ? `&cursor=${cursor}` : ""}`
        );
        const data = await res.json();

        setMessages((prev) => [...data.messages, ...prev]);
        setCursor(data.nextCursor);
        setHasMore(Boolean(data.nextCursor));
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [chatId, cursor, loading, hasMore]
  );

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadOlder();
  }, [chatId]);

  return { messages, loadOlder, hasMore, loading };
}
