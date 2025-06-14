const Database = require('better-sqlite3');
const path = require('path');

// AIisms guide content as a system prompt
const AIISMS_PROMPT = `# Anti-AI-isms Writing Guidelines

IMPORTANT: Avoid these overused, formulaic phrases that signal artificial writing:

## Forbidden Transition Phrases
- "It's worth noting that..."
- "Furthermore, it's important to recognize..."
- "In light of this..."
- "With that being said..."
- "On a related note..."
- "It goes without saying..."
- "Needless to say..."
- "At the end of the day..."

## Avoid Empty Qualifiers
- "Truly remarkable"
- "Absolutely essential"
- "Incredibly important"
- "Deeply meaningful"
- "Profoundly significant"
- "Utterly fascinating"
- "Completely transformed"
- "Entirely different"

## Skip Generic Descriptors
- "Cutting-edge technology"
- "State-of-the-art solution"
- "Seamless experience"
- "Robust framework"
- "Comprehensive approach"
- "Innovative methodology"
- "Game-changing innovation"
- "Revolutionary breakthrough"

## Eliminate Distance Markers
- "One might argue..."
- "It could be said that..."
- "There's a sense that..."
- "It's clear that..."
- "Obviously..."
- "Certainly..."
- "Undoubtedly..."
- "Without question..."

## Replace Vague Intensifiers
- "Significantly enhance"
- "Greatly improve"
- "Substantially increase"
- "Dramatically reduce"
- "Effectively address"
- "Successfully implement"
- "Carefully consider"
- "Thoroughly examine"

## Avoid Academic Pretension
- "It is imperative to note..."
- "One must consider..."
- "It becomes evident that..."
- "Upon careful examination..."
- "Through rigorous analysis..."
- "In accordance with..."
- "As evidenced by..."
- "It can be argued that..."

## INSTEAD, FOLLOW THESE PRINCIPLES:

1. **Be Specific**: Use concrete details, numbers, and examples instead of abstract concepts
2. **Use Active Voice**: Write direct, accountable statements
3. **Cut Unnecessary Words**: Remove qualifiers that don't add meaning
4. **Show Clear Relationships**: Connect ideas through logical flow, not formulaic transitions
5. **Write Naturally**: Use language that sounds authentic and conversational
6. **Test for Authenticity**: Ask "Would a human naturally speak this way?"

## GOAL: Create writing that feels natural, authoritative, and genuinely engaging through clear, specific, and purposeful language.`;

async function addAIismsPrompt() {
  console.log('Adding AIisms system prompt to all novels...\n');

  const dataDir = path.join(__dirname, 'data');
  const dbPath = path.join(dataDir, 'scribber.db');
  
  if (!require('fs').existsSync(dbPath)) {
    console.error('Database not found. Please run the server first to create the database.');
    return;
  }

  const db = new Database(dbPath);
  
  try {
    // Get all novels
    const novels = db.prepare('SELECT id, title FROM novels').all();
    
    if (novels.length === 0) {
      console.log('No novels found in database.');
      return;
    }

    console.log(`Found ${novels.length} novel(s). Adding AIisms prompt to each...`);

    // Check if AIisms prompt already exists for any novel
    const existingPrompt = db.prepare('SELECT COUNT(*) as count FROM ai_prompts WHERE name = ? AND is_system = 1').get('Anti-AI-isms Guidelines');
    
    if (existingPrompt.count > 0) {
      console.log('AIisms prompt already exists. Updating content...');
      
      // Update existing AIisms prompts
      const updateStmt = db.prepare(`
        UPDATE ai_prompts 
        SET prompt_text = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE name = ? AND is_system = 1
      `);
      
      const result = updateStmt.run(AIISMS_PROMPT, 'Anti-AI-isms Guidelines');
      console.log(`Updated ${result.changes} AIisms prompt(s).`);
    } else {
      // Insert AIisms prompt for each novel
      const insertStmt = db.prepare(`
        INSERT INTO ai_prompts (novel_id, name, category, prompt_text, is_active, is_system, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let added = 0;
      for (const novel of novels) {
        try {
          insertStmt.run(
            novel.id,
            'Anti-AI-isms Guidelines',
            'system',
            AIISMS_PROMPT,
            1, // is_active
            1, // is_system (non-editable)
            100 // high priority
          );
          added++;
          console.log(`✓ Added AIisms prompt to "${novel.title}"`);
        } catch (error) {
          console.error(`✗ Failed to add prompt to "${novel.title}":`, error.message);
        }
      }
      
      console.log(`\nSuccessfully added AIisms prompt to ${added}/${novels.length} novels.`);
    }

    console.log('\nAIisms system prompt integration completed!');
    console.log('This prompt will automatically apply to all Claude interactions.');
    
  } catch (error) {
    console.error('Error adding AIisms prompt:', error);
  } finally {
    db.close();
  }
}

// Run the migration
if (require.main === module) {
  addAIismsPrompt().catch(console.error);
}

module.exports = addAIismsPrompt;