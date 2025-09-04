require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const store = require('./store');
const tasks = require('./tasks');

store.init();

const app = express();
const PORT = process.env.PORT || 8787;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const findTask = (id) => tasks.find(t => t.id === id);
const txLooksValid = (tx) => /^0x[a-fA-F0-9]{32,}$/.test(tx);

app.get('/api/spiceflow/tasks', (req, res) => res.json(tasks));

app.post('/api/spiceflow/join', (req, res) => {
  const { userId, displayName = '' } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  store.upsertUser(userId, displayName);
  if (!store.hasClaim(userId, 'join')) {
    store.addClaim({ userId, taskId: 'join', points: 50 });
    store.addPoints(userId, 50);
  }
  const user = store.getUser(userId);
  res.json({ message: 'Joined quest!', totalPoints: user.points });
});

app.get('/api/spiceflow/progress/:userId', (req, res) => {
  const { userId } = req.params;
  const user = store.getUser(userId);
  const claims = store.getClaims(userId);
  res.json({ user, claims, tasks });
});

app.post('/api/spiceflow/claim', (req, res) => {
  const { userId, taskId, proof = '' } = req.body || {};
  if (!userId || !taskId) return res.status(400).json({ error: 'userId and taskId required' });

  const task = findTask(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.type === 'tx') return res.status(400).json({ error: 'Use /submit-tx for this task' });

  // one-time tasks guard
  const singleShot = ['x_follow','linkedin_follow','newsletter_sub','sepolia_faucet','testnet_mint','testnet_swap'];
  if (store.hasClaim(userId, taskId) && singleShot.includes(taskId)) {
    const user = store.getUser(userId) || { points: 0 };
    return res.json({ message: 'Already claimed', totalPoints: user.points });
  }

  // daily rate limit for engage_post
  if (taskId === 'engage_post') {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    if (store.countClaimsSince(userId, 'engage_post', since) >= 1) {
      const user = store.getUser(userId) || { points: 0 };
      return res.json({ message: 'Daily cap reached for engage_post', totalPoints: user.points });
    }
  }

  store.addClaim({ userId, taskId, proof, points: task.points });
  const totalPoints = store.addPoints(userId, task.points);
  res.json({ message: `Claim accepted: ${taskId} (+${task.points})`, totalPoints });
});

app.post('/api/spiceflow/submit-tx', (req, res) => {
  const { userId, taskId, txHash } = req.body || {};
  if (!userId || !taskId || !txHash) return res.status(400).json({ error: 'Missing params' });

  const task = findTask(taskId);
  if (!task || task.type !== 'tx') return res.status(404).json({ error: 'Invalid tx task' });
  if (!txLooksValid(txHash)) return res.status(400).json({ error: 'Invalid TX format' });
  if (store.hasClaim(userId, taskId)) {
    const user = store.getUser(userId) || { points: 0 };
    return res.json({ message: 'Already claimed', totalPoints: user.points });
  }

  store.addClaim({ userId, taskId, txHash, points: task.points });
  const totalPoints = store.addPoints(userId, task.points);
  res.json({ message: 'Tx submitted', totalPoints });
});

// --------- Admin (export) ----------
app.get('/api/spiceflow/admin/export', (req, res) => {
  if ((req.header('x-admin-token') || req.query.token) !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const dbPath = path.join(__dirname, 'db', 'spiceflow.json');
  if (!fs.existsSync(dbPath)) return res.status(404).json({ message: 'No data file yet' });
  res.setHeader('Content-Type','application/json');
  res.setHeader('Content-Disposition', `attachment; filename="spiceflow-export-${Date.now()}.json"`);
  fs.createReadStream(dbPath).pipe(res);
});

// --------- Fallback to UI ----------
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --------- Start ----------
app.listen(PORT, () => {
  console.log(`SpiceFlow (Pure JS) running on http://localhost:${PORT}`);
});