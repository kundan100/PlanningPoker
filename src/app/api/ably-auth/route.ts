// File: src/app/api/ably-auth/route.ts
import Ably from 'ably';
import { NextResponse } from 'next/server';

// Server route to create Ably token requests. Accepts optional clientId query param.
const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || undefined;
    const tokenRequest = clientId
      ? await ably.auth.createTokenRequest({ clientId })
      : await ably.auth.createTokenRequest();
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error('Ably token error', err);
    return NextResponse.json({ error: 'Unable to create token' }, { status: 500 });
  }
}