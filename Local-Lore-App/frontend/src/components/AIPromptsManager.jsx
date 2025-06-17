import React, { useState, useEffect } from 'react';
import { Wand2, Plus, Edit3, Trash2, Eye, EyeOff, Settings, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal, InputModal, ConfirmModal } from './Modal';
import axios from 'axios';

const PROMPT_CATEGORIES = [
  { value: 'style', label: 'Writing Style' },
  { value: 'character', label: 'Character Voice' },
  { value: 'genre', label: 'Genre Rules' },
  { value: 'scene', label: 'Scene Structure' },
  { value: 'tone', label: 'Tone & Mood' },
  { value: 'general', label: 'General' }
];

function AIPromptsManager({ novelId, selectedText, chapter, storyElements, onResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createModal, setCreateModal] = useState({ isOpen: false });
  const [editModal, setEditModal] = useState({ isOpen: false, prompt: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, prompt: null });
  const [customPromptText, setCustomPromptText] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState(new Set());

  useEffect(() => {
    if (isOpen && novelId) {
      fetchPrompts();
    }
  }, [isOpen, novelId]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/novels/${novelId}/ai-prompts`);
      setPrompts(response.data);
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (formData) => {
    setIsSaving(true);
    try {
      const response = await axios.post(`/api/novels/${novelId}/ai-prompts`, {
        name: formData.name,
        category: formData.category,
        prompt_text: formData.prompt_text,
        priority: parseInt(formData.priority) || 0,
        is_active: true
      });
      
      setPrompts(prev => [response.data, ...prev]);
      setCreateModal({ isOpen: false });
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error; // Re-throw to keep modal open
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPrompt = async (formData) => {
    setIsSaving(true);
    try {
      await axios.put(`/api/ai-prompts/${editModal.prompt.id}`, {
        name: formData.name,
        category: formData.category,
        prompt_text: formData.prompt_text,
        priority: parseInt(formData.priority) || 0,
        is_active: editModal.prompt.is_active
      });
      
      setPrompts(prev => prev.map(p => 
        p.id === editModal.prompt.id 
          ? { ...p, ...formData, priority: parseInt(formData.priority) || 0 }
          : p
      ));
      setEditModal({ isOpen: false, prompt: null });
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error; // Re-throw to keep modal open
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrompt = async () => {
    try {
      await axios.delete(`/api/ai-prompts/${deleteModal.prompt.id}`);
      setPrompts(prev => prev.filter(p => p.id !== deleteModal.prompt.id));
      setDeleteModal({ isOpen: false, prompt: null });
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const togglePromptActive = async (promptId, isActive) => {
    try {
      const prompt = prompts.find(p => p.id === promptId);
      await axios.put(`/api/ai-prompts/${promptId}`, {
        ...prompt,
        is_active: !isActive
      });
      
      setPrompts(prev => prev.map(p => 
        p.id === promptId ? { ...p, is_active: !isActive } : p
      ));
    } catch (error) {
      console.error('Error toggling prompt:', error);
    }
  };

  const executePrompt = async (prompt) => {
    setIsProcessing(true);
    try {
      const context = {
        selectedText,
        chapter: chapter ? {
          title: chapter.title,
          content: chapter.content
        } : null,
        storyElements: {
          characters: storyElements?.characters || [],
          places: storyElements?.places || [],
          events: storyElements?.events || [],
          lore: storyElements?.lore || [],
          items: storyElements?.items || []
        }
      };

      // Call MCP server
      const result = await callClaudeAPI('custom_prompt', { 
        prompt: prompt.prompt_text, 
        context,
        novelId 
      });
      onResult?.(result);
    } catch (error) {
      console.error('AI prompt execution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const buildPromptForClipboard = () => {
    if (!customPromptText.trim()) return '';

    let fullPrompt = '';

    // Add system prompts
    const systemPrompts = prompts.filter(p => p.is_system && p.is_active);
    const userPrompts = activePrompts.filter(p => !p.is_system);

    if (systemPrompts.length > 0 || userPrompts.length > 0) {
      fullPrompt += 'WRITING GUIDELINES:\n\n';
      
      // Add system prompts first (highest priority)
      systemPrompts.forEach((prompt, index) => {
        fullPrompt += `${index + 1}. ${prompt.name}:\n${prompt.prompt_text}\n\n`;
      });

      // Add user prompts
      userPrompts.forEach((prompt, index) => {
        fullPrompt += `${systemPrompts.length + index + 1}. ${prompt.name} (${prompt.category}):\n${prompt.prompt_text}\n\n`;
      });

      fullPrompt += '---\n\n';
    }

    // Add story context if available
    if (chapter || selectedText || (storyElements && Object.values(storyElements).some(arr => arr?.length > 0))) {
      fullPrompt += 'STORY CONTEXT:\n\n';

      if (selectedText) {
        fullPrompt += `Selected Text: "${selectedText}"\n\n`;
      }

      if (chapter) {
        fullPrompt += `Current Chapter: "${chapter.title}"\n`;
        if (chapter.content) {
          fullPrompt += `Chapter Content Preview: ${chapter.content.substring(0, 500)}${chapter.content.length > 500 ? '...' : ''}\n\n`;
        }
      }

      if (storyElements) {
        const { characters = [], places = [], events = [], lore = [], items = [] } = storyElements;
        
        if (characters.length > 0) {
          fullPrompt += `Characters: ${characters.map(c => c.name).join(', ')}\n`;
        }
        if (places.length > 0) {
          fullPrompt += `Locations: ${places.map(p => p.name).join(', ')}\n`;
        }
        if (events.length > 0) {
          fullPrompt += `Recent Events: ${events.length} events\n`;
        }
        if (lore.length > 0) {
          fullPrompt += `Lore Elements: ${lore.length} entries\n`;
        }
        if (items.length > 0) {
          fullPrompt += `Important Items: ${items.map(i => i.name).join(', ')}\n`;
        }
      }

      fullPrompt += '\n---\n\n';
    }

    // Add user's question/request
    fullPrompt += `REQUEST:\n${customPromptText}`;

    return fullPrompt;
  };

  const copyPromptToClipboard = async () => {
    if (!customPromptText.trim()) return;
    
    setIsProcessing(true);
    try {
      const fullPrompt = buildPromptForClipboard();
      
      await navigator.clipboard.writeText(fullPrompt);
      
      // Show success feedback
      onResult?.(`✅ Prompt copied to clipboard!\n\nYou can now paste this into Claude. It includes:\n${activePrompts.length > 0 ? `- ${activePrompts.length} custom writing guideline${activePrompts.length !== 1 ? 's' : ''}\n` : ''}${prompts.filter(p => p.is_system && p.is_active).length > 0 ? '- System writing guidelines (Anti-AI-isms)\n' : ''}${selectedText ? '- Your selected text\n' : ''}${chapter ? `- Current chapter context\n` : ''}${storyElements && Object.values(storyElements).some(arr => arr?.length > 0) ? '- Story elements context\n' : ''}- Your specific request`);
      
      setCustomPromptText('');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      onResult?.('❌ Failed to copy to clipboard. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const callClaudeAPI = async (action, data) => {
    try {
      const response = await fetch('/api/mcp/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data
        })
      });
      
      if (!response.ok) {
        throw new Error(`MCP call failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.response || result.message || 'AI processing completed';
    } catch (error) {
      console.error('MCP call error:', error);
      throw error;
    }
  };

  const togglePromptExpanded = (promptId) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const getPromptFields = () => [
    { name: 'name', label: 'Prompt Name', required: true, placeholder: 'e.g., "Dark Fantasy Style"' },
    { 
      name: 'category', 
      label: 'Category', 
      type: 'select',
      required: true,
      options: PROMPT_CATEGORIES
    },
    { 
      name: 'prompt_text', 
      label: 'Prompt Text', 
      type: 'textarea', 
      rows: 6,
      required: true,
      placeholder: 'Enter your custom prompt instructions for Claude...'
    },
    { 
      name: 'priority', 
      label: 'Priority', 
      type: 'number',
      placeholder: '0',
      help: 'Higher numbers = higher priority (applied first)' 
    }
  ];

  const activePrompts = prompts.filter(p => p.is_active);
  const systemPrompts = prompts.filter(p => p.is_system);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/20 rounded"
        title="AI Assistant"
      >
        <Wand2 className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="AI Assistant" size="large">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Prompts
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'quick'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Prepare Prompt
            </button>
          </div>

          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Writing Prompts</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {activePrompts.length} active prompts will be applied to Claude responses
                  </p>
                </div>
                <button
                  onClick={() => setCreateModal({ isOpen: true })}
                  className="flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Prompt
                </button>
              </div>

              {selectedText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected text:</strong> "{selectedText.substring(0, 100)}..."
                  </p>
                </div>
              )}

              {/* System Prompts */}
              {systemPrompts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    System Writing Guidelines
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    These guidelines are automatically applied to all Claude interactions and cannot be edited.
                  </p>
                  {systemPrompts.map(prompt => (
                    <div key={prompt.id} className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">{prompt.name}</span>
                        <div className="flex items-center space-x-2">
                          {prompt.is_active && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                          <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                            System
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700 mt-1 capitalize">{prompt.category}</p>
                      {prompt.name.includes('AI-isms') && (
                        <p className="text-xs text-blue-600 mt-2">
                          Helps avoid common AI writing patterns for more authentic prose
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* User Prompts */}
              <div className="space-y-3">
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading prompts...</p>
                ) : prompts.filter(p => !p.is_system).length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No custom prompts yet</p>
                    <p className="text-sm text-gray-400">Create prompts to customize how Claude helps with your writing</p>
                  </div>
                ) : (
                  prompts.filter(p => !p.is_system).map(prompt => (
                    <div key={prompt.id} className="border border-gray-200 rounded-lg">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {PROMPT_CATEGORIES.find(c => c.value === prompt.category)?.label || prompt.category}
                              </span>
                              {prompt.priority > 0 && (
                                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                  Priority: {prompt.priority}
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => togglePromptExpanded(prompt.id)}
                              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
                            >
                              {expandedPrompts.has(prompt.id) ? (
                                <ChevronUp className="w-4 h-4 mr-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 mr-1" />
                              )}
                              {expandedPrompts.has(prompt.id) ? 'Hide' : 'Show'} prompt text
                            </button>

                            {expandedPrompts.has(prompt.id) && (
                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3">
                                {prompt.prompt_text}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => togglePromptActive(prompt.id, prompt.is_active)}
                              className={`p-1.5 rounded ${
                                prompt.is_active 
                                  ? 'text-green-600 hover:bg-green-100' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={prompt.is_active ? 'Active' : 'Inactive'}
                            >
                              {prompt.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => executePrompt(prompt)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isProcessing ? 'Processing...' : 'Apply'}
                            </button>
                            <button
                              onClick={() => setEditModal({ isOpen: true, prompt })}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, prompt })}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Prepare Claude Prompt</h3>
              <p className="text-sm text-gray-600">
                Create a comprehensive prompt with your writing guidelines and story context. This will be copied to your clipboard so you can paste it into Claude.
              </p>

              <div className="space-y-3">
                <textarea
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="E.g., 'Analyze the pacing of this chapter', 'Help me develop the romantic subplot', 'What are the main themes in my story so far?'"
                />
                <button
                  onClick={copyPromptToClipboard}
                  disabled={isProcessing || !customPromptText.trim()}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Copying...' : '📋 Copy Full Prompt to Clipboard'}
                </button>
              </div>

              {(activePrompts.length > 0 || prompts.filter(p => p.is_system && p.is_active).length > 0) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">Your prompt will include:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {prompts.filter(p => p.is_system && p.is_active).length > 0 && (
                      <li>✓ Anti-AI-isms writing guidelines</li>
                    )}
                    {activePrompts.filter(p => !p.is_system).length > 0 && (
                      <li>✓ {activePrompts.filter(p => !p.is_system).length} custom writing guideline{activePrompts.filter(p => !p.is_system).length !== 1 ? 's' : ''}</li>
                    )}
                    {selectedText && (
                      <li>✓ Your selected text</li>
                    )}
                    {chapter && (
                      <li>✓ Current chapter context</li>
                    )}
                    {storyElements && Object.values(storyElements).some(arr => arr?.length > 0) && (
                      <li>✓ Story elements (characters, places, etc.)</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>How it works:</strong> Click the button above to copy a complete prompt to your clipboard, then paste it into Claude. 
                  The prompt will include all your active writing guidelines plus the story context.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Create Prompt Modal */}
      <InputModal
        isOpen={createModal.isOpen}
        onClose={() => setCreateModal({ isOpen: false })}
        onSubmit={handleCreatePrompt}
        title="Create AI Prompt"
        fields={getPromptFields()}
        submitText={isSaving ? "Creating..." : "Create Prompt"}
        isSubmitting={isSaving}
      />

      {/* Edit Prompt Modal */}
      <InputModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, prompt: null })}
        onSubmit={handleEditPrompt}
        title="Edit AI Prompt"
        fields={getPromptFields().map(field => ({
          ...field,
          defaultValue: editModal.prompt ? editModal.prompt[field.name] || '' : ''
        }))}
        submitText={isSaving ? "Updating..." : "Update Prompt"}
        isSubmitting={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, prompt: null })}
        onConfirm={handleDeletePrompt}
        title="Delete AI Prompt"
        message={`Are you sure you want to delete "${deleteModal.prompt?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </>
  );
}

export default AIPromptsManager;