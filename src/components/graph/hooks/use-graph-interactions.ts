"use client";

import { useCallback, useRef, useState } from 'react';
import type { GraphNode } from '../types';
import { LAYOUT_CONSTANTS } from '../constants';

export function useGraphInteractions() {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isPanningRef = useRef(false);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);

  // Pan handling
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) return; // Don't pan while dragging node
    
    isPanningRef.current = true;
    lastPanPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [draggingNodeId]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current || !lastPanPos.current) return;
    
    const deltaX = e.clientX - lastPanPos.current.x;
    const deltaY = e.clientY - lastPanPos.current.y;
    
    setPanX(prev => prev + deltaX);
    setPanY(prev => prev + deltaY);
    
    lastPanPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false;
    lastPanPos.current = null;
  }, []);

  // Zoom handling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      LAYOUT_CONSTANTS.minZoom,
      Math.min(LAYOUT_CONSTANTS.maxZoom, zoom * zoomFactor)
    );
    
    // Zoom towards cursor position
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;
    
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, panX, panY]);

  // Node interaction handling
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  }, [selectedNode]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent, nodes?: GraphNode[]) => {
    setDraggingNodeId(nodeId);
    lastDragPos.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  }, []);

  const handleNodeDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNodeId || !lastDragPos.current) return;
    
    const deltaX = (e.clientX - lastDragPos.current.x) / zoom;
    const deltaY = (e.clientY - lastDragPos.current.y) / zoom;
    
    // Update node position in our positions map
    const currentPos = nodePositions.current.get(draggingNodeId) || { x: 0, y: 0 };
    nodePositions.current.set(draggingNodeId, {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY,
    });
    
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  }, [draggingNodeId, zoom]);

  const handleNodeDragEnd = useCallback(() => {
    setDraggingNodeId(null);
    lastDragPos.current = null;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Reset view on double click
    setPanX(0);
    setPanY(0);
    setZoom(1);
  }, []);

  // Touch handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      lastPanPos.current = { x: touch.clientX, y: touch.clientY };
      isPanningRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanningRef.current && lastPanPos.current) {
      const touch = e.touches[0]!;
      const deltaX = touch.clientX - lastPanPos.current.x;
      const deltaY = touch.clientY - lastPanPos.current.y;
      
      setPanX(prev => prev + deltaX);
      setPanY(prev => prev + deltaY);
      
      lastPanPos.current = { x: touch.clientX, y: touch.clientY };
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPanningRef.current = false;
    lastPanPos.current = null;
  }, []);

  // Utility functions
  const zoomIn = useCallback((centerX: number, centerY: number) => {
    const newZoom = Math.min(LAYOUT_CONSTANTS.maxZoom, zoom * 1.2);
    
    const worldX = (centerX - panX) / zoom;
    const worldY = (centerY - panY) / zoom;
    
    const newPanX = centerX - worldX * newZoom;
    const newPanY = centerY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, panX, panY]);

  const zoomOut = useCallback((centerX: number, centerY: number) => {
    const newZoom = Math.max(LAYOUT_CONSTANTS.minZoom, zoom * 0.8);
    
    const worldX = (centerX - panX) / zoom;
    const worldY = (centerY - panY) / zoom;
    
    const newPanX = centerX - worldX * newZoom;
    const newPanY = centerY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, panX, panY]);

  const centerViewportOn = useCallback((worldX: number, worldY: number, viewportWidth: number, viewportHeight: number) => {
    const newPanX = viewportWidth / 2 - worldX * zoom;
    const newPanY = viewportHeight / 2 - worldY * zoom;
    
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom]);

  const autoFitToViewport = useCallback((
    nodes: GraphNode[], 
    viewportWidth: number, 
    viewportHeight: number,
    options: { animate?: boolean; padding?: number } = {}
  ) => {
    if (nodes.length === 0) return;
    
    const { padding = 50 } = options;
    
    // Calculate bounding box of all nodes
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeSize = node.size / 2;
      minX = Math.min(minX, node.x - nodeSize);
      maxX = Math.max(maxX, node.x + nodeSize);
      minY = Math.min(minY, node.y - nodeSize);
      maxY = Math.max(maxY, node.y + nodeSize);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Calculate zoom to fit content with padding
    const zoomX = (viewportWidth - padding * 2) / contentWidth;
    const zoomY = (viewportHeight - padding * 2) / contentHeight;
    const newZoom = Math.max(
      LAYOUT_CONSTANTS.minZoom,
      Math.min(LAYOUT_CONSTANTS.maxZoom, Math.min(zoomX, zoomY))
    );
    
    // Center the content
    const newPanX = viewportWidth / 2 - centerX * newZoom;
    const newPanY = viewportHeight / 2 - centerY * newZoom;
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  return {
    panX,
    panY,
    zoom,
    hoveredNode,
    selectedNode,
    draggingNodeId,
    nodePositions: nodePositions.current,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleWheel,
    handleNodeHover,
    handleNodeClick,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    handleDoubleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setSelectedNode,
    zoomIn,
    zoomOut,
    centerViewportOn,
    autoFitToViewport,
  };
}