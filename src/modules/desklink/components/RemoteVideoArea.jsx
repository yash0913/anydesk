import React, { useRef, useEffect, useState } from 'react';
import {
  createMouseMoveMessage,
  createMouseClickMessage,
  createMouseWheelMessage,
  MessageThrottler,
} from '../utils/controlProtocol';

export default function RemoteVideoArea({
  stream,
  onControlMessage,
  sessionId,
  token,
  permissions,
  stats,
  sendRemoteAction,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [remoteCursor, setRemoteCursor] = useState({ x: 0, y: 0, visible: false });
  const throttlerRef = useRef(new MessageThrottler(16));

  useEffect(() => {
    console.log('[RemoteVideoArea] ===== STREAM UPDATE =====');
    console.log('[RemoteVideoArea] stream exists:', !!stream);
    console.log('[RemoteVideoArea] videoRef exists:', !!videoRef.current);
    console.log('[RemoteVideoArea] stream tracks count:', stream?.getTracks()?.length || 0);

    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        console.log('[RemoteVideoArea] ✓ Stream set to video element');

        // Force video to play
        videoRef.current.play().catch(err => {
          console.log('[RemoteVideoArea] Play error:', err);
        });
      } else {
        videoRef.current.srcObject = null;
        console.log('[RemoteVideoArea] Clear: Stream removed, srcObject set to null');
      }
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      throttlerRef.current.clear();
    };
  }, []);

  const getNormalizedCoords = (e) => {
    // Get container bounding box
    const rect = videoRef.current.getBoundingClientRect();
    
    // Get actual video resolution
    const videoWidth = videoRef.current.videoWidth || rect.width;
    const videoHeight = videoRef.current.videoHeight || rect.height;
    
    // Get container size
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    // Compute aspect ratios
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;
    
    // Calculate rendered video dimensions and black bar offsets
    let renderWidth, renderHeight;
    let offsetX = 0;
    let offsetY = 0;
    
    if (videoAspect > containerAspect) {
      // Video is wider than container - black bars top/bottom
      renderWidth = containerWidth;
      renderHeight = containerWidth / videoAspect;
      offsetY = (containerHeight - renderHeight) / 2;
    } else {
      // Video is taller than container - black bars left/right
      renderHeight = containerHeight;
      renderWidth = containerHeight * videoAspect;
      offsetX = (containerWidth - renderWidth) / 2;
    }
    
    // Adjust mouse position by subtracting black bar offsets
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const adjustedX = mouseX - offsetX;
    const adjustedY = mouseY - offsetY;
    
    // Ignore clicks outside the actual video area
    if (
      adjustedX < 0 ||
      adjustedY < 0 ||
      adjustedX > renderWidth ||
      adjustedY > renderHeight
    ) {
      // Return null to indicate the click should be ignored
      return null;
    }
    
    // Normalize coordinates only within the visible video area
    const normalizedX = adjustedX / renderWidth;
    const normalizedY = adjustedY / renderHeight;
    
    // Debug logging (can be removed in production)
    console.log('[COORD-FIX] Corrected coordinate calculation:', {
      videoResolution: { width: videoWidth, height: videoHeight },
      containerSize: { width: containerWidth, height: containerHeight },
      aspectRatios: { video: videoAspect, container: containerAspect },
      renderedVideo: { width: renderWidth, height: renderHeight },
      blackBarOffsets: { x: offsetX, y: offsetY },
      mousePosition: { rawX: mouseX, rawY: mouseY },
      adjustedPosition: { x: adjustedX, y: adjustedY },
      normalizedCoords: { x: normalizedX, y: normalizedY }
    });
    
    return { x: normalizedX, y: normalizedY };
  };

  const handleMouseMove = (e) => {
    if (!permissions?.allowControl) return;

    const coords = getNormalizedCoords(e);
    if (!coords) return;

    const { x, y } = coords;
    setRemoteCursor({ x: x * 100, y: y * 100, visible: true });

    const message = createMouseMoveMessage(x, y, sessionId, token);
    throttlerRef.current.throttle(message, onControlMessage);
  };

  const handleMouseClick = (e) => {
    if (!permissions?.allowControl) return;

    const coords = getNormalizedCoords(e);
    if (!coords) return; // Click outside video area, ignore it

    const { x, y } = coords;
    const button = e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right';
    const message = createMouseClickMessage(x, y, button, sessionId, token);
    onControlMessage(message);

    // Log action
    sendRemoteAction?.('mouse_click', { button, x: Math.round(x * 100), y: Math.round(y * 100) });
  };

  const handleWheel = (e) => {
    if (!permissions?.allowControl) return;

    e.preventDefault();
    const message = createMouseWheelMessage(e.deltaX, e.deltaY, sessionId, token);
    onControlMessage(message);

    // Log action
    sendRemoteAction?.('scroll', { deltaX: e.deltaX, deltaY: e.deltaY });
  };

  const handleKeyDown = (e) => {
    if (!permissions?.allowControl) return;

    // Prevent default common shortcuts
    if (e.ctrlKey || e.altKey || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
      // Logic for sending key message would go here if implemented in protocol
      // For now, we just log it for the host
      sendRemoteAction?.('key', { key: e.key, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey });
    }
  };

  const handleMouseLeave = () => {
    setRemoteCursor((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleMouseClick}
      onWheel={handleWheel}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Remote Cursor Overlay */}
      {remoteCursor.visible && permissions?.allowControl && (
        <div
          className="absolute w-4 h-4 bg-emerald-500 rounded-full pointer-events-none transition-transform duration-75"
          style={{
            left: `${remoteCursor.x}%`,
            top: `${remoteCursor.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
        </div>
      )}

      {/* Stats Overlay */}
      {stats && (
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">FPS:</span>
            <span className="font-mono">{stats.fps}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Bitrate:</span>
            <span className="font-mono">{stats.bitrate} kbps</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">RTT:</span>
            <span className="font-mono">{stats.rtt} ms</span>
          </div>
          {stats.packetsLost > 0 && (
            <div className="flex items-center gap-2 text-amber-400">
              <span className="text-slate-500">Lost:</span>
              <span className="font-mono">{stats.packetsLost}</span>
            </div>
          )}
        </div>
      )}

      {/* Control Status Indicator */}
      {permissions?.allowControl && (
        <div className="absolute bottom-4 left-4 bg-emerald-500/90 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-slate-950 font-medium flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-950 rounded-full animate-pulse" />
          You are controlling
        </div>
      )}

      {permissions?.viewOnly && (
        <div className="absolute bottom-4 left-4 bg-amber-500/90 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-slate-950 font-medium">
          View Only Mode
        </div>
      )}
    </div>
  );
}