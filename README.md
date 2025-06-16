# Local Lore - AI-Powered Novel Writing Suite

<div align="center">
  <img src="Logo.png" alt="Local Lore Logo" width="200"/>
  <h3><em>"It's like Magic"</em></h3>
</div>

A comprehensive, self-hosted novel writing application with AI assistance that integrates seamlessly with Claude Desktop. Local Lore helps authors organize their writing process, track story elements, and leverage AI for creative assistance—all while keeping your data private and local.

## ✨ Key Features

### 📝 **Professional Writing Environment**
- **Rich Text Editor**: TipTap-powered editor with professional formatting tools
- **Focus Mode**: Distraction-free writing with customizable interface
- **Auto-save**: Intelligent auto-saving with debounced updates
- **Real-time Statistics**: Live word count, character count, and writing progress
- **Version History**: Complete chapter version control with restoration capabilities

### 🏗️ **Advanced Story Organization**
- **Hierarchical Outlines**: Multi-level story structure (Acts → Chapters → Scenes → Beats)
- **Chapter Management**: Create, reorder, and manage chapters with drag-and-drop
- **Bi-directional Sync**: Automatic synchronization between outline and chapter views
- **Chapter Guide**: Read-only contextual guide showing scene and beat structure

### 🎭 **Comprehensive Story Element Tracking**
- **Characters**: Detailed character profiles with traits and descriptions
- **Places**: Location registry with rich descriptions
- **Events**: Plot events linked to specific chapters
- **Lore**: Categorized world-building information
- **Items**: Story objects and artifacts
- **Smart Organization**: Tabbed interface with search and categorization

### 🤖 **Advanced AI Integration**
- **Claude Desktop Integration**: Direct MCP (Model Context Protocol) server connection
- **Custom AI Prompts**: User-defined writing assistance templates
- **Context-Aware AI**: Automatically provides relevant story elements as context
- **Multiple AI Actions**: Edit, review, continue, and replace text functionality
- **Story Analysis**: Generate outlines, summaries, and comprehensive story analysis

### 🔍 **Powerful Search & Navigation**
- **Global Search**: Search across all chapters and story elements
- **Text Highlighting**: In-editor search result highlighting
- **Quick Navigation**: Jump between chapters, characters, and places
- **Cross-references**: Navigate between related story elements

### 📊 **Export & Data Management**
- **Multiple Export Formats**: JSON, Markdown, HTML, and plain text
- **Complete Data Export**: Export all story elements with metadata
- **Visual Notes System**: Draggable, resizable notes with color coding
- **Data Integrity**: SQLite database with proper relationship management

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Claude Desktop** (for AI features)
- **Git** (for cloning)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Local-Lore.git
   cd Local-Lore
   ```

2. **Install dependencies for all components:**
   ```bash
   # Backend
   cd Local-Lore-App/backend
   npm install

   # Frontend
   cd ../frontend
   npm install

   # MCP Server
   cd ../mcp-server
   npm install
   cd ../../
   ```

3. **Start the application:**
   
   **Option A: Use batch files (Windows):**
   ```batch
   # Start backend
   start-backend.bat
   
   # Start frontend (in new terminal)
   Start-frontend.bat
   
   # Start MCP server (in new terminal)
   "Start MCP.bat"
   ```

   **Option B: Manual startup:**
   ```bash
   # Terminal 1: Backend
   cd Local-Lore-App/backend
   npm start

   # Terminal 2: Frontend
   cd Local-Lore-App/frontend
   npm start

   # Terminal 3: MCP Server
   cd Local-Lore-App/mcp-server
   npm start
   ```

4. **Access the application at `http://localhost:3000`**

### Desktop Application (Electron)

For a native desktop experience:

```bash
cd Local-Lore-App/frontend

# Development mode
npm run electron-dev

# Build for production
npm run electron-dist
```

## 🤖 AI Integration Setup

### Claude Desktop MCP Integration

1. **Install and configure the MCP server:**
   ```bash
   cd Local-Lore-App/mcp-server
   npm install
   ```

2. **Configure Claude Desktop:**
   
   **Windows:**
   - Copy the contents of `claude-desktop-config.json`
   - Paste into `%APPDATA%\Claude\claude_desktop_config.json`
   - Create the file if it doesn't exist

   **Mac/Linux:**
   ```bash
   # Create or edit ~/.config/claude/claude_desktop_config.json
   {
     "mcpServers": {
       "local-lore": {
         "command": "node",
         "args": ["/full/path/to/Local-Lore/Local-Lore-App/mcp-server/server.js"],
         "env": {
           "LOCAL_LORE_API": "http://localhost:3001/api"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** to activate the integration

### Browser Extension (Alternative)

For Claude Desktop web interface integration:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Local-Lore-App/frontend/public/scribber-extension` directory

## 📖 User Guide

### Creating Your First Novel

1. **Start a New Project:**
   - Click "New Novel" from the dashboard
   - Enter title, description, genre, and POV
   - Choose standalone or series format
   - Click "Create" to initialize

2. **Writing Interface:**
   - **Left Sidebar**: Navigate chapters and story elements
   - **Main Editor**: Rich text editing with formatting toolbar
   - **Right Sidebar**: Chapter Guide (when enabled)
   - **Bottom Status**: Word count and save status

### Story Organization

1. **Chapter Management:**
   - Create new chapters from the sidebar
   - Drag and drop to reorder chapters
   - Use the outline view for hierarchical organization

