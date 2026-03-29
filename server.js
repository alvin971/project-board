const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'board.json');

const ZAI_API_KEY = process.env.ZAI_API_KEY || '9197359eea7a491284e365d5a4509c97.fe7fplcTTX0skayA';
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4';

async function zaiChat(model, prompt, maxTokens = 1024) {
  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZAI_API_KEY}`,
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

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

/* ── GET /api/board — charge toutes les données ── */
app.get('/api/board', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return res.json(JSON.parse(raw));
    }
    res.json({});
  } catch (e) {
    console.error('Read error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/board — sauvegarde toutes les données ── */
app.post('/api/board', (req, res) => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error('Write error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/spec/synthesize — synthèse automatique des cartes ── */
app.post('/api/spec/synthesize', async (req, res) => {
  try {
    const { cards = [], project = {} } = req.body;

    if (cards.length === 0) {
      return res.json({ spec_points: [] });
    }

    const cardsText = cards.map((card, i) => {
      const type = card.type || 'note';
      let content = '';
      if (card.content) {
        if (card.content.text) content = card.content.text;
        else if (card.content.title) content = card.content.title + (card.content.description ? ': ' + card.content.description : '');
        else if (card.content.url) content = card.content.url + (card.content.title ? ' — ' + card.content.title : '');
        else if (card.content.question) content = card.content.question + ' (sondage: ' + (card.content.options || []).map(o => o.label).join(', ') + ')';
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

    const text = await zaiChat('glm-4.7-flash', prompt, 1024);
    const points = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let boardData = {};
    if (fs.existsSync(DATA_FILE)) {
      boardData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    boardData.spec_points = points;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(boardData, null, 2), 'utf8');

    res.json({ spec_points: points });
  } catch (e) {
    console.error('Synthesize error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/spec/finalize — génère le cahier des charges final ── */
app.post('/api/spec/finalize', async (req, res) => {
  try {
    const { cards = [], project = {}, spec_points = [] } = req.body;

    const cardsText = cards.map((card, i) => {
      const type = card.type || 'note';
      let content = '';
      if (card.content) {
        if (card.content.text) content = card.content.text;
        else if (card.content.title) content = card.content.title + (card.content.description ? ': ' + card.content.description : '');
        else if (card.content.url) content = card.content.url + (card.content.title ? ' — ' + card.content.title : '');
        else if (card.content.question) content = card.content.question + ' (sondage: ' + (card.content.options || []).map(o => o.label).join(', ') + ')';
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

    const spec_final = await zaiChat('glm-4.7', prompt, 4096);

    let boardData = {};
    if (fs.existsSync(DATA_FILE)) {
      boardData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    boardData.spec_final = spec_final;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(boardData, null, 2), 'utf8');

    res.json({ spec_final });
  } catch (e) {
    console.error('Finalize error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ── Toutes les autres routes → React app ── */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Project Board running on http://localhost:${PORT}`);
  console.log(`💾 Data stored at: ${DATA_FILE}`);
  console.log(`🤖 ZAI/GLM API configured (glm-4.7-flash / glm-4.7)`);
});
