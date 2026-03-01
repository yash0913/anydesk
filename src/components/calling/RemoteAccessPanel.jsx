/**
 * RemoteAccessPanel - Remote PC Access Control Panel
 * Manages remote desktop access requests and control permissions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, User, Shield, Clock, Check, X, Crown, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { getSocket } from '../../socket.js';

export function RemoteAccessPanel({ roomId, userId, userName, isHost, participants = [] }) {
  const [socket, setSocket] = React.useState(null);
  
  // Remote access state
  const [accessState, setAccessState] = useState({
    currentController: null,
    pendingRequests: [],
    hostOverride: false
  });
  
  const [hasControl, setHasControl] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isHostOverride, setIsHostOverride] = useState(false);
  
  // Input control refs
  const controlListenersRef = useRef(new Set());
  const isControllerRef = useRef(false);
  const hostActivityTimeoutRef = useRef(null);
  
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
  
  // Initialize access state on join
  useEffect(() => {
    if (socket && roomId) {
      // Request current state
      socket.emit('get-remote-access-state', { roomId });
    }
  }, [socket, roomId]);
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleStateUpdate = (state) => {
      setAccessState(state);
      setHasControl(state.currentController === userId);
      setIsHostOverride(state.hostOverride);
      
      // Update control refs
      isControllerRef.current = state.currentController === userId && !state.hostOverride;
      
      // Update input listeners
      updateInputListeners();
    };
    
    const handleAccessGranted = ({ roomId: grantedRoomId, grantedBy }) => {
      if (grantedRoomId === roomId) {
        setHasControl(true);
        setRequestSent(false);
        console.log('[Remote Access] Access granted by', grantedBy);
      }
    };
    
    const handleAccessRevoked = ({ reason, newControllerId }) => {
      setHasControl(false);
      setRequestSent(false);
      
      if (reason === 'granted-to-another') {
        console.log('[Remote Access] Control granted to another user');
      } else if (reason === 'host-revoked') {
        console.log('[Remote Access] Control revoked by host');
      }
    };
    
    const handleAccessRejected = ({ rejectedBy }) => {
      setRequestSent(false);
      console.log('[Remote Access] Request rejected by', rejectedBy);
    };
    
    const handleHostOverrideStart = ({ hostId }) => {
      setIsHostOverride(true);
      isControllerRef.current = false;
      updateInputListeners();
      console.log('[Remote Access] Host override started');
    };
    
    const handleHostOverrideStop = ({ hostId }) => {
      setIsHostOverride(false);
      isControllerRef.current = hasControl;
      updateInputListeners();
      console.log('[Remote Access] Host override stopped');
    };
    
    const handleRequested = ({ requesterId, requesterName }) => {
      console.log('[Remote Access] Access requested by', requesterName);
    };
    
    // Register listeners
    socket.on('remote-access-state-update', handleStateUpdate);
    socket.on('remote-access-granted', handleAccessGranted);
    socket.on('remote-access-revoked', handleAccessRevoked);
    socket.on('remote-access-rejected', handleAccessRejected);
    socket.on('host-override-start', handleHostOverrideStart);
    socket.on('host-override-stop', handleHostOverrideStop);
    socket.on('remote-access-requested', handleRequested);
    
    return () => {
      socket.off('remote-access-state-update', handleStateUpdate);
      socket.off('remote-access-granted', handleAccessGranted);
      socket.off('remote-access-revoked', handleAccessRevoked);
      socket.off('remote-access-rejected', handleAccessRejected);
      socket.off('host-override-start', handleHostOverrideStart);
      socket.off('host-override-stop', handleHostOverrideStop);
      socket.off('remote-access-requested', handleRequested);
    };
  }, [socket, roomId, userId, hasControl]);
  
  // Input control management
  const updateInputListeners = () => {
    // Remove all existing listeners
    controlListenersRef.current.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    controlListenersRef.current.clear();
    
    // Add listeners if this user is controller
    if (isControllerRef.current && window.remoteDesktopStream) {
      const videoElement = document.querySelector('video[src]');
      if (videoElement) {
        const handleMouseMove = (e) => {
          if (!isControllerRef.current) return;
          
          const rect = videoElement.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          
          socket.emit('remote-mouse-move', {
            roomId,
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
          });
        };
        
        const handleClick = (e) => {
          if (!isControllerRef.current) return;
          
          const rect = videoElement.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          
          socket.emit('remote-click', {
            roomId,
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
            button: e.button === 0 ? 'left' : 'right'
          });
        };
        
        const handleKeyDown = (e) => {
          if (!isControllerRef.current) return;
          
          socket.emit('remote-key', {
            roomId,
            key: e.key,
            action: 'press',
            modifiers: {
              ctrl: e.ctrlKey,
              alt: e.altKey,
              shift: e.shiftKey,
              meta: e.metaKey
            }
          });
        };
        
        const handleWheel = (e) => {
          if (!isControllerRef.current) return;
          e.preventDefault();
          
          socket.emit('remote-wheel', {
            roomId,
            deltaY: e.deltaY
          });
        };
        
        // Add listeners
        videoElement.addEventListener('mousemove', handleMouseMove);
        videoElement.addEventListener('click', handleClick);
        videoElement.addEventListener('keydown', handleKeyDown);
        videoElement.addEventListener('wheel', handleWheel);
        
        // Store references for cleanup
        controlListenersRef.current.add({
          element: videoElement,
          event: 'mousemove',
          handler: handleMouseMove
        });
        controlListenersRef.current.add({
          element: videoElement,
          event: 'click',
          handler: handleClick
        });
        controlListenersRef.current.add({
          element: videoElement,
          event: 'keydown',
          handler: handleKeyDown
        });
        controlListenersRef.current.add({
          element: videoElement,
          event: 'wheel',
          handler: handleWheel
        });
        
        // Make video element focusable
        videoElement.tabIndex = 0;
        videoElement.focus();
      }
    }
  };
  
  // Host activity detection
  const detectHostActivity = () => {
    if (!isHost) return;
    
    // Clear existing timeout
    if (hostActivityTimeoutRef.current) {
      clearTimeout(hostActivityTimeoutRef.current);
    }
    
    // Start override
    socket.emit('host-override-start', { roomId });
    
    // Stop override after 2 seconds of inactivity
    hostActivityTimeoutRef.current = setTimeout(() => {
      socket.emit('host-override-stop', { roomId });
    }, 2000);
  };
  
  // Request access
  const requestAccess = () => {
    if (!socket || isHost || requestSent || hasControl) return;
    
    socket.emit('remote-access-request', { roomId });
    setRequestSent(true);
  };
  
  // Host functions
  const acceptRequest = (requesterId) => {
    if (!socket || !isHost) return;
    
    socket.emit('remote-access-accept', { roomId, requesterId });
  };
  
  const rejectRequest = (requesterId) => {
    if (!socket || !isHost) return;
    
    socket.emit('remote-access-reject', { roomId, requesterId });
  };
  
  const revokeAccess = () => {
    if (!socket || !isHost) return;
    
    socket.emit('remote-access-revoke', { roomId });
  };
  
  const switchControl = (newControllerId) => {
    if (!socket || !isHost || newControllerId === accessState.currentController) return;
    
    socket.emit('remote-access-accept', { roomId, requesterId: newControllerId });
  };
  
  // Get participant info
  const getParticipantInfo = (userId) => {
    return participants.find(p => p.userId === userId);
  };
  
  return (
    <div className="bg-gray-900 rounded-lg p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Remote Access Control</h3>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {hasControl ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-500 text-sm">You have control</span>
            </>
          ) : isHostOverride ? (
            <>
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 text-sm">Host override</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500 text-sm">No control</span>
            </>
          )}
        </div>
      </div>
      
      {/* Current Controller */}
      {accessState.currentController && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm">
                Current Controller: {getParticipantInfo(accessState.currentController)?.userName || 'Unknown'}
              </span>
            </div>
            
            {isHost && (
              <button
                onClick={revokeAccess}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Host Override Status */}
      {isHostOverride && (
        <div className="mb-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Host has temporary control</span>
          </div>
        </div>
      )}
      
      {/* Pending Requests (Host Only) */}
      {isHost && accessState.pendingRequests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Pending Requests ({accessState.pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {accessState.pendingRequests.map(requesterId => {
              const participant = getParticipantInfo(requesterId);
              return (
                <div key={requesterId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{participant?.userName || 'Unknown User'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(requesterId)}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
                      title="Accept"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => rejectRequest(requesterId)}
                      className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                      title="Reject"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Participants List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Participants</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {participants.map(participant => (
            <div
              key={participant.userId}
              className={`flex items-center justify-between p-2 rounded ${
                accessState.currentController === participant.userId
                  ? 'bg-blue-900/30 border border-blue-700/50'
                  : 'bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-sm">{participant.userName}</span>
                {participant.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                {accessState.currentController === participant.userId && (
                  <Shield className="w-3 h-3 text-blue-400" />
                )}
              </div>
              
              {isHost && !participant.isHost && (
                <button
                  onClick={() => switchControl(participant.userId)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    accessState.currentController === participant.userId
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {accessState.currentController === participant.userId ? 'Current' : 'Grant'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Request Access Button (Non-host) */}
      {!isHost && !hasControl && (
        <button
          onClick={requestAccess}
          disabled={requestSent}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            requestSent
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {requestSent ? 'Request Sent' : 'Request Remote Access'}
        </button>
      )}
      
      {/* Give Up Control Button */}
      {hasControl && (
        <button
          onClick={() => socket.emit('remote-access-revoke', { roomId })}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
        >
          Give Up Control
        </button>
      )}
      
      {/* Host Instructions */}
      {isHost && (
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-3 h-3" />
            <span>Host Instructions:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Grant access to participants using the Grant button</li>
            <li>Only one user can control at a time</li>
            <li>Move your mouse to temporarily override control</li>
            <li>Revoke access anytime with the Revoke button</li>
          </ul>
        </div>
      )}
    </div>
  );
}
