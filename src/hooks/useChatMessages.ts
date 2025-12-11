"use client";
// the bigger question is do i need state management for this ?
// take on me
// what does this hook do?--
// i shall tell you now 
import { useState, useEffect, useCallback } from "react";
// where do i get the chattId from ? I get it from the local_storage or context. 
// can be used to indicate if there are more messages to load.  
// i want the architectural breakdown of this code
export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<any[]>([]);   
  const [cursor, setCursor] = useState<string | null>(null);   
  const [loading, setLoading] = useState(false); 
  const [hasMore, setHasMore] = useState(true); 

  const loadOlder = useCallback(async () => {   
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
  }, [chatId, cursor, loading, hasMore]);

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    loadOlder();
  }, [chatId]);

  return { messages, loadOlder, hasMore, loading };
}
