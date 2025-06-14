const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

async function migrate() {
  console.log('Starting migration from JSON to SQLite...\n');

  // Paths
  const dataDir = path.join(__dirname, 'data');
  const dbPath = path.join(dataDir, 'scribber.db');
  
  // Check if JSON files exist
  const jsonFiles = ['novels.json', 'chapters.json', 'characters.json', 'places.json', 'events.json', 'lore.json', 'items.json'];
  const missingFiles = jsonFiles.filter(file => !fs.existsSync(path.join(dataDir, file)));
  
  if (missingFiles.length === jsonFiles.length) {
    console.log('No JSON files found. Nothing to migrate.');
    return;
  }

  // Backup existing database if it exists
  if (fs.existsSync(dbPath)) {
    const backupPath = path.join(dataDir, `scribber_backup_${Date.now()}.db`);
    console.log(`Backing up existing database to ${backupPath}`);
    fs.copyFileSync(dbPath, backupPath);
  }

  // Initialize database
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // Create schema
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
  `);

  // Prepare statements
  const insertNovel = db.prepare('INSERT INTO novels (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const insertChapter = db.prepare('INSERT INTO chapters (id, novel_id, title, content, order_index, word_count) VALUES (?, ?, ?, ?, ?, ?)');
  const insertCharacter = db.prepare('INSERT INTO characters (id, novel_id, name, description, traits) VALUES (?, ?, ?, ?, ?)');
  const insertPlace = db.prepare('INSERT INTO places (id, novel_id, name, description) VALUES (?, ?, ?, ?)');
  const insertEvent = db.prepare('INSERT INTO events (id, novel_id, title, description, chapter_id) VALUES (?, ?, ?, ?, ?)');
  const insertLore = db.prepare('INSERT INTO lore (id, novel_id, title, content, category) VALUES (?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO items (id, novel_id, name, description, properties) VALUES (?, ?, ?, ?, ?)');

  // Load JSON data
  const loadJSON = (filename) => {
    const filepath = path.join(dataDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
      }
    }
    return [];
  };

  const novels = loadJSON('novels.json');
  const chapters = loadJSON('chapters.json');
  const characters = loadJSON('characters.json');
  const places = loadJSON('places.json');
  const events = loadJSON('events.json');
  const lore = loadJSON('lore.json');
  const items = loadJSON('items.json');

  // Count words helper
  function countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Migrate data in a transaction
  const migrate = db.transaction(() => {
    let counts = {
      novels: 0,
      chapters: 0,
      characters: 0,
      places: 0,
      events: 0,
      lore: 0,
      items: 0
    };

    // Migrate novels
    for (const novel of novels) {
      try {
        insertNovel.run(
          novel.id,
          novel.title || 'Untitled',
          novel.description || '',
          novel.createdAt || new Date().toISOString(),
          novel.updatedAt || new Date().toISOString()
        );
        counts.novels++;
      } catch (error) {
        console.error(`Error migrating novel ${novel.id}:`, error.message);
      }
    }

    // Migrate chapters
    for (const chapter of chapters) {
      try {
        const wordCount = countWords(chapter.content);
        insertChapter.run(
          chapter.id,
          chapter.novelId,
          chapter.title || 'Untitled Chapter',
          chapter.content || '',
          chapter.order || 0,
          wordCount
        );
        counts.chapters++;
      } catch (error) {
        console.error(`Error migrating chapter ${chapter.id}:`, error.message);
      }
    }

    // Migrate characters
    for (const character of characters) {
      try {
        insertCharacter.run(
          character.id,
          character.novelId,
          character.name || 'Unknown',
          character.description || '',
          character.traits || ''
        );
        counts.characters++;
      } catch (error) {
        console.error(`Error migrating character ${character.id}:`, error.message);
      }
    }

    // Migrate places
    for (const place of places) {
      try {
        insertPlace.run(
          place.id,
          place.novelId,
          place.name || 'Unknown Place',
          place.description || ''
        );
        counts.places++;
      } catch (error) {
        console.error(`Error migrating place ${place.id}:`, error.message);
      }
    }

    // Migrate events
    for (const event of events) {
      try {
        insertEvent.run(
          event.id,
          event.novelId,
          event.title || 'Untitled Event',
          event.description || '',
          event.chapterId || null
        );
        counts.events++;
      } catch (error) {
        console.error(`Error migrating event ${event.id}:`, error.message);
      }
    }

    // Migrate lore
    for (const loreItem of lore) {
      try {
        insertLore.run(
          loreItem.id,
          loreItem.novelId,
          loreItem.title || 'Untitled Lore',
          loreItem.content || '',
          loreItem.category || ''
        );
        counts.lore++;
      } catch (error) {
        console.error(`Error migrating lore ${loreItem.id}:`, error.message);
      }
    }

    // Migrate items
    for (const item of items) {
      try {
        insertItem.run(
          item.id,
          item.novelId,
          item.name || 'Unknown Item',
          item.description || '',
          item.properties || ''
        );
        counts.items++;
      } catch (error) {
        console.error(`Error migrating item ${item.id}:`, error.message);
      }
    }

    return counts;
  });

  try {
    const counts = migrate();
    
    console.log('\nMigration completed successfully!');
    console.log('----------------------------------');
    console.log(`Novels migrated: ${counts.novels}`);
    console.log(`Chapters migrated: ${counts.chapters}`);
    console.log(`Characters migrated: ${counts.characters}`);
    console.log(`Places migrated: ${counts.places}`);
    console.log(`Events migrated: ${counts.events}`);
    console.log(`Lore entries migrated: ${counts.lore}`);
    console.log(`Items migrated: ${counts.items}`);
    console.log('\nYour data has been migrated to SQLite.');
    console.log('You can now use the improved backend by running: npm run start:sqlite');
    
    // Ask user if they want to archive JSON files
    console.log('\nThe original JSON files are still in the data directory.');
    console.log('You may want to archive them once you verify the migration was successful.');
    
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    console.error('Your original JSON files are unchanged.');
  } finally {
    db.close();
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;