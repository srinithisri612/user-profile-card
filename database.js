/**
 * Database module using Node.js built-in DatabaseSync (node:sqlite)
 * Handles persistent storage of generated user profile cards.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      headline TEXT,
      bio TEXT,
      skills TEXT,
      social_links TEXT,
      avatar_url TEXT,
      avatar_type TEXT,
      initials TEXT,
      theme TEXT DEFAULT 'dark-glass',
      word_count INTEGER DEFAULT 0,
      reading_time TEXT DEFAULT '10s read',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Check if we need to seed initial profiles
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM profiles');
  const result = countStmt.get();
  
  if (result.count === 0) {
    seedProfiles();
  }
}

// Seed default profiles for instant visual demonstration
function seedProfiles() {
  const seedData = [
    {
      slug: 'elena-rostova-tech',
      full_name: 'Elena Rostova',
      headline: 'Principal AI Architect & Cloud Visionary',
      bio: 'Pioneering generative interfaces and resilient distributed systems. Passionate about ethical AI, open source tooling, and high-throughput microservices. #buildinpublic #neuralnetworks',
      skills: JSON.stringify([
        { name: 'Python', slug: 'python', colorClass: 'badge-amber' },
        { name: 'Node.js', slug: 'nodejs', colorClass: 'badge-violet' },
        { name: 'Docker', slug: 'docker', colorClass: 'badge-cyan' },
        { name: 'Kubernetes', slug: 'kubernetes', colorClass: 'badge-sky' },
        { name: 'TypeScript', slug: 'typescript', colorClass: 'badge-emerald' },
        { name: 'GraphQL', slug: 'graphql', colorClass: 'badge-rose' }
      ]),
      social_links: JSON.stringify({
        github: { url: 'https://github.com/elena-ai', handle: '@elena-ai' },
        linkedin: { url: 'https://linkedin.com/in/elena-rostova', handle: 'elena-rostova' },
        twitter: { url: 'https://x.com/elenarostova', handle: '@elenarostova' },
        website: { url: 'https://elenarostova.dev', handle: 'elenarostova.dev' },
        email: { url: 'mailto:elena.rostova@nexus.ai', handle: 'elena.rostova@nexus.ai' }
      }),
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=b6e3f4,c0aede,d1d4f9',
      avatar_type: 'dicebear',
      initials: 'ER',
      theme: 'cyber-neon',
      word_count: 24,
      reading_time: '12s read'
    },
    {
      slug: 'marcus-vance-design',
      full_name: 'Marcus Vance',
      headline: 'Staff Product Designer & Design Systems Lead',
      bio: 'Crafting fluid digital interactions, micro-animations, and accessible design tokens. Believer in minimal aesthetics with maximal emotional impact. #designsystems #ux',
      skills: JSON.stringify([
        { name: 'Figma', slug: 'figma', colorClass: 'badge-violet' },
        { name: 'UI/UX Design', slug: 'ui-ux-design', colorClass: 'badge-rose' },
        { name: 'CSS3', slug: 'css3', colorClass: 'badge-cyan' },
        { name: 'React', slug: 'react', colorClass: 'badge-sky' },
        { name: 'Tailwind CSS', slug: 'tailwind-css', colorClass: 'badge-emerald' }
      ]),
      social_links: JSON.stringify({
        github: { url: 'https://github.com/marcusvance', handle: '@marcusvance' },
        linkedin: { url: 'https://linkedin.com/in/marcus-vance', handle: 'marcus-vance' },
        twitter: { url: 'https://x.com/vance_designs', handle: '@vance_designs' },
        website: { url: 'https://marcusvance.design', handle: 'marcusvance.design' }
      }),
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus&hair=short02&eyebrows=variant02',
      avatar_type: 'dicebear',
      initials: 'MV',
      theme: 'sunset-ember',
      word_count: 23,
      reading_time: '10s read'
    },
    {
      slug: 'aravind-kumar-dev',
      full_name: 'Aravind Kumar',
      headline: 'Full-Stack Web Engineer & Open Source Hacker',
      bio: 'Building modern web applications that scale seamlessly. Loves SQLite, Node.js internals, and lightning-fast developer workflows. #nodejs #javascript #webdev',
      skills: JSON.stringify([
        { name: 'JavaScript', slug: 'javascript', colorClass: 'badge-amber' },
        { name: 'TypeScript', slug: 'typescript', colorClass: 'badge-sky' },
        { name: 'Node.js', slug: 'nodejs', colorClass: 'badge-emerald' },
        { name: 'SQLite', slug: 'sqlite', colorClass: 'badge-cyan' },
        { name: 'REST API', slug: 'rest-api', colorClass: 'badge-violet' }
      ]),
      social_links: JSON.stringify({
        github: { url: 'https://github.com/aravindkumar', handle: '@aravindkumar' },
        linkedin: { url: 'https://linkedin.com/in/aravind-kumar-dev', handle: 'aravind-kumar-dev' },
        website: { url: 'https://aravind.io', handle: 'aravind.io' },
        email: { url: 'mailto:aravind@codecraft.org', handle: 'aravind@codecraft.org' }
      }),
      avatar_url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aravind',
      avatar_type: 'dicebear',
      initials: 'AK',
      theme: 'emerald-luxe',
      word_count: 22,
      reading_time: '10s read'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO profiles (
      slug, full_name, headline, bio, skills, social_links,
      avatar_url, avatar_type, initials, theme, word_count, reading_time
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const item of seedData) {
    insert.run(
      item.slug,
      item.full_name,
      item.headline,
      item.bio,
      item.skills,
      item.social_links,
      item.avatar_url,
      item.avatar_type,
      item.initials,
      item.theme,
      item.word_count,
      item.reading_time
    );
  }
  console.log('Database seeded with 3 initial profiles.');
}

// Save a new profile card
function createProfile(data) {
  const insert = db.prepare(`
    INSERT INTO profiles (
      slug, full_name, headline, bio, skills, social_links,
      avatar_url, avatar_type, initials, theme, word_count, reading_time
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const result = insert.run(
    data.slug,
    data.full_name,
    data.headline || '',
    data.bio || '',
    typeof data.skills === 'string' ? data.skills : JSON.stringify(data.skills || []),
    typeof data.social_links === 'string' ? data.social_links : JSON.stringify(data.social_links || {}),
    data.avatar_url || '',
    data.avatar_type || 'initials',
    data.initials || 'U',
    data.theme || 'dark-glass',
    data.word_count || 0,
    data.reading_time || '10s read'
  );

  return getProfileById(result.lastInsertRowid);
}

// Get profile by ID
function getProfileById(id) {
  const stmt = db.prepare('SELECT * FROM profiles WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  return parseProfileRow(row);
}

// Get profile by Slug
function getProfileBySlug(slug) {
  const stmt = db.prepare('SELECT * FROM profiles WHERE slug = ?');
  const row = stmt.get(slug);
  if (!row) return null;
  return parseProfileRow(row);
}

// Get all profiles with optional search
function getAllProfiles(searchQuery = '') {
  let rows;
  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim().toLowerCase()}%`;
    const stmt = db.prepare(`
      SELECT * FROM profiles 
      WHERE LOWER(full_name) LIKE ? OR LOWER(headline) LIKE ? OR LOWER(skills) LIKE ? OR LOWER(bio) LIKE ?
      ORDER BY id DESC
    `);
    rows = stmt.all(q, q, q, q);
  } else {
    const stmt = db.prepare('SELECT * FROM profiles ORDER BY id DESC');
    rows = stmt.all();
  }
  return rows.map(parseProfileRow);
}

// Delete profile
function deleteProfile(id) {
  const stmt = db.prepare('DELETE FROM profiles WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Helper to parse stored JSON fields
function parseProfileRow(row) {
  let skills = [];
  try {
    skills = JSON.parse(row.skills || '[]');
  } catch (e) {
    skills = [];
  }

  let socialLinks = {};
  try {
    socialLinks = JSON.parse(row.social_links || '{}');
  } catch (e) {
    socialLinks = {};
  }

  return {
    ...row,
    skills,
    social_links: socialLinks
  };
}

// Initialize on module load
initDb();

module.exports = {
  createProfile,
  getProfileById,
  getProfileBySlug,
  getAllProfiles,
  deleteProfile
};
