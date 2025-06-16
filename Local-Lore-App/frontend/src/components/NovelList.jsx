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
  const [pov, setPov] = useState('');
  const [genre, setGenre] = useState('');
  const [isSeries, setIsSeries] = useState('standalone');
  const [seriesName, setSeriesName] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const createNovel = async (e) => {
    e.preventDefault();
    
    const novelData = {
      title,
      description,
      pov,
      genre,
      is_series: isSeries === 'series',
      series_name: isSeries === 'series' ? seriesName : null,
      book_number: isSeries === 'series' ? parseInt(bookNumber) || 1 : null
    };
    
    console.log('Creating novel:', novelData);
    try {
      const response = await axios.post('/api/novels', novelData);
      console.log('Novel created:', response.data);
      setTitle('');
      setDescription('');
      setPov('');
      setGenre('');
      setIsSeries('standalone');
      setSeriesName('');
      setBookNumber('');
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
    <div className="min-h-screen bg-writer-bg dark:bg-dark-bg p-8">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(180deg); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
            50% { transform: translateY(-8px) rotate(90deg); opacity: 1; }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-6px) translateX(2px); }
            66% { transform: translateY(-3px) translateX(-2px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 2.5s ease-in-out infinite;
            animation-delay: 0.8s;
          }
          .animate-float-slow {
            animation: float-slow 4s ease-in-out infinite;
            animation-delay: 1.5s;
          }
          .animation-delay-500 {
            animation-delay: 0.5s;
          }
          .animation-delay-1000 {
            animation-delay: 1s;
          }
        `
      }} />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Local Lore" className="w-12 h-12 mr-4" />
            <div>
              <h1 className="text-4xl font-serif text-writer-heading dark:text-dark-heading">Local Lore</h1>
              <p className="text-writer-accent dark:text-dark-accent text-lg font-medium italic">"It's like Magic"</p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 mb-8">
          {novels.map(novel => (
            <div
              key={novel.id}
              onClick={() => navigate(`/novel/${novel.id}`)}
              className="bg-white dark:bg-dark-surface rounded-lg shadow-md border border-gray-200 dark:border-dark-border p-6 cursor-pointer hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-dark-muted transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <Book className="text-writer-accent dark:text-dark-accent mt-1" size={24} />
                <div className="flex-1">
                  <h2 className="text-xl font-serif mb-2 text-writer-heading dark:text-dark-heading">{novel.title}</h2>
                  <p className="text-writer-text dark:text-dark-text">{novel.description}</p>
                  <p className="text-sm text-writer-subtle dark:text-dark-subtle mt-2">
                    Updated {new Date(novel.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDeleteClick(novel, e)}
                    className="p-2 text-writer-subtle dark:text-dark-subtle hover:text-writer-error dark:hover:text-dark-error hover:bg-writer-error/10 dark:hover:bg-dark-error/10 rounded-lg transition-colors"
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
          <div className="relative group">
            <button
              onClick={() => {
                console.log('New Novel button clicked');
                setShowNewNovel(true);
              }}
              className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden animate-pulse hover:animate-none"
            >
              {/* Magical shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              
              {/* Sparkle effects */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full opacity-70 animate-ping"></div>
              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-yellow-200 rounded-full opacity-60 animate-ping animation-delay-500"></div>
              <div className="absolute top-1/2 -left-2 w-1 h-1 bg-cyan-200 rounded-full opacity-80 animate-bounce animation-delay-1000"></div>
              
              {/* Plus icon with rotation */}
              <Plus size={20} className="relative z-10 transform group-hover:rotate-90 transition-transform duration-300" />
              
              {/* Text with glow */}
              <span className="relative z-10 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">
                New Novel
              </span>
              
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
            </button>
            
            {/* Floating particles around button */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-2 left-1/4 w-1 h-1 bg-emerald-300 rounded-full animate-float opacity-70"></div>
              <div className="absolute -bottom-2 right-1/4 w-0.5 h-0.5 bg-teal-300 rounded-full animate-float-delayed opacity-60"></div>
              <div className="absolute top-1/2 -right-3 w-0.5 h-0.5 bg-cyan-300 rounded-full animate-float-slow opacity-50"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={createNovel} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-md dark:shadow-none p-6">
            <h2 className="text-xl font-serif mb-6 text-writer-heading dark:text-dark-heading">Create New Novel</h2>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                Novel Title *
              </label>
              <input
                type="text"
                placeholder="Enter your novel title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-primary"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                Description
              </label>
              <textarea
                placeholder="Brief description of your novel (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea-primary h-20"
              />
            </div>

            {/* POV and Genre Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                  Point of View
                </label>
                <select
                  value={pov}
                  onChange={(e) => setPov(e.target.value)}
                  className="input-primary"
                >
                  <option value="">Select POV</option>
                  <option value="First Person">First Person</option>
                  <option value="Second Person">Second Person</option>
                  <option value="Third Person Limited">Third Person Limited</option>
                  <option value="Third Person Omniscient">Third Person Omniscient</option>
                  <option value="Multiple POV">Multiple POV</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="input-primary"
                >
                  <option value="">Select Genre</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Romance">Romance</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Horror">Horror</option>
                  <option value="Historical Fiction">Historical Fiction</option>
                  <option value="Literary Fiction">Literary Fiction</option>
                  <option value="Young Adult">Young Adult</option>
                  <option value="Middle Grade">Middle Grade</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Biography">Biography</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Series Information */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                Series Information
              </label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="seriesType"
                      value="standalone"
                      checked={isSeries === 'standalone'}
                      onChange={(e) => setIsSeries(e.target.value)}
                      className="mr-2 text-emerald-500 focus:ring-emerald-500"
                    />
                    Standalone Novel
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="seriesType"
                      value="series"
                      checked={isSeries === 'series'}
                      onChange={(e) => setIsSeries(e.target.value)}
                      className="mr-2 text-emerald-500 focus:ring-emerald-500"
                    />
                    Part of a Series
                  </label>
                </div>
                
                {isSeries === 'series' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-gray-50 dark:bg-dark-muted rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                        Series Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., The Chronicles of Narnia"
                        value={seriesName}
                        onChange={(e) => setSeriesName(e.target.value)}
                        className="input-primary"
                        required={isSeries === 'series'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                        Book Number *
                      </label>
                      <input
                        type="number"
                        placeholder="1"
                        min="1"
                        value={bookNumber}
                        onChange={(e) => setBookNumber(e.target.value)}
                        className="input-primary"
                        required={isSeries === 'series'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium shadow-md transition-all duration-200"
              >
                Create Novel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewNovel(false);
                  // Reset form
                  setTitle('');
                  setDescription('');
                  setPov('');
                  setGenre('');
                  setIsSeries('standalone');
                  setSeriesName('');
                  setBookNumber('');
                }}
                className="btn-secondary"
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
              <div className="w-16 h-16 bg-writer-error/10 dark:bg-dark-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-writer-error dark:text-dark-error" />
              </div>
              <h3 className="text-lg font-semibold text-writer-heading dark:text-dark-heading mb-2">
                Are you sure you want to delete this novel?
              </h3>
              <p className="text-writer-text dark:text-dark-text mb-4">
                This action cannot be undone. This will permanently delete:
              </p>
              <div className="bg-writer-muted dark:bg-dark-muted rounded-lg p-4 mb-4">
                <p className="font-medium text-writer-heading dark:text-dark-heading">"{novelToDelete?.title}"</p>
                <p className="text-sm text-writer-text dark:text-dark-text mt-1">
                  All chapters, characters, places, events, lore, items, and outlines will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-writer-heading dark:text-dark-heading mb-2">
                Type the novel title to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={novelToDelete?.title}
                className="input-primary focus:ring-writer-error dark:focus:ring-dark-error focus:border-writer-error dark:focus:border-dark-error"
              />
              {confirmText && confirmText !== novelToDelete?.title && (
                <p className="text-sm text-writer-error dark:text-dark-error mt-1">
                  Novel title does not match
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmText !== novelToDelete?.title}
                className="px-4 py-2 text-sm font-medium text-white bg-writer-error dark:bg-dark-error hover:opacity-90 disabled:bg-writer-subtle dark:disabled:bg-dark-subtle disabled:cursor-not-allowed rounded-lg transition-all"
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