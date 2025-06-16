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
  MoreVertical,
  Grid3x3,
  List,
  Clock,
  Eye
} from 'lucide-react';
import { Modal, InputModal, ConfirmModal } from './Modal';
import axios from 'axios';

const STORY_LEVELS = {
  ACT: 0,
  CHAPTER: 1, 
  SCENE: 2,
  BEAT: 3
};

const LEVEL_NAMES = {
  0: 'act',
  1: 'chapter',
  2: 'scene', 
  3: 'beat'
};

const LEVEL_CONFIG = {
  [STORY_LEVELS.ACT]: {
    label: 'Act',
    plural: 'Acts',
    icon: 'BookOpen',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    fields: [
      { name: 'title', label: 'Act Title', required: true, placeholder: 'e.g., "Act I: Setup", "Act II: Confrontation"' },
      { name: 'description', label: 'Summary', type: 'textarea', rows: 2, placeholder: 'What happens in this act?' },
      { name: 'order_index', label: 'Act Number', type: 'number', placeholder: '1' }
    ]
  },
  [STORY_LEVELS.CHAPTER]: {
    label: 'Chapter',
    plural: 'Chapters', 
    icon: 'FileText',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    fields: [
      { name: 'title', label: 'Chapter Title', required: true, placeholder: 'e.g., "Chapter 1: The Beginning"' },
      { name: 'description', label: 'Summary', type: 'textarea', rows: 2, placeholder: 'Chapter summary' },
      { name: 'order_index', label: 'Chapter Number', type: 'number', placeholder: '1' }
    ]
  },
  [STORY_LEVELS.SCENE]: {
    label: 'Scene',
    plural: 'Scenes',
    icon: 'Camera', 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    fields: [
      { name: 'title', label: 'Scene Title', required: true, placeholder: 'e.g., "Opening scene", "The confrontation"' },
      { name: 'description', label: 'Summary', type: 'textarea', rows: 2, placeholder: 'What happens in this scene?' },
      { name: 'content', label: 'Notes', type: 'textarea', rows: 4, placeholder: 'Character goals, conflicts, key events...' },
      { name: 'order_index', label: 'Scene Number', type: 'number', placeholder: '1' }
    ]
  },
  [STORY_LEVELS.BEAT]: {
    label: 'Beat',
    plural: 'Beats',
    icon: 'Zap',
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50',
    fields: [
      { name: 'title', label: 'Beat Title', required: true, placeholder: 'e.g., "Character enters", "Plot twist revealed"' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 2, placeholder: 'What specific thing happens?' },
      { name: 'order_index', label: 'Beat Number', type: 'number', placeholder: '1' }
    ]
  }
};

