# Claude Desktop Integration Guide

The enhanced MCP server provides Claude Desktop with powerful tools to interact directly with your Scribber novels. Here's what Claude can now do:

## 🔧 Available Tools

### **Novel Management**
- `get_novels` - List all your novels
- `get_novel` - Get details of a specific novel
- `get_chapters` - List all chapters in a novel
- `get_chapter` - Read a specific chapter with full content
- `update_chapter` - Write/edit chapter content directly

### **Character Management**
- `get_characters` - View all characters in a novel (with IDs for deletion)
- `add_character` - Create new characters with descriptions and traits
- `delete_character` - Remove a character by ID

### **World Building**
- `get_places` - View all locations in your story (with IDs for deletion)
- `add_place` - Add new locations with descriptions
- `delete_place` - Remove a place by ID
- `get_lore` - Access all lore entries (with IDs for deletion)
- `add_lore` - Create new lore entries with categories
- `delete_lore` - Remove a lore entry by ID
- `get_items` - View all items in your story (with IDs for deletion)
- `add_item` - Add new items with properties
- `delete_item` - Remove an item by ID

### **Story Events**
- `get_events` - View timeline of story events (with IDs for deletion)
- `add_event` - Record new story events (can link to chapters)
- `delete_event` - Remove an event by ID

### **Smart Analysis**
- `analyze_chapter` - Automatically extract story elements from chapter text
- `get_story_context` - Get complete overview of all story elements

## 💡 How to Use with Claude Desktop

### **1. Start Your Writing Session**
```
Claude, I'm working on a novel. Can you show me what novels I have available?
```
Claude will use `get_novels` to show your projects.

### **2. Get Story Context**
```
Claude, give me the complete story context for novel ID 1
```
Claude will use `get_story_context` to show all characters, places, events, lore, and items.

### **3. Read and Edit Chapters**
```
Claude, please read chapter 2 from novel 1, then help me continue writing it
```
Claude will:
1. Use `get_chapter` to read the current content
2. Use `get_story_context` to understand your world
3. Help you write new content
4. Use `update_chapter` to save changes

### **4. Develop Characters**
```
Claude, I mentioned a character named "Elena" in my latest chapter. Can you add her to my character database with a detailed description?
```
Claude will use `add_character` to create a proper character entry.

### **5. Analyze Your Writing**
```
Claude, please analyze chapter 3 to extract any new story elements I might have introduced
```
Claude will use `analyze_chapter` to automatically find and add new characters, places, events, and items.

### **6. Maintain Consistency**
```
Claude, I want to write a scene in the tavern. What do I know about taverns in my story?
```
Claude will use `get_places` to show you all locations and help maintain consistency.

## 🎯 Example Workflows

### **Starting a New Chapter**
1. "Claude, show me the characters in novel 1"
2. "What events have happened recently?"
3. "Help me write the opening of chapter 4, taking place in the castle courtyard"
4. Claude reads context, helps write, then updates the chapter

### **Character Development**
1. "Claude, get the characters for novel 1"
2. "I want to develop Sarah's backstory more. Help me write a scene showing her childhood"
3. "Add this backstory information to Sarah's character profile"

### **World Building**
1. "Claude, what lore do I have for novel 1?"
2. "Help me create a new lore entry about the magic system"
3. "Add a new place called 'The Whispering Woods' with a mysterious description"

### **Story Analysis**
1. "Claude, analyze chapter 5 for any new story elements"
2. "Show me all the events in chronological order"
3. "Help me identify any plot holes or inconsistencies"

### **Codex Management**
1. "Claude, show me all characters in novel 1"
2. "Delete character ID 5 - they're no longer needed"
3. "Clean up the places list by removing any unused locations"
4. "Remove all events that are no longer relevant to the plot"

## 🚀 Advanced Tips

### **Batch Operations**
```
Claude, please:
1. Get the story context for novel 1
2. Read chapter 3
3. Help me write a continuation that introduces a new character
4. Add that character to the database
5. Update the chapter with our new content
```

### **Consistency Checking**
```
Claude, compare the description of the castle in chapter 1 with how I described it in chapter 5. Are they consistent?
```

### **Plot Development**
```
Claude, based on all the events in my novel so far, help me brainstorm what should happen next
```

## ⚙️ Setup Requirements

1. **Scribber backend must be running** on `http://localhost:3001`
2. **Claude Desktop configured** with the MCP server
3. **Novel must exist** in Scribber (create through the web interface)

## 🔍 Troubleshooting

If Claude reports errors:
- ✅ Check that Scribber backend is running
- ✅ Verify novel/chapter IDs are correct
- ✅ Ensure you've created novels through the web interface first
- ✅ Restart Claude Desktop after MCP setup changes

## 🎉 Getting Started

1. Create a novel in the Scribber web interface
2. Add a chapter with some content
3. Tell Claude: "Show me my available novels and help me continue writing"

Claude now has full access to your story world and can help you write consistently while maintaining all your story elements!