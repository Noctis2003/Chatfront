import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


interface Message {
  id: string;
  room: string;
  clientId: string;
  nickname: string;
  content: string;
  createdAt: Date;
  parentClientId?: string | null;
}

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const cursor = searchParams.get('cursor'); 
  const userSecret = req.headers.get('authorization')?.split(' ')[1];
  console.log(userSecret);
  if (!room) {
    return NextResponse.json({ error: 'room required' }, { status: 400 });
  }
// cursor logic starts
  const messages = await prisma.message.findMany({
    where: { room },
    include: {
      reactions: true,
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' }, 
    ],
    take: PAGE_SIZE + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  let nextCursor: string | null = null;

  

  if (messages.length > PAGE_SIZE) {
    messages.pop();
    nextCursor = messages[messages.length - 1].id;
  }
// cursor logic ends
  const formattedMessages = messages.reverse().map((m) => {
    // Aggregate reactions by emoji
    // Record is used for defining an object with string keys and number values to count reactions
    const emojiCounts: Record<string, number> = {};
    let myReaction: string | null = null;
    for (const r of m.reactions) {
      // how do you increament a number that might not exist yet in the object? this is how--
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
      if (userSecret && r.userSecret === userSecret) { // why tf we gotta perform nasty iterations
        myReaction = r.emoji;
      }
    }
    
    const reactions = Object.entries(emojiCounts).map(([emoji, count]) => ({ emoji, count }));
    const dominantReaction = Object.entries(emojiCounts).reduce(
  (max, [emoji, count]) => (count > max.count ? { emoji, count } : max),
  { emoji: '', count: 0 }
);
    console.log("reactions:", reactions, "myReaction:", myReaction);
    return {
      id: m.clientId,
      roomKey: m.room,
      author: m.nickname,
      text: m.content,
      timestamp: m.createdAt,
      replyTo: m.parentClientId ?? null,
      reactions,
      myReaction,
      dominantReaction: dominantReaction.emoji || null,
    };
  });
  
  return NextResponse.json({
    messages: formattedMessages,
    nextCursor,
  });
}
