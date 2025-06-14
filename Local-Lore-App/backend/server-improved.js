const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');
const { convert } = require('html-to-text');
const MarkdownIt = require('markdown-it');
const { analyzeText } = require('./analyzer');
require('dotenv').config();

const md = new MarkdownIt();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for novel content

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
fs.ensureDirSync(dataDir);

// Initialize database with better error handling
const dbPath = path.join(dataDir, 'scribber.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS novels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    traits TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    UNIQUE(novel_id, name)
  );

  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    UNIQUE(novel_id, name)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    chapter_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS lore (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    properties TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    UNIQUE(novel_id, name)
  );

  CREATE TABLE IF NOT EXISTS chapter_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    word_count INTEGER DEFAULT 0,
    version_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_prompt_contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    context_type TEXT, -- 'character', 'chapter', 'global'
    context_id INTEGER, -- character_id, chapter_id, or null for global
    FOREIGN KEY (prompt_id) REFERENCES ai_prompts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outline_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outline_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    parent_id INTEGER,
    level INTEGER NOT NULL DEFAULT 0,
    chapter_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outline_id) REFERENCES outlines(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES outline_sections(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
  CREATE INDEX IF NOT EXISTS idx_characters_novel_id ON characters(novel_id);
  CREATE INDEX IF NOT EXISTS idx_places_novel_id ON places(novel_id);
  CREATE INDEX IF NOT EXISTS idx_events_novel_id ON events(novel_id);
  CREATE INDEX IF NOT EXISTS idx_lore_novel_id ON lore(novel_id);
  CREATE INDEX IF NOT EXISTS idx_items_novel_id ON items(novel_id);
  CREATE INDEX IF NOT EXISTS idx_notes_novel_id ON notes(novel_id);
  CREATE INDEX IF NOT EXISTS idx_ai_prompts_novel_id ON ai_prompts(novel_id);
  CREATE INDEX IF NOT EXISTS idx_ai_prompt_contexts_prompt_id ON ai_prompt_contexts(prompt_id);
  CREATE INDEX IF NOT EXISTS idx_outlines_novel_id ON outlines(novel_id);
  CREATE INDEX IF NOT EXISTS idx_outline_sections_outline_id ON outline_sections(outline_id);
  CREATE INDEX IF NOT EXISTS idx_outline_sections_parent_id ON outline_sections(parent_id);
`);

// Prepare statements for better performance
const statements = {
  // Novel queries
  getAllNovels: db.prepare('SELECT * FROM novels ORDER BY updated_at DESC'),
  getNovel: db.prepare('SELECT * FROM novels WHERE id = ?'),
  createNovel: db.prepare('INSERT INTO novels (title, description) VALUES (?, ?)'),
  updateNovel: db.prepare('UPDATE novels SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteNovel: db.prepare('DELETE FROM novels WHERE id = ?'),
  
  // Chapter queries
  getChapters: db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY order_index'),
  getChapter: db.prepare('SELECT * FROM chapters WHERE id = ?'),
  createChapter: db.prepare('INSERT INTO chapters (novel_id, title, content, order_index, word_count) VALUES (?, ?, ?, ?, ?)'),
  updateChapter: db.prepare('UPDATE chapters SET title = ?, content = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteChapter: db.prepare('DELETE FROM chapters WHERE id = ?'),
  
  // Character queries
  getCharacters: db.prepare('SELECT * FROM characters WHERE novel_id = ? ORDER BY name'),
  getCharacter: db.prepare('SELECT * FROM characters WHERE id = ?'),
  createCharacter: db.prepare('INSERT OR IGNORE INTO characters (novel_id, name, description, traits) VALUES (?, ?, ?, ?)'),
  updateCharacter: db.prepare('UPDATE characters SET name = ?, description = ?, traits = ? WHERE id = ?'),
  deleteCharacter: db.prepare('DELETE FROM characters WHERE id = ?'),
  
  // Place queries
  getPlaces: db.prepare('SELECT * FROM places WHERE novel_id = ? ORDER BY name'),
  getPlace: db.prepare('SELECT * FROM places WHERE id = ?'),
  createPlace: db.prepare('INSERT OR IGNORE INTO places (novel_id, name, description) VALUES (?, ?, ?)'),
  updatePlace: db.prepare('UPDATE places SET name = ?, description = ? WHERE id = ?'),
  deletePlace: db.prepare('DELETE FROM places WHERE id = ?'),
  
  // Event queries
  getEvents: db.prepare('SELECT * FROM events WHERE novel_id = ? ORDER BY created_at DESC'),
  getEvent: db.prepare('SELECT * FROM events WHERE id = ?'),
  createEvent: db.prepare('INSERT INTO events (novel_id, title, description, chapter_id) VALUES (?, ?, ?, ?)'),
  updateEvent: db.prepare('UPDATE events SET title = ?, description = ?, chapter_id = ? WHERE id = ?'),
  deleteEvent: db.prepare('DELETE FROM events WHERE id = ?'),
  
  // Lore queries
  getLore: db.prepare('SELECT * FROM lore WHERE novel_id = ? ORDER BY category, title'),
  getLoreItem: db.prepare('SELECT * FROM lore WHERE id = ?'),
  createLore: db.prepare('INSERT INTO lore (novel_id, title, content, category) VALUES (?, ?, ?, ?)'),
  updateLore: db.prepare('UPDATE lore SET title = ?, content = ?, category = ? WHERE id = ?'),
  deleteLore: db.prepare('DELETE FROM lore WHERE id = ?'),
  
  // Item queries
  getItems: db.prepare('SELECT * FROM items WHERE novel_id = ? ORDER BY name'),
  getItem: db.prepare('SELECT * FROM items WHERE id = ?'),
  createItem: db.prepare('INSERT OR IGNORE INTO items (novel_id, name, description, properties) VALUES (?, ?, ?, ?)'),
  updateItem: db.prepare('UPDATE items SET name = ?, description = ?, properties = ? WHERE id = ?'),
  deleteItem: db.prepare('DELETE FROM items WHERE id = ?'),
  
  // Notes queries
  getNotes: db.prepare('SELECT * FROM notes WHERE novel_id = ? ORDER BY updated_at DESC'),
  getNote: db.prepare('SELECT * FROM notes WHERE id = ?'),
  createNote: db.prepare('INSERT INTO notes (novel_id, title, content, category) VALUES (?, ?, ?, ?)'),
  updateNote: db.prepare('UPDATE notes SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteNote: db.prepare('DELETE FROM notes WHERE id = ?'),
  
  // AI Prompts queries
  getAIPrompts: db.prepare('SELECT * FROM ai_prompts WHERE novel_id = ? ORDER BY priority DESC, created_at DESC'),
  getAIPrompt: db.prepare('SELECT * FROM ai_prompts WHERE id = ?'),
  createAIPrompt: db.prepare('INSERT INTO ai_prompts (novel_id, name, category, prompt_text, is_active, is_system, priority) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  updateAIPrompt: db.prepare('UPDATE ai_prompts SET name = ?, category = ?, prompt_text = ?, is_active = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_system = false'),
  deleteAIPrompt: db.prepare('DELETE FROM ai_prompts WHERE id = ? AND is_system = false'),
  getActiveAIPrompts: db.prepare('SELECT * FROM ai_prompts WHERE novel_id = ? AND is_active = true ORDER BY priority DESC, created_at DESC'),
  
  // AI Prompt Contexts queries
  getPromptContexts: db.prepare('SELECT * FROM ai_prompt_contexts WHERE prompt_id = ?'),
  createPromptContext: db.prepare('INSERT INTO ai_prompt_contexts (prompt_id, context_type, context_id) VALUES (?, ?, ?)'),
  deletePromptContexts: db.prepare('DELETE FROM ai_prompt_contexts WHERE prompt_id = ?'),
  
  // Outline queries
  getOutlines: db.prepare('SELECT * FROM outlines WHERE novel_id = ? ORDER BY updated_at DESC'),
  getOutline: db.prepare('SELECT * FROM outlines WHERE id = ?'),
  createOutline: db.prepare('INSERT INTO outlines (novel_id, title, description) VALUES (?, ?, ?)'),
  updateOutline: db.prepare('UPDATE outlines SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteOutline: db.prepare('DELETE FROM outlines WHERE id = ?'),
  
  // Outline Section queries
  getOutlineSections: db.prepare('SELECT * FROM outline_sections WHERE outline_id = ? ORDER BY level, order_index'),
  getOutlineSection: db.prepare('SELECT * FROM outline_sections WHERE id = ?'),
  createOutlineSection: db.prepare('INSERT INTO outline_sections (outline_id, title, description, content, order_index, parent_id, level, chapter_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  updateOutlineSection: db.prepare('UPDATE outline_sections SET title = ?, description = ?, content = ?, order_index = ?, parent_id = ?, level = ?, chapter_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteOutlineSection: db.prepare('DELETE FROM outline_sections WHERE id = ?'),
  getOutlineSectionsByParent: db.prepare('SELECT * FROM outline_sections WHERE outline_id = ? AND parent_id = ? ORDER BY order_index'),
  getOutlineSectionsByLevel: db.prepare('SELECT * FROM outline_sections WHERE outline_id = ? AND level = ? ORDER BY order_index'),
  
  // Version queries
  getChapterVersions: db.prepare('SELECT * FROM chapter_versions WHERE chapter_id = ? ORDER BY created_at DESC'),
  createVersion: db.prepare('INSERT INTO chapter_versions (chapter_id, title, content, word_count, version_note) VALUES (?, ?, ?, ?, ?)'),
  getVersion: db.prepare('SELECT * FROM chapter_versions WHERE id = ?')
};

// Helper function to count words
function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Input validation middleware
function validateInput(rules) {
  return (req, res, next) => {
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      
      if (rule.required && !value) {
        return res.status(400).json({ error: `${field} is required` });
      }
      
      if (value && rule.maxLength && value.length > rule.maxLength) {
        return res.status(400).json({ error: `${field} must be less than ${rule.maxLength} characters` });
      }
      
      if (value && rule.type === 'number' && isNaN(value)) {
        return res.status(400).json({ error: `${field} must be a number` });
      }
    }
    next();
  };
}

// Error handling wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Routes

// Novel routes
app.get('/api/novels', asyncHandler(async (req, res) => {
  const novels = statements.getAllNovels.all();
  res.json(novels);
}));

app.post('/api/novels', validateInput({
  title: { required: true, maxLength: 500 },
  description: { maxLength: 5000 }
}), asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const result = statements.createNovel.run(title, description || '');
  res.json({ id: result.lastInsertRowid, title, description });
}));

app.get('/api/novels/:id', asyncHandler(async (req, res) => {
  const novel = statements.getNovel.get(req.params.id);
  if (!novel) return res.status(404).json({ error: 'Novel not found' });
  res.json(novel);
}));

app.delete('/api/novels/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteNovel.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Novel not found' });
  }
  res.json({ success: true });
}));

// Chapter routes
app.get('/api/novels/:id/chapters', asyncHandler(async (req, res) => {
  const chapters = statements.getChapters.all(req.params.id);
  res.json(chapters);
}));

app.post('/api/novels/:id/chapters', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', order_index = 0 } = req.body;
  const wordCount = countWords(content);
  const result = statements.createChapter.run(req.params.id, title, content, order_index, wordCount);
  statements.updateNovel.run(req.params.id);
  res.json({ 
    id: result.lastInsertRowid, 
    novel_id: req.params.id, 
    title, 
    content, 
    order_index,
    word_count: wordCount 
  });
}));

app.get('/api/chapters/:id', asyncHandler(async (req, res) => {
  const chapter = statements.getChapter.get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  res.json(chapter);
}));

app.put('/api/chapters/:id', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', saveVersion = false, versionNote = '' } = req.body;
  const wordCount = countWords(content);
  
  const chapter = statements.getChapter.get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  
  // Save version if requested or if significant changes
  const shouldSaveVersion = saveVersion || (
    chapter.content && 
    chapter.content !== content && 
    Math.abs(countWords(chapter.content) - wordCount) > 50
  );
  
  if (shouldSaveVersion) {
    statements.createVersion.run(
      req.params.id, 
      chapter.title, 
      chapter.content, 
      chapter.word_count || countWords(chapter.content), 
      versionNote || 'Auto-saved version'
    );
  }
  
  statements.updateChapter.run(title, content, wordCount, req.params.id);
  statements.updateNovel.run(chapter.novel_id);
  res.json({ success: true, word_count: wordCount });
}));

app.delete('/api/chapters/:id', asyncHandler(async (req, res) => {
  const chapter = statements.getChapter.get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  
  statements.deleteChapter.run(req.params.id);
  statements.updateNovel.run(chapter.novel_id);
  res.json({ success: true });
}));

// Chapter analysis
app.post('/api/chapters/:id/analyze', asyncHandler(async (req, res) => {
  const chapter = statements.getChapter.get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  
  const analysis = analyzeText(chapter.content || '');
  const novelId = chapter.novel_id;
  
  // Use a transaction for data integrity
  const transaction = db.transaction(() => {
    // Add characters
    for (const char of analysis.characters) {
      statements.createCharacter.run(novelId, char.name, 
        char.description || `Appeared in chapter: ${chapter.title}`, '');
    }
    
    // Add places
    for (const place of analysis.places) {
      statements.createPlace.run(novelId, place.name, place.context || '');
    }
    
    // Add events
    for (let i = 0; i < analysis.events.length; i++) {
      statements.createEvent.run(novelId, `Event ${i + 1}`, analysis.events[i], chapter.id);
    }
    
    // Add items
    for (const item of analysis.items) {
      statements.createItem.run(novelId, item.name, item.context || '', '');
    }
  });
  
  transaction();
  res.json({ success: true, analysis });
}));

// Chapter version routes
app.get('/api/chapters/:id/versions', asyncHandler(async (req, res) => {
  const versions = statements.getChapterVersions.all(req.params.id);
  res.json(versions);
}));

app.post('/api/chapters/:id/versions', validateInput({
  versionNote: { maxLength: 1000 }
}), asyncHandler(async (req, res) => {
  const { versionNote = 'Manual save' } = req.body;
  const chapter = statements.getChapter.get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  
  const result = statements.createVersion.run(
    req.params.id,
    chapter.title,
    chapter.content,
    chapter.word_count || countWords(chapter.content),
    versionNote
  );
  
  res.json({ 
    id: result.lastInsertRowid, 
    success: true,
    message: 'Version saved successfully'
  });
}));

app.get('/api/versions/:id', asyncHandler(async (req, res) => {
  const version = statements.getVersion.get(req.params.id);
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json(version);
}));

app.post('/api/chapters/:chapterId/restore/:versionId', asyncHandler(async (req, res) => {
  const chapter = statements.getChapter.get(req.params.chapterId);
  const version = statements.getVersion.get(req.params.versionId);
  
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  if (!version) return res.status(404).json({ error: 'Version not found' });
  
  // Save current content as a version before restoring
  statements.createVersion.run(
    req.params.chapterId,
    chapter.title,
    chapter.content,
    chapter.word_count || countWords(chapter.content),
    'Before restore'
  );
  
  // Restore the version
  statements.updateChapter.run(
    version.title,
    version.content,
    version.word_count,
    req.params.chapterId
  );
  
  statements.updateNovel.run(chapter.novel_id);
  
  res.json({ success: true, message: 'Version restored successfully' });
}));

// Character routes
app.get('/api/novels/:id/characters', asyncHandler(async (req, res) => {
  const characters = statements.getCharacters.all(req.params.id);
  res.json(characters);
}));

app.post('/api/novels/:id/characters', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '', traits = '' } = req.body;
  const result = statements.createCharacter.run(req.params.id, name, description, traits);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, name, description, traits });
}));

app.put('/api/characters/:id', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '', traits = '' } = req.body;
  const result = statements.updateCharacter.run(name, description, traits, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Character not found' });
  res.json({ success: true });
}));

app.delete('/api/characters/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteCharacter.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Character not found' });
  res.json({ success: true });
}));

// Place routes
app.get('/api/novels/:id/places', asyncHandler(async (req, res) => {
  const places = statements.getPlaces.all(req.params.id);
  res.json(places);
}));

app.post('/api/novels/:id/places', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  const result = statements.createPlace.run(req.params.id, name, description);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, name, description });
}));

app.put('/api/places/:id', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  const result = statements.updatePlace.run(name, description, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Place not found' });
  res.json({ success: true });
}));

app.delete('/api/places/:id', asyncHandler(async (req, res) => {
  const result = statements.deletePlace.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Place not found' });
  res.json({ success: true });
}));

// Event routes
app.get('/api/novels/:id/events', asyncHandler(async (req, res) => {
  const events = statements.getEvents.all(req.params.id);
  res.json(events);
}));

app.post('/api/novels/:id/events', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, description = '', chapter_id = null } = req.body;
  const result = statements.createEvent.run(req.params.id, title, description, chapter_id);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, title, description, chapter_id });
}));

app.put('/api/events/:id', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, description = '', chapter_id = null } = req.body;
  const result = statements.updateEvent.run(title, description, chapter_id, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
}));

app.delete('/api/events/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteEvent.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
}));

// Lore routes
app.get('/api/novels/:id/lore', asyncHandler(async (req, res) => {
  const lore = statements.getLore.all(req.params.id);
  res.json(lore);
}));

app.post('/api/novels/:id/lore', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', category = '' } = req.body;
  const result = statements.createLore.run(req.params.id, title, content, category);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, title, content, category });
}));

app.put('/api/lore/:id', validateInput({
  title: { required: true, maxLength: 500 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', category = '' } = req.body;
  const result = statements.updateLore.run(title, content, category, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lore not found' });
  res.json({ success: true });
}));

app.delete('/api/lore/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteLore.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lore not found' });
  res.json({ success: true });
}));

// Item routes
app.get('/api/novels/:id/items', asyncHandler(async (req, res) => {
  const items = statements.getItems.all(req.params.id);
  res.json(items);
}));

app.post('/api/novels/:id/items', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '', properties = '' } = req.body;
  const result = statements.createItem.run(req.params.id, name, description, properties);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, name, description, properties });
}));

app.put('/api/items/:id', validateInput({
  name: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { name, description = '', properties = '' } = req.body;
  const result = statements.updateItem.run(name, description, properties, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
}));

app.delete('/api/items/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteItem.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
}));

// Notes routes
app.get('/api/novels/:id/notes', asyncHandler(async (req, res) => {
  const notes = statements.getNotes.all(req.params.id);
  res.json(notes);
}));

app.post('/api/novels/:id/notes', validateInput({
  title: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', category = '' } = req.body;
  const result = statements.createNote.run(req.params.id, title, content, category);
  res.json({ id: result.lastInsertRowid, novel_id: req.params.id, title, content, category });
}));

app.put('/api/notes/:id', validateInput({
  title: { required: true, maxLength: 300 }
}), asyncHandler(async (req, res) => {
  const { title, content = '', category = '' } = req.body;
  const result = statements.updateNote.run(title, content, category, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ success: true });
}));

app.delete('/api/notes/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteNote.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ success: true });
}));

// AI Prompts routes
app.get('/api/novels/:id/ai-prompts', asyncHandler(async (req, res) => {
  const prompts = statements.getAIPrompts.all(req.params.id);
  // Get contexts for each prompt
  const promptsWithContexts = prompts.map(prompt => ({
    ...prompt,
    contexts: statements.getPromptContexts.all(prompt.id)
  }));
  res.json(promptsWithContexts);
}));

app.get('/api/novels/:id/ai-prompts/active', asyncHandler(async (req, res) => {
  const prompts = statements.getActiveAIPrompts.all(req.params.id);
  res.json(prompts);
}));

app.post('/api/novels/:id/ai-prompts', validateInput({
  name: { required: true, maxLength: 300 },
  category: { required: true, maxLength: 100 },
  prompt_text: { required: true, maxLength: 10000 }
}), asyncHandler(async (req, res) => {
  const { name, category, prompt_text, is_active = true, priority = 0, contexts = [] } = req.body;
  
  const result = statements.createAIPrompt.run(
    req.params.id, 
    name, 
    category, 
    prompt_text, 
    is_active ? 1 : 0, 
    0, // is_system = false for user prompts
    priority
  );
  
  const promptId = result.lastInsertRowid;
  
  // Add contexts if provided
  for (const context of contexts) {
    statements.createPromptContext.run(promptId, context.context_type, context.context_id || null);
  }
  
  res.json({ 
    id: promptId, 
    novel_id: req.params.id, 
    name, 
    category, 
    prompt_text, 
    is_active, 
    is_system: false,
    priority 
  });
}));

app.put('/api/ai-prompts/:id', validateInput({
  name: { required: true, maxLength: 300 },
  category: { required: true, maxLength: 100 },
  prompt_text: { required: true, maxLength: 10000 }
}), asyncHandler(async (req, res) => {
  const { name, category, prompt_text, is_active = true, priority = 0, contexts = [] } = req.body;
  
  const result = statements.updateAIPrompt.run(
    name, 
    category, 
    prompt_text, 
    is_active ? 1 : 0, 
    priority, 
    req.params.id
  );
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'AI Prompt not found or is system prompt' });
  }
  
  // Update contexts
  statements.deletePromptContexts.run(req.params.id);
  for (const context of contexts) {
    statements.createPromptContext.run(req.params.id, context.context_type, context.context_id || null);
  }
  
  res.json({ success: true });
}));

app.delete('/api/ai-prompts/:id', asyncHandler(async (req, res) => {
  const result = statements.deleteAIPrompt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'AI Prompt not found or is system prompt' });
  }
  res.json({ success: true });
}));

// ==================== OUTLINE ROUTES ====================

// Get all outlines for a novel
app.get('/api/novels/:id/outlines', asyncHandler(async (req, res) => {
  const novelId = parseInt(req.params.id);
  const outlines = statements.getOutlines.all(novelId);
  
  // Get sections for each outline
  const outlinesWithSections = outlines.map(outline => {
    const sections = statements.getOutlineSections.all(outline.id);
    return { ...outline, sections };
  });
  
  res.json(outlinesWithSections);
}));

// Create a new outline
app.post('/api/novels/:id/outlines', validateInput({
  title: { required: true, maxLength: 300 },
  description: { maxLength: 1000 }
}), asyncHandler(async (req, res) => {
  const novelId = parseInt(req.params.id);
  const { title, description = '' } = req.body;
  
  const result = statements.createOutline.run(novelId, title, description);
  const outline = statements.getOutline.get(result.lastInsertRowid);
  
  res.status(201).json(outline);
}));

// Get a specific outline with its sections
app.get('/api/outlines/:id', asyncHandler(async (req, res) => {
  const outlineId = parseInt(req.params.id);
  const outline = statements.getOutline.get(outlineId);
  
  if (!outline) {
    return res.status(404).json({ error: 'Outline not found' });
  }
  
  const sections = statements.getOutlineSections.all(outlineId);
  outline.sections = sections;
  
  res.json(outline);
}));

// Update an outline
app.put('/api/outlines/:id', validateInput({
  title: { required: true, maxLength: 300 },
  description: { maxLength: 1000 }
}), asyncHandler(async (req, res) => {
  const outlineId = parseInt(req.params.id);
  const { title, description = '' } = req.body;
  
  const result = statements.updateOutline.run(title, description, outlineId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Outline not found' });
  }
  
  const outline = statements.getOutline.get(outlineId);
  res.json(outline);
}));

// Delete an outline
app.delete('/api/outlines/:id', asyncHandler(async (req, res) => {
  const outlineId = parseInt(req.params.id);
  
  const result = statements.deleteOutline.run(outlineId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Outline not found' });
  }
  
  res.json({ success: true });
}));

// Get sections for an outline
app.get('/api/outlines/:id/sections', asyncHandler(async (req, res) => {
  const outlineId = parseInt(req.params.id);
  const sections = statements.getOutlineSections.all(outlineId);
  res.json(sections);
}));

// Get a specific section
app.get('/api/sections/:id', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.id);
  const section = statements.getOutlineSection.get(sectionId);
  
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }
  
  res.json(section);
}));

// Create a new outline section
app.post('/api/outlines/:id/sections', validateInput({
  title: { required: true, maxLength: 300 },
  description: { maxLength: 1000 },
  content: { maxLength: 10000 },
  order_index: { type: 'number' },
  parent_id: { type: 'number' },
  level: { type: 'number' },
  chapter_id: { type: 'number' }
}), asyncHandler(async (req, res) => {
  const outlineId = parseInt(req.params.id);
  const { 
    title, 
    description = '', 
    content = '',
    order_index = 0, 
    parent_id = null, 
    level = 0,
    chapter_id = null 
  } = req.body;
  
  const result = statements.createOutlineSection.run(
    outlineId, title, description, content, order_index, parent_id, level, chapter_id
  );
  
  const section = statements.getOutlineSection.get(result.lastInsertRowid);
  res.status(201).json(section);
}));

// Update an outline section
app.put('/api/sections/:id', validateInput({
  title: { required: true, maxLength: 300 },
  description: { maxLength: 1000 },
  content: { maxLength: 10000 },
  order_index: { type: 'number' },
  parent_id: { type: 'number' },
  level: { type: 'number' },
  chapter_id: { type: 'number' }
}), asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.id);
  const { 
    title, 
    description = '', 
    content = '',
    order_index = 0, 
    parent_id = null, 
    level = 0,
    chapter_id = null 
  } = req.body;
  
  const result = statements.updateOutlineSection.run(
    title, description, content, order_index, parent_id, level, chapter_id, sectionId
  );
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Outline section not found' });
  }
  
  const section = statements.getOutlineSection.get(sectionId);
  res.json(section);
}));

// Delete an outline section
app.delete('/api/sections/:id', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.id);
  
  const result = statements.deleteOutlineSection.run(sectionId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Outline section not found' });
  }
  
  res.json({ success: true });
}));

// MCP Claude API endpoint
app.post('/api/mcp/claude', asyncHandler(async (req, res) => {
  const { action, data } = req.body;
  
  // Get active AI prompts for the novel if novelId is provided
  let activePrompts = [];
  if (data.novelId) {
    try {
      activePrompts = statements.getActiveAIPrompts.all(data.novelId);
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    }
  }

  // Build system prompt from active prompts
  let systemPrompt = '';
  if (activePrompts.length > 0) {
    systemPrompt = 'WRITING GUIDELINES:\n\n';
    activePrompts.forEach((prompt, index) => {
      systemPrompt += `${index + 1}. ${prompt.name} (${prompt.category}):\n${prompt.prompt_text}\n\n`;
    });
    systemPrompt += 'Please follow these guidelines when responding.\n\n';
  }
  
  // For now, return a placeholder response since actual MCP integration would require
  // your specific MCP server setup. You can replace this with actual MCP calls.
  let response = '';
  
  switch (action) {
    case 'custom_prompt':
      response = `${systemPrompt}Based on your prompt: "${data.prompt}", here's my analysis of the provided content.\n\n`;
      
      if (activePrompts.length > 0) {
        response += `Applied ${activePrompts.length} custom writing guideline${activePrompts.length !== 1 ? 's' : ''}:\n`;
        activePrompts.forEach(prompt => {
          response += `- ${prompt.name} (${prompt.category})\n`;
        });
        response += '\n';
      }
      
      response += 'This is a placeholder response that would be replaced with actual Claude analysis via MCP.';
      break;
    case 'generate_outline':
      const characters = data.context.storyElements.characters || [];
      const places = data.context.storyElements.places || [];
      response = `${systemPrompt}Story Outline:\n\n1. Introduction\n   - Establish main characters: ${characters.map(c => c.name).join(', ') || 'To be defined'}\n   - Setting: ${places.map(p => p.name).join(', ') || 'To be defined'}\n\n2. Rising Action\n   - Key events unfold\n\n3. Climax\n   - Major conflict resolution\n\n4. Resolution\n   - Character arcs complete\n\n`;
      
      if (activePrompts.length > 0) {
        response += `Generated with ${activePrompts.length} custom writing guideline${activePrompts.length !== 1 ? 's' : ''} applied.\n`;
      }
      
      response += 'This is a placeholder outline. Real MCP integration would provide detailed analysis.';
      break;
    case 'story_so_far':
      const storyElements = data.context.storyElements || {};
      response = `${systemPrompt}Story Summary:\n\nCharacters: ${(storyElements.characters || []).length} defined\nPlaces: ${(storyElements.places || []).length} locations\nEvents: ${(storyElements.events || []).length} key events\n\nCurrent chapter: "${data.context.chapter?.title || 'None'}"\n\n`;
      
      if (activePrompts.length > 0) {
        response += `Analysis follows ${activePrompts.length} custom writing guideline${activePrompts.length !== 1 ? 's' : ''}.\n`;
      }
      
      response += 'This is a placeholder summary. Real MCP integration would provide detailed story analysis.';
      break;
    case 'create_outline_from_chapters':
      if (!data.novelId) {
        response = 'Error: Novel ID required to create outline from chapters.';
        break;
      }
      
      // Get chapters and create outline
      try {
        const chaptersResponse = statements.getChapters.all(data.novelId);
        if (chaptersResponse.length === 0) {
          response = 'No chapters found to create outline from.';
          break;
        }
        
        // Create outline
        const outlineTitle = data.outlineTitle || 'Generated Outline';
        const outlineDescription = `Auto-generated from ${chaptersResponse.length} chapters`;
        const outlineResult = statements.createOutline.run(data.novelId, outlineTitle, outlineDescription);
        const outlineId = outlineResult.lastInsertRowid;
        
        // Create sections for each chapter
        let sectionsCreated = 0;
        chaptersResponse.forEach((chapter, index) => {
          const wordCount = chapter.content ? chapter.content.split(/\s+/).filter(word => word.length > 0).length : 0;
          const sectionDescription = `Chapter ${index + 1} (${wordCount} words)`;
          const sectionContent = chapter.content && chapter.content.length > 200 
            ? chapter.content.substring(0, 200) + '...' 
            : chapter.content || '';
          
          statements.createOutlineSection.run(
            outlineId, 
            chapter.title, 
            sectionDescription, 
            sectionContent,
            index, // order_index
            null, // parent_id
            0, // level
            chapter.id // chapter_id
          );
          sectionsCreated++;
        });
        
        response = `${systemPrompt}✅ Outline created successfully!\n\nTitle: ${outlineTitle}\nSections created: ${sectionsCreated}\nChapters analyzed: ${chaptersResponse.length}\n\nEach chapter has been converted to an outline section and linked back to the original chapter.`;
      } catch (error) {
        response = `Error creating outline: ${error.message}`;
      }
      break;
    case 'get_outline_context':
      if (!data.novelId) {
        response = 'Error: Novel ID required to get outline context.';
        break;
      }
      
      try {
        const outlines = statements.getOutlines.all(data.novelId);
        if (outlines.length === 0) {
          response = 'No outlines found for this novel.';
          break;
        }
        
        // Get first outline with sections
        const outline = outlines[0];
        const sections = statements.getOutlineSections.all(outline.id);
        
        response = `${systemPrompt}📖 STORY OUTLINE: "${outline.title}"\n\n`;
        if (outline.description) {
          response += `Description: ${outline.description}\n\n`;
        }
        
        // Format sections in tree structure
        const formatSection = (section, level = 0) => {
          const indent = '  '.repeat(level);
          return `${indent}• ${section.title}${section.description ? ` - ${section.description}` : ''}`;
        };
        
        const buildSectionTree = (sections, parentId = null) => {
          return sections
            .filter(s => s.parent_id === parentId)
            .sort((a, b) => a.order_index - b.order_index)
            .map(section => {
              const children = buildSectionTree(sections, section.id);
              return formatSection(section, section.level) + 
                (children.length > 0 ? '\n' + children.join('\n') : '');
            });
        };
        
        const sectionTree = buildSectionTree(sections);
        response += sectionTree.length > 0 ? sectionTree.join('\n\n') : 'No sections in outline';
        
        if (activePrompts.length > 0) {
          response += `\n\nGenerated with ${activePrompts.length} custom writing guideline${activePrompts.length !== 1 ? 's' : ''} applied.`;
        }
      } catch (error) {
        response = `Error retrieving outline: ${error.message}`;
      }
      break;
    default:
      response = 'AI processing completed. This is a placeholder response.';
  }
  
  res.json({ 
    success: true, 
    action, 
    response,
    activePrompts: activePrompts.map(p => ({ name: p.name, category: p.category })),
    timestamp: new Date().toISOString()
  });
}));

