import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Move,
  StickyNote as StickyNoteIcon,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { ConfirmModal } from './Modal';
import axios from 'axios';

const NOTE_COLORS = [
  { name: 'Yellow', value: '#fef3c7', border: '#f59e0b' },
  { name: 'Blue', value: '#dbeafe', border: '#3b82f6' },
  { name: 'Green', value: '#d1fae5', border: '#10b981' },
  { name: 'Pink', value: '#fce7f3', border: '#ec4899' },
  { name: 'Purple', value: '#e9d5ff', border: '#8b5cf6' },
  { name: 'Orange', value: '#fed7aa', border: '#f97316' },
  { name: 'Red', value: '#fee2e2', border: '#ef4444' },
  { name: 'Gray', value: '#f3f4f6', border: '#6b7280' }
];

function StickyNote({ 
  note, 
  onEdit, 
  onDelete, 
  onPositionChange, 
  isDragging,
  scale = 1
}) {
  const [position, setPosition] = useState({ x: note.x || 0, y: note.y || 0 });
  const [size, setSize] = useState({ width: note.width || 200, height: note.height || 150 });
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempTitle, setTempTitle] = useState(note.title || '');
  const [tempContent, setTempContent] = useState(note.content || '');
  const noteRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentTextareaRef = useRef(null);

  const noteColor = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];

  const handleMouseDown = (e) => {
    // Completely disable drag if any modal is open or if editing
    if (document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0') || 
        isEditingTitle || isEditingContent || showColorPicker) {
      return;
    }
    
    if (e.target.closest('.note-content') || e.target.closest('.note-actions') || 
        e.target.closest('.resize-handle') || e.target.closest('.color-picker')) {
      return; // Don't drag if clicking on content, action buttons, or resize handle
    }
    
    setIsDraggingLocal(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleMouseMove = (e) => {
    // Stop dragging if modal opens mid-drag
    if ((isDraggingLocal || isResizing) && (document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0'))) {
      setIsDraggingLocal(false);
      setIsResizing(false);
      return;
    }
    
    if (isDraggingLocal) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPosition(newPosition);
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newSize = {
        width: Math.max(150, resizeStart.width + deltaX),
        height: Math.max(100, resizeStart.height + deltaY)
      };
      setSize(newSize);
    }
  };

  const handleMouseUp = (e) => {
    // Immediately clear dragging state if modal is open, don't save position
    if (document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0')) {
      setIsDraggingLocal(false);
      setIsResizing(false);
      return;
    }
    
    if (isDraggingLocal) {
      setIsDraggingLocal(false);
      onPositionChange(note.id, position);
    }
    
    if (isResizing) {
      setIsResizing(false);
      // Save the new size
      onEdit(note.id, { ...note, width: size.width, height: size.height });
    }
  };

  useEffect(() => {
    if (isDraggingLocal || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLocal, isResizing, dragStart, resizeStart, position, size]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
      contentTextareaRef.current.select();
    }
  }, [isEditingContent]);

  const handleTitleSave = () => {
    onEdit(note.id, { ...note, title: tempTitle });
    setIsEditingTitle(false);
  };

  const handleContentSave = () => {
    onEdit(note.id, { ...note, content: tempContent });
    setIsEditingContent(false);
  };

  const handleColorChange = (color) => {
    onEdit(note.id, { ...note, color });
    setShowColorPicker(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(note.title || '');
      setIsEditingTitle(false);
    }
  };

  const handleContentKeyDown = (e) => {
    if (e.key === 'Escape') {
      setTempContent(note.content || '');
      setIsEditingContent(false);
    } else if (e.key === 'Tab' && e.ctrlKey) {
      e.preventDefault();
      handleContentSave();
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColorPicker && !e.target.closest('.color-picker') && !e.target.closest('[title="Change color"]')) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showColorPicker]);

  return (
    <div
      ref={noteRef}
      className={`absolute select-none transition-shadow ${
        isDraggingLocal ? 'shadow-lg z-50' : 'shadow-md hover:shadow-lg z-10'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width * scale,
        height: size.height * scale,
        backgroundColor: noteColor.value,
        borderColor: noteColor.border,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full border-2 rounded-lg p-3 flex flex-col group cursor-move">
        {/* Note Header */}
        <div className="flex items-center justify-between mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            <Move className="w-3 h-3 text-gray-500" />
          </div>
          <div className="note-actions flex items-center space-x-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 hover:bg-black/10 rounded relative"
              title="Change color"
            >
              <Palette className="w-3 h-3 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(note)}
              className="p-1 hover:bg-black/10 rounded"
              title="Delete note"
            >
              <Trash2 className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Color Picker Dropdown */}
        {showColorPicker && (
          <div className="color-picker absolute top-10 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
            <div className="grid grid-cols-4 gap-1">
              {NOTE_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`w-8 h-8 rounded border-2 transition-all duration-200 hover:scale-110`}
                  style={{ backgroundColor: color.value, borderColor: color.border }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Note Content */}
        <div className="note-content flex-1 overflow-hidden">
          {/* Title */}
          <div className="mb-1" onClick={(e) => e.stopPropagation()}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="w-full font-semibold text-sm text-gray-800 bg-transparent border-b border-gray-400 outline-none"
                placeholder="Add title..."
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h4 
                className="font-semibold text-sm text-gray-800 truncate cursor-text hover:bg-white/20 px-1 -mx-1 rounded"
                onClick={() => {
                  setTempTitle(note.title || '');
                  setIsEditingTitle(true);
                }}
                title="Click to edit title"
              >
                {note.title || <span className="text-gray-400 italic">Click to add title</span>}
              </h4>
            )}
          </div>

          {/* Content */}
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            {isEditingContent ? (
              <textarea
                ref={contentTextareaRef}
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                onBlur={handleContentSave}
                onKeyDown={handleContentKeyDown}
                className="w-full h-full text-xs text-gray-700 bg-transparent resize-none outline-none"
                placeholder="Write your note..."
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div 
                className="text-xs text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-full cursor-text hover:bg-white/20 p-1 -m-1 rounded"
                onClick={() => {
                  setTempContent(note.content || '');
                  setIsEditingContent(true);
                }}
                title="Click to edit content"
              >
                {note.content || <span className="text-gray-400 italic">Click to add content</span>}
              </div>
            )}
          </div>
        </div>
        
        {/* Resize Handle */}
        <div
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          style={{
            background: 'linear-gradient(-45deg, transparent 30%, currentColor 30%, currentColor 40%, transparent 40%, transparent 60%, currentColor 60%, currentColor 70%, transparent 70%)',
            color: noteColor.border
          }}
          title="Drag to resize"
        />
      </div>
    </div>
  );
}


function NoteCreateModal({ onSave, onClose, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: NOTE_COLORS[0].value,
    width: 200,
    height: 150
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-writer-surface dark:bg-dark-surface rounded-lg p-6 w-96 max-w-[90vw] shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-writer-heading dark:text-dark-heading">Create Note</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <label className="block text-sm font-medium mb-1 text-writer-text dark:text-dark-text">Title (optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-writer-border dark:border-dark-border rounded-md bg-writer-bg dark:bg-dark-bg text-writer-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-writer-accent dark:focus:ring-dark-accent"
              placeholder="Note title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-writer-text dark:text-dark-text">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 border border-writer-border dark:border-dark-border rounded-md h-24 resize-none bg-writer-bg dark:bg-dark-bg text-writer-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-writer-accent dark:focus:ring-dark-accent"
              placeholder="Write your note..."
              required
              tabIndex={2}
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-writer-text dark:text-dark-text">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {NOTE_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded border-2 transition-all duration-200 ${
                    formData.color === color.value ? 'ring-2 ring-writer-accent dark:ring-dark-accent scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value, borderColor: color.border }}
                  title={color.name}
                />
              ))}
            </div>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotesView({ novelId, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, note: null });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (novelId) {
      fetchNotes();
    }
  }, [novelId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/novels/${novelId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (formData) => {
    setIsSaving(true);
    try {
      // Create note at center of visible area
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const centerX = canvasRect ? (canvasRect.width / 2 - 100) / scale : 100;
      const centerY = canvasRect ? (canvasRect.height / 2 - 75) / scale : 100;
      
      const noteData = {
        ...formData,
        x: centerX,
        y: centerY,
        width: formData.width || 200,
        height: formData.height || 150,
        color: formData.color || NOTE_COLORS[0].value
      };

      const response = await axios.post(`/api/novels/${novelId}/notes`, noteData);
      setNotes(prev => [...prev, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNote = async (noteId, formData) => {
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/notes/${noteId}`, formData);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, ...response.data } : note
      ));
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      await axios.delete(`/api/notes/${deleteModal.note.id}`);
      setNotes(prev => prev.filter(note => note.id !== deleteModal.note.id));
      setDeleteModal({ isOpen: false, note: null });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handlePositionChange = async (noteId, position) => {
    try {
      await axios.put(`/api/notes/${noteId}`, {
        x: position.x,
        y: position.y
      });
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, x: position.x, y: position.y } : note
      ));
    } catch (error) {
      console.error('Error updating note position:', error);
    }
  };

  const resetView = () => {
    setScale(1);
    if (canvasRef.current) {
      canvasRef.current.scrollTo(0, 0);
    }
  };

  return (
    <div className="h-full flex flex-col bg-writer-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="card-header border-0 border-b border-writer-border dark:border-dark-border bg-writer-surface dark:bg-dark-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-writer-heading dark:text-dark-heading flex items-center">
              <StickyNoteIcon className="w-5 h-5 mr-3 text-writer-accent dark:text-dark-accent" />
              Notes
            </h2>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-writer-muted dark:bg-dark-muted rounded-lg p-1">
              <button
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 hover:bg-writer-surface dark:hover:bg-dark-surface rounded"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                className="p-1 hover:bg-writer-surface dark:hover:bg-dark-surface rounded"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-1 hover:bg-writer-surface dark:hover:bg-dark-surface rounded"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900" ref={canvasRef}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-writer-accent dark:border-dark-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative min-h-full min-w-full" style={{ minHeight: '200vh', minWidth: '200vw' }}>
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <StickyNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h3>
                  <p className="text-gray-500 mb-4">Create your first sticky note to start organizing your ideas</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
                  >
                    Add First Note
                  </button>
                </div>
              </div>
            ) : (
              notes.map(note => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={(note) => setDeleteModal({ isOpen: true, note })}
                  onPositionChange={handlePositionChange}
                  scale={scale}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <NoteCreateModal
          onSave={(noteData) => {
            handleCreateNote(noteData);
          }}
          onClose={() => setShowCreateModal(false)}
          isSaving={isSaving}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, note: null })}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete this note${deleteModal.note?.title ? ` "${deleteModal.note.title}"` : ''}?`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}

export default NotesView;