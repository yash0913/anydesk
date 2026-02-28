import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { desklinkApi } from '../../modules/desklink/services/desklink.api.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { getSocket } from '../../socket.js';

const MeetingRemoteControlContext = createContext(null);



export function MeetingRemoteControlProvider({ children, meetingId, localAuthUserId }) {

  const { token } = useAuth();



  if (!localAuthUserId) {
    console.error('[MeetingRemoteControl] CRITICAL: localAuthUserId missing - cannot proceed');
    throw new Error('localAuthUserId is required');
  }



  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [sessionConfig, setSessionConfig] = useState(null);

  const [permissions, setPermissions] = useState({ allowControl: true, viewOnly: false });

  const [incomingRequest, setIncomingRequest] = useState(null); // owner side

  const pcRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);





  const [meetingSocket, setMeetingSocket] = useState(null);

  // Wait for global socket to become available, then bind listeners
  useEffect(() => {
    if (!meetingId) return;
    
    const initializeSocket = async () => {
      try {
        const socket = await getSocket(token);
        setMeetingSocket(socket);
        console.log('[MEETING] Global socket resolved and listeners bound', {
          meetingId,
          socketId: socket.id,
        });
      } catch (err) {
        console.error('[MEETING] Failed to initialize socket:', err);
      }
    };

    initializeSocket();
  }, [meetingId, token]);





  const [connectionState, setConnectionState] = useState('idle');
  const [iceConnectionState, setIceConnectionState] = useState('new');

  const stopSession = useCallback(() => {
    try {
      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
      }
    } catch (e) {
      // ignore
    }
    pcRef.current = null;
    setRemoteStream(null);
    setConnectionState('closed');
    setIceConnectionState('closed');
  }, []);

  const sendControlMessage = useCallback(() => {
    return;
  }, []);

  const setOnDataMessage = useCallback(() => {
    return;
  }, []);

  const setOnConnected = useCallback(() => {
    return;
  }, []);

  const setOnDisconnected = useCallback(() => {
    return;
  }, []);

  const stats = null;





  const openPanel = useCallback(() => setIsPanelOpen(true), []);

  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const togglePanel = useCallback(() => {

    setIsPanelOpen((prev) => !prev);

  }, []);





  const beginControl = useCallback(async (config) => {
    if (!config || !config.sessionId) {
      console.warn('[MeetingRemoteControl] beginControl called without session config');
    }
    setSessionConfig(config);
    setIsPanelOpen(true);
  }, [token]);



  const endControl = useCallback(() => {

    stopSession();

    setSessionConfig(null);

  }, [stopSession]);



  // Meeting-native WebRTC receiver
  useEffect(() => {
    if (!meetingSocket) return;
    if (!meetingId) return;

    const currentMeetingId = String(meetingId);

    const handleOffer = async (payload) => {
      try {
        console.log('[MEETING] webrtc-offer raw payload', payload);
        if (!payload || String(payload.meetingId || '') !== currentMeetingId) return;
        if (!payload.sdp) return;

        console.log('[MEETING] Received webrtc-offer');

        stopSession();

        const pc = new RTCPeerConnection();
        pcRef.current = pc;
        setConnectionState('connecting');

        pc.oniceconnectionstatechange = () => {
          setIceConnectionState(pc.iceConnectionState);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            meetingSocket.emit('webrtc-ice', {
              meetingId: currentMeetingId,
              candidate: event.candidate,
            });
          }
        };

        pc.ontrack = (event) => {
          const stream = event && event.streams && event.streams[0] ? event.streams[0] : null;
          if (stream) {
            setRemoteStream(stream);
          }
        };

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp: payload.sdp })
        );

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('[MEETING] Sending webrtc-answer');
        meetingSocket.emit('webrtc-answer', {
          meetingId: currentMeetingId,
          sdp: answer.sdp,
        });

        setSessionConfig({ sessionId: currentMeetingId, sessionToken: token || currentMeetingId });
        setIsPanelOpen(true);

        setConnectionState('connected');
      } catch (err) {
        console.error('[MEETING] Error handling webrtc-offer', err);
      }
    };

    const handleIce = async (payload) => {
      try {
        console.log('[MEETING] webrtc-ice raw payload', payload);
        if (!payload || String(payload.meetingId || '') !== currentMeetingId) return;
        if (!payload.candidate) return;
        const pc = pcRef.current;
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error('[MEETING] Error adding ICE', err);
      }
    };

    meetingSocket.on('webrtc-offer', handleOffer);
    meetingSocket.on('webrtc-ice', handleIce);

    console.log('[MEETING] Listening for webrtc-offer/webrtc-ice on meeting socket', {
      meetingId: currentMeetingId,
      socketId: meetingSocket && meetingSocket.id,
    });

    return () => {
      meetingSocket.off('webrtc-offer', handleOffer);
      meetingSocket.off('webrtc-ice', handleIce);
      stopSession();
    };
  }, [meetingSocket, meetingId, stopSession]);


  // Meeting remote control: request backend to start control session.

  const requestControl = useCallback(async () => {
    if (!meetingSocket) {
      console.warn('[FRONTEND] requestControl called but meetingSocket not ready yet');
      return;
    }

    if (!meetingId) {
      console.warn('[FRONTEND] requestControl called but meetingId missing');
      return;
    }

    console.log('[FRONTEND] Emitting request-control', meetingId);
    meetingSocket.emit('request-control', { meetingId });
  }, [meetingSocket, meetingId]);

// ... (rest of the code remains the same)
  const checkUserAgentStatus = useCallback(async () => {
    return 'unknown';
  }, []);





  // Owner: accept/reject incoming request inside meeting

  const acceptIncomingRequest = useCallback(

    async (acceptPermissions) => {

      if (!incomingRequest || !token) return;

      try {

        const payload = {

          sessionId: incomingRequest.sessionId,

          permissions: acceptPermissions,

        };

        await desklinkApi.acceptRemote(token, payload);

        setIncomingRequest(null);

      } catch (err) {

        console.error('[MeetingRemoteControl] acceptIncomingRequest failed', err);

      }

    },

    [incomingRequest, token]

  );



  const rejectIncomingRequest = useCallback(

    async () => {

      if (!incomingRequest || !token) {

        setIncomingRequest(null);

        return;

      }

      try {

        await desklinkApi.rejectRemote(token, { sessionId: incomingRequest.sessionId });

      } catch (err) {

        console.error('[MeetingRemoteControl] rejectIncomingRequest failed', err);

      } finally {

        setIncomingRequest(null);

      }

    },
    [incomingRequest, token]
  );

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



    // Incoming owner-side request (for future in-meeting modal)
    incomingRequest,
    acceptIncomingRequest,
    rejectIncomingRequest,



    // Permissions (owner controls)
    permissions,
    setPermissions,



    // Request flow from controller side
    requestControl,
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
    meetingSocketReady: !!meetingSocket,
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