// Export functionality
app.get('/api/novels/:id/export', asyncHandler(async (req, res) => {
  const novel = statements.getNovel.get(req.params.id);
  if (!novel) return res.status(404).json({ error: 'Novel not found' });
  
  const chapters = statements.getChapters.all(req.params.id);
  const characters = statements.getCharacters.all(req.params.id);
  const places = statements.getPlaces.all(req.params.id);
  const events = statements.getEvents.all(req.params.id);
  const lore = statements.getLore.all(req.params.id);
  const items = statements.getItems.all(req.params.id);
  
  const exportData = {
    novel,
    chapters,
    characters,
    places,
    events,
    lore,
    items,
    exported_at: new Date().toISOString()
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${novel.title.replace(/[^a-z0-9]/gi, '_')}_export.json"`);
  res.json(exportData);
}));

// Export in different formats
app.get('/api/novels/:id/export/:format', asyncHandler(async (req, res) => {
  const { format } = req.params;
  const novel = statements.getNovel.get(req.params.id);
  if (!novel) return res.status(404).json({ error: 'Novel not found' });
  
  const chapters = statements.getChapters.all(req.params.id);
  const filename = novel.title.replace(/[^a-z0-9]/gi, '_');
  
  switch (format.toLowerCase()) {
    case 'markdown':
      const markdownContent = generateMarkdown(novel, chapters);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
      res.send(markdownContent);
      break;
      
    case 'txt':
      const textContent = generatePlainText(novel, chapters);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
      res.send(textContent);
      break;
      
    case 'html':
      const htmlContent = generateHTML(novel, chapters);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
      res.send(htmlContent);
      break;
      
    default:
      res.status(400).json({ error: 'Unsupported format. Use: markdown, txt, or html' });
  }
}));

// Helper functions for export formats
function generateMarkdown(novel, chapters) {
  let content = `# ${novel.title}\n\n`;
  
  if (novel.description) {
    content += `${novel.description}\n\n`;
  }
  
  content += `---\n\n`;
  
  chapters.forEach(chapter => {
    content += `## ${chapter.title}\n\n`;
    if (chapter.content) {
      // Convert HTML to plain text, then format for markdown
      const plainText = convert(chapter.content, {
        wordwrap: false,
        preserveNewlines: true
      });
      content += `${plainText}\n\n`;
    }
  });
  
  return content;
}

function generatePlainText(novel, chapters) {
  let content = `${novel.title}\n`;
  content += '='.repeat(novel.title.length) + '\n\n';
  
  if (novel.description) {
    content += `${novel.description}\n\n`;
  }
  
  chapters.forEach((chapter, index) => {
    content += `Chapter ${index + 1}: ${chapter.title}\n`;
    content += '-'.repeat(`Chapter ${index + 1}: ${chapter.title}`.length) + '\n\n';
    
    if (chapter.content) {
      const plainText = convert(chapter.content, {
        wordwrap: 80,
        preserveNewlines: true
      });
      content += `${plainText}\n\n`;
    }
  });
  
  return content;
}

function generateHTML(novel, chapters) {
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${novel.title}</title>
    <style>
        body { 
            font-family: Georgia, serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { margin-top: 40px; color: #444; }
        .description { 
            font-style: italic; 
            color: #666; 
            margin-bottom: 30px; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .chapter { margin-bottom: 50px; }
        .chapter-content { text-align: justify; }
    </style>
</head>
<body>
    <h1>${novel.title}</h1>`;
    
  if (novel.description) {
    content += `    <div class="description">${novel.description}</div>`;
  }
  
  chapters.forEach(chapter => {
    content += `
    <div class="chapter">
        <h2>${chapter.title}</h2>
        <div class="chapter-content">
            ${chapter.content || '<p>No content</p>'}
        </div>
    </div>`;
  });
  
  content += `
</body>
</html>`;
  
  return content;
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'An error occurred processing your request',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Scribber backend (SQLite) running on port ${PORT}`);
  console.log(`Database location: ${dbPath}`);
});