const STORY_TEMPLATES = {
  three_act: {
    name: 'Three-Act Structure',
    description: 'Classic story structure with setup, confrontation, and resolution',
    structure: [
      {
        level: 0,
        title: 'Act I: Setup',
        description: 'Introduce characters, world, and initial conflict',
        percentage: 25,
        children: [
          { level: 2, title: 'Opening Image', description: 'Sets tone and theme', percentage: 1 },
          { level: 2, title: 'Inciting Incident', description: 'The event that starts everything', percentage: 10 },
          { level: 2, title: 'Plot Point 1', description: 'Point of no return', percentage: 25 }
        ]
      },
      {
        level: 0, 
        title: 'Act II: Confrontation',
        description: 'Rising action, obstacles, and character development',
        percentage: 50,
        children: [
          { level: 2, title: 'First Obstacle', description: 'Initial challenges', percentage: 30 },
          { level: 2, title: 'Midpoint', description: 'Major revelation or twist', percentage: 50 },
          { level: 2, title: 'Crisis', description: 'Things get worse', percentage: 65 },
          { level: 2, title: 'Plot Point 2', description: 'Enter Act 3', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Act III: Resolution', 
        description: 'Climax and resolution of conflicts',
        percentage: 25,
        children: [
          { level: 2, title: 'Climax', description: 'Final confrontation', percentage: 90 },
          { level: 2, title: 'Resolution', description: 'Wrap up loose ends', percentage: 95 }
        ]
      }
    ]
  },
  
  save_cat: {
    name: 'Save the Cat Beat Sheet',
    description: 'Blake Snyder\'s 15-beat screenplay structure',
    structure: [
      {
        level: 0,
        title: 'Act I: Setup',
        description: 'Setup world and characters',
        percentage: 25,
        children: [
          { level: 2, title: 'Opening Image', description: 'Visual that captures essence', percentage: 1 },
          { level: 2, title: 'Theme Stated', description: 'Theme mentioned early', percentage: 5 },
          { level: 2, title: 'Catalyst', description: 'Life-changing event', percentage: 10 },
          { level: 2, title: 'Debate', description: 'Should I go?', percentage: 12 },
          { level: 2, title: 'Break Into Two', description: 'Commit to journey', percentage: 20 }
        ]
      },
      {
        level: 0,
        title: 'Act II: Confrontation', 
        description: 'Journey and obstacles',
        percentage: 50,
        children: [
          { level: 2, title: 'B Story', description: 'Secondary character/love interest', percentage: 22 },
          { level: 2, title: 'Fun and Games', description: 'Promise of the premise', percentage: 30 },
          { level: 2, title: 'Midpoint', description: 'False victory or defeat', percentage: 50 },
          { level: 2, title: 'Bad Guys Close In', description: 'Things get worse', percentage: 55 },
          { level: 2, title: 'All Is Lost', description: 'Lowest point', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Act III: Resolution',
        description: 'Final push and resolution', 
        percentage: 25,
        children: [
          { level: 2, title: 'Dark Night of Soul', description: 'Moment of despair', percentage: 80 },
          { level: 2, title: 'Break Into Three', description: 'Final lesson learned', percentage: 85 },
          { level: 2, title: 'Finale', description: 'Climax and resolution', percentage: 90 },
          { level: 2, title: 'Final Image', description: 'Opposite of opening', percentage: 99 }
        ]
      }
    ]
  },

  heros_journey: {
    name: 'Hero\'s Journey',
    description: 'Joseph Campbell\'s monomyth structure',
    structure: [
      {
        level: 0,
        title: 'Act I: Departure',
        description: 'Hero leaves ordinary world',
        percentage: 25,
        children: [
          { level: 2, title: 'Ordinary World', description: 'Hero\'s normal life', percentage: 5 },
          { level: 2, title: 'Call to Adventure', description: 'Presented with problem/challenge', percentage: 10 },
          { level: 2, title: 'Refusal of Call', description: 'Hero hesitates or refuses', percentage: 15 },
          { level: 2, title: 'Meeting Mentor', description: 'Wise figure gives advice/magical object', percentage: 20 },
          { level: 2, title: 'Crossing Threshold', description: 'Hero commits to adventure', percentage: 25 }
        ]
      },
      {
        level: 0,
        title: 'Act II: Initiation',
        description: 'Hero faces challenges and transforms',
        percentage: 50, 
        children: [
          { level: 2, title: 'Tests & Allies', description: 'Hero faces challenges, makes allies', percentage: 30 },
          { level: 2, title: 'Approach to Inmost Cave', description: 'Hero prepares for major challenge', percentage: 40 },
          { level: 2, title: 'Ordeal', description: 'Hero confronts greatest fear', percentage: 50 },
          { level: 2, title: 'Reward', description: 'Hero survives and gains something', percentage: 60 },
          { level: 2, title: 'Road Back', description: 'Hero begins journey back', percentage: 70 }
        ]
      },
      {
        level: 0, 
        title: 'Act III: Return',
        description: 'Hero returns transformed',
        percentage: 25,
        children: [
          { level: 2, title: 'Resurrection', description: 'Final test, hero is reborn', percentage: 85 },
          { level: 2, title: 'Return with Elixir', description: 'Hero returns home transformed', percentage: 95 }
        ]
      }
    ]
  },

  freytags_pyramid: {
    name: 'Freytag\'s Pyramid',
    description: 'Classical dramatic structure with rising/falling action',
    structure: [
      {
        level: 0,
        title: 'Exposition',
        description: 'Introduction and background',
        percentage: 15,
        children: [
          { level: 2, title: 'Introduction', description: 'Characters and setting established', percentage: 10 }
        ]
      },
      {
        level: 0,
        title: 'Rising Action', 
        description: 'Building tension and complications',
        percentage: 35,
        children: [
          { level: 2, title: 'Inciting Incident', description: 'Conflict begins', percentage: 15 },
          { level: 2, title: 'Complication 1', description: 'First major obstacle', percentage: 25 },
          { level: 2, title: 'Complication 2', description: 'Stakes get higher', percentage: 35 },
          { level: 2, title: 'Crisis', description: 'Point of highest tension', percentage: 45 }
        ]
      },
      {
        level: 0,
        title: 'Climax',
        description: 'Turning point of the story',
        percentage: 10,
        children: [
          { level: 2, title: 'Climax', description: 'Peak of conflict', percentage: 50 }
        ]
      },
      {
        level: 0,
        title: 'Falling Action',
        description: 'Consequences of climax',
        percentage: 25,
        children: [
          { level: 2, title: 'Aftermath', description: 'Immediate consequences', percentage: 60 },
          { level: 2, title: 'Loose Ends', description: 'Tying up subplots', percentage: 70 }
        ]
      },
      {
        level: 0,
        title: 'Resolution',
        description: 'Conclusion and new normal',
        percentage: 15,
        children: [
          { level: 2, title: 'Denouement', description: 'Final outcome', percentage: 90 }
        ]
      }
    ]
  },

  fichtean_curve: {
    name: 'Fichtean Curve',
    description: 'Rising action with multiple crises',
    structure: [
      {
        level: 0,
        title: 'Rising Action',
        description: 'Series of escalating crises',
        percentage: 80,
        children: [
          { level: 2, title: 'Inciting Incident', description: 'Story begins with conflict', percentage: 5 },
          { level: 2, title: 'Crisis 1', description: 'First major crisis', percentage: 20 },
          { level: 2, title: 'Crisis 2', description: 'Second crisis, higher stakes', percentage: 35 },
          { level: 2, title: 'Crisis 3', description: 'Third crisis, even higher stakes', percentage: 50 },
          { level: 2, title: 'Crisis 4', description: 'Major crisis', percentage: 65 },
          { level: 2, title: 'Final Crisis', description: 'Highest stakes', percentage: 80 }
        ]
      },
      {
        level: 0,
        title: 'Climax & Resolution',
        description: 'Peak and falling action',
        percentage: 20,
        children: [
          { level: 2, title: 'Climax', description: 'Peak of the story', percentage: 85 },
          { level: 2, title: 'Resolution', description: 'Brief conclusion', percentage: 95 }
        ]
      }
    ]
  },

  kishōtenketsu: {
    name: 'Kishōtenketsu',
    description: 'Four-act Japanese structure without central conflict',
    structure: [
      {
        level: 0,
        title: 'Ki (Introduction)',
        description: 'Introduces characters and setting',
        percentage: 25,
        children: [
          { level: 2, title: 'Setup', description: 'Establish the world and characters', percentage: 15 }
        ]
      },
      {
        level: 0, 
        title: 'Shō (Development)',
        description: 'Develops the situation',
        percentage: 25,
        children: [
          { level: 2, title: 'Development', description: 'Expand on the setup', percentage: 35 }
        ]
      },
      {
        level: 0,
        title: 'Ten (Twist)',
        description: 'Unexpected development',
        percentage: 25,
        children: [
          { level: 2, title: 'Twist', description: 'Sudden change or revelation', percentage: 60 }
        ]
      },
      {
        level: 0,
        title: 'Ketsu (Conclusion)',
        description: 'Resolution incorporating the twist',
        percentage: 25,
        children: [
          { level: 2, title: 'Resolution', description: 'New understanding or situation', percentage: 85 }
        ]
      }
    ]
  }
};

function StoryNode({ 
  node, 
  level = 0, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onLinkChapter, 
  chapters = [], 
  expandedNodes, 
  onToggleExpanded,
  children = []
}) {
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const indent = level * 24;
  const config = LEVEL_CONFIG[node.level] || LEVEL_CONFIG[STORY_LEVELS.SCENE];
  
  const IconComponent = getIconComponent(config.icon);

  return (
    <div className="story-node">
      <div 
        className="flex items-center p-3 hover:bg-writer-muted/30 border-b border-writer-border/30 transition-all duration-200 group"
        style={{ paddingLeft: `${16 + indent}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggleExpanded(node.id)}
          className="btn-icon p-1 mr-3"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Level Icon */}
        <div className={`w-6 h-6 rounded-full ${config.bgColor} flex items-center justify-center mr-3`}>
          <IconComponent className={`w-3 h-3 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-writer-heading truncate">{node.title}</h4>
                <span className="text-xs px-2 py-1 bg-writer-muted rounded-full text-writer-subtle">
                  {config.label} {node.order_index || 1}
                </span>
              </div>
              {node.description && (
                <p className="text-sm text-writer-subtle mt-1 line-clamp-2">{node.description}</p>
              )}
              {node.chapter_id && (
                <div className="flex items-center mt-2">
                  <Link className="w-3 h-3 text-writer-accent mr-1" />
                  <span className="text-xs text-writer-accent bg-writer-accent/10 px-2 py-1 rounded-full">
                    {chapters.find(ch => ch.id === node.chapter_id)?.title || 'Chapter'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onAddChild(node)}
                className="btn-icon text-writer-subtle hover:text-writer-accent p-1"
                title={`Add ${getChildLevel(node.level)}`}
              >
                <Plus className="w-3 h-3" />
              </button>
              {node.level === STORY_LEVELS.SCENE && (
                <button
                  onClick={() => onLinkChapter(node)}
                  className="btn-icon text-writer-subtle hover:text-writer-info p-1"
                  title="Link to chapter"
                >
                  <Link className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => onEdit(node)}
                className="btn-icon text-writer-subtle hover:text-writer-warning p-1"
                title={`Edit ${config.label.toLowerCase()}`}
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(node)}
                className="btn-icon text-writer-subtle hover:text-writer-error p-1"
                title={`Delete ${config.label.toLowerCase()}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <StoryNode
              key={child.node.id}
              node={child.node}
              level={level + 1}
              children={child.children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onLinkChapter={onLinkChapter}
              chapters={chapters}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getIconComponent(iconName) {
  const icons = {
    BookOpen,
    FileText,
    Camera: Eye, // Using Eye instead of Camera
    Zap: Clock // Using Clock instead of Zap
  };
  return icons[iconName] || FileText;
}

function getChildLevel(currentLevel) {
  const hierarchy = [STORY_LEVELS.ACT, STORY_LEVELS.CHAPTER, STORY_LEVELS.SCENE, STORY_LEVELS.BEAT];
  const currentIndex = hierarchy.indexOf(currentLevel);
  const nextLevel = hierarchy[currentIndex + 1];
  return nextLevel !== undefined ? nextLevel : null;
}

function SceneCard({ scene, onEdit, onDelete, onLinkChapter, chapters = [] }) {
  return (
    <div className="bg-writer-surface border border-writer-border rounded-lg p-4 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-writer-heading truncate pr-2">{scene.title}</h4>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(scene)}
            className="btn-icon text-writer-subtle hover:text-writer-warning p-1"
            title="Edit scene"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(scene)}
            className="btn-icon text-writer-subtle hover:text-writer-error p-1"
            title="Delete scene"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {scene.description && (
        <p className="text-sm text-writer-subtle mb-3 line-clamp-2">{scene.description}</p>
      )}
      
      {scene.chapter_id && (
        <div className="flex items-center mb-2">
          <Link className="w-3 h-3 text-writer-accent mr-1" />
          <span className="text-xs text-writer-accent bg-writer-accent/10 px-2 py-1 rounded-full">
            {chapters.find(ch => ch.id === scene.chapter_id)?.title || 'Chapter'}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-writer-subtle">
        <span>Scene {scene.order_index || 1}</span>
        <button
          onClick={() => onLinkChapter(scene)}
          className="text-writer-subtle hover:text-writer-info"
          title="Link to chapter"
        >
          <Link className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function TemplateItem({ template, onApply }) {
  return (
    <div className="border border-writer-border rounded-lg p-4 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-writer-heading">{template.name}</h4>
          <p className="text-sm text-writer-subtle mt-1">{template.description}</p>
        </div>
        <button
          onClick={() => onApply(template)}
          className="btn-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Use Template
        </button>
      </div>
      
      <div className="text-xs text-writer-subtle">
        {template.structure.length} {template.structure[0]?.level === 'act' ? 'Acts' : 'Scenes'}
      </div>
    </div>
  );
}

function OutlineView({ novelId, chapters = [], onClose }) {
  const [outlines, setOutlines] = useState([]);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('hierarchy'); // hierarchy, cards, templates
  const [selectedLevel, setSelectedLevel] = useState(STORY_LEVELS.ACT);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Modal states
  const [createSectionModal, setCreateSectionModal] = useState({ isOpen: false, parent: null, beatTemplate: null });
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
    } else {
      // Auto-create outline if none exists
      autoCreateOutline();
    }
  }, [selectedOutline]);
  
  const autoCreateOutline = async () => {
    if (novelId && outlines.length === 0) {
      try {
        const response = await axios.post(`/api/novels/${novelId}/outlines`, {
          title: 'Story Outline',
          description: 'Main story outline'
        });
        const newOutline = response.data;
        setOutlines([newOutline]);
        setSelectedOutline(newOutline);
      } catch (error) {
        console.error('Error auto-creating outline:', error);
      }
    }
  };

  const fetchOutlines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/novels/${novelId}/outlines`);
      setOutlines(response.data);
      
      // Auto-select first outline
      if (response.data.length > 0 && !selectedOutline) {
        setSelectedOutline(response.data[0]);
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

  const buildStoryTree = (nodes) => {
    const nodeMap = new Map();
    const roots = [];

    // Create map of all nodes
    nodes.forEach(node => {
      nodeMap.set(node.id, { node, children: [] });
    });

    // Build tree structure
    nodes.forEach(node => {
      const nodeRef = nodeMap.get(node.id);
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(nodeRef);
      } else {
        roots.push(nodeRef);
      }
    });

    // Sort by order_index and level
    const sortByOrder = (a, b) => {
      const levelDiff = (a.node.level || 0) - (b.node.level || 0);
      if (levelDiff !== 0) return levelDiff;
      return (a.node.order_index || 0) - (b.node.order_index || 0);
    };
    
    roots.sort(sortByOrder);
    nodeMap.forEach(node => node.children.sort(sortByOrder));

    return roots;
  };


  const handleCreateSection = async (formData) => {
    setIsSaving(true);
    try {
      const sectionData = {
        ...formData,
        parent_id: formData.parent_id || null,
        level: formData.level || selectedLevel,
        order_index: parseInt(formData.order_index) || getNextOrderIndex(formData.parent_id, formData.level)
      };
      
      if (!selectedOutline) {
        // Auto-create outline if none exists
        const outlineResponse = await axios.post(`/api/novels/${novelId}/outlines`, {
          title: 'Story Outline',
          description: 'Main story outline'
        });
        const newOutline = outlineResponse.data;
        setOutlines([newOutline]);
        setSelectedOutline(newOutline);
        
        const response = await axios.post(`/api/outlines/${newOutline.id}/sections`, sectionData);
        await fetchSections(newOutline.id);
      } else {
        const response = await axios.post(`/api/outlines/${selectedOutline.id}/sections`, sectionData);
        await fetchSections(selectedOutline.id);
      }
      
      setCreateSectionModal({ isOpen: false, parent: null, level: selectedLevel });
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const getNextOrderIndex = (parentId, level) => {
    const siblings = sections.filter(s => s.parent_id === parentId && s.level === level);
    return siblings.length + 1;
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

  const storyTree = buildStoryTree(sections);

  const renderOutlineContent = () => {
    if (sections.length === 0) {
      return (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-writer-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-writer-subtle" />
          </div>
          <h4 className="font-medium text-writer-heading mb-2">No story structure yet</h4>
          <p className="text-writer-subtle mb-6 max-w-sm mx-auto">
            Start building your story by adding acts, chapters, scenes, or using a story structure template.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: STORY_LEVELS.ACT })}
              className="btn-primary"
            >
              Add First Act
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className="btn-secondary"
            >
              Use Template
            </button>
          </div>
        </div>
      );
    }
    
    switch (viewMode) {
      case 'cards':
        const scenes = sections.filter(s => s.level === STORY_LEVELS.SCENE);
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onEdit={(scene) => setEditSectionModal({ isOpen: true, section: scene })}
                  onDelete={(scene) => setDeleteSectionModal({ isOpen: true, section: scene })}
                  onLinkChapter={(scene) => setLinkChapterModal({ isOpen: true, section: scene })}
                  chapters={chapters}
                />
              ))}
            </div>
          </div>
        );
        
      case 'templates':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold text-writer-heading mb-2">
                Story Structure Templates
              </h3>
              <p className="text-writer-subtle">
                Choose a proven story structure to guide your outline
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(STORY_TEMPLATES).map((template, index) => (
                <TemplateItem
                  key={index}
                  template={template}
                  onApply={() => applyTemplate(template)}
                />
              ))}
            </div>
          </div>
        );
        
      default: // hierarchy
        return (
          <div>
            {storyTree.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-writer-subtle">No story elements yet</p>
              </div>
            ) : (
              <div className="story-tree">
                {storyTree.map(node => (
                  <StoryNode
                    key={node.node.id}
                    node={node.node}
                    children={node.children}
                    onEdit={(node) => setEditSectionModal({ isOpen: true, section: node })}
                    onDelete={(node) => setDeleteSectionModal({ isOpen: true, section: node })}
                    onAddChild={(node) => {
          const childLevel = getChildLevel(node.level);
          if (childLevel !== null) {
            setCreateSectionModal({ isOpen: true, parent: node, level: childLevel });
          }
        }}
                    onLinkChapter={(node) => setLinkChapterModal({ isOpen: true, section: node })}
                    chapters={chapters}
                    expandedNodes={expandedNodes}
                    onToggleExpanded={toggleNodeExpanded}
                  />
                ))}
              </div>
            )}
          </div>
        );
    }
  };
  
  const applyTemplate = async (template) => {
    setIsSaving(true);
    try {
      const createNode = async (item, parentId = null, orderIndex = 1) => {
        const nodeData = {
          title: item.title,
          description: item.description,
          content: '',
          level: item.level,
          parent_id: parentId,
          order_index: orderIndex,
          template_percentage: item.percentage
        };
        
        const response = await axios.post(`/api/outlines/${selectedOutline.id}/sections`, nodeData);
        const newNode = response.data;
        
        if (item.children) {
          for (let i = 0; i < item.children.length; i++) {
            await createNode(item.children[i], newNode.id, i + 1);
          }
        }
        
        return newNode;
      };
      
      for (let i = 0; i < template.structure.length; i++) {
        await createNode(template.structure[i], null, i + 1);
      }
      
      await fetchSections(selectedOutline.id);
      setViewMode('hierarchy'); // Switch to hierarchy view to see the structure
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleNodeExpanded = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };


  const getSectionFields = (section = null, parent = null, level = STORY_LEVELS.SCENE) => {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[STORY_LEVELS.SCENE];
    const fields = [...config.fields.map(field => ({
      ...field,
      defaultValue: section ? section[field.name] || '' : ''
    }))];
    
    // Add hidden fields for level and parent
    fields.push({
      name: 'level',
      type: 'hidden',
      defaultValue: level
    });
    
    if (parent) {
      fields.push({
        name: 'parent_id',
        type: 'hidden',
        defaultValue: parent.id
      });
    }
    
    return fields;
  };

  return (
    <div className="h-full flex flex-col bg-writer-bg">
      {/* Header */}
      <div className="card-header border-0 border-b border-writer-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-writer-heading flex items-center">
              <BookOpen className="w-5 h-5 mr-3 text-writer-accent" />
              Story Outline
            </h2>
            
            {/* View Mode Selector */}
            <div className="flex items-center space-x-1 bg-writer-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'hierarchy' ? 'bg-writer-bg text-writer-heading shadow-sm' : 'text-writer-subtle hover:text-writer-heading'
                }`}
                title="Hierarchical structure view"
              >
                <List className="w-4 h-4 mr-1" />
                Structure
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'cards' ? 'bg-writer-bg text-writer-heading shadow-sm' : 'text-writer-subtle hover:text-writer-heading'
                }`}
                title="Scene cards view"
              >
                <Grid3x3 className="w-4 h-4 mr-1" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('templates')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'templates' ? 'bg-writer-bg text-writer-heading shadow-sm' : 'text-writer-subtle hover:text-writer-heading'
                }`}
                title="Story structure templates"
              >
                <Clock className="w-4 h-4 mr-1" />
                Templates
              </button>
            </div>
            
            {/* Level Selector for Hierarchy View */}
            {viewMode === 'hierarchy' && (
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-primary text-sm"
              >
                <option value={STORY_LEVELS.ACT}>Add Acts</option>
                <option value={STORY_LEVELS.CHAPTER}>Add Chapters</option>
                <option value={STORY_LEVELS.SCENE}>Add Scenes</option>
                <option value={STORY_LEVELS.BEAT}>Add Beats</option>
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: selectedLevel })}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {LEVEL_CONFIG[selectedLevel]?.label || 'Item'}
            </button>
            
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
            <div className="w-8 h-8 border-2 border-writer-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-writer-subtle">Setting up your outline...</p>
          </div>
        ) : (
          <div>
            {/* Content based on view mode */}
            {renderOutlineContent()}
          </div>
        )}
      </div>

      {/* Modals */}

      <InputModal
        isOpen={createSectionModal.isOpen}
        onClose={() => setCreateSectionModal({ isOpen: false, parent: null, level: selectedLevel })}
        onSubmit={handleCreateSection}
        title={`Add ${LEVEL_CONFIG[createSectionModal.level || selectedLevel]?.label || 'Item'}${createSectionModal.parent ? ` to "${createSectionModal.parent.title}"` : ''}`}
        fields={getSectionFields(null, createSectionModal.parent, createSectionModal.level || selectedLevel)}
        submitText={isSaving ? "Creating..." : `Create ${LEVEL_CONFIG[createSectionModal.level || selectedLevel]?.label || 'Item'}`}
        isSubmitting={isSaving}
      />

      <InputModal
        isOpen={editSectionModal.isOpen}
        onClose={() => setEditSectionModal({ isOpen: false, section: null })}
        onSubmit={handleEditSection}
        title={`Edit ${LEVEL_CONFIG[editSectionModal.section?.level]?.label || 'Item'}`}
        fields={getSectionFields(editSectionModal.section, null, editSectionModal.section?.level)}
        submitText={isSaving ? "Updating..." : `Update ${LEVEL_CONFIG[editSectionModal.section?.level]?.label || 'Item'}`}
        isSubmitting={isSaving}
      />

      <ConfirmModal
        isOpen={deleteSectionModal.isOpen}
        onClose={() => setDeleteSectionModal({ isOpen: false, section: null })}
        onConfirm={handleDeleteSection}
        title={`Delete ${LEVEL_CONFIG[deleteSectionModal.section?.level]?.label || 'Item'}`}
        message={`Are you sure you want to delete "${deleteSectionModal.section?.title}"? This will also delete all child elements.`}
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
          <p className="text-writer-subtle">
            Link "{linkChapterModal.section?.title}" to a chapter:
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