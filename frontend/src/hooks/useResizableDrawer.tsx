import { useState, useCallback, useEffect, useRef } from "react";
import type React from "react";

interface UseResizableDrawerOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UseResizableDrawerReturn {
  width: number;
  ResizeHandle: React.FC;
}

export function useResizableDrawer({
  defaultWidth = 600,
  minWidth = 300,
  maxWidth = 1200,
}: UseResizableDrawerOptions = {}): UseResizableDrawerReturn {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX; // 从右侧拖拽，所以是 startX - currentX
      const newWidth = startWidthRef.current + deltaX;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minWidth, maxWidth]);

  const ResizeHandle = useCallback(() => (
    <div
      onMouseDown={handleMouseDown}
      className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 group"
      style={{
        touchAction: "none",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/30 group-hover:bg-primary/70 transition-colors" />
    </div>
  ), [handleMouseDown]);

  return {
    width,
    ResizeHandle: ResizeHandle as React.FC,
  };
}

