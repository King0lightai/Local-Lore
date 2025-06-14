import React, { useState } from 'react';
import { Wand2, FileText, BookOpen, Edit3, Eye, ArrowRight, RotateCcw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from './Modal';

const DEFAULT_PROMPTS = {
  edit: {
    label: 'Edit',
    icon: Edit3,
    prompt: 'Please edit this text to improve clarity, flow, and readability while maintaining the original meaning and style.',
    description: 'Improve clarity and flow'
  },
  review: {
    label: 'Review',
    icon: Eye,
    prompt: 'Please review this text and provide feedback on writing quality, character development, plot coherence, and suggest improvements.',
    description: 'Get writing feedback'
  },
  continue: {
    label: 'Continue',
    icon: ArrowRight,
    prompt: 'Please continue this story naturally, maintaining the established tone, character voices, and plot direction.',
    description: 'Continue the story'
  },
  replace: {
    label: 'Replace',
    icon: RotateCcw,
    prompt: 'Please rewrite this text with a different approach while keeping the same key events and character interactions.',
    description: 'Rewrite differently'
  }
};

function AIAssistant({ selectedText, chapter, storyElements, onResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');
  const [customPrompts, setCustomPrompts] = useState(() => {
    // Load saved prompts from localStorage
    const saved = localStorage.getItem('local-lore-custom-prompts');
    return saved ? { ...DEFAULT_PROMPTS, ...JSON.parse(saved) } : DEFAULT_PROMPTS;
  });
  const [isEditingPrompts, setIsEditingPrompts] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    outline: false,
    storySoFar: false
  });

  const handlePromptAction = async (promptKey) => {
    if (!customPrompts[promptKey]) return;
    
    setIsProcessing(true);
    try {
      const prompt = customPrompts[promptKey].prompt;
      const context = {
        selectedText,
        chapter: chapter ? {
          title: chapter.title,
          content: chapter.content
        } : null,
        storyElements: {
          characters: storyElements.characters || [],
          places: storyElements.places || [],
          events: storyElements.events || []
        }
      };

      // This will be implemented as MCP tool call
      const result = await callClaudeAPI('custom_prompt', { prompt, context });
      onResult?.(result);
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOutline = async () => {
    setIsProcessing(true);
    try {
      const context = {
        chapter: chapter ? {
          title: chapter.title,
          content: chapter.content
        } : null,
        storyElements: {
          characters: storyElements.characters || [],
          places: storyElements.places || [],
          events: storyElements.events || []
        }
      };

      // This will be implemented as MCP tool call
      const result = await callClaudeAPI('generate_outline', { context });
      onResult?.(result);
    } catch (error) {
      console.error('Outline generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStorySoFar = async () => {
    setIsProcessing(true);
    try {
      const context = {
        chapter: chapter ? {
          title: chapter.title,
          content: chapter.content
        } : null,
        storyElements: {
          characters: storyElements.characters || [],
          places: storyElements.places || [],
          events: storyElements.events || []
        }
      };

      // This will be implemented as MCP tool call
      const result = await callClaudeAPI('story_so_far', { context });
      onResult?.(result);
    } catch (error) {
      console.error('Story summary failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOutlineFromChapters = async () => {
    setIsProcessing(true);
    try {
      const result = await callClaudeAPI('create_outline_from_chapters', { 
        novelId,
        outlineTitle: 'AI Generated Outline'
      });
      onResult?.(result);
    } catch (error) {
      console.error('Outline creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetOutlineContext = async () => {
    setIsProcessing(true);
    try {
      const result = await callClaudeAPI('get_outline_context', { novelId });
      onResult?.(result);
    } catch (error) {
      console.error('Outline context retrieval failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // MCP tool call implementation
  const callClaudeAPI = async (action, data) => {
    try {
      // Call your MCP server endpoint
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
      // Fallback for development/testing
      return `AI would process: ${action} with context: ${JSON.stringify(data, null, 2).substring(0, 200)}...`;
    }
  };

  const updatePrompt = (key, newPrompt) => {
    const updated = {
      ...customPrompts,
      [key]: {
        ...customPrompts[key],
        prompt: newPrompt
      }
    };
    setCustomPrompts(updated);
    
    // Save to localStorage
    localStorage.setItem('local-lore-custom-prompts', JSON.stringify(updated));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
        title="AI Assistant"
      >
        <Wand2 className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="AI Writing Assistant" size="large">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="tab-nav">
            <button
              onClick={() => setActiveTab('prompts')}
              className={activeTab === 'prompts' ? 'active' : ''}
            >
              Custom Prompts
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={activeTab === 'tools' ? 'active' : ''}
            >
              Story Tools
            </button>
          </div>

          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-writer-heading">Custom AI Prompts</h3>
                <button
                  onClick={() => setIsEditingPrompts(!isEditingPrompts)}
                  className="btn-secondary flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isEditingPrompts ? 'Done' : 'Edit Prompts'}
                </button>
              </div>

              {selectedText && (
                <div className="p-4 bg-writer-info/10 border border-writer-info/20 rounded-xl">
                  <p className="text-sm text-writer-info">
                    <strong>Selected text:</strong> "{selectedText.substring(0, 100)}..."
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(customPrompts).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="card hover:shadow-medium transition-all duration-200">
                      <div className="card-content">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Icon className="w-5 h-5 text-writer-accent mr-3" />
                            <h4 className="font-medium text-writer-heading">{config.label}</h4>
                          </div>
                          {!isEditingPrompts && (
                            <button
                              onClick={() => handlePromptAction(key)}
                              disabled={isProcessing}
                              className="btn-primary disabled:opacity-50"
                            >
                              {isProcessing ? 'Processing...' : 'Apply'}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-writer-subtle mb-4 leading-relaxed">{config.description}</p>
                        
                        {isEditingPrompts ? (
                          <textarea
                            value={config.prompt}
                            onChange={(e) => updatePrompt(key, e.target.value)}
                            className="textarea-primary text-sm"
                            rows={3}
                            placeholder="Enter your custom prompt..."
                          />
                        ) : (
                          <p className="text-xs text-writer-subtle bg-writer-muted p-3 rounded-lg font-mono leading-relaxed">
                            {config.prompt}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isEditingPrompts && (
                <div className="p-4 bg-writer-warning/10 border border-writer-warning/20 rounded-xl">
                  <p className="text-sm text-writer-warning leading-relaxed">
                    <strong>Tip:</strong> Customize these prompts to match your writing style and needs. 
                    Your changes will be saved automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-writer-heading">Story Analysis Tools</h3>

              {/* Outline Generator */}
              <div className="card hover:shadow-medium transition-all duration-200">
                <button
                  onClick={() => toggleSection('outline')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-writer-muted/30 transition-colors rounded-xl"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-writer-success mr-3" />
                    <div>
                      <h4 className="font-medium text-writer-heading">Generate Outline</h4>
                      <p className="text-sm text-writer-subtle">Create a story outline based on current content</p>
                    </div>
                  </div>
                  {expandedSections.outline ? (
                    <ChevronUp className="w-5 h-5 text-writer-subtle" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-writer-subtle" />
                  )}
                </button>
                
                {expandedSections.outline && (
                  <div className="border-t border-writer-border p-4">
                    <p className="text-sm text-writer-subtle mb-4 leading-relaxed">
                      Generate a comprehensive outline for your story based on existing characters, 
                      places, events, and current chapter content.
                    </p>
                    <button
                      onClick={handleOutline}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-writer-success text-white rounded-lg hover:bg-writer-success/90 disabled:opacity-50 transition-all duration-200"
                    >
                      {isProcessing ? 'Generating...' : 'Generate Outline'}
                    </button>
                  </div>
                )}
              </div>

              {/* Story So Far */}
              <div className="card hover:shadow-medium transition-all duration-200">
                <button
                  onClick={() => toggleSection('storySoFar')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">Story So Far</h4>
                      <p className="text-sm text-gray-600">Summarize the story up to this point</p>
                    </div>
                  </div>
                  {expandedSections.storySoFar ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.storySoFar && (
                  <div className="border-t border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Generate a summary of your story so far, including key plot points, 
                      character development, and current situation.
                    </p>
                    <button
                      onClick={handleStorySoFar}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                    >
                      {isProcessing ? 'Analyzing...' : 'Generate Summary'}
                    </button>
                  </div>
                )}
              </div>

              {/* Create Outline from Chapters */}
              <div className="card hover:shadow-medium transition-all duration-200">
                <button
                  onClick={() => toggleSection('createOutline')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">Create Outline from Manuscript</h4>
                      <p className="text-sm text-gray-600">Generate an outline from existing chapters</p>
                    </div>
                  </div>
                  {expandedSections.createOutline ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.createOutline && (
                  <div className="border-t border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Analyze your existing chapters and automatically create a structured outline. 
                      Each chapter will become an outline section linked back to the original content.
                    </p>
                    <button
                      onClick={handleCreateOutlineFromChapters}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all duration-200"
                    >
                      {isProcessing ? 'Creating Outline...' : 'Create from Chapters'}
                    </button>
                  </div>
                )}
              </div>

              {/* Get Outline Context */}
              <div className="card hover:shadow-medium transition-all duration-200">
                <button
                  onClick={() => toggleSection('outlineContext')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-orange-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">View Story Outline</h4>
                      <p className="text-sm text-gray-600">Show current outline as context for Claude</p>
                    </div>
                  </div>
                  {expandedSections.outlineContext ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.outlineContext && (
                  <div className="border-t border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Display your current story outline to provide Claude with complete story structure context. 
                      Perfect for getting advice on plot development or consistency.
                    </p>
                    <button
                      onClick={handleGetOutlineContext}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all duration-200"
                    >
                      {isProcessing ? 'Loading Outline...' : 'Show Outline Context'}
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Prompt Input */}
              <div className="card">
                <div className="card-content">
                  <h4 className="font-medium text-gray-900 mb-2">Custom Prompt</h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Enter a custom prompt for Claude to analyze your story or provide specific assistance.
                  </p>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="textarea-primary mb-4"
                    rows={3}
                    placeholder="E.g., 'Analyze the pacing of this chapter and suggest improvements' or 'Help me develop the romantic subplot between these characters'"
                  />
                  <button
                    onClick={async () => {
                      if (!editPrompt.trim()) return;
                      setIsProcessing(true);
                      try {
                        const context = {
                          selectedText,
                          chapter: chapter ? {
                            title: chapter.title,
                            content: chapter.content
                          } : null,
                          storyElements
                        };
                        const result = await callClaudeAPI('custom_prompt', { prompt: editPrompt, context });
                        onResult?.(result);
                        setEditPrompt(''); // Clear after successful execution
                      } catch (error) {
                        console.error('Custom prompt failed:', error);
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing || !editPrompt.trim()}
                    className="w-full px-4 py-2 bg-writer-accent text-white rounded-lg hover:bg-writer-accent/90 disabled:opacity-50 transition-all duration-200"
                  >
                    {isProcessing ? 'Processing...' : 'Send to Claude'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default AIAssistant;