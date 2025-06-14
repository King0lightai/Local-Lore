import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ConfirmModal, InputModal } from './Modal';

const Sidebar = forwardRef(({ type, items = [], selectedItem, onSelectItem, onCreateItem, onDeleteItem, onEditItem, onEditChapter }, ref) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
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
    if (type === 'chapters') {
      onCreateItem(formData.title);
    } else {
      onCreateItem(formData);
    }
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

  if (type === 'chapters') {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex-1 overflow-y-auto headless-scroll">
          {safeItems
          .filter(chapter => chapter && typeof chapter === 'object' && chapter.id)
          .map(chapter => (
            <div
              key={chapter.id}
              onClick={() => onSelectItem && onSelectItem(chapter)}
              className={`group p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                selectedItem?.id === chapter.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
              }`}
            >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{chapter.title}</h3>
                {chapter.word_count !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">{chapter.word_count} words</p>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(chapter);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 p-1"
                  title="Edit chapter title"
                >
                  <Edit size={14} />
                </button>
                {onDeleteItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chapter);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                    title="Delete chapter"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full p-4 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600 border-t border-gray-200"
        >
          <Plus size={16} />
          New Chapter
        </button>

        <InputModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          title="Create New Chapter"
          fields={getCreateFields('chapters')}
          submitText="Create Chapter"
        />

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
        className="w-full p-4 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600 border-b border-gray-200 bg-gray-25"
      >
        <Plus size={16} />
        Add {getSingularType(type)}
      </button>
      
      <div className="flex-1 overflow-y-auto headless-scroll">
        {safeItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
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
                className="border-b border-gray-100 group transition-colors"
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpanded(element.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{getItemDisplayName(element)}</h4>
                      {showDescription && (
                        <div 
                          className={`text-sm text-gray-600 mt-1 ${
                            isExpanded 
                              ? 'max-h-48 overflow-y-auto pr-1 sidebar-scroll' 
                              : 'line-clamp-2'
                          }`}
                        >
                          <p className="leading-relaxed pr-2">{description}</p>
                        </div>
                      )}
                      {element.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {element.category}
                        </span>
                      )}
                      {showDescription && (
                        <div className="text-xs text-gray-400 mt-1">
                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {onEditItem && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(element);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 p-1"
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
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