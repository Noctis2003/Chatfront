import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Message {
  id: string;
  room: string;
  clientId: string;
  nickname: string;
  content: string;
  createdAt: Date;
  parentClientId?: string | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  if (!room) {
    return NextResponse.json(
      { error: "Missing query parameter ?room=" },
      { status: 400 }
    );
  }

  try {
    const messages = await prisma.message.findMany({
      where: { room },
      orderBy: { createdAt: "asc" },
    });
// why would i want to format the messages ?
// well the client expects certain fields
// so i need to map the database fields to the client fields
    const formatted = messages.map((m:Message) => ({
      id: m.clientId,
      roomKey: m.room,
      author: m.nickname,
      text: m.content,
      timestamp: m.createdAt,
      replyTo: m.parentClientId ?? null,
      reactions: [],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
