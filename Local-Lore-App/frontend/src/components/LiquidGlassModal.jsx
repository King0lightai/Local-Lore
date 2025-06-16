import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export function LiquidGlassModal({ isOpen, onClose, title, children, size = 'medium' }) {
  const modalRef = useRef(null);
  const glassRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
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
    small: 'w-96 h-auto',
    medium: 'w-[28rem] h-auto',
    large: 'w-[36rem] h-auto',
    fullscreen: 'w-[48rem] h-auto'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Liquid Glass Modal */}
      <div
        ref={glassRef}
        tabIndex={-1}
        className={`relative ${sizeClasses[size]} liquid-glass-modal animate-in zoom-in-95 duration-200`}
      >
        {/* Glass layers */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Main glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl" />
          
          {/* Static refraction layer */}
          <div 
            className="absolute inset-0 opacity-40 rounded-2xl"
            style={{
              background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%)`
            }}
          />
          
          {/* Edge glow */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-cyan-400/40 via-transparent to-purple-400/40 bg-clip-border" 
               style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor' }} />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-900/20 hover:bg-red-500 dark:bg-white/20 dark:hover:bg-red-500 text-gray-900 dark:text-white hover:text-white transition-all duration-200 backdrop-blur-sm border border-gray-900/20 dark:border-white/30 hover:border-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="text-gray-900 dark:text-white">
            {children}
          </div>
        </div>

        {/* Ambient lighting effects */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-60 -z-10" />
        
        {/* Bottom highlight */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>

      <style jsx>{`
        .liquid-glass-modal::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 2px;
          background: linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(255,255,255,0.3));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export function LiquidGlassInputModal({ isOpen, onClose, onSubmit, title, fields, submitText = 'Submit', isSubmitting = false }) {
  const [values, setValues] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const initialValues = {};
      fields.forEach(field => {
        initialValues[field.name] = field.defaultValue || '';
      });
      setValues(initialValues);
      
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    }
  };

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={onClose} title={title} size="medium">
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                ref={index === 0 ? firstInputRef : null}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                rows={field.rows || 3}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 border border-gray-300/50 dark:border-white/30 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm transition-all duration-200 shadow-sm"
                required={field.required}
                style={{ resize: 'vertical' }}
              />
            ) : field.type === 'select' ? (
              <select
                ref={index === 0 ? firstInputRef : null}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 border border-gray-300/50 dark:border-white/30 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm transition-all duration-200 shadow-sm"
                required={field.required}
              >
                <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Select {field.label}</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
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
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 border border-gray-300/50 dark:border-white/30 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm transition-all duration-200 shadow-sm"
                required={field.required}
              />
            )}
            {field.help && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{field.help}</p>
            )}
          </div>
        ))}
        
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-300/30 dark:border-white/30">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 text-gray-900 dark:text-white border border-gray-300/50 dark:border-gray-600/50 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 border-emerald-400 text-white rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            {submitText}
          </button>
        </div>
      </form>
    </LiquidGlassModal>
  );
}

export function LiquidGlassConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmStyle = 'danger' }) {
  const confirmStyles = {
    danger: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400',
    primary: 'from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 border-emerald-400',
    success: 'from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 border-emerald-400'
  };

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div className="space-y-6">
        <p className="text-gray-900 dark:text-white leading-relaxed font-medium">{message}</p>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 text-gray-900 dark:text-white border border-gray-300/50 dark:border-gray-600/50 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-3 bg-gradient-to-r ${confirmStyles[confirmStyle]} text-white rounded-lg transition-all duration-200 backdrop-blur-sm font-semibold shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </LiquidGlassModal>
  );
}