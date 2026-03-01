/**
 * useRemoteInputControl - Hook for managing remote desktop input control
 * Handles mouse, keyboard, and scroll events for remote desktop access
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../../../socket.js';

export function useRemoteInputControl(roomId, hasControl, isHostOverride) {
  const [socket, setSocket] = useState(null);
  const listenersRef = useRef(new Map());
  const videoElementRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const activityThrottleRef = useRef(null);
  
  // Initialize socket
  useEffect(() => {
    // Get auth token for socket connection
    const authToken = (() => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('vd_user_profile') : null;
        if (!raw) return null;
        const profile = JSON.parse(raw);
        return profile?.token || null;
      } catch {
        return null;
      }
    })();

    if (!authToken) return;

    let active = true;

    getSocket(authToken).then(socket => {
      if (!active) return;
      setSocket(socket);
    });

    return () => {
      active = false;
    };
  }, []);
  
  // Throttled activity detection for host override
  const detectActivity = useCallback(() => {
    if (!isHostOverride) return;
    
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Clear existing timeout
    if (activityThrottleRef.current) {
      clearTimeout(activityThrottleRef.current);
    }
    
    // Set new timeout to stop override after 2 seconds of inactivity
    activityThrottleRef.current = setTimeout(() => {
      if (Date.now() - lastActivityRef.current >= 2000) {
        socket.emit('host-override-stop', { roomId });
      }
    }, 2000);
  }, [socket, roomId, isHostOverride]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((event) => {
    if (!hasControl || isHostOverride) return;
    
    const video = videoElementRef.current;
    if (!video) return;
    
    const rect = video.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Validate coordinates
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    
    socket.emit('remote-mouse-move', {
      roomId,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    });
  }, [socket, roomId, hasControl, isHostOverride]);
  
  // Mouse click handler
  const handleClick = useCallback((event) => {
    if (!hasControl || isHostOverride) return;
    
    const video = videoElementRef.current;
    if (!video) return;
    
    const rect = video.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Validate coordinates
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    
    socket.emit('remote-click', {
      roomId,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      button: event.button === 0 ? 'left' : 'right'
    });
  }, [socket, roomId, hasControl, isHostOverride]);
  
  // Mouse wheel handler
  const handleWheel = useCallback((event) => {
    if (!hasControl || isHostOverride) return;
    
    event.preventDefault();
    
    socket.emit('remote-wheel', {
      roomId,
      deltaY: event.deltaY
    });
  }, [socket, roomId, hasControl, isHostOverride]);
  
  // Keyboard handler
  const handleKeyDown = useCallback((event) => {
    if (!hasControl || isHostOverride) return;
    
    // Prevent certain key combinations that might interfere with browser
    if (event.ctrlKey && event.key === 'r') return; // F5 refresh
    if (event.ctrlKey && event.key === 'w') return; // Close tab
    if (event.ctrlKey && event.key === 't') return; // New tab
    if (event.key === 'F5') return; // F5 refresh
    if (event.key === 'F11') return; // Fullscreen
    
    socket.emit('remote-key', {
      roomId,
      key: event.key,
      action: 'press',
      modifiers: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }
    });
  }, [socket, roomId, hasControl, isHostOverride]);
  
  // Host activity detection handlers
  const handleHostMouseMove = useCallback((event) => {
    if (!isHostOverride) return;
    detectActivity();
  }, [isHostOverride, detectActivity]);
  
  const handleHostKeyDown = useCallback((event) => {
    if (!isHostOverride) return;
    detectActivity();
  }, [isHostOverride, detectActivity]);
  
  // Setup and cleanup listeners
  useEffect(() => {
    // Find the video element showing remote desktop
    const findVideoElement = () => {
      // Look for video elements with remote desktop stream
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        if (video.src && video.src.includes('blob:') || video.srcObject) {
          return video;
        }
      }
      return null;
    };
    
    const video = findVideoElement();
    if (!video) {
      console.warn('[Remote Input] No video element found for remote desktop');
      return;
    }
    
    videoElementRef.current = video;
    
    // Clear existing listeners
    listenersRef.current.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    listenersRef.current.clear();
    
    // Add listeners based on control state
    if (hasControl && !isHostOverride) {
      // User has control - add input handlers
      video.addEventListener('mousemove', handleMouseMove);
      video.addEventListener('click', handleClick);
      video.addEventListener('wheel', handleWheel);
      video.addEventListener('keydown', handleKeyDown);
      
      // Store references
      listenersRef.current.set('mousemove', { element: video, event: 'mousemove', handler: handleMouseMove });
      listenersRef.current.set('click', { element: video, event: 'click', handler: handleClick });
      listenersRef.current.set('wheel', { element: video, event: 'wheel', handler: handleWheel });
      listenersRef.current.set('keydown', { element: video, event: 'keydown', handler: handleKeyDown });
      
      // Make video focusable
      video.tabIndex = 0;
      video.focus();
      
      // Add cursor style
      video.style.cursor = 'pointer';
      
    } else if (isHostOverride) {
      // Host override - add activity detection
      document.addEventListener('mousemove', handleHostMouseMove);
      document.addEventListener('keydown', handleHostKeyDown);
      
      listenersRef.current.set('host-mousemove', { element: document, event: 'mousemove', handler: handleHostMouseMove });
      listenersRef.current.set('host-keydown', { element: document, event: 'keydown', handler: handleHostKeyDown });
      
      // Change cursor to indicate host control
      video.style.cursor = 'not-allowed';
      
    } else {
      // No control - remove cursor
      video.style.cursor = 'default';
    }
    
    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      listenersRef.current.clear();
      
      // Clear timeouts
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
      }
    };
  }, [hasControl, isHostOverride, handleMouseMove, handleClick, handleWheel, handleKeyDown, handleHostMouseMove, handleHostKeyDown, detectActivity]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
      }
    };
  }, []);
  
  return {
    isActive: hasControl && !isHostOverride,
    videoElement: videoElementRef.current
  };
}
