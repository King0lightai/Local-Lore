# Local Lore - AI-Powered Novel Writing App

A comprehensive, self-hosted novel writing application with AI assistance that integrates with Claude Desktop. Local Lore helps authors organize their writing process, track story elements, and leverage AI for creative assistance—all while keeping your data private and local.

## ✨ Features

### Writing & Organization
- 📝 Distraction-free writing interface
- 🗂️ Hierarchical project structure with novels, chapters, and scenes
- 📑 Rich text editing with formatting options
- 🔍 Full-text search across all your writing
- 🏷️ Tagging system for easy categorization
- 📊 Word count and writing statistics

### AI-Powered Assistance
- 🤖 Integrated Claude AI for writing suggestions
- ✍️ AI-powered editing and rewriting
- 📖 Story continuation and expansion
- 🔄 Multiple AI interaction modes (Edit, Review, Continue, Replace)
- 🎭 Character and plot consistency checking

### Story Management
- 📚 Automatic tracking of story elements:
  - 👥 Characters with detailed profiles
  - 🏰 Locations and settings
  - 📅 Events and plot points
  - 📜 Lore and worldbuilding
  - 🧩 Items and artifacts
- 🗺️ Visual outline and storyboard view
- 🔗 Link story elements to specific scenes

### Productivity
- ⏱️ Writing goals and progress tracking
- 📅 Session history and statistics
- 💾 Auto-save and version history
- 📱 Responsive design for all devices
- 🎨 Customizable interface themes
- 🔌 Plugin system for extensibility

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Claude Desktop application (for AI features)
- Modern web browser (Chrome, Firefox, Edge, or Safari)

### 1. Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/local-lore.git
   cd local-lore/Local-Lore-App
   ```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will run on http://localhost:3001

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
npm start
```

The application will automatically open in your default browser at http://localhost:3000

### 4. AI Integration (Optional but Recommended)

#### Claude Desktop Integration

1. Install the MCP server:
   ```bash
   cd mcp-server
   npm install
   ```

2. **Windows Setup:**
   - Copy the contents of `claude-desktop-config.json`
   - Paste into `%APPDATA%\Claude\claude_desktop_config.json`
   - Create the file if it doesn't exist
   - Restart Claude Desktop

3. **Mac/Linux Setup:**
   Create or edit `~/.config/claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "local-lore": {
         "command": "node",
         "args": ["/full/path/to/local-lore/mcp-server/server.js"],
         "env": {
           "LOCAL_LORE_API": "http://localhost:3001/api"
         }
       }
     }
   }
   ```

4. **Chrome Extension (Alternative):**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `frontend/public/scribber-extension` directory

## 📖 User Guide

### Creating Your First Novel
1. Click "New Novel" from the dashboard
2. Enter your novel's title, genre, and description
3. Click "Create" to initialize your project

### Writing Interface
- The main editor provides a clean, distraction-free writing environment
- Use the left sidebar to navigate between chapters and scenes
- The right sidebar shows relevant story elements as you write

### Using AI Assistance
1. Select text in your document
2. Click the AI Assistant button in the toolbar
3. Choose an action:
   - **Edit**: Improve clarity and flow
   - **Review**: Get feedback on writing quality
   - **Continue**: Generate the next part of your story
   - **Replace**: Rewrite with a different approach

### Managing Story Elements
- **Characters**: Track character details, relationships, and arcs
- **Locations**: Document settings and environments
- **Timeline**: Visualize your story's chronology
- **Lore**: Build your world's history and rules

### Outline View
- Create a hierarchical outline of your novel
- Drag and drop to reorganize scenes and chapters
- Link outline items to specific story elements
- View word count and progress for each section

### Version Control
- View and restore previous versions of your work
- Add notes to significant changes
- Compare different versions side by side

## 🤖 Advanced AI Integration

### MCP Server Features
- Access your entire story context directly in Claude Desktop
- Query character information, plot points, and world details
- Generate content that stays consistent with your story

### Custom AI Prompts
1. Access the AI Prompts Manager from the settings menu
2. Create new prompt templates or modify existing ones
3. Use placeholders like `{{selectedText}}` and `{{character}}`
4. Save your prompts for future use

### Chrome Extension Features
- One-click prompt generation based on selected text
- Quick access to common writing assistance tasks
- Seamless integration with Claude's web interface

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=3001
NODE_ENV=development
DATABASE_URL=./data/local-lore.db
```

### Customizing the Interface
- Toggle between light and dark themes
- Adjust font size and family
- Customize the editor's appearance
- Configure keyboard shortcuts

## 📚 Documentation

For detailed documentation, please refer to:
- [AI Integration Guide](./CLAUDE-INTEGRATION-GUIDE.md)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: SQLite with Knex.js ORM
- **API**: RESTful JSON API
- **Authentication**: JWT

### Frontend
- **Framework**: React 18
- **State Management**: React Context API
- **Rich Text Editor**: TipTap (ProseMirror)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Charts**: Chart.js

### AI Integration
- **Protocol**: Model Context Protocol (MCP)
- **AI Provider**: Anthropic Claude
- **Extensions**: Chrome Extension API

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

### Core Tables
- **novels**: Main story projects
- **chapters**: Chapter content and metadata
- **scenes**: Individual scenes within chapters
- **versions**: Document version history

### Story Elements
- **characters**: Character profiles and traits
- **locations**: Places and settings
- **events**: Plot points and timeline events
- **items**: Objects and artifacts
- **lore_entries**: Worldbuilding elements

### Supporting Tables
- **tags**: Categorization system
- **notes**: Author's notes and annotations
- **ai_prompts**: Custom AI prompt templates
- **sessions**: Writing session data

## 🤝 Contributing

We welcome contributions!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by tools like Scrivener, Novelcrafter, and Sudowrite
- Built with the amazing open-source community
- Special thanks to all our beta testers and contributors

---

📝 **Note**: This is a self-hosted application. Your data never leaves your machine unless you choose to export or back it up.
- **events**: Story events and timeline
- **lore**: World-building information
- **items**: Important objects in the story