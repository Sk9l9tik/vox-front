import { NextRequest } from 'next/server';

const API_GW = 'http://api-gateway:8080';

export async function POST(request: NextRequest) {
  const ct = request.headers.get('content-type') ?? '';
  const body = await request.arrayBuffer();

  const up = await fetch(`${API_GW}/api/messages/send-init`, {
    method: 'POST',
    headers: { 'content-type': ct },
    body,
  });

  return new Response(await up.text(), {
    status: up.status,
    headers: { 'content-type': 'application/json' },
  });
}
