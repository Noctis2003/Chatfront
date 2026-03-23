// app/api/chat/generate-id/route.ts
import { signUUID } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  const token = signUUID();
  return NextResponse.json({ token });
}