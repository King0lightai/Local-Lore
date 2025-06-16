import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Plus, Trash2, Edit, GripVertical, Copy, Check } from 'lucide-react';
import { ConfirmModal, InputModal } from './Modal';

const Sidebar = forwardRef(({ type, items = [], acts = [], selectedItem, onSelectItem, onCreateItem, onDeleteItem, onEditItem, onEditChapter, onReorderChapters }, ref) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [expandedActs, setExpandedActs] = useState(new Set());
  const [actsInitialized, setActsInitialized] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [copiedItems, setCopiedItems] = useState(new Set());

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
  // Initialize act expansion on first load
  useEffect(() => {
    if (acts.length > 0 && !actsInitialized) {
      const newExpanded = new Set(expandedActs);
      
      // Auto-expand first act or all acts if only one
      if (acts.length === 1) {
        acts.forEach(act => newExpanded.add(act.id));
      } else if (acts.length >= 2) {
        // Auto-expand first act
        const firstAct = acts.find(act => act.order_index === 1) || acts[0];
        if (firstAct) {
          newExpanded.add(firstAct.id);
        }
      }
      
      setExpandedActs(newExpanded);
      setActsInitialized(true);
    }
  }, [acts, actsInitialized, expandedActs]);
  
  // Add error boundary
  try {

  const getCreateFields = (type) => {
    const fieldConfigs = {
      chapters: [
        { name: 'title', label: 'Chapter Title', required: true, placeholder: 'Enter chapter title' }
      ],
      characters: [
        { name: 'name', label: 'Character Name', required: true, placeholder: 'Enter character name' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the character' },
        { name: 'traits', label: 'Traits', placeholder: 'Personality traits, separated by commas' }
      ],
      places: [
        { name: 'name', label: 'Place Name', required: true, placeholder: 'Enter place name' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the location' }
      ],
      events: [
        { name: 'title', label: 'Event Title', required: true, placeholder: 'Enter event title' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe what happens' }
      ],
      lore: [
        { name: 'title', label: 'Lore Title', required: true, placeholder: 'Enter lore title' },
        { name: 'content', label: 'Content', type: 'textarea', rows: 4, placeholder: 'Enter lore content' },
        { name: 'category', label: 'Category', placeholder: 'e.g. History, Magic, Culture' }
      ],
      items: [
        { name: 'name', label: 'Item Name', required: true, placeholder: 'Enter item name' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the item' },
        { name: 'properties', label: 'Properties', placeholder: 'Special properties or abilities' }
      ],
      notes: [
        { name: 'title', label: 'Note Title', required: true, placeholder: 'Enter note title' },
        { name: 'content', label: 'Content', type: 'textarea', rows: 6, placeholder: 'Write your note, idea, or style guide...' },
        { name: 'category', label: 'Category', placeholder: 'e.g. Ideas, Style Guide, Research, TODO' }
      ]
    };

    return fieldConfigs[type] || [];
  };

  const handleCreate = (formData) => {
    // Chapters are now created only through the outline
    onCreateItem(formData);
  };

  const handleEdit = (item) => {
    setEditModal({ isOpen: true, item });
  };

  const handleEditSubmit = (formData) => {
    if (editModal.item) {
      if (type === 'chapters') {
        // For chapters, we need a special handler that updates both title and content
        if (onEditChapter) {
          onEditChapter(editModal.item.id, formData.title, editModal.item.content);
        }
      } else if (onEditItem) {
        // For story elements, use the existing handler
        onEditItem(editModal.item.id, formData);
      }
    }
    setEditModal({ isOpen: false, item: null });
  };

  const handleDelete = (item) => {
    setDeleteModal({ isOpen: true, item });
  };

  const confirmDelete = () => {
    if (deleteModal.item) {
      onDeleteItem(deleteModal.item.id);
    }
    setDeleteModal({ isOpen: false, item: null });
  };

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleActExpanded = (actId) => {
    const newExpanded = new Set(expandedActs);
    if (newExpanded.has(actId)) {
      newExpanded.delete(actId);
    } else {
      newExpanded.add(actId);
    }
    setExpandedActs(newExpanded);
  };

  const expandElement = (itemId) => {
    const newExpanded = new Set(expandedItems);
    newExpanded.add(itemId);
    setExpandedItems(newExpanded);
    
    // Scroll to the element
    setTimeout(() => {
      const element = document.querySelector(`[data-item-id="${itemId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.classList.add('bg-yellow-100');
        setTimeout(() => {
          element.classList.remove('bg-yellow-100');
        }, 2000);
      }
    }, 100);
  };

  useImperativeHandle(ref, () => ({
    expandElement
  }));

  const getItemDisplayName = (item) => {
    if (!item || typeof item !== 'object') return 'Untitled';
    return item.name || item.title || 'Untitled';
  };

  const getItemDescription = (item) => {
    if (!item || typeof item !== 'object') return '';
    return item.description || item.content || item.traits || item.properties || '';
  };

  const getSingularType = (type) => {
    const singularMap = {
      chapters: 'chapter',
      characters: 'character', 
      places: 'place',
      events: 'event',
      lore: 'lore',
      items: 'item',
      notes: 'note'
    };
    return singularMap[type] || type;
  };

  const getCapitalizedSingular = (type) => {
    const singular = getSingularType(type);
    return singular.charAt(0).toUpperCase() + singular.slice(1);
  };

  const handleCopyItem = async (item) => {
    const itemName = getItemDisplayName(item);
    const itemDescription = getItemDescription(item);
    const itemType = getSingularType(type);
    
    // Create formatted text for copying
    let copyText = `${itemType.toUpperCase()}: ${itemName}`;
    if (itemDescription) {
      copyText += `\n\nDescription: ${itemDescription}`;
    }
    
    // Add additional fields based on item type
    if (type === 'characters' && item.traits) {
      copyText += `\n\nTraits: ${item.traits}`;
    } else if (type === 'items' && item.properties) {
      copyText += `\n\nProperties: ${item.properties}`;
    } else if (type === 'lore' && item.category) {
      copyText += `\n\nCategory: ${item.category}`;
    } else if (type === 'notes' && item.category) {
      copyText += `\n\nCategory: ${item.category}`;
    }
    
    try {
      await navigator.clipboard.writeText(copyText);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = copyText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    // Show visual feedback
    setCopiedItems(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setCopiedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 2000);
  };

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const reorderedItems = [...safeItems];
    const [movedItem] = reorderedItems.splice(draggedItem.index, 1);
    reorderedItems.splice(dropIndex, 0, movedItem);
    
    if (onReorderChapters) {
      const newOrder = reorderedItems.map((item, index) => ({
        id: item.id,
        order_index: index
      }));
      onReorderChapters(newOrder);
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  if (type === 'chapters') {
    // Group chapters by their act association
    const groupChaptersByActs = () => {
      const grouped = { orphaned: [] };
      
      // Initialize act groups
      acts.forEach(act => {
        grouped[act.id] = {
          act,
          chapters: []
        };
      });

      // Sort chapters by their relationship to acts
      safeItems.forEach(chapter => {
        let assigned = false;
        
        // Try to find which act this chapter belongs to
        for (const act of acts) {
          const chapterSection = act.chapters?.find(c => c.chapter_id === chapter.id);
          if (chapterSection) {
            grouped[act.id].chapters.push(chapter);
            assigned = true;
            break;
          }
        }
        
        // If not assigned to any act, it's orphaned
        if (!assigned) {
          grouped.orphaned.push(chapter);
        }
      });

      return grouped;
    };

    const groupedChapters = groupChaptersByActs();

    return (
      <div className="flex-1 overflow-y-auto">
        {safeItems.length === 0 && (
          <div className="p-4 text-center text-writer-subtle dark:text-dark-subtle text-sm border-b border-writer-border dark:border-dark-border">
            <p className="mb-2">No chapters yet.</p>
            <p className="text-xs">Create chapters in the <strong>Outline</strong> for better organization!</p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto headless-scroll">
          {/* Render Acts with their chapters */}
          {acts.map((act) => {
            const actChapters = groupedChapters[act.id]?.chapters || [];
            const isActExpanded = expandedActs.has(act.id);
            
            return (
              <div key={act.id} className="border-b border-writer-border dark:border-dark-border">
                {/* Act Header */}
                <button
                  onClick={() => toggleActExpanded(act.id)}
                  className="w-full p-3 text-left hover:bg-writer-muted/50 dark:hover:bg-dark-muted/50 flex items-center justify-between bg-purple-50/30 dark:bg-purple-900/10 border-l-4 border-l-purple-400 dark:border-l-purple-600"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                      {act.order_index || 1}
                    </div>
                    <span className="font-medium text-sm text-writer-heading dark:text-dark-heading truncate">
                      {act.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-writer-subtle dark:text-dark-subtle bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                      {actChapters.length} ch
                    </span>
                    <span className="text-writer-subtle dark:text-dark-subtle">
                      {isActExpanded ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {/* Act Chapters */}
                {isActExpanded && actChapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, chapter, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectItem && onSelectItem(chapter)}
                    className={`group pl-8 pr-4 py-3 cursor-pointer hover:bg-writer-muted dark:hover:bg-dark-muted border-b border-writer-border/30 dark:border-dark-border/30 transition-all duration-200 ${
                      selectedItem?.id === chapter.id ? 'bg-writer-surface dark:bg-dark-panel border-l-4 border-l-writer-accent dark:border-l-dark-accent shadow-lg' : ''
                    } ${
                      draggedItem?.item.id === chapter.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-writer-heading dark:text-dark-heading truncate">{chapter.title}</h3>
                        {chapter.word_count !== undefined && (
                          <p className="text-xs text-writer-subtle dark:text-dark-subtle mt-1">{chapter.word_count} words</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Orphaned Chapters (not assigned to any act) */}
          {groupedChapters.orphaned.length > 0 && (
            <div className="border-b border-writer-border dark:border-dark-border">
              <div className="p-3 bg-gray-50/30 dark:bg-gray-900/10 border-l-4 border-l-gray-400 dark:border-l-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-writer-subtle dark:text-dark-subtle">
                    Unorganized Chapters
                  </span>
                  <span className="text-xs text-writer-subtle dark:text-dark-subtle bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded-full">
                    {groupedChapters.orphaned.length}
                  </span>
                </div>
              </div>
              
              {groupedChapters.orphaned.map((chapter, index) => (
                <div
                  key={chapter.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, chapter, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectItem && onSelectItem(chapter)}
                  className={`group pl-8 pr-4 py-3 cursor-pointer hover:bg-writer-muted dark:hover:bg-dark-muted border-b border-writer-border/30 dark:border-dark-border/30 transition-all duration-200 ${
                    selectedItem?.id === chapter.id ? 'bg-writer-surface dark:bg-dark-panel border-l-4 border-l-writer-accent dark:border-l-dark-accent shadow-lg' : ''
                  } ${
                    draggedItem?.item.id === chapter.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div 
                      className="text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-writer-heading dark:text-dark-heading truncate">{chapter.title}</h3>
                      {chapter.word_count !== undefined && (
                        <p className="text-xs text-writer-subtle dark:text-dark-subtle mt-1">{chapter.word_count} words</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        <InputModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, item: null })}
          onSubmit={handleEditSubmit}
          title="Edit Chapter"
          fields={[{
            name: 'title',
            label: 'Chapter Title',
            required: true,
            placeholder: 'Enter chapter title',
            defaultValue: editModal.item ? editModal.item.title || '' : ''
          }]}
          submitText="Update Chapter"
        />

        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, item: null })}
          onConfirm={confirmDelete}
          title="Delete Chapter"
          message={`Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmStyle="danger"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
          .headless-scroll::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          .headless-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .scroll-fade {
            position: relative;
          }
          .scroll-fade::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            background: linear-gradient(transparent, rgba(249, 250, 251, 0.8));
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .scroll-fade.has-scroll::after {
            opacity: 1;
          }
        `
      }} />
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full p-4 text-left hover:bg-writer-border dark:hover:bg-dark-muted flex items-center gap-2 text-writer-heading dark:text-dark-heading border-b border-writer-border dark:border-dark-border bg-writer-border/50 dark:bg-dark-muted/50 font-semibold transition-all duration-200"
      >
        <Plus size={16} />
        Add {getSingularType(type)}
      </button>
      
      <div className="flex-1 overflow-y-auto headless-scroll">
        {safeItems.length === 0 ? (
          <div className="p-4 text-center text-writer-subtle dark:text-dark-subtle text-sm">
            No {type} yet. Click above to add one.
          </div>
        ) : (
          safeItems
            .filter(element => element && typeof element === 'object' && element.id)
            .map(element => {
            const isExpanded = expandedItems.has(element.id);
            const description = getItemDescription(element);
            const showDescription = description && description.length > 0;
            
            return (
              <div 
                key={element.id} 
                data-item-id={element.id}
                className="border-b border-writer-border dark:border-dark-border group transition-colors"
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-writer-muted dark:hover:bg-dark-muted"
                  onClick={() => toggleExpanded(element.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-writer-heading dark:text-dark-heading">{getItemDisplayName(element)}</h4>
                      {showDescription && (
                        <div 
                          className={`text-sm text-writer-text dark:text-dark-text mt-1 ${
                            isExpanded 
                              ? 'max-h-48 overflow-y-auto pr-1 sidebar-scroll' 
                              : 'line-clamp-2'
                          }`}
                        >
                          <p className="leading-relaxed pr-2">{description}</p>
                        </div>
                      )}
                      {element.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-writer-muted dark:bg-dark-muted text-writer-subtle dark:text-dark-subtle rounded">
                          {element.category}
                        </span>
                      )}
                      {showDescription && (
                        <div className="text-xs text-writer-subtle dark:text-dark-subtle mt-1">
                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopyItem(element);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-writer-subtle dark:text-dark-subtle hover:text-emerald-500 dark:hover:text-emerald-400 p-1"
                        title={`Copy ${getSingularType(type)} to clipboard`}
                      >
                        {copiedItems.has(element.id) ? (
                          <Check size={14} className="text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      {onEditItem && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(element);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading p-1"
                          title={`Edit ${getSingularType(type)}`}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(element);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-writer-error dark:text-dark-error hover:opacity-80 p-1"
                          title={`Delete ${getSingularType(type)}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <InputModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        title={`Add ${getCapitalizedSingular(type)}`}
        fields={getCreateFields(type)}
        submitText={`Add ${getSingularType(type)}`}
      />

      <InputModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null })}
        onSubmit={handleEditSubmit}
        title={`Edit ${getCapitalizedSingular(type)}`}
        fields={getCreateFields(type).map(field => ({
          ...field,
          defaultValue: editModal.item ? editModal.item[field.name] || '' : ''
        }))}
        submitText={`Update ${getSingularType(type)}`}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title={`Delete ${getCapitalizedSingular(type)}`}
        message={`Are you sure you want to delete "${getItemDisplayName(deleteModal.item)}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
  
  } catch (error) {
    console.error('Sidebar error:', error);
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-red-500 text-sm">
          Error loading {type}: {error.message}
        </div>
      </div>
    );
  }
});

export default Sidebar;