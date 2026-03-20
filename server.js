const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'board.json');

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

/* ── Toutes les autres routes → React app ── */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Project Board running on http://localhost:${PORT}`);
  console.log(`💾 Data stored at: ${DATA_FILE}`);
});
