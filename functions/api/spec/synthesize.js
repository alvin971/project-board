const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4';

async function zaiChat(apiKey, model, prompt, maxTokens = 1024) {
  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function onRequestPost({ request, env }) {
  try {
    const { cards = [], project = {} } = await request.json();

    if (cards.length === 0) {
      return Response.json({ spec_points: [] });
    }

    const cardsText = cards.map((card, i) => {
      const type = card.type || 'note';
      let content = '';
      if (card.content) {
        if (card.content.text) content = card.content.text;
        else if (card.content.title) content = card.content.title + (card.content.description ? ': ' + card.content.description : '');
        else if (card.content.url) content = card.content.url + (card.content.title ? ' — ' + card.content.title : '');
        else if (card.content.question) content = card.content.question;
        else if (card.content.name) content = card.content.name;
      }
      return `[${i + 1}] (${type}) ${content}`;
    }).join('\n');

    const projectContext = project.title
      ? `Projet: ${project.title}${project.description ? '\nDescription: ' + project.description : ''}\n\n`
      : '';

    const prompt = `Tu es un expert en cahier des charges. Analyse ces cartes d'un board de projet et extrais les points clés sous forme de bullet points concis (max 15 points). Chaque point doit capturer une information essentielle sur le projet : fonctionnalité, contrainte, objectif, ou décision. Format : liste à puces (commence chaque ligne par "• "), une ligne par point. Retourne UNIQUEMENT les points, sans intro ni conclusion.

${projectContext}Cartes du board :
${cardsText}`;

    const apiKey = env.ZAI_API_KEY || '9197359eea7a491284e365d5a4509c97.fe7fplcTTX0skayA';
    const text = await zaiChat(apiKey, 'glm-4.7-flash', prompt, 1024);
    const spec_points = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Persister dans KV
    const board = await env.BOARD_DATA.get('board', { type: 'json' }) || {};
    board.spec_points = spec_points;
    await env.BOARD_DATA.put('board', JSON.stringify(board));

    return Response.json({ spec_points });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
