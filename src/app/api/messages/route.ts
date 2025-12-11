// what does this app basically do ?
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server'; 

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room'); 
  const cursor = searchParams.get('cursor'); // Mongo ObjectId of the oldest currently loaded message
// i will pass this as a query parameter
  if (!room) {
    return NextResponse.json({ error: 'room required' }, { status: 400 });
  }
// if u wondering why PAGE_SIZE + 1 is used, its to check if there are more messages to load after the current batch
  const messages = await prisma.message.findMany({
    where: { room },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), // means if cursor is provided, skip the message at the cursor
  });

// cursor points to the 21st message if there are more messages to load
// if thhe nextCursor is null, it means there are no more messages to load
// heck we can use this nextCursor in the frontend to decide whether to show the "load more" button or not
// pretty smart way to do it huh ?
  let nextCursor = null;
  if (messages.length > PAGE_SIZE) {
    const nextItem = messages.pop();
    nextCursor = nextItem!.id;
  }

 

  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor,
  });
}
