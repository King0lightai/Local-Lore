import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, AlertCircle, CheckCircle, Loader, Undo, Redo, Bold, Italic, List, ListOrdered, Clock, Focus, Maximize2, Trash2, Layout } from 'lucide-react';
import { useToast } from './Toast';
import VersionHistory from './VersionHistory';
import AIPromptsManager from './AIPromptsManager';
import { ConfirmModal } from './Modal';

function Editor({ chapter, onSave, storyContext, onEditorReady, novelId, novel, chapters, focusMode, onFocusModeChange, onDeleteChapter, showGuide, onToggleGuide }) {
  const { showToast } = useToast();
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [chapterTitle, setChapterTitle] = useState(chapter.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedContent = useRef(chapter.content || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true, // Use built-in history
        bulletList: {
          HTMLAttributes: {
            class: 'prose-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'prose-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'prose-list-item',
          },
        },
      }),
    ],
    content: chapter.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6 bg-writer-surface dark:bg-dark-surface text-writer-text dark:text-dark-text',
        style: 'font-family: Georgia, Cambria, serif; line-height: 1.8; font-size: 16px;'
      }
    },
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && chapter.content !== editor.getHTML()) {
      editor.commands.setContent(chapter.content || '');
      lastSavedContent.current = chapter.content || '';
      setSaveStatus('saved');
    }
    setChapterTitle(chapter.title);
  }, [chapter.id, editor, chapter.title]);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);


  const handleContentChange = (content) => {
    // Clear existing timeouts
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Only save if content actually changed
    if (content === lastSavedContent.current) return;

    setSaveStatus('saving');

    // Debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(chapter.id, chapterTitle, content);
        lastSavedContent.current = content;
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        showToast('Failed to save changes', 'error');
      }
    }, 1000);
  };


  const handleManualSave = async () => {
    if (saveStatus === 'saving') return;
    
    const content = editor.getHTML();
    setSaveStatus('saving');
    
    try {
      await onSave(chapter.id, chapterTitle, content);
      lastSavedContent.current = content;
      setSaveStatus('saved');
      showToast('Chapter saved successfully', 'success');
    } catch (error) {
      setSaveStatus('error');
      showToast('Failed to save chapter', 'error');
    }
  };

  const handleTitleChange = async (newTitle) => {
    if (newTitle.trim() && newTitle !== chapter.title) {
      setChapterTitle(newTitle);
      try {
        await onSave(chapter.id, newTitle, editor?.getHTML() || '');
        showToast('Chapter title updated', 'success');
      } catch (error) {
        setChapterTitle(chapter.title); // Revert on error
        showToast('Failed to update title', 'error');
      }
    }
  };

  // Format toolbar actions
  const formatActions = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => {
        console.log('Bullet list clicked, editor available:', !!editor);
        if (editor) {
          console.log('Toggling bullet list...');
          editor.chain().focus().toggleBulletList().run();
        }
      },
      isActive: () => editor?.isActive('bulletList')
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => {
        console.log('Ordered list clicked, editor available:', !!editor);
        if (editor) {
          console.log('Toggling ordered list...');
          editor.chain().focus().toggleOrderedList().run();
        }
      },
      isActive: () => editor?.isActive('orderedList')
    }
  ];

  // Save status indicator
  const SaveIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center text-gray-600">
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    } else if (saveStatus === 'saved') {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span>Saved</span>
        </div>
      );
    } else if (saveStatus === 'error') {
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>Save failed</span>
        </div>
      );
    }
  };

  const handleVersionRestore = () => {
    // Force re-render of editor with new content
    window.location.reload();
  };

  const handleDeleteChapter = () => {
    if (onDeleteChapter) {
      onDeleteChapter(chapter.id);
      setShowDeleteConfirm(false);
    }
  };

  // Handle text selection for AI Assistant
  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor]);

  // Handle AI Assistant results
  const handleAIResult = (result) => {
    if (result && selectedText && editor) {
      // Replace selected text with AI result
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().insertContentAt({ from, to }, result).run();
      } else {
        // If no selection, insert at cursor
        editor.chain().focus().insertContent(result).run();
      }
    } else if (result) {
      // Show result in a toast or modal for non-replacement actions like outline/summary
      showToast(result.substring(0, 100) + '...', 'success');
    }
  };

  // Custom word and character counting
  const getTextContent = (html) => {
    if (!html) return '';
    // Create a temporary div to strip HTML tags
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const currentContent = editor?.getHTML() || '';
  const textContent = getTextContent(currentContent);
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const characterCount = textContent.length;

  // Calculate total word count across all chapters
  const getTotalWordCount = () => {
    if (!chapters || chapters.length === 0) return wordCount;
    
    return chapters.reduce((total, ch) => {
      if (ch.id === chapter.id) {
        // Use current editor content for active chapter
        return total + wordCount;
      } else {
        // Use saved content for other chapters
        const chapterText = getTextContent(ch.content || '');
        const chapterWords = chapterText.trim() ? chapterText.trim().split(/\s+/).length : 0;
        return total + chapterWords;
      }
    }, 0);
  };

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Focus Mode Layout
  if (focusMode) {
    return (
      <div className="h-full bg-writer-surface dark:bg-dark-surface relative">
        <style dangerouslySetInnerHTML={{
          __html: `
            .focus-mode .ProseMirror {
              font-size: 18px !important;
              line-height: 1.8 !important;
              font-family: Georgia, Cambria, serif !important;
              color: rgb(31, 41, 55) !important;
              padding: 0 !important;
              max-width: none !important;
            }
            .dark .focus-mode .ProseMirror {
              color: rgb(228, 228, 231) !important;
            }
            .focus-mode .ProseMirror:focus {
              outline: none !important;
            }
            .focus-mode .ProseMirror p {
              margin-bottom: 1.5rem !important;
            }
            .focus-mode .ProseMirror h1, 
            .focus-mode .ProseMirror h2, 
            .focus-mode .ProseMirror h3 {
              margin-top: 2rem !important;
              margin-bottom: 1rem !important;
              color: #1f2937 !important;
            }
            .dark .focus-mode .ProseMirror h1,
            .dark .focus-mode .ProseMirror h2,
            .dark .focus-mode .ProseMirror h3 {
              color: #f4f4f5 !important;
            }
          `
        }} />
        
        {/* Exit Focus Mode Button - Fixed position */}
        <button
          onClick={() => onFocusModeChange(false)}
          className="fixed top-6 right-6 z-50 p-3 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 text-gray-700 rounded-full transition-all duration-200 backdrop-blur-sm"
          title="Exit Focus Mode (Esc)"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Minimal Editor in Focus Mode */}
        <div className="h-full overflow-y-auto focus-mode">
          <div className="max-w-4xl mx-auto px-8 py-16">
            {/* Chapter Title in Focus Mode */}
            <input 
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              onBlur={(e) => handleTitleChange(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.target.blur();
                  editor?.commands.focus();
                }
              }}
              className="text-4xl font-bold text-writer-heading dark:text-dark-heading mb-12 border-none focus:outline-none bg-transparent w-full placeholder:text-writer-subtle dark:placeholder:text-dark-subtle"
              placeholder="Chapter Title"
            />
            
            {/* Editor Content */}
            <EditorContent 
              editor={editor}
              className="min-h-[600px] focus-within:outline-none"
            />
          </div>
        </div>

        {/* Hidden auto-save indicator in focus mode */}
        <div className="fixed bottom-6 right-6 z-40">
          <SaveIndicator />
        </div>
      </div>
    );
  }

  // Normal Mode Layout
  return (
    <div className="h-full flex flex-col bg-writer-surface dark:bg-dark-surface">
      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror ul {
            list-style-type: disc !important;
            margin-left: 1.5rem !important;
            padding-left: 0.5rem !important;
          }
          .ProseMirror ol {
            list-style-type: decimal !important;
            margin-left: 1.5rem !important;
            padding-left: 0.5rem !important;
          }
          .ProseMirror li {
            margin: 0.25rem 0 !important;
            padding-left: 0.25rem !important;
            display: list-item !important;
          }
          .ProseMirror ul ul, .ProseMirror ol ol, .ProseMirror ul ol, .ProseMirror ol ul {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
        `
      }} />
      {/* Header */}
      <div className="border-b border-writer-border dark:border-dark-border px-8 py-4 bg-writer-muted dark:bg-dark-muted">
        <div className="flex items-center justify-between">
          <input 
            type="text"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            onBlur={(e) => handleTitleChange(e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
                editor?.commands.focus();
              }
            }}
            className="text-2xl font-semibold text-writer-heading dark:text-dark-heading bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-writer-accent dark:focus:ring-dark-accent rounded px-2 py-1 min-w-0 flex-shrink"
            placeholder="Chapter Title"
          />
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              title="Delete Chapter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <span className="text-sm text-writer-subtle dark:text-dark-subtle">
              {getTotalWordCount().toLocaleString()} words total
            </span>
            <SaveIndicator />
            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
              title="Version History"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => onFocusModeChange(true)}
              className="p-2 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
              title="Focus Mode (Press Esc to exit)"
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className="p-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-writer-border dark:border-dark-border px-8 py-2 bg-writer-muted dark:bg-dark-muted">
        <div className="flex items-center space-x-1">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 pr-3 border-r border-writer-border dark:border-dark-border">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Format buttons */}
          <div className="flex items-center space-x-1">
            {formatActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`p-2 rounded transition-all duration-200 ${
                  action.isActive() 
                    ? 'bg-writer-accent dark:bg-dark-accent text-black' 
                    : 'text-writer-text dark:text-dark-text hover:text-writer-heading dark:hover:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted'
                }`}
                title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex-1" />
          
          {/* AI Assistant */}
          <div className="flex items-center space-x-1 pl-3 border-l border-writer-border dark:border-dark-border">
            <AIPromptsManager
              novelId={novelId}
              selectedText={selectedText}
              chapter={chapter}
              storyElements={{
                characters: storyContext?.characters || [],
                places: storyContext?.places || [],
                events: storyContext?.events || [],
                lore: storyContext?.lore || [],
                items: storyContext?.items || []
              }}
              onResult={handleAIResult}
            />
          </div>
          
          {/* Guide Toggle */}
          {onToggleGuide && (
            <div className="flex items-center space-x-1 pl-3 border-l border-writer-border dark:border-dark-border">
              <button
                onClick={() => onToggleGuide(!showGuide)}
                className={`p-2 rounded transition-all duration-200 ${
                  showGuide 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-writer-text dark:text-dark-text hover:text-writer-heading dark:hover:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted'
                }`}
                title="Toggle chapter structure guide"
              >
                <Layout className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 pt-8 pb-4">
          <EditorContent 
            editor={editor}
            className="min-h-[500px] focus-within:outline-none"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-writer-border dark:border-dark-border px-8 py-2 bg-writer-muted dark:bg-dark-muted">
        <div className="flex items-center justify-between text-xs text-writer-subtle dark:text-dark-subtle">
          <div className="flex items-center space-x-4">
            <span>Press Ctrl+Z to undo, Ctrl+Y to redo</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters</span>
            {storyContext && (
              <>
                <span>{storyContext.characters.length} characters</span>
                <span>{storyContext.places.length} places</span>
                <span>{storyContext.events.length} events</span>
              </>
            )}
          </div>
        </div>
      </div>

      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        chapter={chapter}
        onRestore={handleVersionRestore}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteChapter}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${chapter.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}

export default Editor;