import React, { useState } from 'react';
import { Download, FileText, Code, File } from 'lucide-react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import axios from 'axios';

const EXPORT_FORMATS = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Complete data export with all story elements',
    icon: Code,
    color: 'bg-blue-500',
    endpoint: '/export'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Clean text format perfect for editing',
    icon: FileText,
    color: 'bg-gray-500',
    endpoint: '/export/markdown'
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web-ready format with styling',
    icon: Code,
    color: 'bg-orange-500',
    endpoint: '/export/html'
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text file for any platform',
    icon: File,
    color: 'bg-green-500',
    endpoint: '/export/txt'
  }
];

function ExportModal({ isOpen, onClose, novel }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    if (!novel) return;
    
    setExporting(format.id);
    try {
      const response = await axios.get(`/api/novels/${novel.id}${format.endpoint}`, {
        responseType: format.id === 'json' ? 'json' : 'blob'
      });
      
      let blob, filename;
      
      if (format.id === 'json') {
        blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        filename = `${novel.title.replace(/[^a-z0-9]/gi, '_')}_export.json`;
      } else {
        blob = response.data;
        const extension = format.id === 'markdown' ? 'md' : format.id;
        filename = `${novel.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Novel" size="medium">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose a format to export <strong>{novel?.title}</strong>
        </p>
        
        <div className="grid gap-3">
          {EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            const isExporting = exporting === format.id;
            
            return (
              <button
                key={format.id}
                onClick={() => handleExport(format)}
                disabled={isExporting}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${format.color} text-white mr-4 flex-shrink-0`}>
                  {isExporting ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{format.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase font-medium">
                      .{format.id === 'markdown' ? 'md' : format.id}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                </div>
                
                <Download className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              </button>
            );
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Export Tips</h3>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>JSON:</strong> Complete backup with all story elements</li>
                  <li><strong>Markdown:</strong> Great for sharing or editing in other tools</li>
                  <li><strong>HTML:</strong> Readable in web browsers with nice formatting</li>
                  <li><strong>Text:</strong> Universal compatibility, works everywhere</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExportModal;