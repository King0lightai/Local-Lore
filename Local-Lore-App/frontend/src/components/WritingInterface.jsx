import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Users, MapPin, Calendar, BookOpen, Package, Download, Search, ChevronDown, ChevronRight, FileSignature, StickyNote } from 'lucide-react';
import Editor from './Editor';
import Sidebar from './Sidebar';
import ResizableSidebar from './ResizableSidebar';
import SearchModal, { useSearch } from './Search';
import ExportModal from './ExportModal';
import OutlineView from './OutlineView';
import NotesView from './NotesView';
import ChapterGuidePanel from './ChapterGuidePanel';
import axios from 'axios';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

function WritingInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const { isSearchOpen, openSearch, closeSearch } = useSearch();
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('characters');
  const [sidebarView, setSidebarView] = useState('chapters'); // 'chapters' or 'elements'
  const [showOutline, setShowOutline] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [outlineData, setOutlineData] = useState(null);
  const [storyElements, setStoryElements] = useState({
    characters: [],
    places: [],
    events: [],
    lore: [],
    items: [],
    notes: []
  });
  const [acts, setActs] = useState([]);
  const [editorRef, setEditorRef] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const sidebarRef = useRef(null);

  // Utility function to convert plural types to singular
  const getSingularType = (type) => {
    const singularMap = {
      chapters: 'chapter',
      characters: 'character', 
      places: 'place',
      events: 'event',
      lore: 'lore',
      items: 'item'
    };
    return singularMap[type] || type;
  };

  useEffect(() => {
    loadNovelData();
    
    // Temporarily expose deleteAllOutlines to window for debugging
    window.deleteAllOutlines = deleteAllOutlines;
  }, [id]);

  // Handle escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const loadNovelData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchNovel(),
        fetchChapters(),
        fetchStoryElements(),
        fetchActs()
      ]);
      
      // Ensure outline-chapter consistency after loading
      await ensureOutlineChapterConsistency();
    } catch (error) {
      showToast('Failed to load novel data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Temporary function to clean up all outlines
  const deleteAllOutlines = async () => {
    try {
      console.log('🗑️ Starting outline cleanup for novel:', id);
      const response = await axios.get(`/api/novels/${id}/outlines`);
      const outlines = response.data;
      console.log('🗑️ Found', outlines.length, 'outlines to delete');
      
      for (const outline of outlines) {
        try {
          console.log('🗑️ Deleting outline:', outline.id, outline.title);
          await axios.delete(`/api/outlines/${outline.id}`);
        } catch (error) {
          console.error('Error deleting outline:', outline.id, error);
        }
      }
      
      console.log('✅ All outlines deleted');
      showToast('All outlines deleted successfully', 'success');
      
      // Refresh the interface
      if (showOutline) {
        setShowOutline(false);
      }
    } catch (error) {
      console.error('Error in deleteAllOutlines:', error);
      showToast('Failed to delete outlines', 'error');
    }
  };

  const ensureOutlineChapterConsistency = async (currentChapters = null) => {
    try {
      console.log('🔍 Checking outline-chapter consistency...');
      
      // Use provided chapters or fetch fresh data
      const chaptersToCheck = currentChapters || await axios.get(`/api/novels/${id}/chapters`).then(r => r.data);
      console.log('📖 Current chapters:', chaptersToCheck.map(c => ({ id: c.id, title: c.title })));
      
      // Get outline sections to check for orphaned chapter references
      const outlineResponse = await axios.get(`/api/novels/${id}/outlines`);
      if (outlineResponse.data.length > 0) {
        const outline = outlineResponse.data[0];
        const sectionsResponse = await axios.get(`/api/outlines/${outline.id}/sections`);
        const chapterSections = sectionsResponse.data.filter(s => s.level === 1);
        
        console.log('📋 Chapter sections in outline:', chapterSections.map(s => ({ 
          id: s.id, 
          title: s.title, 
          chapter_id: s.chapter_id 
        })));
        
        // Check for chapter sections without valid chapter_id references
        const orphanedSections = chapterSections.filter(s => {
          return s.chapter_id && !chaptersToCheck.find(ch => ch.id === s.chapter_id);
        });
        
        // Clear orphaned references
        for (const section of orphanedSections) {
          console.log('🧹 Cleaning up orphaned chapter reference:', section.title, 'chapter_id:', section.chapter_id);
          await axios.put(`/api/sections/${section.id}`, {
            ...section,
            chapter_id: null
          });
        }
        
        if (orphanedSections.length > 0) {
          console.log(`🧹 Cleaned up ${orphanedSections.length} orphaned chapter references in outline`);
          // Refresh acts after cleanup to reflect changes
          await fetchActs();
        } else {
          console.log('✅ No orphaned references found');
        }
      } else {
        console.log('ℹ️ No outlines found - consistency check skipped');
      }
      
      console.log('✅ Outline-chapter consistency check completed');
    } catch (error) {
      console.warn('❌ Failed to ensure outline-chapter consistency:', error);
    }
  };

  const fetchNovel = async () => {
    try {
      const response = await axios.get(`/api/novels/${id}`);
      setNovel(response.data);
    } catch (error) {
      console.error('Error fetching novel:', error);
      if (error.response?.status === 404) {
        showToast('Novel not found', 'error');
        navigate('/');
      } else {
        throw error;
      }
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await axios.get(`/api/novels/${id}/chapters`);
      setChapters(response.data);
      if (response.data.length > 0 && !selectedChapter) {
        setSelectedChapter(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  };

  const fetchStoryElements = async () => {
    try {
      const [characters, places, events, lore, items] = await Promise.all([
        axios.get(`/api/novels/${id}/characters`),
        axios.get(`/api/novels/${id}/places`),
        axios.get(`/api/novels/${id}/events`),
        axios.get(`/api/novels/${id}/lore`),
        axios.get(`/api/novels/${id}/items`)
      ]);

      // Fetch notes separately to prevent it from breaking other elements
      let notesData = [];
      try {
        const notes = await axios.get(`/api/novels/${id}/notes`);
        notesData = notes.data;
      } catch (noteError) {
        console.error('Error fetching notes:', noteError);
        // Continue without notes
      }

      setStoryElements({
        characters: characters.data,
        places: places.data,
        events: events.data,
        lore: lore.data,
        items: items.data,
        notes: notesData
      });
    } catch (error) {
      console.error('Error fetching story elements:', error);
      // Don't throw here - story elements are not critical for basic functionality
    }
  };

  const fetchActs = async () => {
    try {
      // Get the first outline for this novel
      const outlineResponse = await axios.get(`/api/novels/${id}/outlines`);
      if (outlineResponse.data.length > 0) {
        const outline = outlineResponse.data[0];
        
        // Get all sections for this outline
        const sectionsResponse = await axios.get(`/api/outlines/${outline.id}/sections`);
        const sections = sectionsResponse.data;
        
        // Filter and sort acts (level 0) with their chapters (level 1)
        const actSections = sections
          .filter(s => s.level === 0)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        const actsWithChapters = actSections.map(act => {
          const actChapters = sections
            .filter(s => s.level === 1 && s.parent_id === act.id)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          
          return {
            ...act,
            chapters: actChapters
          };
        });
        
        console.log(`🎭 Loaded ${actsWithChapters.length} acts with chapters`);
        setActs(actsWithChapters);
      } else {
        setActs([]);
      }
    } catch (error) {
      console.error('Error fetching acts:', error);
      setActs([]);
    }
  };

  // Synchronization functions for outline and sidebar
  const syncChapterToOutline = async (chapter, action) => {
    try {
      // Get the main outline for this novel
      const outlinesResponse = await axios.get(`/api/novels/${id}/outlines`);
      const outlines = outlinesResponse.data;
      
      if (outlines.length === 0) return; // No outline to sync with
      
      const mainOutline = outlines[0]; // Use the first outline
      const sectionsResponse = await axios.get(`/api/outlines/${mainOutline.id}/sections`);
      const sections = sectionsResponse.data;
      
      // Find chapter-level sections (level 1) and acts (level 0)
      const chapterSections = sections.filter(s => s.level === 1);
      const acts = sections.filter(s => s.level === 0).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      if (action === 'create') {
        // Determine which Act this chapter should belong to
        let parentActId = null;
        
        if (acts.length > 0) {
          // Find the appropriate Act based on chapter order or use the last Act
          const existingChaptersInActs = chapterSections.filter(s => s.parent_id);
          if (existingChaptersInActs.length > 0) {
            // Find the Act with the most chapters or the last Act
            const actChapterCounts = acts.map(act => ({
              act,
              count: chapterSections.filter(s => s.parent_id === act.id).length
            }));
            parentActId = actChapterCounts[actChapterCounts.length - 1].act.id; // Use last Act
          } else {
            // No chapters in any Act yet, use the first Act
            parentActId = acts[0].id;
          }
        }
        
        // Create a corresponding chapter section in the outline
        await axios.post(`/api/outlines/${mainOutline.id}/sections`, {
          title: chapter.title,
          description: `Chapter ${chapter.order_index + 1}`,
          content: '',
          level: 1, // Chapter level
          parent_id: parentActId, // Place under Act if exists
          order_index: chapter.order_index,
          chapter_id: chapter.id // Link to actual chapter
        });
      } else if (action === 'update') {
        // Find and update the corresponding section
        const correspondingSection = chapterSections.find(s => s.chapter_id === chapter.id);
        if (correspondingSection) {
          await axios.put(`/api/sections/${correspondingSection.id}`, {
            title: chapter.title,
            description: `Chapter ${chapter.order_index + 1}`,
            order_index: chapter.order_index
          });
        }
      } else if (action === 'delete') {
        // Find and delete the corresponding section
        const correspondingSection = chapterSections.find(s => s.chapter_id === chapter.id);
        if (correspondingSection) {
          await axios.delete(`/api/sections/${correspondingSection.id}`);
        }
      }
    } catch (error) {
      console.warn('Failed to sync chapter with outline:', error);
      // Don't throw - this should not break the main chapter operation
    }
  };

  const syncOutlineToChapter = async (section, action) => {
    try {
      // Only sync chapter-level sections (level 1)
      if (section.level !== 1) return;
      
      if (action === 'create') {
        // Create a corresponding chapter in the main novel
        const response = await axios.post(`/api/novels/${id}/chapters`, {
          title: section.title,
          content: '',
          order_index: section.order_index || chapters.length
        });
        
        const newChapter = response.data;
        
        // Update the section to link to the new chapter (prevent sync loop)
        await axios.put(`/api/sections/${section.id}`, {
          ...section,
          chapter_id: newChapter.id
        });
        
        // Immediate refresh to ensure sidebar shows updated data
        await fetchChapters();
        await fetchActs();
        
        showToast(`Chapter "${newChapter.title}" created from outline`, 'success');
        return newChapter;
      } else if (action === 'update' && section.chapter_id) {
        // Get current chapter content to preserve it
        const currentChapter = chapters.find(ch => ch.id === section.chapter_id);
        
        // Update the corresponding chapter with new title but preserve content
        await axios.put(`/api/chapters/${section.chapter_id}`, {
          title: section.title,
          content: currentChapter?.content || '',
          order_index: section.order_index
        });
        
        // Immediate refresh to ensure consistency
        await fetchChapters();
        await fetchActs();
        
        showToast(`Chapter "${section.title}" updated from outline`, 'success');
      } else if (action === 'delete' && section.chapter_id) {
        const chapterTitle = chapters.find(ch => ch.id === section.chapter_id)?.title || 'Chapter';
        
        console.log(`🗑️ Deleting chapter ${section.chapter_id} ("${chapterTitle}") from outline deletion`);
        
        // Delete the corresponding chapter
        await axios.delete(`/api/chapters/${section.chapter_id}`);
        
        // Clear selected chapter if it was deleted BEFORE refresh
        if (selectedChapter?.id === section.chapter_id) {
          setSelectedChapter(null);
        }
        
        // Immediate refresh - don't use setTimeout
        await fetchChapters();
        await fetchActs();
        
        console.log(`✅ Chapter "${chapterTitle}" deleted and data refreshed`);
        showToast(`Chapter "${chapterTitle}" deleted from outline`, 'success');
      }
    } catch (error) {
      console.error('Failed to sync outline section with chapter:', error);
      showToast('Failed to sync outline changes with chapters', 'error');
      // Always refresh to ensure consistency
      await fetchChapters();
      await fetchActs();
    }
  };

  // Refresh function to ensure consistency
  const refreshAfterSync = async () => {
    try {
      console.log('🔄 Refreshing after sync...');
      await fetchChapters();
      await fetchActs();
      // Force a refresh of the outline if it's open
      // The outline will refresh its sections when it detects chapter changes
    } catch (error) {
      console.error('Error refreshing after sync:', error);
    }
  };


  const handleChapterCreate = async (title) => {
    try {
      const order_index = chapters.length;
      const response = await axios.post(`/api/novels/${id}/chapters`, {
        title,
        content: '',
        order_index
      });
      
      const newChapter = response.data;
      setChapters([...chapters, newChapter]);
      setSelectedChapter(newChapter);
      showToast('Chapter created successfully', 'success');
      
      // Inform user about outline management
      setTimeout(() => {
        showToast('💡 Tip: Create chapters in the Outline for better organization!', 'info');
      }, 2000);
    } catch (error) {
      console.error('Error creating chapter:', error);
      showToast('Failed to create chapter', 'error');
    }
  };

  const handleChapterUpdate = async (chapterId, title, content) => {
    try {
      await axios.put(`/api/chapters/${chapterId}`, { title, content });
      
      const originalChapter = chapters.find(ch => ch.id === chapterId);
      const updatedChapter = { ...originalChapter, title, content };
      
      setChapters(chapters.map(ch => 
        ch.id === chapterId ? updatedChapter : ch
      ));
      
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter({ ...selectedChapter, title, content });
      }
      
      // Sync chapter title changes to outline sections
      await syncChapterToOutline(updatedChapter, 'update');
    } catch (error) {
      console.error('Error updating chapter:', error);
      showToast('Failed to save chapter', 'error');
      throw error; // Re-throw to handle in Editor
    }
  };

  const handleChapterEdit = async (chapterId, title, content) => {
    try {
      await handleChapterUpdate(chapterId, title, content);
      showToast('Chapter updated successfully', 'success');
    } catch (error) {
      // Error already handled in handleChapterUpdate
    }
  };

  const handleChapterDelete = async (chapterId) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      const chapterToDelete = chapters.find(ch => ch.id === chapterId);
      await axios.delete(`/api/chapters/${chapterId}`);
      
      const updatedChapters = chapters.filter(ch => ch.id !== chapterId);
      setChapters(updatedChapters);
      
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(updatedChapters[0] || null);
      }
      
      // Sync with outline if there's an active outline
      await syncChapterToOutline(chapterToDelete, 'delete');
      
      showToast('Chapter deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      showToast('Failed to delete chapter', 'error');
    }
  };

  const handleChapterReorder = async (newOrder) => {
    try {
      await axios.put(`/api/novels/${id}/chapters/reorder`, { chapters: newOrder });
      
      // Update local state with new order
      const reorderedChapters = newOrder.map(orderItem => 
        chapters.find(ch => ch.id === orderItem.id)
      ).filter(Boolean);
      
      setChapters(reorderedChapters);
      
      // Sync chapter order to outline
      for (const orderItem of newOrder) {
        const chapter = chapters.find(ch => ch.id === orderItem.id);
        if (chapter) {
          await syncChapterToOutline({ ...chapter, order_index: orderItem.order_index }, 'update');
        }
      }
      
      showToast('Chapters reordered successfully', 'success');
    } catch (error) {
      console.error('Error reordering chapters:', error);
      showToast('Failed to reorder chapters', 'error');
      // Refresh chapters to get back to original order
      fetchChapters();
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    // Navigate to chapter view by closing outline and notes views
    setShowOutline(false);
    setShowNotes(false);
  };

  const handleElementAdd = async (type, data) => {
    try {
      const response = await axios.post(`/api/novels/${id}/${type}`, data);
      
      setStoryElements(prev => ({
        ...prev,
        [type]: [...prev[type], response.data]
      }));
      
      showToast(`${getSingularType(type)} added successfully`, 'success');
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      showToast(`Failed to add ${getSingularType(type)}`, 'error');
    }
  };

  const handleElementEdit = async (type, elementId, data) => {
    try {
      // The API expects the plural form for the URL path
      const response = await axios.put(`/api/${type}/${elementId}`, data);
      
      // Update local state
      setStoryElements(prev => ({
        ...prev,
        [type]: prev[type].map(el => el.id === elementId ? { ...el, ...data } : el)
      }));
      
      // Also refresh the data from server to ensure consistency
      await fetchStoryElements();
      
      showToast(`${getSingularType(type)} updated successfully`, 'success');
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      showToast(`Failed to update ${getSingularType(type)}`, 'error');
    }
  };

  const handleElementDelete = async (type, elementId) => {
    try {
      await axios.delete(`/api/${type}/${elementId}`);
      
      setStoryElements(prev => ({
        ...prev,
        [type]: prev[type].filter(el => el.id !== elementId)
      }));
      
      showToast(`${getSingularType(type)} deleted successfully`, 'success');
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showToast(`Failed to delete ${getSingularType(type)}`, 'error');
    }
  };


  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleHighlightText = (searchTerm) => {
    if (editorRef && searchTerm) {
      // Scroll editor into view first
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        // Use browser's find functionality
        if (window.find) {
          // Clear any previous search
          if (window.getSelection) {
            window.getSelection().removeAllRanges();
          }
          // Find and highlight the text
          const found = window.find(searchTerm, false, false, true, false, true, false);
          if (found) {
            // Scroll the found text into view
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              if (rect.top < 0 || rect.bottom > window.innerHeight) {
                range.startContainer.parentElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }
          }
        }
      }
    }
  };

  const handleNavigateToElement = (elementType, elementId) => {
    // Switch to the appropriate sidebar tab
    setSidebarTab(elementType);
    
    // Expand the element in the sidebar if we have a ref
    if (sidebarRef.current && sidebarRef.current.expandElement) {
      setTimeout(() => {
        sidebarRef.current.expandElement(elementId);
      }, 100); // Small delay to let tab switch
    }
  };

  const tabConfig = [
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'places', label: 'Places', icon: MapPin },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'notes', label: 'AI', icon: StickyNote }
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Novel not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Return to novels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-writer-bg dark:bg-dark-bg">
      {/* Resizable Sidebar - Hidden in Focus Mode */}
      {!focusMode && (
        <ResizableSidebar initialWidth={280} minWidth={240} maxWidth={600}>
        <div className="h-full flex flex-col bg-writer-muted dark:bg-dark-sidebar">
          {/* Header */}
          <div className="px-4 py-4 border-b border-writer-border dark:border-dark-border bg-writer-muted dark:bg-dark-sidebar">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="p-1 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-border dark:hover:bg-dark-border rounded mr-2"
                  title="Back to novels"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h1 className="text-lg font-semibold text-writer-heading dark:text-dark-heading truncate">{novel.title}</h1>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={openSearch}
                  className="p-2 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-border dark:hover:bg-dark-border rounded"
                  title="Search (Ctrl+K)"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-border dark:hover:bg-dark-border rounded"
                  title="Export novel"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  setShowOutline(true);
                  setShowNotes(false);
                }}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  showOutline
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                    : 'bg-writer-surface dark:bg-dark-surface text-writer-heading dark:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted border border-writer-border dark:border-dark-border'
                }`}
              >
                <FileSignature className="w-4 h-4 mr-1" />
                Outline
              </button>
              <button
                onClick={() => {
                  setShowNotes(true);
                  setShowOutline(false);
                }}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showNotes
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                    : 'bg-writer-surface dark:bg-dark-surface text-writer-heading dark:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted border border-writer-border dark:border-dark-border'
                }`}
              >
                <StickyNote className="w-4 h-4 mr-1" />
                Notes
              </button>
            </div>

            {/* Main View Selection Buttons */}
            <div className="grid grid-cols-1 gap-3 mt-4">
              <button
                onClick={() => setSidebarView('chapters')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sidebarView === 'chapters'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                    : 'bg-writer-surface dark:bg-dark-surface text-writer-heading dark:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted border border-writer-border dark:border-dark-border'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Chapters
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">{chapters.length}</span>
              </button>
              
              <button
                onClick={() => setSidebarView('elements')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sidebarView === 'elements'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                    : 'bg-writer-surface dark:bg-dark-surface text-writer-heading dark:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted border border-writer-border dark:border-dark-border'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Story Elements
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                  {Object.values(storyElements).reduce((total, items) => total + (items?.length || 0), 0)}
                </span>
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sidebarView === 'chapters' ? (
              <div className="flex-1 overflow-y-auto">
                {chapters.length === 0 ? (
                  <div className="p-4 text-center text-writer-subtle dark:text-dark-subtle text-sm border-b border-writer-border dark:border-dark-border">
                    <p className="mb-2">No chapters yet.</p>
                    <p className="text-xs">Create chapters in the <strong>Outline</strong> for better organization!</p>
                  </div>
                ) : (
                  <Sidebar
                    type="chapters"
                    items={chapters}
                    acts={acts}
                    selectedItem={selectedChapter}
                    onSelectItem={handleChapterSelect}
                    onCreateItem={handleChapterCreate}
                    onEditChapter={handleChapterEdit}
                    onDeleteItem={handleChapterDelete}
                    onReorderChapters={handleChapterReorder}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Story Elements Tabs */}
                <div className="p-3 border-b border-writer-border dark:border-dark-border bg-writer-muted/50 dark:bg-dark-muted/50">
                  <div className="grid grid-cols-3 gap-2">
                    {tabConfig.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSidebarTab(tab.id)}
                        className={`flex items-center justify-center px-2 py-2 text-xs rounded-md transition-all duration-200 font-medium border ${
                          sidebarTab === tab.id
                            ? 'bg-writer-accent dark:bg-dark-accent text-black border-writer-accent dark:border-dark-accent shadow-sm'
                            : 'text-writer-heading dark:text-dark-heading hover:text-writer-heading dark:hover:text-dark-heading hover:bg-writer-surface dark:hover:bg-dark-muted border-writer-border dark:border-dark-border hover:border-writer-accent/50 dark:hover:border-dark-accent/50'
                        }`}
                      >
                        <tab.icon className="w-3 h-3 mr-1" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Story Elements Content */}
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    ref={sidebarRef}
                    type={sidebarTab}
                    items={storyElements[sidebarTab] || []}
                    selectedItem={null}
                    onSelectItem={null}
                    onCreateItem={(data) => handleElementAdd(sidebarTab, data)}
                    onEditItem={(id, data) => handleElementEdit(sidebarTab, id, data)}
                    onDeleteItem={(id) => handleElementDelete(sidebarTab, id)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </ResizableSidebar>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden bg-writer-bg dark:bg-dark-bg">
        {showOutline ? (
          <OutlineView
            novelId={id}
            chapters={chapters}
            onClose={async () => {
              setShowOutline(false);
              // Refresh chapters and acts to show any changes made in the outline
              await fetchChapters();
              await fetchActs();
            }}
            onSyncToChapter={syncOutlineToChapter}
            onRefreshChapters={async () => {
              await fetchChapters();
              await fetchActs();
            }}
          />
        ) : showNotes ? (
          <NotesView
            novelId={id}
            onClose={() => setShowNotes(false)}
          />
        ) : selectedChapter ? (
          <div className="h-full bg-writer-surface dark:bg-dark-surface flex">
            <div className="flex-1">
              <Editor
                key={selectedChapter.id}
                novelId={id}
                novel={novel}
                chapters={chapters}
                chapter={selectedChapter}
                onSave={handleChapterUpdate}
                onDeleteChapter={handleChapterDelete}
                onEditorReady={setEditorRef}
                focusMode={focusMode}
                onFocusModeChange={setFocusMode}
                showGuide={showGuide}
                onToggleGuide={setShowGuide}
                storyContext={{
                  characters: storyElements.characters,
                  places: storyElements.places,
                  events: storyElements.events.filter(e => e.chapter_id === selectedChapter.id)
                }}
              />
            </div>
            {showGuide && (
              <ChapterGuidePanel
                novelId={id}
                chapter={selectedChapter}
                onClose={() => setShowGuide(false)}
                onEditSection={(section) => {
                  // Open outline view and edit the section
                  setShowOutline(true);
                  // Note: We'll need to pass the section to edit to OutlineView
                }}
                onCreateSection={(parent, level) => {
                  // Open outline view and create a new section
                  setShowOutline(true);
                  // Note: We'll need to pass creation data to OutlineView
                }}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-writer-surface dark:bg-dark-surface">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-writer-muted dark:bg-dark-muted rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-writer-subtle dark:text-dark-subtle" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-writer-heading dark:text-dark-heading mb-2">
                  {chapters.length === 0 ? "Ready to start writing?" : "Select a chapter"}
                </h3>
                <p className="text-writer-text dark:text-dark-text text-sm max-w-sm">
                  {chapters.length === 0 
                    ? "Create your first chapter to begin your writing journey" 
                    : "Choose a chapter from the sidebar to start editing"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        storyElements={storyElements}
        chapters={chapters}
        onSelectChapter={setSelectedChapter}
        onHighlightText={handleHighlightText}
        onNavigateToElement={handleNavigateToElement}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        novel={novel}
      />

      <ToastContainer />
    </div>
  );
}

export default WritingInterface;