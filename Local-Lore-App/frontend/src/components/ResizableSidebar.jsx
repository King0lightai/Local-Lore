import React, { useState, useRef, useCallback } from 'react';

function ResizableSidebar({ children, initialWidth = 256, minWidth = 200, maxWidth = 600 }) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true);
    
    const startX = mouseDownEvent.clientX;
    const startWidth = width;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(clampedWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width, minWidth, maxWidth]);

  return (
    <div className="flex h-full">
      <div
        ref={sidebarRef}
        className="flex flex-col relative"
        style={{ width: `${width}px` }}
      >
        {children}
        
        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-writer-accent dark:hover:bg-dark-accent transition-colors ${
            isResizing ? 'bg-writer-accent dark:bg-dark-accent' : 'bg-transparent hover:bg-writer-muted dark:hover:bg-dark-muted'
          }`}
          onMouseDown={startResizing}
          title="Drag to resize sidebar"
        />
        
        {/* Visual indicator when resizing */}
        {isResizing && (
          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-400 opacity-75" />
        )}
      </div>
    </div>
  );
}

export default ResizableSidebar;