import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing query parameter ?id=" },
      { status: 400 }
    );
  }

  try {
    const message=await prisma.message.findUnique({
      where: { clientId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const formatted = {
      id: message.clientId,
      roomKey: message.room,
      author: message.nickname,
      text: message.content,
      timestamp: message.createdAt,
      replyTo: message.parentClientId ?? null,
      reactions: [],
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
