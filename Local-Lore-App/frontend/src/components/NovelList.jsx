import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import { Modal } from './Modal';
import { useToast } from './Toast';

function NovelList({ novels, onRefresh }) {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [showNewNovel, setShowNewNovel] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const createNovel = async (e) => {
    e.preventDefault();
    console.log('Creating novel:', { title, description });
    try {
      const response = await axios.post('/api/novels', { title, description });
      console.log('Novel created:', response.data);
      setTitle('');
      setDescription('');
      setShowNewNovel(false);
      onRefresh();
      navigate(`/novel/${response.data.id}`);
    } catch (error) {
      console.error('Error creating novel:', error);
      showToast('Failed to create novel: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleDeleteClick = (novel, e) => {
    e.stopPropagation(); // Prevent navigating to the novel
    setNovelToDelete(novel);
    setConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (confirmText !== novelToDelete.title) {
      showToast('Novel title does not match. Please type the exact title to confirm deletion.', 'error');
      return;
    }

    try {
      await axios.delete(`/api/novels/${novelToDelete.id}`);
      setShowDeleteModal(false);
      setNovelToDelete(null);
      setConfirmText('');
      onRefresh();
      showToast('Novel deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting novel:', error);
      showToast('Failed to delete novel: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setNovelToDelete(null);
    setConfirmText('');
  };

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <img src="/logo.png" alt="Local Lore" className="w-12 h-12 mr-4" />
          <div>
            <h1 className="text-4xl font-serif">Local Lore</h1>
            <p className="text-gray-600 text-lg">Your Novels</p>
          </div>
        </div>
        
        <div className="grid gap-4 mb-8">
          {novels.map(novel => (
            <div
              key={novel.id}
              onClick={() => navigate(`/novel/${novel.id}`)}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <Book className="text-indigo-600 mt-1" size={24} />
                <div className="flex-1">
                  <h2 className="text-xl font-serif mb-2">{novel.title}</h2>
                  <p className="text-gray-600">{novel.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Updated {new Date(novel.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDeleteClick(novel, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete novel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showNewNovel ? (
          <button
            onClick={() => {
              console.log('New Novel button clicked');
              setShowNewNovel(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Novel
          </button>
        ) : (
          <form onSubmit={createNovel} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-serif mb-4">Create New Novel</h2>
            <input
              type="text"
              placeholder="Novel Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:border-indigo-600"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:border-indigo-600 h-24"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewNovel(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Modal */}
        <Modal 
          isOpen={showDeleteModal} 
          onClose={closeDeleteModal} 
          title="Delete Novel" 
          size="medium"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this novel?
              </h3>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. This will permanently delete:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-900">"{novelToDelete?.title}"</p>
                <p className="text-sm text-gray-600 mt-1">
                  All chapters, characters, places, events, lore, items, and outlines will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type the novel title to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={novelToDelete?.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {confirmText && confirmText !== novelToDelete?.title && (
                <p className="text-sm text-red-600 mt-1">
                  Novel title does not match
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmText !== novelToDelete?.title}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Delete Novel
              </button>
            </div>
          </div>
        </Modal>

        <ToastContainer />
      </div>
    </div>
  );
}

export default NovelList;