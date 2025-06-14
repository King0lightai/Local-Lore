import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus trap
      modalRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    fullscreen: 'max-w-4xl'
  };

  return (
    <div className="modal-overlay animate-in">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`modal-content scale-in relative w-full ${sizeClasses[size]}`}
        >
          {/* Header */}
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-writer-heading">{title}</h3>
              <button
                onClick={onClose}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="card-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmStyle = 'danger' }) {
  const confirmStyles = {
    danger: 'bg-writer-error hover:bg-writer-error/90',
    primary: 'bg-writer-accent hover:bg-writer-accent/90',
    success: 'bg-writer-success hover:bg-writer-success/90'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div className="space-y-6">
        <p className="text-writer-text leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-writer-bg transition-all duration-200 ${confirmStyles[confirmStyle]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InputModal({ isOpen, onClose, onSubmit, title, fields, submitText = 'Submit', isSubmitting = false }) {
  const [values, setValues] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      const initialValues = {};
      fields.forEach(field => {
        initialValues[field.name] = field.defaultValue || '';
      });
      setValues(initialValues);
      
      // Focus first input
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    for (const field of fields) {
      if (field.required && !values[field.name]?.trim()) {
        return;
      }
    }
    
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Keep modal open on error so user can retry
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="medium">
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-writer-heading mb-2">
              {field.label}
              {field.required && <span className="text-writer-error ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                ref={index === 0 ? firstInputRef : null}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                rows={field.rows || 3}
                className="textarea-primary"
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <select
                ref={index === 0 ? firstInputRef : null}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="input-primary"
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={index === 0 ? firstInputRef : null}
                type={field.type || 'text'}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                className="input-primary"
                required={field.required}
              />
            )}
            {field.help && (
              <p className="mt-2 text-sm text-writer-subtle">{field.help}</p>
            )}
          </div>
        ))}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-writer-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}