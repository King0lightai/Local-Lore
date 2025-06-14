import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const LOCAL_LORE_API = process.env.LOCAL_LORE_API || 'http://localhost:3001/api';

const server = new Server({
  name: 'local-lore-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_novels',
        description: 'Get list of all novels',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_novel',
        description: 'Get details of a specific novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'get_chapters',
        description: 'Get all chapters for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'get_chapter',
        description: 'Get a specific chapter with full content',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            chapterId: { type: 'number', description: 'The ID of the chapter' }
          },
          required: ['novelId', 'chapterId']
        }
      },
      {
        name: 'update_chapter',
        description: 'Update chapter content',
        inputSchema: {
          type: 'object',
          properties: {
            chapterId: { type: 'number', description: 'The ID of the chapter' },
            title: { type: 'string', description: 'Chapter title' },
            content: { type: 'string', description: 'Chapter content' }
          },
          required: ['chapterId', 'title', 'content']
        }
      },
      {
        name: 'get_characters',
        description: 'Get all characters for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'add_character',
        description: 'Add a new character to a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            name: { type: 'string', description: 'Character name' },
            description: { type: 'string', description: 'Character description' },
            traits: { type: 'string', description: 'Character traits' }
          },
          required: ['novelId', 'name']
        }
      },
      {
        name: 'get_places',
        description: 'Get all places for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'add_place',
        description: 'Add a new place to a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            name: { type: 'string', description: 'Place name' },
            description: { type: 'string', description: 'Place description' }
          },
          required: ['novelId', 'name']
        }
      },
      {
        name: 'get_events',
        description: 'Get all events for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'add_event',
        description: 'Add a new event to a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            chapterId: { type: 'number', description: 'Chapter ID (optional)' }
          },
          required: ['novelId', 'title', 'description']
        }
      },
      {
        name: 'get_lore',
        description: 'Get all lore entries for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'add_lore',
        description: 'Add a new lore entry to a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            title: { type: 'string', description: 'Lore title' },
            content: { type: 'string', description: 'Lore content' },
            category: { type: 'string', description: 'Lore category' }
          },
          required: ['novelId', 'title', 'content']
        }
      },
      {
        name: 'get_items',
        description: 'Get all items for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'add_item',
        description: 'Add a new item to a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            name: { type: 'string', description: 'Item name' },
            description: { type: 'string', description: 'Item description' },
            properties: { type: 'string', description: 'Item properties' }
          },
          required: ['novelId', 'name']
        }
      },
      {
        name: 'analyze_chapter',
        description: 'Analyze chapter content to automatically extract and add story elements',
        inputSchema: {
          type: 'object',
          properties: {
            chapterId: { type: 'number', description: 'The ID of the chapter to analyze' }
          },
          required: ['chapterId']
        }
      },
      {
        name: 'get_story_context',
        description: 'Get comprehensive story context for a novel (all characters, places, events, lore, items)',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'delete_character',
        description: 'Delete a character from the novel',
        inputSchema: {
          type: 'object',
          properties: {
            characterId: { type: 'number', description: 'The ID of the character to delete' }
          },
          required: ['characterId']
        }
      },
      {
        name: 'delete_place',
        description: 'Delete a place from the novel',
        inputSchema: {
          type: 'object',
          properties: {
            placeId: { type: 'number', description: 'The ID of the place to delete' }
          },
          required: ['placeId']
        }
      },
      {
        name: 'delete_event',
        description: 'Delete an event from the novel',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'The ID of the event to delete' }
          },
          required: ['eventId']
        }
      },
      {
        name: 'delete_lore',
        description: 'Delete a lore entry from the novel',
        inputSchema: {
          type: 'object',
          properties: {
            loreId: { type: 'number', description: 'The ID of the lore entry to delete' }
          },
          required: ['loreId']
        }
      },
      {
        name: 'delete_item',
        description: 'Delete an item from the novel',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'number', description: 'The ID of the item to delete' }
          },
          required: ['itemId']
        }
      },
      {
        name: 'get_outlines',
        description: 'Get all outlines for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      },
      {
        name: 'get_outline',
        description: 'Get a specific outline with all its sections',
        inputSchema: {
          type: 'object',
          properties: {
            outlineId: { type: 'number', description: 'The ID of the outline' }
          },
          required: ['outlineId']
        }
      },
      {
        name: 'create_outline',
        description: 'Create a new outline for a novel',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            title: { type: 'string', description: 'Outline title' },
            description: { type: 'string', description: 'Outline description' }
          },
          required: ['novelId', 'title']
        }
      },
      {
        name: 'update_outline',
        description: 'Update an existing outline',
        inputSchema: {
          type: 'object',
          properties: {
            outlineId: { type: 'number', description: 'The ID of the outline' },
            title: { type: 'string', description: 'Outline title' },
            description: { type: 'string', description: 'Outline description' }
          },
          required: ['outlineId', 'title']
        }
      },
      {
        name: 'add_outline_section',
        description: 'Add a new section to an outline',
        inputSchema: {
          type: 'object',
          properties: {
            outlineId: { type: 'number', description: 'The ID of the outline' },
            title: { type: 'string', description: 'Section title' },
            description: { type: 'string', description: 'Section description' },
            content: { type: 'string', description: 'Section content/notes' },
            parentId: { type: 'number', description: 'Parent section ID (for subsections)' },
            orderIndex: { type: 'number', description: 'Order within level (0 = first)' },
            chapterId: { type: 'number', description: 'Chapter to link to (optional)' }
          },
          required: ['outlineId', 'title']
        }
      },
      {
        name: 'update_outline_section',
        description: 'Update an existing outline section',
        inputSchema: {
          type: 'object',
          properties: {
            sectionId: { type: 'number', description: 'The ID of the section' },
            title: { type: 'string', description: 'Section title' },
            description: { type: 'string', description: 'Section description' },
            content: { type: 'string', description: 'Section content/notes' },
            orderIndex: { type: 'number', description: 'Order within level (0 = first)' },
            chapterId: { type: 'number', description: 'Chapter to link to (optional)' }
          },
          required: ['sectionId', 'title']
        }
      },
      {
        name: 'delete_outline_section',
        description: 'Delete a section from an outline',
        inputSchema: {
          type: 'object',
          properties: {
            sectionId: { type: 'number', description: 'The ID of the section to delete' }
          },
          required: ['sectionId']
        }
      },
      {
        name: 'create_outline_from_manuscript',
        description: 'Analyze existing chapters and create a structured outline',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' },
            outlineTitle: { type: 'string', description: 'Title for the new outline' },
            includeChapterSummaries: { type: 'boolean', description: 'Include chapter summaries in outline' }
          },
          required: ['novelId', 'outlineTitle']
        }
      },
      {
        name: 'get_story_summary',
        description: 'Get a comprehensive story summary including outline, characters, and plot progression',
        inputSchema: {
          type: 'object',
          properties: {
            novelId: { type: 'number', description: 'The ID of the novel' }
          },
          required: ['novelId']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_novels': {
        const response = await axios.get(`${LOCAL_LORE_API}/novels`);
        return {
          content: [{
            type: 'text',
            text: `Available novels:\n\n${response.data.map(novel => 
              `ID: ${novel.id}\nTitle: ${novel.title}\nDescription: ${novel.description || 'No description'}\nUpdated: ${new Date(novel.updated_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'get_novel': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}`);
        return {
          content: [{
            type: 'text',
            text: `Novel Details:\n\nID: ${response.data.id}\nTitle: ${response.data.title}\nDescription: ${response.data.description || 'No description'}\nCreated: ${new Date(response.data.created_at).toLocaleDateString()}\nUpdated: ${new Date(response.data.updated_at).toLocaleDateString()}`
          }]
        };
      }

      case 'get_chapters': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/chapters`);
        return {
          content: [{
            type: 'text',
            text: `Chapters for Novel ${novelId}:\n\n${response.data.map(chapter => 
              `ID: ${chapter.id}\nTitle: ${chapter.title}\nContent Length: ${(chapter.content || '').length} characters\nOrder: ${chapter.order_index}\nUpdated: ${new Date(chapter.updated_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'get_chapter': {
        const { novelId, chapterId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/chapters`);
        const chapter = response.data.find(c => c.id === chapterId);
        
        if (!chapter) {
          throw new Error(`Chapter ${chapterId} not found in novel ${novelId}`);
        }

        return {
          content: [{
            type: 'text',
            text: `Chapter: ${chapter.title}\n\nContent:\n${chapter.content || '(No content yet)'}\n\nMetadata:\n- ID: ${chapter.id}\n- Order: ${chapter.order_index}\n- Length: ${(chapter.content || '').length} characters\n- Updated: ${new Date(chapter.updated_at).toLocaleDateString()}`
          }]
        };
      }

      case 'update_chapter': {
        const { chapterId, title, content } = args;
        await axios.put(`${LOCAL_LORE_API}/chapters/${chapterId}`, { title, content });
        return {
          content: [{
            type: 'text',
            text: `✅ Chapter ${chapterId} updated successfully!\n\nTitle: ${title}\nContent Length: ${content.length} characters`
          }]
        };
      }

      case 'get_characters': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/characters`);
        return {
          content: [{
            type: 'text',
            text: `Characters in Novel ${novelId}:\n\n${response.data.map(char => 
              `ID: ${char.id}\nName: ${char.name}\nDescription: ${char.description || 'No description'}\nTraits: ${char.traits || 'No traits listed'}\nAdded: ${new Date(char.created_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'add_character': {
        const { novelId, name, description = '', traits = '' } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/characters`, {
          name, description, traits
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Character added successfully!\n\nName: ${response.data.name}\nDescription: ${response.data.description}\nTraits: ${response.data.traits}`
          }]
        };
      }

      case 'get_places': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/places`);
        return {
          content: [{
            type: 'text',
            text: `Places in Novel ${novelId}:\n\n${response.data.map(place => 
              `ID: ${place.id}\nName: ${place.name}\nDescription: ${place.description || 'No description'}\nAdded: ${new Date(place.created_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'add_place': {
        const { novelId, name, description = '' } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/places`, {
          name, description
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Place added successfully!\n\nName: ${response.data.name}\nDescription: ${response.data.description}`
          }]
        };
      }

      case 'get_events': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/events`);
        return {
          content: [{
            type: 'text',
            text: `Events in Novel ${novelId}:\n\n${response.data.map(event => 
              `ID: ${event.id}\nTitle: ${event.title}\nDescription: ${event.description || 'No description'}\nChapter: ${event.chapter_id || 'Not linked'}\nAdded: ${new Date(event.created_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'add_event': {
        const { novelId, title, description, chapterId } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/events`, {
          title, description, chapter_id: chapterId
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Event added successfully!\n\nTitle: ${response.data.title}\nDescription: ${response.data.description}\nChapter: ${response.data.chapter_id || 'Not linked'}`
          }]
        };
      }

      case 'get_lore': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/lore`);
        return {
          content: [{
            type: 'text',
            text: `Lore in Novel ${novelId}:\n\n${response.data.map(lore => 
              `ID: ${lore.id}\nTitle: ${lore.title}\nCategory: ${lore.category || 'Uncategorized'}\nContent: ${lore.content}\nAdded: ${new Date(lore.created_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'add_lore': {
        const { novelId, title, content, category = '' } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/lore`, {
          title, content, category
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Lore entry added successfully!\n\nTitle: ${response.data.title}\nCategory: ${response.data.category}\nContent: ${response.data.content}`
          }]
        };
      }

      case 'get_items': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/items`);
        return {
          content: [{
            type: 'text',
            text: `Items in Novel ${novelId}:\n\n${response.data.map(item => 
              `ID: ${item.id}\nName: ${item.name}\nDescription: ${item.description || 'No description'}\nProperties: ${item.properties || 'No properties'}\nAdded: ${new Date(item.created_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'add_item': {
        const { novelId, name, description = '', properties = '' } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/items`, {
          name, description, properties
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Item added successfully!\n\nName: ${response.data.name}\nDescription: ${response.data.description}\nProperties: ${response.data.properties}`
          }]
        };
      }

      case 'analyze_chapter': {
        const { chapterId } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/chapters/${chapterId}/analyze`);
        return {
          content: [{
            type: 'text',
            text: `✅ Chapter analysis completed!\n\nExtracted elements:\n- Characters: ${response.data.analysis.characters.length}\n- Places: ${response.data.analysis.places.length}\n- Events: ${response.data.analysis.events.length}\n- Items: ${response.data.analysis.items.length}\n\nAll new elements have been automatically added to your novel's database.`
          }]
        };
      }

      case 'get_story_context': {
        const { novelId } = args;
        const context = await getStoryContext(novelId);
        
        return {
          content: [{
            type: 'text',
            text: `Complete Story Context for Novel ${novelId}:

📚 CHARACTERS (${context.characters.length}):
${context.characters.map(char => `• ID: ${char.id} | ${char.name}: ${char.description || 'No description'}`).join('\n')}

🗺️ PLACES (${context.places.length}):
${context.places.map(place => `• ID: ${place.id} | ${place.name}: ${place.description || 'No description'}`).join('\n')}

📅 EVENTS (${context.events.length}):
${context.events.map(event => `• ID: ${event.id} | ${event.title}: ${event.description || 'No description'}`).join('\n')}

📜 LORE (${context.lore.length}):
${context.lore.map(lore => `• ID: ${lore.id} | ${lore.title} (${lore.category || 'Uncategorized'}): ${lore.content}`).join('\n')}

🎒 ITEMS (${context.items.length}):
${context.items.map(item => `• ID: ${item.id} | ${item.name}: ${item.description || 'No description'} ${item.properties ? `[${item.properties}]` : ''}`).join('\n')}`
          }]
        };
      }

      case 'delete_character': {
        const { characterId } = args;
        const response = await axios.delete(`${LOCAL_LORE_API}/characters/${characterId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Character deleted successfully!\n\nDeleted: ${response.data.deleted.name}\nDescription: ${response.data.deleted.description || 'No description'}`
          }]
        };
      }

      case 'delete_place': {
        const { placeId } = args;
        const response = await axios.delete(`${LOCAL_LORE_API}/places/${placeId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Place deleted successfully!\n\nDeleted: ${response.data.deleted.name}\nDescription: ${response.data.deleted.description || 'No description'}`
          }]
        };
      }

      case 'delete_event': {
        const { eventId } = args;
        const response = await axios.delete(`${LOCAL_LORE_API}/events/${eventId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Event deleted successfully!\n\nDeleted: ${response.data.deleted.title}\nDescription: ${response.data.deleted.description || 'No description'}`
          }]
        };
      }

      case 'delete_lore': {
        const { loreId } = args;
        const response = await axios.delete(`${LOCAL_LORE_API}/lore/${loreId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Lore entry deleted successfully!\n\nDeleted: ${response.data.deleted.title}\nCategory: ${response.data.deleted.category || 'Uncategorized'}\nContent: ${response.data.deleted.content}`
          }]
        };
      }

      case 'delete_item': {
        const { itemId } = args;
        const response = await axios.delete(`${LOCAL_LORE_API}/items/${itemId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Item deleted successfully!\n\nDeleted: ${response.data.deleted.name}\nDescription: ${response.data.deleted.description || 'No description'}\nProperties: ${response.data.deleted.properties || 'No properties'}`
          }]
        };
      }

      case 'get_outlines': {
        const { novelId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/outlines`);
        return {
          content: [{
            type: 'text',
            text: `Outlines for Novel ${novelId}:\n\n${response.data.map(outline => 
              `ID: ${outline.id}\nTitle: ${outline.title}\nDescription: ${outline.description || 'No description'}\nSections: ${outline.sections?.length || 0}\nCreated: ${new Date(outline.created_at).toLocaleDateString()}\nUpdated: ${new Date(outline.updated_at).toLocaleDateString()}\n`
            ).join('\n')}`
          }]
        };
      }

      case 'get_outline': {
        const { outlineId } = args;
        const response = await axios.get(`${LOCAL_LORE_API}/outlines/${outlineId}`);
        const outline = response.data;
        
        const formatSection = (section, level = 0) => {
          const indent = '  '.repeat(level);
          return `${indent}• ${section.title}${section.description ? ` - ${section.description}` : ''}${section.content ? `\n${indent}  Content: ${section.content}` : ''}${section.chapter_id ? `\n${indent}  Linked to Chapter: ${section.chapter_id}` : ''}`;
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

        const sectionTree = buildSectionTree(outline.sections || []);

        return {
          content: [{
            type: 'text',
            text: `Outline: ${outline.title}\n\nDescription: ${outline.description || 'No description'}\nCreated: ${new Date(outline.created_at).toLocaleDateString()}\nUpdated: ${new Date(outline.updated_at).toLocaleDateString()}\n\nStructure:\n${sectionTree.length > 0 ? sectionTree.join('\n\n') : 'No sections yet'}`
          }]
        };
      }

      case 'create_outline': {
        const { novelId, title, description = '' } = args;
        const response = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/outlines`, {
          title, description
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Outline created successfully!\n\nID: ${response.data.id}\nTitle: ${response.data.title}\nDescription: ${response.data.description || 'No description'}`
          }]
        };
      }

      case 'update_outline': {
        const { outlineId, title, description = '' } = args;
        const response = await axios.put(`${LOCAL_LORE_API}/outlines/${outlineId}`, {
          title, description
        });
        return {
          content: [{
            type: 'text',
            text: `✅ Outline updated successfully!\n\nTitle: ${response.data.title}\nDescription: ${response.data.description || 'No description'}`
          }]
        };
      }

      case 'add_outline_section': {
        const { outlineId, title, description = '', content = '', parentId, orderIndex = 0, chapterId } = args;
        
        // Calculate level based on parent
        let level = 0;
        if (parentId) {
          const parentResponse = await axios.get(`${LOCAL_LORE_API}/sections/${parentId}`);
          level = parentResponse.data.level + 1;
        }

        const response = await axios.post(`${LOCAL_LORE_API}/outlines/${outlineId}/sections`, {
          title, description, content, 
          order_index: orderIndex,
          parent_id: parentId || null,
          level,
          chapter_id: chapterId || null
        });
        
        return {
          content: [{
            type: 'text',
            text: `✅ Outline section added successfully!\n\nTitle: ${response.data.title}\nDescription: ${response.data.description || 'No description'}\nLevel: ${response.data.level}\nOrder: ${response.data.order_index}${response.data.chapter_id ? `\nLinked to Chapter: ${response.data.chapter_id}` : ''}`
          }]
        };
      }

      case 'update_outline_section': {
        const { sectionId, title, description = '', content = '', orderIndex = 0, chapterId } = args;
        
        // Get current section to preserve parent and level
        const currentSection = await axios.get(`${LOCAL_LORE_API}/sections/${sectionId}`);
        
        const response = await axios.put(`${LOCAL_LORE_API}/sections/${sectionId}`, {
          title, description, content,
          order_index: orderIndex,
          parent_id: currentSection.data.parent_id,
          level: currentSection.data.level,
          chapter_id: chapterId || null
        });
        
        return {
          content: [{
            type: 'text',
            text: `✅ Outline section updated successfully!\n\nTitle: ${response.data.title}\nDescription: ${response.data.description || 'No description'}${response.data.chapter_id ? `\nLinked to Chapter: ${response.data.chapter_id}` : ''}`
          }]
        };
      }

      case 'delete_outline_section': {
        const { sectionId } = args;
        await axios.delete(`${LOCAL_LORE_API}/sections/${sectionId}`);
        return {
          content: [{
            type: 'text',
            text: `✅ Outline section deleted successfully!`
          }]
        };
      }

      case 'create_outline_from_manuscript': {
        const { novelId, outlineTitle, includeChapterSummaries = true } = args;
        
        // Get all chapters
        const chaptersResponse = await axios.get(`${LOCAL_LORE_API}/novels/${novelId}/chapters`);
        const chapters = chaptersResponse.data;

        if (chapters.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `❌ No chapters found in novel ${novelId}. Cannot create outline from empty manuscript.`
            }]
          };
        }

        // Create the outline
        const outlineResponse = await axios.post(`${LOCAL_LORE_API}/novels/${novelId}/outlines`, {
          title: outlineTitle,
          description: `Generated from existing manuscript with ${chapters.length} chapters`
        });
        
        const outlineId = outlineResponse.data.id;
        let sectionsCreated = 0;

        // Create sections for each chapter
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          let sectionDescription = '';
          let sectionContent = '';

          if (includeChapterSummaries && chapter.content) {
            // Create a basic summary (first 200 chars + word count)
            const wordCount = chapter.content.split(/\s+/).filter(word => word.length > 0).length;
            sectionDescription = `Chapter ${i + 1} summary (${wordCount} words)`;
            sectionContent = chapter.content.length > 200 
              ? chapter.content.substring(0, 200) + '...'
              : chapter.content;
          }

          await axios.post(`${LOCAL_LORE_API}/outlines/${outlineId}/sections`, {
            title: chapter.title,
            description: sectionDescription,
            content: sectionContent,
            order_index: i,
            parent_id: null,
            level: 0,
            chapter_id: chapter.id
          });
          
          sectionsCreated++;
        }

        return {
          content: [{
            type: 'text',
            text: `✅ Outline created from manuscript!\n\nOutline: ${outlineTitle}\nSections created: ${sectionsCreated}\nChapters analyzed: ${chapters.length}\n\nEach chapter has been converted to an outline section and linked back to the original chapter. You can now expand and reorganize the outline structure.`
          }]
        };
      }

      case 'get_story_summary': {
        const { novelId } = args;
        
        // Get all story data
        const [novel, chapters, outlines, context] = await Promise.all([
          axios.get(`${LOCAL_LORE_API}/novels/${novelId}`),
          axios.get(`${LOCAL_LORE_API}/novels/${novelId}/chapters`),
          axios.get(`${LOCAL_LORE_API}/novels/${novelId}/outlines`),
          getStoryContext(novelId)
        ]);

        const totalWords = chapters.data.reduce((sum, ch) => {
          const wordCount = ch.content ? ch.content.split(/\s+/).filter(word => word.length > 0).length : 0;
          return sum + wordCount;
        }, 0);

        let outlineText = '';
        if (outlines.data.length > 0) {
          const mainOutline = outlines.data[0]; // Use first outline
          const outlineResponse = await axios.get(`${LOCAL_LORE_API}/outlines/${mainOutline.id}`);
          const sections = outlineResponse.data.sections || [];
          
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
          outlineText = sectionTree.length > 0 ? sectionTree.join('\n') : 'No sections in outline';
        } else {
          outlineText = 'No outlines created yet';
        }

        return {
          content: [{
            type: 'text',
            text: `📖 COMPREHENSIVE STORY SUMMARY FOR "${novel.data.title}"

📊 MANUSCRIPT STATS:
• Chapters: ${chapters.data.length}
• Total word count: ${totalWords.toLocaleString()}
• Last updated: ${new Date(novel.data.updated_at).toLocaleDateString()}

📋 STORY OUTLINE:
${outlineText}

📚 STORY ELEMENTS:
• Characters: ${context.characters.length}
• Places: ${context.places.length}  
• Events: ${context.events.length}
• Lore entries: ${context.lore.length}
• Items: ${context.items.length}

🔍 KEY CHARACTERS:
${context.characters.slice(0, 5).map(char => `• ${char.name}: ${char.description || 'No description'}`).join('\n')}
${context.characters.length > 5 ? `... and ${context.characters.length - 5} more` : ''}

🗺️ MAIN LOCATIONS:
${context.places.slice(0, 5).map(place => `• ${place.name}: ${place.description || 'No description'}`).join('\n')}
${context.places.length > 5 ? `... and ${context.places.length - 5} more` : ''}

📅 RECENT EVENTS:
${context.events.slice(0, 5).map(event => `• ${event.title}: ${event.description || 'No description'}`).join('\n')}
${context.events.length > 5 ? `... and ${context.events.length - 5} more` : ''}

This summary provides Claude with a complete "story so far" context including plot structure, characters, and world-building elements.`
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${error.message}\n\nPlease ensure:\n1. The Scribber backend is running on http://localhost:3001\n2. The novel/chapter IDs are correct\n3. The API endpoint is accessible`
      }]
    };
  }
});

async function getStoryContext(novelId) {
  const [characters, places, events, lore, items] = await Promise.all([
    axios.get(`${LOCAL_LORE_API}/novels/${novelId}/characters`),
    axios.get(`${LOCAL_LORE_API}/novels/${novelId}/places`),
    axios.get(`${LOCAL_LORE_API}/novels/${novelId}/events`),
    axios.get(`${LOCAL_LORE_API}/novels/${novelId}/lore`),
    axios.get(`${LOCAL_LORE_API}/novels/${novelId}/items`)
  ]);
  
  return {
    characters: characters.data,
    places: places.data,
    events: events.data,
    lore: lore.data,
    items: items.data
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Scribber MCP Server running with full functionality');
}

main().catch(console.error);