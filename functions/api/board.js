export async function onRequestGet({ env }) {
  try {
    const data = await env.BOARD_DATA.get('board', { type: 'json' });
    return Response.json(data || {});
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    await env.BOARD_DATA.put('board', JSON.stringify(body));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
