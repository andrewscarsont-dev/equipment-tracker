import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('equipment-tracker');

  if (req.method === 'GET') {
    const data = await store.get('equip_report', { type: 'json' });
    return Response.json(data ?? null);
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }
    const payload = { ...body, lastSavedAt: new Date().toISOString() };
    await store.set('equip_report', JSON.stringify(payload));
    return Response.json({ ok: true, lastSavedAt: payload.lastSavedAt });
  }

  return new Response('Method Not Allowed', { status: 405 });
};

export const config = { path: '/api/data' };
