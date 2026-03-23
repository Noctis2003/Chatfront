import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// this part is redundant but it makes it easier to maintain the list of allowed emojis in one place
const ALLOWED_EMOJIS = ["👍", "👎", "😂", "😡", "😮"];

export async function POST(req: Request) {
  const { messageId, userSecret, emoji } = await req.json();

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji choice" }, { status: 400 });
  }

  // messageId from client is the clientId (UUID), look up the real MongoDB _id
  const message = await prisma.message.findUnique({
    where: { clientId: messageId },
    select: { id: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const dbMessageId = message.id;

  try {
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userSecret_messageId: { userSecret, messageId: dbMessageId }
      }
    });
// this bit is for like unlike toggle functionality, if the same reaction already exists, remove it. otherwise, add or update to the new reaction
    if (existingReaction && existingReaction.emoji === emoji) {
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      return NextResponse.json({ action: "removed" });
    }

    const reaction = await prisma.reaction.upsert({
      where: {
        userSecret_messageId: { userSecret, messageId: dbMessageId } 
      },
      update: { emoji },
      create: { emoji, userSecret, messageId: dbMessageId }
    });

    return NextResponse.json({ action: "set", reaction });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
  finally{
    console.log("POST /api/reactions completed");
  }
}