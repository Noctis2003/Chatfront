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
  
  if (!room) {
    return NextResponse.json({ error: 'room required' }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { room },
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

  const formattedMessages = messages.reverse().map((m) => ({
    id: m.clientId,
    roomKey: m.room,
    author: m.nickname,
    text: m.content,
    timestamp: m.createdAt,
    replyTo: m.parentClientId ?? null,
    reactions: [],
  }));

  return NextResponse.json({
    messages: formattedMessages,
    nextCursor,
  });
}
