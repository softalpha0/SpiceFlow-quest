const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_DIR, 'spiceflow.json');

// shape: { users: { [userId]: { userId, displayName, points } }, claims: [] }
function init() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, claims: [] }, null, 2));
  }
}

function read() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function write(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function upsertUser(userId, displayName = '') {
  const db = read();
  if (!db.users[userId]) db.users[userId] = { userId, displayName, points: 0 };
  write(db);
  return db.users[userId];
}

function addPoints(userId, pts) {
  const db = read();
  if (!db.users[userId]) db.users[userId] = { userId, displayName: '', points: 0 };
  db.users[userId].points += pts;
  write(db);
  return db.users[userId].points;
}

function getUser(userId) {
  const db = read();
  return db.users[userId] || null;
}

function addClaim({ userId, taskId, proof = '', txHash = '', points = 0 }) {
  const db = read();
  const claim = { userId, taskId, proof, txHash, points, createdAt: Date.now() };
  db.claims.push(claim);
  write(db);
  return claim;
}

function getClaims(userId) {
  const db = read();
  return db.claims.filter(c => c.userId === userId).sort((a,b)=>b.createdAt-a.createdAt);
}

function hasClaim(userId, taskId) {
  const db = read();
  return db.claims.some(c => c.userId === userId && c.taskId === taskId);
}

function countClaimsSince(userId, taskId, sinceMs) {
  const db = read();
  return db.claims.filter(c => c.userId === userId && c.taskId === taskId && c.createdAt > sinceMs).length;
}

function leaderboard(limit = 100) {
  const db = read();
  return Object.values(db.users)
    .sort((a,b)=>b.points-a.points)
    .slice(0, limit)
    .map(u => ({ userId: u.userId, points: u.points }));
}

module.exports = {
  init, upsertUser, addPoints, getUser,
  addClaim, getClaims, hasClaim, countClaimsSince, leaderboard
};