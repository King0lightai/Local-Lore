import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Move,
  Link,
  BookOpen,
  MoreVertical
} from 'lucide-react';
import { Modal, InputModal, ConfirmModal } from './Modal';
import axios from 'axios';

const OUTLINE_SECTION_FIELDS = [
  { name: 'title', label: 'Title', required: true, placeholder: 'Section title' },
  { 
    name: 'description', 
    label: 'Description', 
    type: 'textarea', 
    rows: 3,
    placeholder: 'Brief description of this section'
  },
  { 
    name: 'content', 
    label: 'Content', 
    type: 'textarea', 
    rows: 6,
    placeholder: 'Detailed content, notes, or scene breakdown'
  },
  { 
    name: 'order_index', 
    label: 'Order', 
    type: 'number',
    placeholder: '0',
    help: 'Position within the same level (0 = first)' 
  }
];

function OutlineSection({ 
  section, 
  level = 0, 
  children = [], 
  onEdit, 
  onDelete, 
  onAddChild,
  onLinkChapter,
  chapters = [],
  expandedSections,
  onToggleExpanded
}) {
  const hasChildren = children.length > 0;
  const isExpanded = expandedSections.has(section.id);
  const indent = level * 24;

  return (
    <div className="outline-section group">
      <div 
        className="flex items-center p-4 hover:bg-writer-muted/50 border-b border-writer-border/50 transition-all duration-200"
        style={{ paddingLeft: `${16 + indent}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggleExpanded(section.id)}
          className="btn-icon p-1 mr-3"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-1 bg-writer-subtle rounded-full" />
            </div>
          )}
        </button>

        {/* Section Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-writer-heading truncate">{section.title}</h4>
              {section.description && (
                <p className="text-sm text-writer-subtle mt-1 line-clamp-2">{section.description}</p>
              )}
              {section.chapter_id && (
                <div className="flex items-center mt-2">
                  <Link className="w-3 h-3 text-writer-accent mr-1" />
                  <span className="text-xs text-writer-accent bg-writer-accent/10 px-2 py-1 rounded-full">
                    {chapters.find(ch => ch.id === section.chapter_id)?.title || 'Unknown Chapter'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onAddChild(section)}
                className="btn-icon text-writer-subtle hover:text-writer-accent"
                title="Add subsection"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLinkChapter(section)}
                className="btn-icon text-writer-subtle hover:text-writer-info"
                title="Link to chapter"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(section)}
                className="btn-icon text-writer-subtle hover:text-writer-warning"
                title="Edit section"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(section)}
                className="btn-icon text-writer-subtle hover:text-writer-error"
                title="Delete section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <OutlineSection
              key={child.section.id}
              section={child.section}
              level={level + 1}
              children={child.children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onLinkChapter={onLinkChapter}
              chapters={chapters}
              expandedSections={expandedSections}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OutlineView({ novelId, chapters = [], onClose }) {
  const [outlines, setOutlines] = useState([]);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Modal states
  const [createOutlineModal, setCreateOutlineModal] = useState({ isOpen: false });
  const [editOutlineModal, setEditOutlineModal] = useState({ isOpen: false, outline: null });
  const [deleteOutlineModal, setDeleteOutlineModal] = useState({ isOpen: false, outline: null });
  const [createSectionModal, setCreateSectionModal] = useState({ isOpen: false, parent: null });
  const [editSectionModal, setEditSectionModal] = useState({ isOpen: false, section: null });
  const [deleteSectionModal, setDeleteSectionModal] = useState({ isOpen: false, section: null });
  const [linkChapterModal, setLinkChapterModal] = useState({ isOpen: false, section: null });

  useEffect(() => {
    if (novelId) {
      fetchOutlines();
    }
  }, [novelId]);

  useEffect(() => {
    if (selectedOutline) {
      fetchSections(selectedOutline.id);
    }
  }, [selectedOutline]);

  const fetchOutlines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/novels/${novelId}/outlines`);
      setOutlines(response.data);
      
      // Auto-select first outline or create one if none exist
      if (response.data.length > 0 && !selectedOutline) {
        setSelectedOutline(response.data[0]);
      } else if (response.data.length === 0) {
        // Auto-create default outline
        await handleCreateOutline({ title: 'Main Outline', description: 'Primary story outline' });
      }
    } catch (error) {
      console.error('Error fetching outlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (outlineId) => {
    try {
      const response = await axios.get(`/api/outlines/${outlineId}/sections`);
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const buildSectionTree = (sections) => {
    const sectionMap = new Map();
    const roots = [];

    // Create map of all sections
    sections.forEach(section => {
      sectionMap.set(section.id, { section, children: [] });
    });

    // Build tree structure
    sections.forEach(section => {
      const node = sectionMap.get(section.id);
      if (section.parent_id && sectionMap.has(section.parent_id)) {
        sectionMap.get(section.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order_index
    const sortByOrder = (a, b) => a.section.order_index - b.section.order_index;
    roots.sort(sortByOrder);
    sectionMap.forEach(node => node.children.sort(sortByOrder));

    return roots;
  };

  const handleCreateOutline = async (formData) => {
    setIsSaving(true);
    try {
      const response = await axios.post(`/api/novels/${novelId}/outlines`, formData);
      const newOutline = response.data;
      setOutlines(prev => [newOutline, ...prev]);
      setSelectedOutline(newOutline);
      setCreateOutlineModal({ isOpen: false });
    } catch (error) {
      console.error('Error creating outline:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOutline = async (formData) => {
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/outlines/${editOutlineModal.outline.id}`, formData);
      const updatedOutline = response.data;
      setOutlines(prev => prev.map(o => o.id === updatedOutline.id ? updatedOutline : o));
      if (selectedOutline?.id === updatedOutline.id) {
        setSelectedOutline(updatedOutline);
      }
      setEditOutlineModal({ isOpen: false, outline: null });
    } catch (error) {
      console.error('Error updating outline:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOutline = async () => {
    try {
      await axios.delete(`/api/outlines/${deleteOutlineModal.outline.id}`);
      const updatedOutlines = outlines.filter(o => o.id !== deleteOutlineModal.outline.id);
      setOutlines(updatedOutlines);
      
      if (selectedOutline?.id === deleteOutlineModal.outline.id) {
        setSelectedOutline(updatedOutlines[0] || null);
      }
      
      setDeleteOutlineModal({ isOpen: false, outline: null });
    } catch (error) {
      console.error('Error deleting outline:', error);
    }
  };

  const handleCreateSection = async (formData) => {
    setIsSaving(true);
    try {
      const parent = createSectionModal.parent;
      const sectionData = {
        ...formData,
        parent_id: parent?.id || null,
        level: parent ? parent.level + 1 : 0,
        order_index: parseInt(formData.order_index) || 0
      };
      
      const response = await axios.post(`/api/outlines/${selectedOutline.id}/sections`, sectionData);
      await fetchSections(selectedOutline.id);
      setCreateSectionModal({ isOpen: false, parent: null });
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSection = async (formData) => {
    setIsSaving(true);
    try {
      const sectionData = {
        ...formData,
        order_index: parseInt(formData.order_index) || 0
      };
      
      await axios.put(`/api/sections/${editSectionModal.section.id}`, sectionData);
      await fetchSections(selectedOutline.id);
      setEditSectionModal({ isOpen: false, section: null });
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    try {
      await axios.delete(`/api/sections/${deleteSectionModal.section.id}`);
      await fetchSections(selectedOutline.id);
      setDeleteSectionModal({ isOpen: false, section: null });
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleLinkChapter = async (chapterId) => {
    if (!linkChapterModal.section) return;
    
    try {
      const sectionData = {
        ...linkChapterModal.section,
        chapter_id: chapterId || null
      };
      
      await axios.put(`/api/sections/${linkChapterModal.section.id}`, sectionData);
      await fetchSections(selectedOutline.id);
      setLinkChapterModal({ isOpen: false, section: null });
    } catch (error) {
      console.error('Error linking chapter:', error);
    }
  };

  const toggleSectionExpanded = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const sectionTree = buildSectionTree(sections);

  const outlineFields = [
    { name: 'title', label: 'Outline Title', required: true, placeholder: 'e.g., "Main Story Outline"' },
    { 
      name: 'description', 
      label: 'Description', 
      type: 'textarea', 
      rows: 3,
      placeholder: 'Brief description of this outline'
    }
  ];

  const getSectionFields = (section = null, parent = null) => [
    ...OUTLINE_SECTION_FIELDS.map(field => ({
      ...field,
      defaultValue: section ? section[field.name] || '' : ''
    }))
  ];

  return (
    <div className="h-full flex flex-col bg-writer-bg">
      {/* Header */}
      <div className="card-header border-0 border-b border-writer-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-writer-heading flex items-center">
              <BookOpen className="w-5 h-5 mr-3 text-writer-accent" />
              Story Outlines
            </h2>
            
            {/* Outline Selector */}
            {outlines.length > 0 && (
              <select
                value={selectedOutline?.id || ''}
                onChange={(e) => {
                  const outline = outlines.find(o => o.id === parseInt(e.target.value));
                  setSelectedOutline(outline);
                }}
                className="input-primary text-sm max-w-48"
              >
                {outlines.map(outline => (
                  <option key={outline.id} value={outline.id}>
                    {outline.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreateOutlineModal({ isOpen: true })}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Outline
            </button>
            
            {selectedOutline && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setEditOutlineModal({ isOpen: true, outline: selectedOutline })}
                  className="btn-icon text-writer-subtle hover:text-writer-warning"
                  title="Edit outline"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteOutlineModal({ isOpen: true, outline: selectedOutline })}
                  className="btn-icon text-writer-subtle hover:text-writer-error"
                  title="Delete outline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-writer-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-writer-subtle">Loading outlines...</p>
          </div>
        ) : !selectedOutline ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-writer-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-writer-subtle" />
            </div>
            <h3 className="text-lg font-medium text-writer-heading mb-2">No outlines yet</h3>
            <p className="text-writer-subtle mb-6 max-w-sm mx-auto">
              Create your first outline to organize your story structure and plot development.
            </p>
            <button
              onClick={() => setCreateOutlineModal({ isOpen: true })}
              className="btn-primary"
            >
              Create Your First Outline
            </button>
          </div>
        ) : (
          <div>
            {/* Selected Outline Info */}
            <div className="p-6 bg-writer-surface/50 border-b border-writer-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-writer-heading text-lg">{selectedOutline.title}</h3>
                  {selectedOutline.description && (
                    <p className="text-writer-subtle mt-2 leading-relaxed">{selectedOutline.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setCreateSectionModal({ isOpen: true, parent: null })}
                  className="btn-primary flex items-center ml-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </button>
              </div>
            </div>

            {/* Outline Sections */}
            <div className="min-h-0">
              {sectionTree.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-writer-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-writer-subtle" />
                  </div>
                  <h4 className="font-medium text-writer-heading mb-2">No sections yet</h4>
                  <p className="text-writer-subtle mb-6 max-w-sm mx-auto">
                    Start building your story structure by adding your first outline section.
                  </p>
                  <button
                    onClick={() => setCreateSectionModal({ isOpen: true, parent: null })}
                    className="btn-primary"
                  >
                    Add First Section
                  </button>
                </div>
              ) : (
                <div className="outline-tree">
                  {sectionTree.map(node => (
                    <OutlineSection
                      key={node.section.id}
                      section={node.section}
                      children={node.children}
                      onEdit={(section) => setEditSectionModal({ isOpen: true, section })}
                      onDelete={(section) => setDeleteSectionModal({ isOpen: true, section })}
                      onAddChild={(section) => setCreateSectionModal({ isOpen: true, parent: section })}
                      onLinkChapter={(section) => setLinkChapterModal({ isOpen: true, section })}
                      chapters={chapters}
                      expandedSections={expandedSections}
                      onToggleExpanded={toggleSectionExpanded}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <InputModal
        isOpen={createOutlineModal.isOpen}
        onClose={() => setCreateOutlineModal({ isOpen: false })}
        onSubmit={handleCreateOutline}
        title="Create New Outline"
        fields={outlineFields}
        submitText={isSaving ? "Creating..." : "Create Outline"}
        isSubmitting={isSaving}
      />

      <InputModal
        isOpen={editOutlineModal.isOpen}
        onClose={() => setEditOutlineModal({ isOpen: false, outline: null })}
        onSubmit={handleEditOutline}
        title="Edit Outline"
        fields={outlineFields.map(field => ({
          ...field,
          defaultValue: editOutlineModal.outline ? editOutlineModal.outline[field.name] || '' : ''
        }))}
        submitText={isSaving ? "Updating..." : "Update Outline"}
        isSubmitting={isSaving}
      />

      <ConfirmModal
        isOpen={deleteOutlineModal.isOpen}
        onClose={() => setDeleteOutlineModal({ isOpen: false, outline: null })}
        onConfirm={handleDeleteOutline}
        title="Delete Outline"
        message={`Are you sure you want to delete "${deleteOutlineModal.outline?.title}"? This will also delete all sections in this outline.`}
        confirmText="Delete"
        confirmStyle="danger"
      />

      <InputModal
        isOpen={createSectionModal.isOpen}
        onClose={() => setCreateSectionModal({ isOpen: false, parent: null })}
        onSubmit={handleCreateSection}
        title={createSectionModal.parent ? `Add Subsection to "${createSectionModal.parent.title}"` : "Add Section"}
        fields={getSectionFields(null, createSectionModal.parent)}
        submitText={isSaving ? "Creating..." : "Create Section"}
        isSubmitting={isSaving}
      />

      <InputModal
        isOpen={editSectionModal.isOpen}
        onClose={() => setEditSectionModal({ isOpen: false, section: null })}
        onSubmit={handleEditSection}
        title="Edit Section"
        fields={getSectionFields(editSectionModal.section)}
        submitText={isSaving ? "Updating..." : "Update Section"}
        isSubmitting={isSaving}
      />

      <ConfirmModal
        isOpen={deleteSectionModal.isOpen}
        onClose={() => setDeleteSectionModal({ isOpen: false, section: null })}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteSectionModal.section?.title}"? This will also delete all subsections.`}
        confirmText="Delete"
        confirmStyle="danger"
      />

      <Modal
        isOpen={linkChapterModal.isOpen}
        onClose={() => setLinkChapterModal({ isOpen: false, section: null })}
        title="Link to Chapter"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Link section "{linkChapterModal.section?.title}" to a chapter:
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => handleLinkChapter(null)}
              className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="font-medium text-gray-500">Remove Link</div>
              <div className="text-sm text-gray-400">Unlink from any chapter</div>
            </button>
            
            {chapters.map(chapter => (
              <button
                key={chapter.id}
                onClick={() => handleLinkChapter(chapter.id)}
                className={`w-full p-3 text-left border rounded hover:bg-gray-50 ${
                  linkChapterModal.section?.chapter_id === chapter.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="font-medium text-gray-900">{chapter.title}</div>
                <div className="text-sm text-gray-500">
                  {chapter.word_count || 0} words
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OutlineView;