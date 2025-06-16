import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Move,
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
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
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
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
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
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
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
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
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
          { level: 1, title: 'Chapter 1: Opening', description: 'Introduce protagonist and world', percentage: 5 },
          { level: 1, title: 'Chapter 2: Call to Adventure', description: 'Inciting incident occurs', percentage: 10 },
          { level: 1, title: 'Chapter 3: Point of No Return', description: 'Protagonist commits to journey', percentage: 25 }
        ]
      },
      {
        level: 0, 
        title: 'Act II: Confrontation',
        description: 'Rising action, obstacles, and character development',
        percentage: 50,
        children: [
          { level: 1, title: 'Chapter 4: New World', description: 'First challenges and allies', percentage: 30 },
          { level: 1, title: 'Chapter 5: Rising Action', description: 'Obstacles increase in difficulty', percentage: 40 },
          { level: 1, title: 'Chapter 6: Midpoint', description: 'Major revelation or false victory', percentage: 50 },
          { level: 1, title: 'Chapter 7: Complications', description: 'Things get worse, stakes rise', percentage: 60 },
          { level: 1, title: 'Chapter 8: Crisis', description: 'Lowest point, all seems lost', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Act III: Resolution', 
        description: 'Climax and resolution of conflicts',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 9: Final Push', description: 'Protagonist prepares for climax', percentage: 80 },
          { level: 1, title: 'Chapter 10: Climax', description: 'Final confrontation and resolution', percentage: 90 },
          { level: 1, title: 'Chapter 11: Denouement', description: 'New normal, loose ends tied up', percentage: 95 }
        ]
      }
    ]
  },
  
  save_cat: {
    name: 'Save the Cat Beat Sheet',
    description: 'Blake Snyder\'s 15-beat structure adapted for chapters',
    structure: [
      {
        level: 0,
        title: 'Act I: Setup',
        description: 'Setup world and characters',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 1: Opening Image & Theme', description: 'Visual opening and theme establishment', percentage: 5 },
          { level: 1, title: 'Chapter 2: Catalyst', description: 'Life-changing event occurs', percentage: 10 },
          { level: 1, title: 'Chapter 3: Debate & Decision', description: 'Internal conflict and commitment', percentage: 20 }
        ]
      },
      {
        level: 0,
        title: 'Act II-A: Fun and Games', 
        description: 'Promise of the premise',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 4: New World', description: 'B Story introduction, new environment', percentage: 25 },
          { level: 1, title: 'Chapter 5: Fun and Games', description: 'Exploring the premise', percentage: 35 },
          { level: 1, title: 'Chapter 6: Midpoint', description: 'False victory or major revelation', percentage: 50 }
        ]
      },
      {
        level: 0,
        title: 'Act II-B: Bad Guys Close In',
        description: 'Things get worse', 
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 7: Pressure Builds', description: 'Opposition strengthens', percentage: 60 },
          { level: 1, title: 'Chapter 8: All Is Lost', description: 'Lowest point reached', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Act III: Resolution',
        description: 'Final push and resolution', 
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 9: Dark Night & Epiphany', description: 'Despair and breakthrough', percentage: 80 },
          { level: 1, title: 'Chapter 10: Finale', description: 'Climax and resolution', percentage: 90 },
          { level: 1, title: 'Chapter 11: Final Image', description: 'New world established', percentage: 99 }
        ]
      }
    ]
  },

  heros_journey: {
    name: 'Hero\'s Journey',
    description: 'Joseph Campbell\'s monomyth structure organized by chapters',
    structure: [
      {
        level: 0,
        title: 'Act I: Departure',
        description: 'Hero leaves ordinary world',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 1: Ordinary World', description: 'Hero\'s normal life and world', percentage: 5 },
          { level: 1, title: 'Chapter 2: Call to Adventure', description: 'Challenge presented, refusal considered', percentage: 15 },
          { level: 1, title: 'Chapter 3: Meeting the Mentor', description: 'Guidance received, threshold crossed', percentage: 25 }
        ]
      },
      {
        level: 0,
        title: 'Act II: Initiation',
        description: 'Hero faces challenges and transforms',
        percentage: 50, 
        children: [
          { level: 1, title: 'Chapter 4: Tests and Allies', description: 'New world rules, allies and enemies', percentage: 35 },
          { level: 1, title: 'Chapter 5: Approach to Ordeal', description: 'Preparation for the major challenge', percentage: 45 },
          { level: 1, title: 'Chapter 6: The Ordeal', description: 'Confrontation with greatest fear', percentage: 50 },
          { level: 1, title: 'Chapter 7: Reward and Consequences', description: 'Gains reward but faces consequences', percentage: 60 },
          { level: 1, title: 'Chapter 8: The Road Back', description: 'Return journey begins with complications', percentage: 75 }
        ]
      },
      {
        level: 0, 
        title: 'Act III: Return',
        description: 'Hero returns transformed',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 9: Resurrection', description: 'Final test and transformation', percentage: 85 },
          { level: 1, title: 'Chapter 10: Return with Elixir', description: 'Home with wisdom to share', percentage: 95 }
        ]
      }
    ]
  },

  freytags_pyramid: {
    name: 'Freytag\'s Pyramid',
    description: 'Classical dramatic structure organized by chapters',
    structure: [
      {
        level: 0,
        title: 'Act I: Exposition',
        description: 'Introduction and background',
        percentage: 20,
        children: [
          { level: 1, title: 'Chapter 1: Introduction', description: 'Characters, setting, and normal world', percentage: 10 },
          { level: 1, title: 'Chapter 2: Inciting Incident', description: 'Conflict begins, stakes established', percentage: 20 }
        ]
      },
      {
        level: 0,
        title: 'Act II: Rising Action', 
        description: 'Building tension and complications',
        percentage: 40,
        children: [
          { level: 1, title: 'Chapter 3: First Complication', description: 'Initial obstacles and challenges', percentage: 30 },
          { level: 1, title: 'Chapter 4: Escalation', description: 'Stakes rise, complications multiply', percentage: 40 },
          { level: 1, title: 'Chapter 5: Crisis Point', description: 'Highest tension before climax', percentage: 50 }
        ]
      },
      {
        level: 0,
        title: 'Act III: Climax',
        description: 'Turning point of the story',
        percentage: 10,
        children: [
          { level: 1, title: 'Chapter 6: Climax', description: 'Peak conflict and turning point', percentage: 55 }
        ]
      },
      {
        level: 0,
        title: 'Act IV: Falling Action',
        description: 'Consequences of climax',
        percentage: 20,
        children: [
          { level: 1, title: 'Chapter 7: Aftermath', description: 'Immediate consequences unfold', percentage: 70 },
          { level: 1, title: 'Chapter 8: Resolution Setup', description: 'Tying up subplots and threads', percentage: 80 }
        ]
      },
      {
        level: 0,
        title: 'Act V: Denouement',
        description: 'Conclusion and new normal',
        percentage: 10,
        children: [
          { level: 1, title: 'Chapter 9: Final Resolution', description: 'New equilibrium established', percentage: 95 }
        ]
      }
    ]
  },

  fichtean_curve: {
    name: 'Fichtean Curve',
    description: 'Rising action with multiple crisis chapters',
    structure: [
      {
        level: 0,
        title: 'Act I: Rising Action',
        description: 'Series of escalating crisis chapters',
        percentage: 80,
        children: [
          { level: 1, title: 'Chapter 1: Inciting Crisis', description: 'Story begins with immediate conflict', percentage: 10 },
          { level: 1, title: 'Chapter 2: First Major Crisis', description: 'Stakes established, tension builds', percentage: 25 },
          { level: 1, title: 'Chapter 3: Second Crisis', description: 'Complications multiply, stakes rise', percentage: 40 },
          { level: 1, title: 'Chapter 4: Third Crisis', description: 'Major setback, higher stakes', percentage: 55 },
          { level: 1, title: 'Chapter 5: Fourth Crisis', description: 'Near-breaking point reached', percentage: 70 },
          { level: 1, title: 'Chapter 6: Final Crisis', description: 'Highest stakes before climax', percentage: 80 }
        ]
      },
      {
        level: 0,
        title: 'Act II: Climax & Resolution',
        description: 'Peak and brief falling action',
        percentage: 20,
        children: [
          { level: 1, title: 'Chapter 7: Climax', description: 'Peak conflict and resolution', percentage: 90 },
          { level: 1, title: 'Chapter 8: Denouement', description: 'Brief aftermath and new normal', percentage: 95 }
        ]
      }
    ]
  },

  kishōtenketsu: {
    name: 'Kishōtenketsu',
    description: 'Four-act Japanese structure organized by chapters',
    structure: [
      {
        level: 0,
        title: 'Ki (Introduction)',
        description: 'Introduces characters and setting',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 1: World Building', description: 'Establish characters and world', percentage: 12 },
          { level: 1, title: 'Chapter 2: Character Development', description: 'Deepen character understanding', percentage: 25 }
        ]
      },
      {
        level: 0, 
        title: 'Shō (Development)',
        description: 'Develops the situation and relationships',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 3: Expansion', description: 'Develop situation and relationships', percentage: 37 },
          { level: 1, title: 'Chapter 4: Deepening', description: 'Explore themes and connections', percentage: 50 }
        ]
      },
      {
        level: 0,
        title: 'Ten (Twist)',
        description: 'Unexpected development changes everything',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 5: The Twist', description: 'Sudden change or revelation', percentage: 62 },
          { level: 1, title: 'Chapter 6: Recontextualization', description: 'Understanding new reality', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Ketsu (Conclusion)',
        description: 'Resolution incorporating the twist',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 7: Integration', description: 'Incorporating new understanding', percentage: 87 },
          { level: 1, title: 'Chapter 8: New Harmony', description: 'Peaceful resolution and closure', percentage: 95 }
        ]
      }
    ]
  },

  novel_structure: {
    name: 'Classic Novel Structure',
    description: 'Traditional novel organization focused on chapters',
    structure: [
      {
        level: 0,
        title: 'Part I: Beginning',
        description: 'Setup and initial conflict',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 1: Hook', description: 'Compelling opening to grab readers', percentage: 5 },
          { level: 1, title: 'Chapter 2: World & Character', description: 'Establish setting and protagonist', percentage: 10 },
          { level: 1, title: 'Chapter 3: Conflict Emerges', description: 'Main conflict begins to surface', percentage: 15 },
          { level: 1, title: 'Chapter 4: Stakes Established', description: 'What\'s at risk becomes clear', percentage: 25 }
        ]
      },
      {
        level: 0,
        title: 'Part II: Middle',
        description: 'Development and complications',
        percentage: 50,
        children: [
          { level: 1, title: 'Chapter 5: First Challenge', description: 'Initial obstacles faced', percentage: 30 },
          { level: 1, title: 'Chapter 6: Character Growth', description: 'Protagonist develops and learns', percentage: 35 },
          { level: 1, title: 'Chapter 7: Midpoint Revelation', description: 'Major discovery or setback', percentage: 45 },
          { level: 1, title: 'Chapter 8: Raising Stakes', description: 'Complications intensify', percentage: 55 },
          { level: 1, title: 'Chapter 9: Major Setback', description: 'Significant obstacle or failure', percentage: 65 },
          { level: 1, title: 'Chapter 10: Preparation', description: 'Gearing up for final confrontation', percentage: 75 }
        ]
      },
      {
        level: 0,
        title: 'Part III: End',
        description: 'Climax and resolution',
        percentage: 25,
        children: [
          { level: 1, title: 'Chapter 11: Final Confrontation', description: 'Climactic battle or decision', percentage: 85 },
          { level: 1, title: 'Chapter 12: Resolution', description: 'Conflicts resolved, loose ends tied', percentage: 95 },
          { level: 1, title: 'Epilogue: New Beginning', description: 'Where characters end up', percentage: 100 }
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
        className="flex items-center p-3 hover:bg-writer-muted/30 dark:hover:bg-dark-muted/30 border-b border-writer-border/30 dark:border-dark-border/30 transition-all duration-200 group"
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
                <h4 className="font-medium text-writer-heading dark:text-dark-heading truncate">{node.title}</h4>
                <span className="text-xs px-2 py-1 bg-writer-muted dark:bg-dark-muted rounded-full text-writer-subtle dark:text-dark-subtle">
                  {config.label} {node.order_index || 1}
                </span>
              </div>
              {node.description && (
                <p className="text-sm text-writer-subtle dark:text-dark-subtle mt-1 line-clamp-2">{node.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {getChildLevel(node.level) !== null && (
                <button
                  onClick={() => onAddChild(node)}
                  className="p-2 text-writer-subtle hover:text-writer-accent hover:bg-writer-surface dark:hover:bg-dark-surface rounded-md transition-all duration-200"
                  title={`Add ${LEVEL_CONFIG[getChildLevel(node.level)].label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(node)}
                className="p-2 text-writer-subtle hover:text-writer-warning hover:bg-writer-surface dark:hover:bg-dark-surface rounded-md transition-all duration-200"
                title={`Edit ${config.label.toLowerCase()}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(node)}
                className="p-2 text-writer-subtle hover:text-writer-error hover:bg-writer-surface dark:hover:bg-dark-surface rounded-md transition-all duration-200"
                title={`Delete ${config.label.toLowerCase()}`}
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
            <StoryNode
              key={child.node.id}
              node={child.node}
              level={level + 1}
              children={child.children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
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
    Camera: Eye,
    Zap: Clock
  };
  return icons[iconName] || FileText;
}

function getChildLevel(currentLevel) {
  const hierarchy = [STORY_LEVELS.ACT, STORY_LEVELS.CHAPTER, STORY_LEVELS.SCENE, STORY_LEVELS.BEAT];
  const currentIndex = hierarchy.indexOf(currentLevel);
  const nextLevel = hierarchy[currentIndex + 1];
  return nextLevel !== undefined ? nextLevel : null;
}

function ChapterCard({ chapter, scenes, beats, onEdit, onDelete, onAddScene, onAddBeat }) {
  const [expandedScenes, setExpandedScenes] = useState(new Set());
  
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

  const sortedScenes = scenes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="bg-writer-surface dark:bg-dark-surface border border-writer-border dark:border-dark-border rounded-lg overflow-hidden hover:shadow-sm transition-all">
      {/* Chapter Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/30 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
              {chapter.order_index || 1}
            </div>
            <h3 className="font-semibold text-writer-heading dark:text-dark-heading">{chapter.title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onAddScene(chapter)}
              className="btn-icon text-writer-subtle hover:text-writer-accent p-1"
              title="Add scene"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onEdit(chapter)}
              className="btn-icon text-writer-subtle hover:text-writer-warning p-1"
              title="Edit chapter"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(chapter)}
              className="btn-icon text-writer-subtle hover:text-writer-error p-1"
              title="Delete chapter"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {chapter.description && (
          <p className="text-sm text-writer-subtle dark:text-dark-subtle">{chapter.description}</p>
        )}
      </div>

      {/* Scenes */}
      <div className="p-4 space-y-3">
        {sortedScenes.length > 0 ? (
          sortedScenes.map(scene => {
            const sceneBeats = beats.filter(b => b.parent_id === scene.id)
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            const isExpanded = expandedScenes.has(scene.id);
            
            return (
              <div key={scene.id} className="border border-writer-border/50 dark:border-dark-border/50 rounded">
                <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <button
                        onClick={() => toggleScene(scene.id)}
                        className="btn-icon p-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-semibold">
                        {scene.order_index || 1}
                      </div>
                      <h4 className="font-medium text-sm text-writer-heading dark:text-dark-heading truncate">{scene.title}</h4>
                      {sceneBeats.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                          {sceneBeats.length} beats
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onAddBeat(scene)}
                        className="btn-icon text-writer-subtle hover:text-writer-accent p-1"
                        title="Add beat"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
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
                    <p className="text-xs text-writer-subtle dark:text-dark-subtle mt-2 ml-6">{scene.description}</p>
                  )}
                </div>
                
                {/* Beats (expandable) */}
                {isExpanded && sceneBeats.length > 0 && (
                  <div className="p-3 bg-orange-50/30 dark:bg-orange-900/10 space-y-2">
                    {sceneBeats.map(beat => (
                      <div key={beat.id} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded p-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            {beat.order_index || 1}
                          </div>
                          <span className="text-sm text-writer-heading dark:text-dark-heading">{beat.title}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEdit(beat)}
                            className="btn-icon text-writer-subtle hover:text-writer-warning p-1"
                          >
                            <Edit3 className="w-2 h-2" />
                          </button>
                          <button
                            onClick={() => onDelete(beat)}
                            className="btn-icon text-writer-subtle hover:text-writer-error p-1"
                          >
                            <Trash2 className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-writer-subtle dark:text-dark-subtle">
            <p className="text-sm mb-2">No scenes yet</p>
            <button
              onClick={() => onAddScene(chapter)}
              className="text-xs text-writer-accent dark:text-dark-accent hover:text-writer-accent/80 dark:hover:text-dark-accent/80"
            >
              Add first scene
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateItem({ template, onApply }) {
  return (
    <div className="border border-writer-border dark:border-dark-border rounded-lg p-4 hover:shadow-sm transition-all group bg-writer-surface dark:bg-dark-surface">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-writer-heading dark:text-dark-heading">{template.name}</h4>
          <p className="text-sm text-writer-subtle dark:text-dark-subtle mt-1">{template.description}</p>
        </div>
        <button
          onClick={() => onApply(template)}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-md font-medium shadow-md transition-all duration-200 text-sm opacity-0 group-hover:opacity-100"
        >
          Use Template
        </button>
      </div>
      
      <div className="text-xs text-writer-subtle dark:text-dark-subtle">
        {template.structure.length} Acts • {template.structure.reduce((total, act) => total + (act.children?.length || 0), 0)} Chapters
      </div>
    </div>
  );
}

function OutlineView({ novelId, chapters = [], onClose, onSyncToChapter, onRefreshChapters }) {
  const [outlines, setOutlines] = useState([]);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('hierarchy');
  const [selectedLevel, setSelectedLevel] = useState(STORY_LEVELS.ACT);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Debug: Track component lifecycle
  useEffect(() => {
    console.log('🏗️ OutlineView component mounted for novelId:', novelId);
    return () => {
      console.log('🧹 OutlineView component unmounting');
    };
  }, []);

  // Modal states
  const [createSectionModal, setCreateSectionModal] = useState({ isOpen: false, parent: null, level: selectedLevel });
  const [editSectionModal, setEditSectionModal] = useState({ isOpen: false, section: null });
  const [deleteSectionModal, setDeleteSectionModal] = useState({ isOpen: false, section: null });

  useEffect(() => {
    if (novelId) {
      fetchOutlines();
    }
  }, [novelId]);

  // One-time cleanup of duplicate outlines
  useEffect(() => {
    const cleanupDuplicateOutlines = async () => {
      if (outlines.length > 1) {
        console.log('🧹 Multiple outlines detected, keeping only the most recent one with sections');
        
        // Find the outline with the most sections
        const outlineWithSections = [];
        for (const outline of outlines) {
          try {
            const sectionsResponse = await axios.get(`/api/outlines/${outline.id}/sections`);
            outlineWithSections.push({
              outline,
              sectionCount: sectionsResponse.data.length
            });
          } catch (error) {
            console.error('Error checking sections for outline:', outline.id);
          }
        }
        
        // Sort by section count (descending) then by created date
        outlineWithSections.sort((a, b) => {
          if (b.sectionCount !== a.sectionCount) {
            return b.sectionCount - a.sectionCount;
          }
          return new Date(b.outline.created_at) - new Date(a.outline.created_at);
        });
        
        if (outlineWithSections.length > 0) {
          const keepOutline = outlineWithSections[0].outline;
          console.log('🎯 Keeping outline:', keepOutline.id, 'with', outlineWithSections[0].sectionCount, 'sections');
          setOutlines([keepOutline]);
          setSelectedOutline(keepOutline);
        }
      }
    };
    
    if (outlines.length > 1) {
      cleanupDuplicateOutlines();
    }
  }, [outlines.length]);

  useEffect(() => {
    console.log('🔄 OutlineView effect - selectedOutline changed:', selectedOutline?.id, 'outlines.length:', outlines.length);
    console.log('🔄 Current state - selectedOutline:', selectedOutline, 'outlines:', outlines);
    if (selectedOutline && selectedOutline.id) {
      console.log('✅ Found selectedOutline with ID, fetching sections...');
      fetchSections(selectedOutline.id);
    } else if (outlines.length > 0 && !selectedOutline) {
      console.log('🔄 No selectedOutline but outlines exist, selecting first one...');
      const firstOutline = outlines[0];
      console.log('🔄 Setting selectedOutline to:', firstOutline);
      setSelectedOutline(firstOutline);
    } else if (outlines.length === 0 && novelId) {
      console.log('🏗️ No outlines found, auto-creating...');
      autoCreateOutline();
    } else {
      console.log('⚠️ Unexpected state - selectedOutline:', selectedOutline, 'outlines.length:', outlines.length);
    }
  }, [selectedOutline, outlines, novelId]);
  
  // Debug effect to track sections changes
  useEffect(() => {
    console.log('📊 Sections state changed - length:', sections.length);
    if (sections.length === 0) {
      console.log('⚠️ Sections is empty! This might be the issue.');
    } else {
      console.log('✅ Sections contains data:', sections.map(s => ({id: s.id, title: s.title, level: s.level})));
    }
  }, [sections]);
  
  const autoCreateOutline = async () => {
    if (novelId) {
      try {
        // First check if outlines already exist in the database
        console.log('🏗️ Checking for existing outlines before auto-creating...');
        const checkResponse = await axios.get(`/api/novels/${novelId}/outlines`);
        
        if (checkResponse.data.length === 0) {
          console.log('🏗️ No outlines exist, creating auto outline for novel:', novelId);
          const response = await axios.post(`/api/novels/${novelId}/outlines`, {
            title: 'Story Outline',
            description: 'Main story outline'
          });
          const newOutline = response.data;
          console.log('📝 Auto-created outline:', newOutline);
          setOutlines([newOutline]);
          setSelectedOutline(newOutline);
        } else {
          console.log('🚫 Auto-create skipped - found existing outlines:', checkResponse.data.length);
          setOutlines(checkResponse.data);
          setSelectedOutline(checkResponse.data[0]);
        }
      } catch (error) {
        console.error('❌ Error in autoCreateOutline:', error);
      }
    }
  };

  const fetchOutlines = async () => {
    console.log('📚 Starting fetchOutlines for novel:', novelId);
    setLoading(true);
    try {
      console.log('📚 API call: GET /api/novels/' + novelId + '/outlines');
      const response = await axios.get(`/api/novels/${novelId}/outlines`);
      console.log('📋 Raw outlines response:', response);
      console.log('📋 Found outlines:', response.data.length, response.data.map(o => ({id: o.id, title: o.title, created_at: o.created_at})));
      console.log('📋 Full outline data:', response.data);
      console.log('📋 Setting outlines state...');
      setOutlines(response.data);
      
      if (response.data.length > 0) {
        // Try to find an outline with sections, or use the most recent one
        const sortedOutlines = response.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        const outlineToSelect = sortedOutlines[0];
        
        console.log('🎯 Selecting most recent outline:', outlineToSelect);
        console.log('🎯 Setting selectedOutline state...');
        setSelectedOutline(outlineToSelect);
        
        // Clean up duplicate outlines if there are too many
        if (response.data.length > 5) {
          console.log('⚠️ Too many outlines detected:', response.data.length, '- consider cleanup');
        }
      } else {
        console.log('📋 No outlines found');
      }
    } catch (error) {
      console.error('❌ Error fetching outlines:', error);
      console.error('❌ Error details:', error.response?.data, error.response?.status);
    } finally {
      console.log('📚 fetchOutlines completed, setting loading to false');
      setLoading(false);
    }
  };

  const fetchSections = async (outlineId) => {
    try {
      console.log('🔍 Fetching sections for outline ID:', outlineId);
      console.log('🔍 API call: GET /api/outlines/' + outlineId + '/sections');
      const response = await axios.get(`/api/outlines/${outlineId}/sections`);
      console.log('📝 Raw API response:', response);
      console.log('📝 Sections fetched:', response.data.length, 'sections:', response.data);
      console.log('📝 Before setState - current sections length:', sections.length);
      setSections(response.data);
      console.log('✅ Sections state updated with', response.data.length, 'sections');
    } catch (error) {
      console.error('❌ Error fetching sections:', error);
      console.error('❌ Error details:', error.response?.data, error.response?.status);
      console.log('🚨 Setting sections to empty array due to error');
      setSections([]);
    }
  };

  const buildStoryTree = (nodes) => {
    const nodeMap = new Map();
    const roots = [];

    nodes.forEach(node => {
      nodeMap.set(node.id, { node, children: [] });
    });

    nodes.forEach(node => {
      const nodeRef = nodeMap.get(node.id);
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(nodeRef);
      } else {
        roots.push(nodeRef);
      }
    });

    const sortByOrder = (a, b) => {
      const levelDiff = (a.node.level || 0) - (b.node.level || 0);
      if (levelDiff !== 0) return levelDiff;
      return (a.node.order_index || 0) - (b.node.order_index || 0);
    };
    
    roots.sort(sortByOrder);
    nodeMap.forEach(node => node.children.sort(sortByOrder));

    return roots;
  };

  const storyTree = buildStoryTree(sections);

  const renderOutlineContent = () => {
    switch (viewMode) {
      case 'cards':
        return renderCardView();
        
      case 'templates':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold text-writer-heading dark:text-dark-heading mb-2">
                Story Structure Templates
              </h3>
              <p className="text-writer-subtle dark:text-dark-subtle">
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
        return renderHierarchyView();
    }
  };

  const renderHierarchyView = () => {
    if (sections.length === 0) {
      return (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-writer-muted dark:bg-dark-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-writer-subtle dark:text-dark-subtle" />
          </div>
          <h4 className="font-medium text-writer-heading dark:text-dark-heading mb-2">No story structure yet</h4>
          <p className="text-writer-subtle dark:text-dark-subtle mb-6 max-w-sm mx-auto">
            Start building your story by adding acts, chapters, scenes, or using a story structure template.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: STORY_LEVELS.ACT })}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
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
    
    return (
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
            chapters={chapters}
            expandedNodes={expandedNodes}
            onToggleExpanded={toggleNodeExpanded}
          />
        ))}
      </div>
    );
  };

  const renderCardView = () => {
    if (sections.length === 0) {
      return (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-writer-muted dark:bg-dark-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-writer-subtle dark:text-dark-subtle" />
          </div>
          <h4 className="font-medium text-writer-heading dark:text-dark-heading mb-2">No story structure yet</h4>
          <p className="text-writer-subtle dark:text-dark-subtle mb-6 max-w-sm mx-auto">
            Start building your story by adding acts, chapters, scenes, or using a story structure template.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: STORY_LEVELS.ACT })}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
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

    // Group sections by acts
    const acts = sections.filter(s => s.level === STORY_LEVELS.ACT).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    return (
      <div className="p-6 space-y-8">
        {acts.map(act => {
          const actChapters = sections.filter(s => s.level === STORY_LEVELS.CHAPTER && s.parent_id === act.id)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          
          return (
            <div key={act.id} className="act-section">
              {/* Act Header */}
              <div className="border-b-2 border-purple-200 dark:border-purple-800/50 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-semibold">
                      {act.order_index || 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-writer-heading dark:text-dark-heading">{act.title}</h2>
                      {act.description && (
                        <p className="text-writer-subtle dark:text-dark-subtle mt-1">{act.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCreateSectionModal({ isOpen: true, parent: act, level: STORY_LEVELS.CHAPTER })}
                      className="btn-secondary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Chapter
                    </button>
                    <button
                      onClick={() => setEditSectionModal({ isOpen: true, section: act })}
                      className="btn-icon text-writer-subtle hover:text-writer-warning"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteSectionModal({ isOpen: true, section: act })}
                      className="btn-icon text-writer-subtle hover:text-writer-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chapters Grid */}
              {actChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {actChapters.map(chapter => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      scenes={sections.filter(s => s.level === STORY_LEVELS.SCENE && s.parent_id === chapter.id)}
                      beats={sections.filter(s => s.level === STORY_LEVELS.BEAT)}
                      onEdit={(item) => setEditSectionModal({ isOpen: true, section: item })}
                      onDelete={(item) => setDeleteSectionModal({ isOpen: true, section: item })}
                      onAddScene={(chapter) => setCreateSectionModal({ isOpen: true, parent: chapter, level: STORY_LEVELS.SCENE })}
                      onAddBeat={(scene) => setCreateSectionModal({ isOpen: true, parent: scene, level: STORY_LEVELS.BEAT })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-writer-subtle dark:text-dark-subtle mb-4">No chapters in this act yet</p>
                  <button
                    onClick={() => setCreateSectionModal({ isOpen: true, parent: act, level: STORY_LEVELS.CHAPTER })}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
                  >
                    Add First Chapter
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {acts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-writer-subtle dark:text-dark-subtle mb-4">No acts created yet</p>
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: STORY_LEVELS.ACT })}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
            >
              Add First Act
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const applyTemplate = async (template) => {
    console.log('🎯 Applying template:', template.name, 'to outline:', selectedOutline?.id);
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
        
        console.log('📤 Creating section:', nodeData);
        const response = await axios.post(`/api/outlines/${selectedOutline.id}/sections`, nodeData);
        const newNode = response.data;
        console.log('✅ Section created:', newNode);
        
        // Sync chapter-level sections (level 1) to actual chapters
        if (onSyncToChapter && newNode.level === 1) {
          console.log('🔗 Syncing chapter:', newNode.title);
          await onSyncToChapter(newNode, 'create');
        }
        
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
      
      console.log('🔄 Refreshing sections for outline:', selectedOutline.id);
      await fetchSections(selectedOutline.id);
      
      // Refresh chapters to show new chapters created from template
      if (onRefreshChapters) {
        console.log('📚 Refreshing chapters list');
        await onRefreshChapters();
      }
      
      setViewMode('hierarchy');
      console.log('✨ Template application complete');
    } catch (error) {
      console.error('❌ Error applying template:', error);
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
        const outlineResponse = await axios.post(`/api/novels/${novelId}/outlines`, {
          title: 'Story Outline',
          description: 'Main story outline'
        });
        const newOutline = outlineResponse.data;
        setOutlines([newOutline]);
        setSelectedOutline(newOutline);
        
        const response = await axios.post(`/api/outlines/${newOutline.id}/sections`, sectionData);
        const newSection = response.data;
        
        // Sync with chapters if this is a chapter-level section
        if (onSyncToChapter && newSection.level === 1) {
          await onSyncToChapter(newSection, 'create');
        }
        
        await fetchSections(newOutline.id);
      } else {
        const response = await axios.post(`/api/outlines/${selectedOutline.id}/sections`, sectionData);
        const newSection = response.data;
        
        // Sync with chapters if this is a chapter-level section
        if (onSyncToChapter && newSection.level === 1) {
          await onSyncToChapter(newSection, 'create');
        }
        
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
      const originalSection = editSectionModal.section;
      
      const sectionData = {
        ...formData,
        // CRITICAL: Preserve original section structure to prevent orphaning
        parent_id: originalSection.parent_id,
        level: originalSection.level,
        chapter_id: originalSection.chapter_id,
        order_index: parseInt(formData.order_index) || originalSection.order_index || 0
      };
      
      console.log('🔧 Updating section with preserved structure:', {
        id: originalSection.id,
        title: sectionData.title,
        parent_id: sectionData.parent_id,
        level: sectionData.level,
        chapter_id: sectionData.chapter_id
      });
      
      await axios.put(`/api/sections/${originalSection.id}`, sectionData);
      
      // Sync with chapters if this is a chapter-level section
      if (onSyncToChapter && originalSection.level === 1) {
        const updatedSection = { ...originalSection, ...sectionData };
        await onSyncToChapter(updatedSection, 'update');
      }
      
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
      const sectionToDelete = deleteSectionModal.section;
      
      // If deleting an act (level 0), we need to sync deletion of all its chapter children
      if (sectionToDelete.level === 0) {
        console.log('🗑️ Deleting act and all its chapters:', sectionToDelete.title);
        
        // Find all chapter-level children of this act
        const childChapters = sections.filter(s => 
          s.level === 1 && s.parent_id === sectionToDelete.id
        );
        
        console.log('🗑️ Found', childChapters.length, 'chapters to delete');
        
        // Delete each chapter from the actual chapters list
        for (const chapter of childChapters) {
          if (onSyncToChapter && chapter.chapter_id) {
            console.log('🗑️ Syncing deletion of chapter:', chapter.title);
            await onSyncToChapter(chapter, 'delete');
          }
        }
      } else if (onSyncToChapter && sectionToDelete.level === 1) {
        // Sync with chapters if this is a chapter-level section
        await onSyncToChapter(sectionToDelete, 'delete');
      }
      
      // Delete the section and all its children (cascade delete)
      await axios.delete(`/api/sections/${sectionToDelete.id}`);
      await fetchSections(selectedOutline.id);
      
      // Refresh chapters to ensure sync
      if (onRefreshChapters) {
        await onRefreshChapters();
      }
      
      setDeleteSectionModal({ isOpen: false, section: null });
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-writer-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="card-header border-0 border-b border-writer-border dark:border-dark-border bg-writer-surface dark:bg-dark-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-writer-heading dark:text-dark-heading flex items-center">
              <BookOpen className="w-5 h-5 mr-3 text-writer-accent dark:text-dark-accent" />
              Outline
            </h2>
            
            {/* View Mode Selector */}
            <div className="flex items-center space-x-1 bg-writer-muted dark:bg-dark-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'hierarchy' ? 'bg-writer-bg dark:bg-dark-bg text-writer-heading dark:text-dark-heading shadow-sm' : 'text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading'
                }`}
                title="Hierarchical structure view"
              >
                <List className="w-4 h-4 mr-1" />
                Structure
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'cards' ? 'bg-writer-bg dark:bg-dark-bg text-writer-heading dark:text-dark-heading shadow-sm' : 'text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading'
                }`}
                title="Scene cards view"
              >
                <Grid3x3 className="w-4 h-4 mr-1" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('templates')}
                className={`px-3 py-1 rounded text-sm flex items-center ${
                  viewMode === 'templates' ? 'bg-writer-bg dark:bg-dark-bg text-writer-heading dark:text-dark-heading shadow-sm' : 'text-writer-subtle dark:text-dark-subtle hover:text-writer-heading dark:hover:text-dark-heading'
                }`}
                title="Story structure templates"
              >
                <Clock className="w-4 h-4 mr-1" />
                Templates
              </button>
            </div>
            
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreateSectionModal({ isOpen: true, parent: null, level: STORY_LEVELS.ACT })}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Act
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-writer-accent dark:border-dark-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-writer-subtle dark:text-dark-subtle">Loading outlines...</p>
          </div>
        ) : !selectedOutline ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-writer-accent dark:border-dark-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-writer-subtle dark:text-dark-subtle">Setting up your outline...</p>
          </div>
        ) : (
          <div>
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
    </div>
  );
}

export default OutlineView;