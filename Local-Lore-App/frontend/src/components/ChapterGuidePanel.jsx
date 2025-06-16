import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';

const STORY_LEVELS = {
  ACT: 0,
  CHAPTER: 1, 
  SCENE: 2,
  BEAT: 3
};

function ChapterGuidePanel({ novelId, chapter, onClose }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState(new Set());
  const [selectedOutline, setSelectedOutline] = useState(null);

  useEffect(() => {
    if (novelId && chapter) {
      fetchChapterStructure();
    }
  }, [novelId, chapter?.id]);

  const fetchChapterStructure = async () => {
    setLoading(true);
    try {
      // Get the main outline for this novel
      const outlinesResponse = await axios.get(`/api/novels/${novelId}/outlines`);
      if (outlinesResponse.data.length > 0) {
        const outline = outlinesResponse.data[0];
        setSelectedOutline(outline);
        
        // Get all sections for this outline
        const sectionsResponse = await axios.get(`/api/outlines/${outline.id}/sections`);
        const allSections = sectionsResponse.data;
        
        // Find the chapter section that corresponds to this chapter
        const chapterSection = allSections.find(s => 
          s.level === STORY_LEVELS.CHAPTER && s.chapter_id === chapter.id
        );
        
        if (chapterSection) {
          // Get scenes (level 2) and beats (level 3) for this chapter
          const chapterStructure = allSections.filter(s => 
            (s.level === STORY_LEVELS.SCENE && s.parent_id === chapterSection.id) ||
            (s.level === STORY_LEVELS.BEAT && allSections.some(scene => 
              scene.level === STORY_LEVELS.SCENE && 
              scene.parent_id === chapterSection.id && 
              s.parent_id === scene.id
            ))
          );
          
          setSections(chapterStructure);
        } else {
          setSections([]);
        }
      }
    } catch (error) {
      console.error('Error fetching chapter structure:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleScene = (sceneId) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };

  const getScenes = () => {
    return sections
      .filter(s => s.level === STORY_LEVELS.SCENE)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const getBeatsForScene = (sceneId) => {
    return sections
      .filter(s => s.level === STORY_LEVELS.BEAT && s.parent_id === sceneId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };


  const scenes = getScenes();

  return (
    <div className="w-80 bg-writer-surface dark:bg-dark-surface border-l border-writer-border dark:border-dark-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-writer-border dark:border-dark-border bg-writer-muted dark:bg-dark-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-writer-accent dark:text-dark-accent" />
            <h3 className="font-medium text-writer-heading dark:text-dark-heading">Chapter Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-writer-subtle dark:text-dark-subtle hover:text-writer-text dark:hover:text-dark-text hover:bg-writer-surface dark:hover:bg-dark-surface rounded transition-colors"
            title="Close guide"
          >
            ×
          </button>
        </div>
        {chapter && (
          <p className="text-sm text-writer-subtle dark:text-dark-subtle mt-1 truncate">
            {chapter.title}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="w-6 h-6 border-2 border-writer-accent dark:border-dark-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-writer-subtle dark:text-dark-subtle">Loading structure...</p>
          </div>
        ) : scenes.length === 0 ? (
          <div className="p-4 text-center">
            <Eye className="w-8 h-8 text-writer-subtle dark:text-dark-subtle mx-auto mb-3" />
            <h4 className="font-medium text-writer-heading dark:text-dark-heading mb-2">No scenes yet</h4>
            <p className="text-sm text-writer-subtle dark:text-dark-subtle mb-4">
              Structure your chapter by adding scenes and beats in the outline view.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {scenes.map(scene => {
              const beats = getBeatsForScene(scene.id);
              const isExpanded = expandedScenes.has(scene.id);
              
              return (
                <div key={scene.id} className="border border-writer-border/50 dark:border-dark-border/50 rounded-lg overflow-hidden">
                  {/* Scene Header */}
                  <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <button
                          onClick={() => toggleScene(scene.id)}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                          )}
                        </button>
                        <div className="w-4 h-4 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {scene.order_index || 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm text-green-800 dark:text-green-200 truncate">
                            {scene.title}
                          </h4>
                          {beats.length > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {beats.length} beat{beats.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {scene.description && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2 ml-6 truncate">
                        {scene.description}
                      </p>
                    )}
                  </div>

                  {/* Beats (expandable) */}
                  {isExpanded && beats.length > 0 && (
                    <div className="p-3 bg-orange-50/30 dark:bg-orange-900/10 space-y-2">
                      {beats.map(beat => (
                        <div key={beat.id} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded p-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="w-3 h-3 bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {beat.order_index || 1}
                            </div>
                            <span className="text-sm text-orange-800 dark:text-orange-200 truncate">
                              {beat.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterGuidePanel;