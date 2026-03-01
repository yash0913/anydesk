/**
 * RemoteAccessContext - Centralized state management for remote access control
 * Ensures both top-right and bottom panels share the same state
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  currentController: null,
  pendingRequests: [],
  hostOverride: false,
  participants: [],
};

// Action types
const ACTIONS = {
  SET_STATE: 'SET_STATE',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  ADD_PENDING_REQUEST: 'ADD_PENDING_REQUEST',
  REMOVE_PENDING_REQUEST: 'REMOVE_PENDING_REQUEST',
  SET_CONTROLLER: 'SET_CONTROLLER',
  SET_HOST_OVERRIDE: 'SET_HOST_OVERRIDE',
  CLEAR_CONTROLLER: 'CLEAR_CONTROLLER',
};

// Reducer for state updates
function remoteAccessReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_STATE:
      return {
        ...state,
        ...action.payload,
      };
    
    case ACTIONS.SET_PARTICIPANTS:
      return {
        ...state,
        participants: action.payload,
      };
    
    case ACTIONS.ADD_PENDING_REQUEST:
      return {
        ...state,
        pendingRequests: [...new Set([...state.pendingRequests, action.payload])],
      };
    
    case ACTIONS.REMOVE_PENDING_REQUEST:
      return {
        ...state,
        pendingRequests: state.pendingRequests.filter(id => id !== action.payload),
      };
    
    case ACTIONS.SET_CONTROLLER:
      return {
        ...state,
        currentController: action.payload,
      };
    
    case ACTIONS.SET_HOST_OVERRIDE:
      return {
        ...state,
        hostOverride: action.payload,
      };
    
    case ACTIONS.CLEAR_CONTROLLER:
      return {
        ...state,
        currentController: null,
        hostOverride: false,
      };
    
    default:
      return state;
  }
}

// Create context
const RemoteAccessContext = createContext(null);

// Provider component
export function RemoteAccessProvider({ children, roomId, userId, isHost, socket }) {
  const [state, dispatch] = useReducer(remoteAccessReducer, initialState);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleStateUpdate = (data) => {
      console.log('[RemoteAccess] State update received:', data);
      dispatch({ type: ACTIONS.SET_STATE, payload: data });
    };

    const handleStateSync = (data) => {
      console.log('[RemoteAccess] State sync received:', data);
      dispatch({ type: ACTIONS.SET_STATE, payload: data });
    };

    // Register socket listeners
    socket.on('remote-access-state-update', handleStateUpdate);
    socket.on('remote-access-state-sync', handleStateSync);

    // Request initial state sync
    socket.emit('get-remote-access-state', { roomId });

    // Cleanup
    return () => {
      socket.off('remote-access-state-update', handleStateUpdate);
      socket.off('remote-access-state-sync', handleStateSync);
    };
  }, [socket, roomId]);

  // Actions
  const requestAccess = (targetUserId) => {
    if (!socket) return;
    
    console.log('[RemoteAccess] Requesting access for:', targetUserId);
    socket.emit('remote-access-request', { roomId });
  };

  const acceptRequest = (requesterId) => {
    if (!socket) return;
    
    console.log('[RemoteAccess] Accepting request from:', requesterId);
    socket.emit('remote-access-accept', { roomId, requesterId });
  };

  const rejectRequest = (requesterId) => {
    if (!socket) return;
    
    console.log('[RemoteAccess] Rejecting request from:', requesterId);
    socket.emit('remote-access-reject', { roomId, requesterId });
  };

  const revokeAccess = () => {
    if (!socket) return;
    
    console.log('[RemoteAccess] Revoking access');
    socket.emit('remote-access-revoke', { roomId });
  };

  const switchAccess = (newControllerId) => {
    if (!socket) return;
    
    console.log('[RemoteAccess] Switching control to:', newControllerId);
    socket.emit('remote-access-accept', { roomId, requesterId: newControllerId });
  };

  const setParticipants = (participants) => {
    dispatch({ type: ACTIONS.SET_PARTICIPANTS, payload: participants });
  };

  const value = {
    // State
    ...state,
    
    // Actions
    requestAccess,
    acceptRequest,
    rejectRequest,
    revokeAccess,
    switchAccess,
    setParticipants,
    
    // Computed values
    hasControl: state.currentController === userId && !state.hostOverride,
    isController: state.currentController === userId,
    isHostOverride: state.hostOverride,
    pendingRequestsCount: state.pendingRequests.length,
  };

  return (
    <RemoteAccessContext.Provider value={value}>
      {children}
    </RemoteAccessContext.Provider>
  );
}

// Hook to use the context
export function useRemoteAccess() {
  const context = useContext(RemoteAccessContext);
  if (!context) {
    throw new Error('useRemoteAccess must be used within RemoteAccessProvider');
  }
  return context;
}
