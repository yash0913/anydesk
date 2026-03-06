import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';



import { useDeskLinkWebRTC } from '../../modules/desklink/hooks/useDeskLinkWebRTC.js';



import { useDeskLinkSocket } from '../../modules/desklink/hooks/useDeskLinkSocket.js';



import { desklinkApi } from '../../modules/desklink/services/desklink.api.js';



import { getNativeDeviceId } from '../../modules/desklink/utils/nativeBridge.js';



import { useAuth } from '../../modules/auth/hooks/useAuth.js';







const MeetingRemoteControlContext = createContext(null);







export function MeetingRemoteControlProvider({ children, meetingId, localAuthUserId }) {



  const { user, token } = useAuth();







  if (!localAuthUserId) {

    console.error('[MeetingRemoteControl] CRITICAL: localAuthUserId missing - cannot proceed');

    throw new Error('localAuthUserId is required');

  }







  const [isPanelOpen, setIsPanelOpen] = useState(false);



  const [sessionConfig, setSessionConfig] = useState(null);



  const [activeSessionId, setActiveSessionId] = useState(null);



  const [permissions, setPermissions] = useState({ allowControl: true, viewOnly: false });



  const [localDeviceId, setLocalDeviceId] = useState('');



  const [pendingSession, setPendingSession] = useState(null); // controller side



  const [remoteRequests, setRemoteRequests] = useState([]); // owner side — array of requests
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState(false);

  // Backward-compatible single-request alias (used by inline VisionDesk panel)
  const incomingRequest = remoteRequests.length > 0 ? remoteRequests[0] : null;

  const [actionLogs, setActionLogs] = useState([]);

  const [activeControllerName, setActiveControllerName] = useState(null);
  const [isHostActive, setIsHostActive] = useState(false); // Priority Override state
  const [meetingAccessState, setMeetingAccessState] = useState({ activeController: null, pendingRequests: [] });
  const [agentStatus, setAgentStatus] = useState('unknown'); // online, offline, provisioning, unknown
  const [checkedLocal, setCheckedLocal] = useState(false);
  const statusRef = useRef(agentStatus);

  useEffect(() => {
    statusRef.current = agentStatus;
  }, [agentStatus]);







  // Shared global signaling socket (managed via src/socket.js)



  const { socket } = useDeskLinkSocket({



    token,



    onRemoteRequest: (payload) => {



      // Incoming request for THIS user (owner side)



      // Don't show incoming request modal for our own requests (meeting sessions)



      console.log('[MeetingRemoteControl] Request check:', {



        payloadFromUserId: payload.fromUserId,



        currentUserId: localAuthUserId,



        shouldIgnore: payload.fromUserId === localAuthUserId



      });







      if (payload.fromUserId === localAuthUserId) {



        console.log('[MeetingRemoteControl] Ignoring own request (meeting session)');



        return;



      }







      setRemoteRequests(prev => {
        // Avoid duplicates by sessionId
        if (prev.some(r => r.sessionId === payload.sessionId)) return prev;
        return [...prev, {
          sessionId: payload.sessionId,
          fromUserId: payload.fromUserId,
          fromDeviceId: payload.fromDeviceId,
          receiverDeviceId: payload.receiverDeviceId,
          callerName: payload.callerName,
          accessType: 'control', // default access type
        }];
      });



    },



    onRemoteResponse: (payload) => {
      // Pending outgoing request updated (accepted/rejected/ended)
      if (!pendingSession || payload.sessionId !== pendingSession.sessionId) return;

      if (payload.status === 'accepted') {
        console.log('[MeetingRemoteControl] Remote user accepted request - initiating session');
        beginControl(payload);
        setPendingSession(null);
      }

      if (payload.status === 'rejected') {
        // Simple UX for now; can be replaced by toast/snackbar later
        console.warn('[MeetingRemoteControl] Remote user rejected request');
        setPendingSession(null);
      }

      if (payload.status === 'ended') {
        setPendingSession(null);
      }
    },
  });

  const checkLocalAgent = useCallback(async () => {
    try {
      console.log('[MeetingRemoteControl] Checking local agent...');
      const resp = await fetch('http://127.0.0.1:17600/device-id', { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        const { deviceId } = await resp.json();
        console.log('[MeetingRemoteControl] Local agent detected:', deviceId);
        // We still wait for backend to confirm socket connection
        return deviceId;
      }
    } catch (err) {
      console.log('[MeetingRemoteControl] Local agent not detected at :17600');
    }
    return null;
  }, []);

  const provisionAgent = useCallback(async () => {
    if (!token) return;
    try {
      setAgentStatus('provisioning');
      console.log('[MeetingRemoteControl] Starting agent provisioning...');

      // 1. Get agent JWT from backend
      const { agentJwt } = await desklinkApi.provisionAgentToken(token);

      // 2. Send to local agent API
      // Hardcode to production as per user request
      const serverUrl = 'https://anydesk.onrender.com';
      console.log('[MeetingRemoteControl] Pushing to local agent:', { serverUrl, hasJwt: !!agentJwt });

      const resp = await fetch('http://127.0.0.1:17600/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl, agentJwt })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to send provisioning to local agent: ${resp.status} ${errorText}`);
      }

      console.log('[MeetingRemoteControl] Provisioning sent successfully to local agent');
      // Status will be updated to 'online' via socket event 'agent-status-change'
      // Fail-safe: check status manually via socket after small delay
      setTimeout(() => {
        if (socket?.connected) {
          console.log('[MeetingRemoteControl] Proactive status check...');
          socket.emit('check-agent-status');
        }
      }, 5000);
    } catch (err) {
      console.error('[MeetingRemoteControl] Provisioning failed phase:', err);
      setAgentStatus('offline');
    }
  }, [token, socket]);

  const checkAgentStatus = useCallback(() => {
    if (socket?.connected) {
      socket.emit('check-agent-status');
    }
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (agentStatus !== 'online' && socket?.connected) {
        checkAgentStatus();
      }
    }, 30000); // Pulse check every 30s if not online
    return () => clearInterval(interval);
  }, [agentStatus, socket, checkAgentStatus]);

  useEffect(() => {
    if (!socket) return;

    console.log('[MeetingRemoteControl] UI Socket State:', {
      id: socket.id,
      connected: socket.connected,
      authenticated: !!token,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'NONE'
    });

    const anyListener = (event, ...args) => {
      console.log(`[MeetingRemoteControl] 🛰️ Socket Event: ${event}`, args);
    };
    socket.onAny(anyListener);

    const handleStatusChange = (payload) => {
      console.log('[MeetingRemoteControl] 🤖 Agent status change:', payload);
      setAgentStatus(payload.status);
    };

    socket.on('agent-status-change', handleStatusChange);

    return () => {
      socket.offAny(anyListener);
      socket.off('agent-status-change', handleStatusChange);
    };
  }, [socket, token]);

  // Provisioning safety timeout
  useEffect(() => {
    let timeoutId;
    if (agentStatus === 'provisioning') {
      timeoutId = setTimeout(() => {
        console.warn('[MeetingRemoteControl] Provisioning timed out after 15s');
        setAgentStatus(prev => prev === 'provisioning' ? 'offline' : prev);
      }, 15000);
    }
    return () => clearTimeout(timeoutId);
  }, [agentStatus]);

  useEffect(() => {
    if (token) {
      const check = () => {
        // Use ref to avoid closure issues with periodic checks
        if (statusRef.current === 'online' || statusRef.current === 'provisioning') return;

        checkLocalAgent().then(id => {
          setAgentStatus(current => {
            // Final safety check inside the setter
            if (current === 'online' || current === 'provisioning') return current;
            return id ? 'offline' : 'disconnected';
          });
        });
      };

      check();
      const interval = setInterval(check, 15000); // Check every 15s if not active
      return () => clearInterval(interval);
    }
  }, [token, checkLocalAgent]);

  useEffect(() => {
    if (agentStatus === 'offline' && checkedLocal) {
      console.warn('[MeetingRemoteControl] Agent is offline. Encouraging reconnection...');
    }
  }, [agentStatus, checkedLocal]);


  // Load native device id (DeskLink agent id) for this machine

  useEffect(() => {



    let cancelled = false;



    const load = async () => {



      try {



        const id = await getNativeDeviceId();



        if (!cancelled && id) {



          setLocalDeviceId(id);



        }



      } catch (err) {



        console.warn('[MeetingRemoteControl] failed to resolve native device id', err);



      }



    };



    load();



    return () => {



      cancelled = true;



    };



  }, []);







  useEffect(() => {

    if (!socket) return;

    if (!localDeviceId) return;



    console.log('[MeetingRemoteControl] registering device on socket', localDeviceId);

    socket.emit('register', {

      deviceId: localDeviceId,

      platform: 'web',

      label: 'Meeting DeskLink Web',

      osInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',

      deviceName: user?.fullName || 'Meeting Web Client',

    });

  }, [socket, localDeviceId, user]);







  const {



    connectionState,



    iceConnectionState,



    remoteStream,



    stats,



    startAsCaller,



    startAsReceiver,



    sendControlMessage,



    stopSession,



    setOnDataMessage,



    setOnConnected,



    setOnDisconnected,

    handleIceCandidate, // Assuming this is exposed by useDeskLinkWebRTC

  } = useDeskLinkWebRTC();

  const addSystemLog = useCallback((message, type = 'info') => {
    setActionLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }].slice(-50)); // Keep last 50 logs
  }, []);



  const openPanel = useCallback(() => setIsPanelOpen(true), []);



  const closePanel = useCallback(() => setIsPanelOpen(false), []);



  const togglePanel = useCallback(() => {



    setIsPanelOpen((prev) => !prev);



  }, []);







  const beginControl = useCallback(



    async (config) => {



      if (!config || !config.sessionId) {



        console.warn('[MeetingRemoteControl] beginControl called without session config');



        return;



      }







      let effectiveConfig = {
        ...config,
        sessionToken: config.sessionToken || config.token || config.callerToken || config.receiverToken,
        remoteDeviceId: config.remoteDeviceId || config.hostDeviceId || config.callerDeviceId,
        localDeviceId: config.localDeviceId || config.viewerDeviceId || config.receiverDeviceId,
        authToken: config.authToken || token,
        localUserId: config.localUserId || localAuthUserId,
      };

      // If no ICE servers were provided by the caller, fetch them from the backend
      // so that in-meeting DeskLink sessions benefit from the same TURN/STUN
      // configuration as the rest of the app.
      if (!effectiveConfig.iceServers && token) {



        try {



          const data = await desklinkApi.getTurnToken(token);



          if (data && Array.isArray(data.iceServers) && data.iceServers.length > 0) {



            // Add Google STUN servers to the backend response for better connectivity



            const enhancedIceServers = [



              { urls: "stun:stun.l.google.com:19302" },



              { urls: "stun:stun1.l.google.com:19302" },



              { urls: "stun:stun2.l.google.com:19302" },



              ...data.iceServers



            ];



            effectiveConfig = { ...effectiveConfig, iceServers: enhancedIceServers };



          }



        } catch (err) {



          console.error('[MeetingRemoteControl] Failed to fetch ICE servers for DeskLink session', err);



        }



      }







      setSessionConfig(effectiveConfig);



      setIsPanelOpen(true);



      startAsCaller(effectiveConfig);



    },



    [startAsCaller, token]



  );







  const endControl = useCallback(async () => {

    const sessionId = sessionConfig?.sessionId || activeSessionId;



    console.log('[MeetingRemoteControl] Ending control session:', sessionId);



    // 1. Stop local WebRTC/Socket state

    stopSession();



    // 2. Notify backend to mark session as ended

    if (sessionId && token) {

      try {

        await desklinkApi.completeRemote(token, { sessionId });

        console.log('[MeetingRemoteControl] Backend notified of session completion');

      } catch (err) {

        console.error('[MeetingRemoteControl] Failed to notify backend of session completion:', err);

      }

    }



    // 3. Reset local UI state

    setSessionConfig(null);
    setActiveSessionId(null);

  }, [stopSession, sessionConfig, activeSessionId, token]);

  const addLog = useCallback((message, type = 'info') => {
    setActionLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }].slice(-50)); // Keep last 50 logs
  }, []);



  const sendRemoteAction = useCallback((actionType, actionDetails = {}) => {
    if (!sendControlMessage) return;
    if (isHostActive) {
      console.warn('[RemoteControl] Input blocked: Host is currently active');
      return;
    }

    sendControlMessage({
      type: actionType,
      ...actionDetails
    });
  }, [sendControlMessage, isHostActive]);



  // Controller: request control of another participant's PC by backend user id (webId-only mode)



  // For in-meeting remote access we intentionally do NOT send fromDeviceId. The backend



  // will resolve the caller's active deviceId based on the authenticated user.



  const requestControlForUser = useCallback(



    async ({ targetUserId, targetName, senderAuthId }) => {



      // Relaxed auth check: allow if we have a token OR if we have senderAuthId (anonymous)



      if (!token && !senderAuthId) {



        console.warn('[MeetingRemoteControl] Missing auth context for requestControlForUser');



        return;



      }



      if (!targetUserId) {



        console.warn('[MeetingRemoteControl] No targetUserId provided for requestControlForUser');



        return;



      }



      try {



        const { session } = await desklinkApi.requestMeetingRemote(token, targetUserId, senderAuthId);



        setPendingSession({



          sessionId: session.sessionId,



          targetUserId,



          targetName,



        });



        setIsPanelOpen(true);



      } catch (err) {



        console.error('[MeetingRemoteControl] requestControlForUser failed', err);



      }



    },



    [token] // Removed 'user' dependency as we might use senderAuthId



  );







  const checkUserAgentStatus = useCallback(async (targetUserId) => {



    if (!token || !targetUserId) return 'offline';



    try {



      const data = await desklinkApi.getUserAgentStatus(token, targetUserId, meetingId);



      return data?.status || 'offline';



    } catch (err) {



      console.warn('[MeetingRemoteControl] checkUserAgentStatus failed', err);



      return 'offline';



    }



  }, [token, meetingId]);







  // Owner: accept/reject incoming request inside meeting



  const acceptIncomingRequest = useCallback(
    async (sessionIdOrPerms, accessType) => {
      // Support two call signatures:
      // 1. acceptIncomingRequest(sessionId, accessType) — new popover style
      // 2. acceptIncomingRequest(permissions) — legacy inline panel style (uses first request)
      let targetRequest;
      let providedPermissions;

      if (typeof sessionIdOrPerms === 'string') {
        // New style: sessionId + accessType
        targetRequest = remoteRequests.find(r => r.sessionId === sessionIdOrPerms);
        providedPermissions = {
          viewOnly: accessType === 'view',
          allowControl: accessType !== 'view',
          allowClipboard: true,
          allowFileTransfer: true,
        };
      } else {
        // Legacy style: permissions object, use first request
        targetRequest = remoteRequests[0] || null;
        providedPermissions = sessionIdOrPerms || permissions;
      }

      if (!targetRequest || !token) {
        console.warn('[MeetingRemoteControl] Cannot accept: missing request or token');
        return;
      }

      const targetDeviceId = localDeviceId || targetRequest.receiverDeviceId;

      if (!targetDeviceId) {
        console.error('[MeetingRemoteControl] Cannot accept: no receiver device ID found');
        return;
      }

      console.log('[MeetingRemoteControl] Accepting request', {
        sessionId: targetRequest.sessionId,
        targetDeviceId,
        permissions: providedPermissions,
      });

      try {
        const payload = {
          sessionId: targetRequest.sessionId,
          receiverDeviceId: targetDeviceId,
          permissions: providedPermissions,
        };

        await desklinkApi.acceptRemote(token, payload);
        console.log('[MeetingRemoteControl] Accept API success');

        // Remove from array
        setRemoteRequests(prev => prev.filter(r => r.sessionId !== targetRequest.sessionId));
      } catch (err) {
        console.error('[MeetingRemoteControl] acceptIncomingRequest failed', err);
      }
    },
    [remoteRequests, token, localDeviceId, permissions]
  );







  const rejectIncomingRequest = useCallback(
    async (sessionId) => {
      // Support two call signatures:
      // 1. rejectIncomingRequest(sessionId) — new popover style
      // 2. rejectIncomingRequest() — legacy style (rejects first request)
      let targetRequest;

      if (typeof sessionId === 'string') {
        targetRequest = remoteRequests.find(r => r.sessionId === sessionId);
      } else {
        targetRequest = remoteRequests[0] || null;
      }

      if (!targetRequest || !token) {
        if (targetRequest) {
          setRemoteRequests(prev => prev.filter(r => r.sessionId !== targetRequest.sessionId));
        }
        return;
      }

      const targetDeviceId = localDeviceId || targetRequest.receiverDeviceId;

      if (!targetDeviceId) {
        console.error('[MeetingRemoteControl] Cannot reject: no receiver device ID found');
        setRemoteRequests(prev => prev.filter(r => r.sessionId !== targetRequest.sessionId));
        return;
      }

      console.log('[MeetingRemoteControl] Rejecting request', targetRequest.sessionId);

      try {
        const payload = {
          sessionId: targetRequest.sessionId,
          receiverDeviceId: targetDeviceId,
        };
        await desklinkApi.rejectRemote(token, payload);
      } catch (err) {
        console.error('[MeetingRemoteControl] rejectIncomingRequest failed', err);
      } finally {
        setRemoteRequests(prev => prev.filter(r => r.sessionId !== targetRequest.sessionId));
      }
    },
    [remoteRequests, token, localDeviceId]
  );

  // Quick Switch: emit remote-access-switch to backend
  const switchController = useCallback(
    (newControllerId, accessType = 'control') => {
      if (!socket || !meetingId || !localAuthUserId) return;
      socket.emit('remote-access-switch', {
        meetingId,
        hostUserId: localAuthUserId,
        newControllerId,
        accessType,
      });
    },
    [socket, meetingId, localAuthUserId]
  );

  // Handle desklink-session-start -> start WebRTC as caller when we are controller



  useEffect(() => {



    if (!socket) return;







    const handleSessionStart = async (payload) => {



      console.log('[MeetingRemoteControl] ===== SESSION START RECEIVED =====');



      console.log('[MeetingRemoteControl] payload:', payload);







      try {



        if (!localAuthUserId) {

          console.error('[MeetingRemoteControl] CRITICAL: localAuthUserId missing - ignoring session-start');

          return;

        }



        if (!payload || !payload.sessionId) {



          console.log('[MeetingRemoteControl] ❌ No payload or sessionId');



          return;



        }



        if (activeSessionId && String(activeSessionId) === String(payload.sessionId)) {



          console.log('[MeetingRemoteControl] Duplicate session-start for active session, ignoring');



          return;



        }



        if (!payload.role) {

          console.log('[MeetingRemoteControl] ❌ Missing role in payload, skipping');

          return;

        }



        const role = String(payload.role);

        const config = {

          sessionId: payload.sessionId,

          authToken: token,

          sessionToken: payload.token || payload.callerToken || payload.receiverToken || payload.sessionToken,

          role: role,

          targetUserId: role === 'caller' ? payload.receiverUserId : payload.callerUserId,

          localUserId: localAuthUserId,

          localDeviceId: role === 'caller'

            ? (payload.callerDeviceId || payload.viewerDeviceId)

            : (payload.receiverDeviceId || payload.hostDeviceId),

          remoteDeviceId: role === 'caller'

            ? (payload.receiverDeviceId || payload.hostDeviceId)

            : (payload.callerDeviceId || payload.viewerDeviceId),

        };

        setActiveSessionId(payload.sessionId);



        setSessionConfig(config);



        setIsPanelOpen(true);







        console.log('[MeetingRemoteControl] WebRTC config:', config);

        console.log('[MeetingRemoteControl] role:', role);

        console.log('[MeetingRemoteControl] targetUserId:', config.targetUserId);

        console.log('[MeetingRemoteControl] localDeviceId:', config.localDeviceId);

        console.log('[MeetingRemoteControl] remoteDeviceId:', config.remoteDeviceId);

        console.log('[MeetingRemoteControl] sessionToken preview:', String(config.sessionToken || '').substring(0, 50));











        if (role === 'caller') {

          console.log('[MeetingRemoteControl] 🚀 Calling startAsCaller...');

          await startAsCaller(config);

          console.log('[MeetingRemoteControl] ✅ startAsCaller completed');

        } else if (role === 'receiver') {

          console.log('[MeetingRemoteControl] 🕒 Starting receiver role (waiting for offer)');

          await startAsReceiver(config);

          console.log('[MeetingRemoteControl] ✅ startAsReceiver completed');

        } else {

          console.log('[MeetingRemoteControl] ❌ Unknown role, skipping:', role);

        }



      } catch (err) {



        console.error('[MeetingRemoteControl] desklink-session-start handler error', err);



      }

    };



    const handleSessionEnded = (payload) => {
      console.log('[MeetingRemoteControl] 🛑 session-ended received:', payload);
      stopSession();
      setSessionConfig(null);
      setActiveSessionId(null);
    };

    const handleHostActionLog = (payload) => {
      console.log('[DEBUG] handleHostActionLog received:', payload);
      const actionText = payload.actionType === 'mouse_click'
        ? `Clicked ${payload.actionDetails.button || 'left'} button`
        : payload.actionType === 'scroll'
          ? 'Scrolled'
          : payload.actionType === 'key'
            ? `Pressed key: ${payload.actionDetails.key}`
            : payload.actionType === 'session_start'
              ? 'Session started'
              : payload.actionType === 'session_end'
                ? 'Session ended'
                : payload.actionType;

      console.log('[DEBUG] Adding to action logs:', actionText);
      addLog(actionText, 'action');
      if (payload.actorUserName) {
        console.log('[DEBUG] Setting active controller name:', payload.actorUserName);
        setActiveControllerName(payload.actorUserName);
      }
    };

    const handleSessionStartExtended = (payload) => {
      handleSessionStart(payload);
      addLog('Remote session initiated', 'system');
    };

    const handleSessionEndedExtended = (payload) => {
      handleSessionEnded(payload);
      addLog('Remote session ended', 'system');
      setActiveControllerName(null);
    };

    // Listen for access-revoked (Quick Switch: controller lost control)
    const handleAccessRevoked = (payload) => {
      if (String(payload.revokedControllerId) === String(localAuthUserId)) {
        console.log('[MeetingRemoteControl] 🛑 Access REVOKED by host. Cleaning up...');

        // Stop WebRTC and clear stream
        stopSession();

        // Clear session state
        setSessionConfig(null);
        setActiveSessionId(null);
        setActiveControllerName(null);

        // Close the panel
        setIsPanelOpen(false);

        // Local feedback
        addLog('Remote control revoked by host (transferred)', 'system');

        // If we are showing the large screen share view, it should unmount now
        // since remoteStream (from stopSession) is now null.
      }
    };

    const handleSignalingEvent = (payload) => {
      const { type, sessionId } = payload;
      switch (type) {
        case 'webrtc-ice':
          if (sessionId === activeSessionId) {
            handleIceCandidate(payload.candidate);
          }
          break;
        case 'remote-control-paused':
          if (sessionId === activeSessionId) {
            console.warn('[RemoteControl] Host is ACTIVE - pausing control');
            setIsHostActive(true);
            addSystemLog('Host is currently performing local actions. Control temporarily paused.', 'warning');
          }
          break;
        case 'remote-control-resumed':
          if (sessionId === activeSessionId) {
            console.log('[RemoteControl] Host is IDLE - resuming control');
            setIsHostActive(false);
            addSystemLog('Host idle. Remote control restored.', 'info');
          }
          break;
        case 'meeting-access-state':
          console.log('[MeetingRemoteControl] Received meeting-access-state:', payload);
          setMeetingAccessState(payload.state);
          break;
        default:
          console.log('[MeetingRemoteControl] Unhandled signaling event:', type, payload);
          break;
      }
    };

    socket.on('desklink-session-start', handleSessionStartExtended);
    socket.on('desklink-session-ended', handleSessionEndedExtended);
    socket.on('host-action-log', handleHostActionLog);
    socket.on('access-revoked', handleAccessRevoked);

    // Remote Control Status (Priority Override)
    socket.on('remote-control-paused', (payload) => {
      console.warn('[RemoteControl] Host is ACTIVE - pausing control');
      setIsHostActive(true);
      addSystemLog('Host is currently performing local actions. Control temporarily paused.', 'warning');
    });

    socket.on('remote-control-resumed', (payload) => {
      console.log('[RemoteControl] Host is IDLE - resuming control');
      setIsHostActive(false);
      addSystemLog('Host idle. Remote control restored.', 'info');
    });

    socket.on('meeting-access-state', (payload) => {
      console.log('[MeetingRemoteControl] Received meeting-access-state:', payload);
      setMeetingAccessState(payload.state);
    });

    return () => {
      socket.off('desklink-session-start', handleSessionStartExtended);
      socket.off('desklink-session-ended', handleSessionEndedExtended);
      socket.off('host-action-log', handleHostActionLog);
      socket.off('access-revoked', handleAccessRevoked);
      socket.off('remote-control-paused');
      socket.off('remote-control-resumed');
      socket.off('meeting-access-state');
    };

  }, [socket, token, startAsCaller, startAsReceiver, activeSessionId, localAuthUserId, addLog, addSystemLog, handleIceCandidate]);


  const value = {

    // UI state

    isPanelOpen,

    openPanel,

    closePanel,

    togglePanel,


    // Session state

    sessionConfig,

    beginControl,

    endControl,

    pendingSession,


    // Incoming owner-side requests
    incomingRequest, // backward-compatible (first request or null)
    remoteRequests, // full array of pending requests
    isRequestPanelOpen,
    setIsRequestPanelOpen,
    acceptIncomingRequest,
    rejectIncomingRequest,
    switchController,


    // Permissions (owner controls)

    permissions,

    setPermissions,


    // Request flow from controller side

    requestControlForUser,

    checkUserAgentStatus,
    agentStatus,
    setAgentStatus,
    provisionAgent,
    checkAgentStatus,
    checkLocalAgent,


    // WebRTC state for remote desktop

    connectionState,

    iceConnectionState,

    remoteStream,

    stats,

    sendControlMessage,

    sendRemoteAction,

    actionLogs,

    activeControllerName,
    isHostActive,
    meetingAccessState,
    setOnDataMessage,

    setOnConnected,


    setOnDisconnected,





    // Expose socket readiness for UI guards
    meetingSocketReady: !!socket,
    meetingSocket: socket,
  };







  return (



    <MeetingRemoteControlContext.Provider value={value}>



      {children}



    </MeetingRemoteControlContext.Provider>



  );



}







export function useMeetingRemoteControl() {



  const ctx = useContext(MeetingRemoteControlContext);



  if (!ctx) {



    throw new Error('useMeetingRemoteControl must be used within MeetingRemoteControlProvider');



  }



  return ctx;



}