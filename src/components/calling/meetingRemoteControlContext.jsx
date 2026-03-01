import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';



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



  const [incomingRequest, setIncomingRequest] = useState(null); // owner side







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







      setIncomingRequest({
        sessionId: payload.sessionId,
        fromUserId: payload.fromUserId,
        fromDeviceId: payload.fromDeviceId,
        receiverDeviceId: payload.receiverDeviceId,
        callerName: payload.callerName,
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



  } = useDeskLinkWebRTC();







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







  const endControl = useCallback(() => {



    stopSession();



    setSessionConfig(null);



  }, [stopSession]);







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



    async (acceptPermissions) => {



      if (!incomingRequest || !token) {



        console.warn('[MeetingRemoteControl] Cannot accept: missing request or token');



        return;



      }







      // Use the deviceId targeted by the requester as fallback if we don't know our own ID



      const targetDeviceId = localDeviceId || incomingRequest.receiverDeviceId;







      if (!targetDeviceId) {



        console.error('[MeetingRemoteControl] Cannot accept: no receiver device ID found');



        return;



      }







      console.log('[MeetingRemoteControl] Accepting request', {



        sessionId: incomingRequest.sessionId,



        targetDeviceId,



        permissions: acceptPermissions



      });







      try {



        const payload = {



          sessionId: incomingRequest.sessionId,



          receiverDeviceId: targetDeviceId,



          permissions: acceptPermissions,



        };







        await desklinkApi.acceptRemote(token, payload);



        console.log('[MeetingRemoteControl] Accept API success');



        setIncomingRequest(null);



      } catch (err) {



        console.error('[MeetingRemoteControl] acceptIncomingRequest failed', err);



      }



    },



    [incomingRequest, token, localDeviceId]



  );







  const rejectIncomingRequest = useCallback(



    async () => {



      if (!incomingRequest || !token) {



        setIncomingRequest(null);



        return;



      }







      const targetDeviceId = localDeviceId || incomingRequest.receiverDeviceId;



      if (!targetDeviceId) {



        console.error('[MeetingRemoteControl] Cannot reject: no receiver device ID found');



        setIncomingRequest(null); // Clear the request even if we can't send a reject



        return;



      }







      console.log('[MeetingRemoteControl] Rejecting request', incomingRequest.sessionId);







      try {



        const payload = {



          sessionId: incomingRequest.sessionId,



          receiverDeviceId: targetDeviceId,



        };







        await desklinkApi.rejectRemote(token, payload);



      } catch (err) {



        console.error('[MeetingRemoteControl] rejectIncomingRequest failed', err);



      } finally {



        setIncomingRequest(null);



      }



    },



    [incomingRequest, token]



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







    socket.on('desklink-session-start', handleSessionStart);



    return () => {



      socket.off('desklink-session-start', handleSessionStart);



    };



  }, [socket, token, startAsCaller, startAsReceiver, activeSessionId, localAuthUserId]);







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







    // Incoming owner-side request (for future in-meeting modal)



    incomingRequest,



    acceptIncomingRequest,



    rejectIncomingRequest,







    // Permissions (owner controls)



    permissions,



    setPermissions,







    // Request flow from controller side



    requestControlForUser,



    checkUserAgentStatus,







    // WebRTC state for remote desktop



    connectionState,



    iceConnectionState,



    remoteStream,



    stats,



    sendControlMessage,



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