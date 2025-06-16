import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Save, Eye, MessageSquare } from 'lucide-react';
import { Modal, ConfirmModal, InputModal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import axios from 'axios';

function VersionHistory({ isOpen, onClose, chapter, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, version: null });
  const [restoreModal, setRestoreModal] = useState({ isOpen: false, version: null });
  const [saveVersionModal, setSaveVersionModal] = useState(false);

  useEffect(() => {
    if (isOpen && chapter) {
      loadVersions();
    }
  }, [isOpen, chapter]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/chapters/${chapter.id}/versions`);
      setVersions(response.data);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async (formData) => {
    try {
      await axios.post(`/api/chapters/${chapter.id}/versions`, {
        versionNote: formData.versionNote
      });
      loadVersions(); // Reload versions
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  const handleRestore = async (version) => {
    try {
      await axios.post(`/api/chapters/${chapter.id}/restore/${version.id}`);
      onRestore(); // Refresh the chapter content
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getWordCountDiff = (version) => {
    const currentWords = chapter.word_count || 0;
    const versionWords = version.word_count || 0;
    const diff = versionWords - currentWords;
    
    if (diff === 0) return null;
    
    return (
      <span className={`text-xs ${diff > 0 ? 'text-writer-success' : 'text-writer-error'}`}>
        {diff > 0 ? '+' : ''}{diff} words
      </span>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Version History" size="large">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-writer-text dark:text-dark-text">
              Version history for <strong>{chapter?.title}</strong>
            </p>
            <button
              onClick={() => setSaveVersionModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Current Version
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-writer-subtle dark:text-dark-subtle">
              <Clock className="w-12 h-12 mx-auto mb-3 text-writer-muted dark:text-dark-muted" />
              <p>No version history yet</p>
              <p className="text-sm">Versions are automatically saved when you make significant changes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-writer-border dark:border-dark-border rounded-lg p-4 hover:bg-writer-muted dark:hover:bg-dark-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-writer-muted dark:text-dark-muted" />
                        <span className="text-sm font-medium text-writer-heading dark:text-dark-heading">
                          {formatDate(version.created_at)}
                        </span>
                        {getWordCountDiff(version)}
                        {index === 0 && (
                          <span className="text-xs bg-writer-success/10 text-writer-success px-2 py-1 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      
                      {version.version_note && (
                        <div className="flex items-center text-sm text-writer-text dark:text-dark-text mb-2">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {version.version_note}
                        </div>
                      )}
                      
                      <div className="text-sm text-writer-subtle dark:text-dark-subtle">
                        {version.word_count?.toLocaleString() || 0} words
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setPreviewModal({ isOpen: true, version })}
                        className="flex items-center px-2 py-1 text-xs text-writer-text dark:text-dark-text hover:text-writer-heading dark:hover:text-dark-heading hover:bg-writer-muted dark:hover:bg-dark-muted rounded"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => setRestoreModal({ isOpen: true, version })}
                        className="flex items-center px-2 py-1 text-xs text-writer-accent hover:text-writer-accent-dark hover:bg-writer-accent/10 rounded"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Save Version Modal */}
      <InputModal
        isOpen={saveVersionModal}
        onClose={() => setSaveVersionModal(false)}
        onSubmit={handleSaveVersion}
        title="Save Version"
        fields={[
          {
            name: 'versionNote',
            label: 'Version Note',
            placeholder: 'Optional note about this version...',
            type: 'textarea',
            rows: 3
          }
        ]}
        submitText="Save Version"
      />

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, version: null })}
        title={`Preview: ${previewModal.version?.version_note || 'Version'}`}
        size="fullscreen"
      >
        {previewModal.version && (
          <div className="space-y-4">
            <div className="bg-writer-muted dark:bg-dark-muted p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span>
                  <strong>Created:</strong> {formatDate(previewModal.version.created_at)}
                </span>
                <span>
                  <strong>Words:</strong> {previewModal.version.word_count?.toLocaleString() || 0}
                </span>
              </div>
            </div>
            
            <div className="border border-writer-border dark:border-dark-border rounded-lg p-6 max-h-96 overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">{previewModal.version.title}</h3>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewModal.version.content || '<p>No content</p>' }}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPreviewModal({ isOpen: false, version: null })}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPreviewModal({ isOpen: false, version: null });
                  setRestoreModal({ isOpen: true, version: previewModal.version });
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
              >
                Restore This Version
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={restoreModal.isOpen}
        onClose={() => setRestoreModal({ isOpen: false, version: null })}
        onConfirm={() => {
          handleRestore(restoreModal.version);
          setRestoreModal({ isOpen: false, version: null });
        }}
        title="Restore Version"
        message={`Are you sure you want to restore this version? Your current content will be saved as a new version before restoring.`}
        confirmText="Restore"
        confirmStyle="primary"
      />
    </>
  );
}

export default VersionHistory;