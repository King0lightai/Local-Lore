# Scribber Backend

This is the backend server for the Scribber novel writing application.

## Database

The backend uses SQLite for data storage. The database file is located at `data/scribber.db`.

## Running the Server

```bash
npm install
npm start
```

Or use the provided batch file from the project root:
```
start-backend.bat
```

## API Endpoints

The server provides RESTful API endpoints for:
- Novels
- Chapters (with version history)
- Story Elements:
  - Characters
  - Places
  - Events
  - Lore
  - Items
  - Notes

## Migration from JSON

If you have old JSON data files, you can migrate them to SQLite using:
```bash
npm run migrate
```

Old JSON files are backed up in `data/json-backup/` directory.

## AI Writing Guidelines

To add the Anti-AI-isms system prompt to all novels:
```bash
npm run add-aiisms
```

This adds a non-editable system prompt that helps prevent common AI writing patterns and improves authenticity.

## File Structure

- `server-improved.js` - Main server file
- `analyzer.js` - Text analysis utilities
- `migrate-to-sqlite.js` - Migration script from JSON to SQLite
- `data/` - Database and backup files
  - `scribber.db` - SQLite database
  - `json-backup/` - Backup of old JSON files