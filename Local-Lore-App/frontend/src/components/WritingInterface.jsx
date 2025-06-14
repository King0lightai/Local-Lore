import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Users, MapPin, Calendar, BookOpen, Package, Download, Search, ChevronDown, ChevronRight, FileSignature, StickyNote } from 'lucide-react';
import Editor from './Editor';
import Sidebar from './Sidebar';
import ResizableSidebar from './ResizableSidebar';
import SearchModal, { useSearch } from './Search';
import ExportModal from './ExportModal';
import OutlineView from './OutlineView';
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
  const [chaptersExpanded, setChaptersExpanded] = useState(true);
  const [elementsExpanded, setElementsExpanded] = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [storyElements, setStoryElements] = useState({
    characters: [],
    places: [],
    events: [],
    lore: [],
    items: [],
    notes: []
  });
  const [editorRef, setEditorRef] = useState(null);
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
        fetchStoryElements()
      ]);
    } catch (error) {
      showToast('Failed to load novel data', 'error');
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error creating chapter:', error);
      showToast('Failed to create chapter', 'error');
    }
  };

  const handleChapterUpdate = async (chapterId, title, content) => {
    try {
      await axios.put(`/api/chapters/${chapterId}`, { title, content });
      
      setChapters(chapters.map(ch => 
        ch.id === chapterId ? { ...ch, title, content } : ch
      ));
      
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter({ ...selectedChapter, title, content });
      }
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
      await axios.delete(`/api/chapters/${chapterId}`);
      
      const updatedChapters = chapters.filter(ch => ch.id !== chapterId);
      setChapters(updatedChapters);
      
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(updatedChapters[0] || null);
      }
      
      showToast('Chapter deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      showToast('Failed to delete chapter', 'error');
    }
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
    { id: 'notes', label: 'Notes', icon: StickyNote }
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
    <div className="h-screen flex bg-gray-50">
      {/* Resizable Sidebar - Hidden in Focus Mode */}
      {!focusMode && (
        <ResizableSidebar initialWidth={280} minWidth={240} maxWidth={600}>
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 px-2 py-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to novels
            </button>
            
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{novel.title}</h1>
              <div className="flex items-center space-x-1">
                <button
                  onClick={openSearch}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Search (Ctrl+K)"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Export novel"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowOutline(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              Story Outline
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chapters Section */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => setChaptersExpanded(!chaptersExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <span className="flex items-center">
                  {chaptersExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                  CHAPTERS
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{chapters.length}</span>
              </button>
              {chaptersExpanded && (
                <div className="max-h-80 overflow-y-auto pb-2">
                  <Sidebar
                    type="chapters"
                    items={chapters}
                    selectedItem={selectedChapter}
                    onSelectItem={setSelectedChapter}
                    onCreateItem={handleChapterCreate}
                    onEditChapter={handleChapterEdit}
                    onDeleteItem={handleChapterDelete}
                  />
                </div>
              )}
            </div>

            {/* Story Elements Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setElementsExpanded(!elementsExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <span className="flex items-center">
                    {elementsExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    STORY ELEMENTS
                  </span>
                </button>
              </div>

              {elementsExpanded && (
                <>
                  {/* Story Elements Tabs */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="grid grid-cols-3 gap-1">
                      {tabConfig.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setSidebarTab(tab.id)}
                          className={`flex items-center justify-center px-2 py-2 text-xs rounded-md transition-all duration-200 ${
                            sidebarTab === tab.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                </>
              )}
            </div>
          </div>
        </div>
        </ResizableSidebar>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {showOutline ? (
          <OutlineView
            novelId={id}
            chapters={chapters}
            onClose={() => setShowOutline(false)}
          />
        ) : selectedChapter ? (
          <div className="h-full bg-white">
            <Editor
              key={selectedChapter.id}
              novelId={id}
              novel={novel}
              chapters={chapters}
              chapter={selectedChapter}
              onSave={handleChapterUpdate}
              onEditorReady={setEditorRef}
              focusMode={focusMode}
              onFocusModeChange={setFocusMode}
              storyContext={{
                characters: storyElements.characters,
                places: storyElements.places,
                events: storyElements.events.filter(e => e.chapter_id === selectedChapter.id)
              }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {chapters.length === 0 ? "Ready to start writing?" : "Select a chapter"}
                </h3>
                <p className="text-gray-600 text-sm max-w-sm">
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