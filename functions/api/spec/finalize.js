const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4';

async function zaiChat(apiKey, model, prompt, maxTokens = 4096) {
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
    const { cards = [], project = {}, spec_points = [] } = await request.json();

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

    const pointsText = spec_points.length > 0
      ? `Points clés identifiés :\n${spec_points.join('\n')}\n\n`
      : '';

    const prompt = `Tu es un expert en rédaction de cahiers des charges. À partir des informations suivantes collectées sur ce projet, rédige un cahier des charges complet, structuré et précis en français.

Structure obligatoire :
# Cahier des charges — [Nom du projet]
## 1. Présentation du projet
## 2. Objectifs
## 3. Fonctionnalités
## 4. Contraintes techniques
## 5. Architecture
## 6. Planning suggéré

Sois précis, concret et actionnable. Utilise le markdown.

${projectContext}${pointsText}Cartes du board :
${cardsText}`;

    const apiKey = env.ZAI_API_KEY || '9197359eea7a491284e365d5a4509c97.fe7fplcTTX0skayA';
    const spec_final = await zaiChat(apiKey, 'glm-4.7', prompt, 4096);

    // Persister dans KV
    const board = await env.BOARD_DATA.get('board', { type: 'json' }) || {};
    board.spec_final = spec_final;
    await env.BOARD_DATA.put('board', JSON.stringify(board));

    return Response.json({ spec_final });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