2. **Story Elements:**
   - **Characters Tab**: Create and manage character profiles
   - **Places Tab**: Document locations and settings
   - **Events Tab**: Track plot events and timeline
   - **Lore Tab**: Build your world's history and rules
   - **Items Tab**: Catalog important objects

3. **Outline System:**
   - Access via the "Outline" view
   - Create hierarchical story structure
   - Generate outlines from existing chapters
   - Sync automatically with chapter organization

### AI-Powered Writing

1. **Text Selection AI:**
   - Select text in the editor
   - Use AI Assistant for editing, reviewing, or continuing
   - AI receives relevant story context automatically

2. **Custom AI Prompts:**
   - Create custom writing assistance prompts
   - Use placeholders like `{{selectedText}}` and `{{character}}`
   - Access from the AI Assistant panel

3. **Story Analysis:**
   - Generate comprehensive story outlines
   - Create character summaries
   - Analyze plot structure and pacing

### Version Control

1. **Automatic Versioning:**
   - Versions saved automatically on significant changes
   - Manual save creates explicit version points

2. **Version Management:**
   - View version history in the sidebar
   - Compare different versions
   - Restore previous versions when needed

## 🏗️ Architecture

### Project Structure
```
Local-Lore/
├── Local-Lore-App/
│   ├── backend/                    # Node.js/Express API server
│   │   ├── data/                   # SQLite database and backups
│   │   ├── server-improved.js      # Main server file
│   │   ├── analyzer.js             # Text analysis utilities
│   │   └── package.json            # Backend dependencies
│   │
│   ├── frontend/                   # React + Electron application
│   │   ├── electron/               # Electron main process
│   │   ├── public/                 # Static assets and browser extension
│   │   ├── src/                    # React application source
│   │   │   ├── components/         # Reusable UI components
│   │   │   └── contexts/           # React context providers
│   │   └── package.json            # Frontend dependencies
│   │
│   ├── mcp-server/                 # Claude Desktop MCP integration
│   │   ├── server.js               # MCP server implementation
│   │   └── package.json            # MCP server dependencies
│   │
│   └── claude-desktop-config.json  # Claude Desktop configuration
│
├── Logo.png                        # Application logo
├── README.md                       # This file
└── *.bat                          # Windows batch scripts for easy startup
```

### Technology Stack

**Backend:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Additional**: CORS, dotenv, markdown-it, html-to-text

**Frontend:**
- **Framework**: React 18 with Vite
- **Router**: React Router DOM
- **Editor**: TipTap (ProseMirror-based)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

**Desktop:**
- **Platform**: Electron 28+
- **Builder**: electron-builder
- **Cross-platform**: Windows, macOS, Linux support

**AI Integration:**
- **Protocol**: Model Context Protocol (MCP)
- **Provider**: Anthropic Claude
- **SDK**: @modelcontextprotocol/sdk

### Database Schema

The application uses SQLite with the following core tables:

- **novels**: Project metadata (title, description, genre, POV, series info)
- **chapters**: Chapter content with order, word count, and timestamps
- **chapter_versions**: Complete version history for all chapters
- **characters**: Character profiles with traits and descriptions
- **places**: Location information with descriptions
- **events**: Plot events linked to specific chapters
- **lore**: Categorized world-building information
- **items**: Story objects and artifacts
- **notes**: Visual sticky notes with position data
- **ai_prompts**: Custom AI writing prompts
- **outlines**: Story structure outlines
- **outline_sections**: Hierarchical outline components

## 🛠️ Development

### Available Scripts

**Backend (`Local-Lore-App/backend`):**
- `npm start`: Start the production server
- `npm run dev`: Start with nodemon (development)
- `npm run migrate`: Migrate from JSON to SQLite
- `npm run add-aiisms`: Add anti-AI writing guidelines

**Frontend (`Local-Lore-App/frontend`):**
- `npm start`: Start Vite development server
- `npm run build`: Build for production
- `npm run electron`: Run Electron app
- `npm run electron-dev`: Run Electron in development mode
- `npm run electron-dist`: Build desktop application

**MCP Server (`Local-Lore-App/mcp-server`):**
- `npm start`: Start the MCP server

### Configuration

**Environment Variables** (create `.env` in backend directory):
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Customization Options:**
- Theme switching (light/dark)
- Editor font and size preferences
- Sidebar width and layout
- Auto-save intervals

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts:**
   - Backend runs on port 3001
   - Frontend runs on port 3000
   - Ensure ports are available

2. **Database Issues:**
   - Database file: `Local-Lore-App/backend/data/scribber.db`
   - Backup available in `data/json-backup/`

3. **AI Integration:**
   - Ensure Claude Desktop is running
   - Check MCP server configuration
   - Verify file paths in configuration

4. **Electron App:**
   - Ensure backend is running before starting Electron
   - Check console for backend connection errors

### Performance Tips

- Use auto-save wisely (it's debounced for performance)
- Close unused story element tabs
- Export projects regularly for backup
- Use version history judiciously

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by professional writing tools like Scrivener and Novelcrafter
- Built with the amazing open-source community
- Special thanks to Anthropic for Claude AI integration
- Icons provided by Lucide React

---

**🔒 Privacy Note**: Local Lore is a self-hosted application. Your writing data never leaves your machine unless you choose to export it. AI features communicate only with your local Claude Desktop installation.

**✨ Happy Writing!** Create your next masterpiece with Local Lore's powerful combination of traditional writing tools and cutting-edge AI assistance.