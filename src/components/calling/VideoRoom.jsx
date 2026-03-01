/**

 * VideoRoom - Main meeting room component with Zoom-like layout

 * Handles grid layout and screen share layout with sidebar

 */



import React, { useEffect } from 'react';

import { useRoomClient } from './useRoomClient.js';

import { useMeetingParticipants } from './useMeetingParticipants.js';

import { useScreenShare } from './useScreenShare.js';

import { useDeskLinkSocket } from '../../modules/desklink/hooks/useDeskLinkSocket.js';

import MeetingGrid from './MeetingGrid.jsx';

import ControlBar from './ControlBar.jsx';

import ScreenShareView from './ScreenShareView.jsx';

import MeetingChatPanel from './MeetingChatPanel.jsx';

import { MeetingRemoteControlProvider, useMeetingRemoteControl } from './meetingRemoteControlContext.jsx';

import RemoteVideoArea from '../../modules/desklink/components/RemoteVideoArea.jsx';

import IncomingRequestModal from '../../modules/desklink/components/IncomingRequestModal.jsx';

import { getSocket } from '../../socket.js';

import { useAuth } from "../../modules/auth/context/AuthContext.jsx";

import { MousePointer2 } from 'lucide-react';

import { WebRTCDebugPanel } from "./WebRTCDebugPanel";



function shortId(id) {

  if (!id) return '';

  const s = String(id);

  return s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;

}



function VideoRoomInner({

  roomId,

  userName,

  isHost = false,

  initialAudioEnabled = true,

  initialVideoEnabled = true,

  localStream: externalStream,

  onLeave,

}) {

  const derivedLocalAuthUserId = (() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('vd_user_profile') : null;
      if (!raw) return null;
      const profile = JSON.parse(raw);
      return profile?.id ? String(profile.id) : null;
    } catch {
      return null;
    }
  })();

  const userId = React.useMemo(() => {
    if (derivedLocalAuthUserId) return derivedLocalAuthUserId;

    // Fallback to session-persisted ID for guests
    const sessionKey = `meeting_userId_${roomId}`;
    let storedId = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null;
    if (!storedId) {
      storedId = crypto.randomUUID();
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(sessionKey, storedId);
      }
    }
    return storedId;
  }, [derivedLocalAuthUserId, roomId]);

  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const [isParticipantsOpen, setIsParticipantsOpen] = React.useState(false);

  const [isReactionsOpen, setIsReactionsOpen] = React.useState(false);

  const [isHostPanelOpen, setIsHostPanelOpen] = React.useState(false);

  const [selectedParticipantId, setSelectedParticipantId] = React.useState('');



  const {

    localStream,

    localScreenStream,

    participants,

    isAudioEnabled,

    isVideoEnabled,

    isScreenSharing,

    screenShareUserId,

    screenShareStream,

    activeSpeakerId,

    meetingEnded,

    meetingEndedBy,

    chatMessages,

    hostMicLocked,

    hostCameraLocked,

    hostChatDisabled,

    reactions,

    hostNotice,

    sendChatMessage,

    muteAllParticipants,

    setMicLock,

    setCameraLock,

    setChatDisabled,

    removeParticipant,

    sendReaction,

    testAddMessage, // For debugging (may be undefined)

    toggleAudio,

    toggleVideo,

    startScreenShare,

    stopScreenShare,

    endMeeting,

    leaveRoom,

    initializeLocalStream,

  } = useRoomClient(roomId, userId, userName, isHost, onLeave, derivedLocalAuthUserId);



  const {

    isPanelOpen: isRemoteControlOpen,

    togglePanel: toggleRemoteControlPanel,

    remoteStream: remoteDesktopStream,

    stats: remoteStats,

    permissions,

    sessionConfig,

    sendControlMessage,

    requestControlForUser,

    incomingRequest,

    acceptIncomingRequest,

    rejectIncomingRequest,

    checkUserAgentStatus, // Exported from context

    meetingSocketReady, // Exported from context

    meetingSocket, // Exported from context

  } = useMeetingRemoteControl();

  // Get auth token for DeskLink socket
  const { token } = useAuth();
  
  // Use the same socket as bottom panel
  const { socket: deskLinkSocket } = useDeskLinkSocket({
    token,
    onRemoteRequest: (payload) => {
      console.log('[VideoRoom] Remote request received:', payload);
      // Handle incoming remote access requests
      if (payload.roomId === roomId) {
        // Update pending requests
        setPendingRequests(prev => {
          const exists = prev.some(r => r.userId === payload.fromUserId);
          if (!exists) {
            return [...prev, {
              userId: payload.fromUserId,
              requestedAt: Date.now()
            }];
          }
          return prev;
        });
      }
    },
    onRemoteResponse: (payload) => {
      console.log('[VideoRoom] Remote response received:', payload);
      // Handle accept/reject responses
      if (payload.roomId === roomId) {
        if (payload.status === 'accepted') {
          setCurrentController(payload.fromUserId);
          // Remove from pending
          setPendingRequests(prev => 
            prev.filter(r => r.userId !== payload.fromUserId)
          );
        } else if (payload.status === 'rejected') {
          // Remove from pending
          setPendingRequests(prev => 
            prev.filter(r => r.userId !== payload.fromUserId)
          );
        } else if (payload.status === 'ended') {
          setCurrentController(null);
        }
      }
    }
  });

// ...
  // STEP 2: Add derived state for remote desktop
  const isRemoteDesktopActive = !!remoteDesktopStream;

  // Debug logging for remote desktop

  useEffect(() => {

    console.log('[VideoRoom] ===== REMOTE DESKTOP STATE UPDATE =====');

    console.log('[VideoRoom] isRemoteControlOpen:', isRemoteControlOpen);

    console.log('[VideoRoom] hasRemoteStream:', !!remoteDesktopStream);

    console.log('[VideoRoom] remoteDesktopStream ID:', remoteDesktopStream?.id || 'no-id');

    console.log('[VideoRoom] hasSessionConfig:', !!sessionConfig);

    console.log('[VideoRoom] sessionConfig sessionId:', sessionConfig?.sessionId);

    console.log('[VideoRoom] sessionConfigId:', sessionConfig?.sessionId);

    console.log('[VideoRoom] remoteStreamTracks:', remoteDesktopStream?.getTracks()?.length || 0);

    console.log('[VideoRoom] remoteStream active tracks:', remoteDesktopStream?.getTracks()?.filter(t => t.readyState === "live")?.length || 0);

    console.log('[VideoRoom] permissions:', permissions);

    console.log('[VideoRoom] Should show RemoteVideoArea:', !!(remoteDesktopStream && sessionConfig));



    // Show alert when remote stream is received

    if (remoteDesktopStream && !window._remoteStreamAlertShown) {

      window._remoteStreamAlertShown = true;

      console.log('[VideoRoom] 🎉 REMOTE STREAM RECEIVED! Check if panel is visible...');

      alert('Remote desktop stream received! Panel should be visible now.');

    }

  }, [isRemoteControlOpen, remoteDesktopStream, sessionConfig, permissions]);



  const [isAccessPanelOpen, setIsAccessPanelOpen] = React.useState(false);

  const [currentController, setCurrentController] = React.useState(null);
  const [pendingRequests, setPendingRequests] = React.useState([]);
  const [hostOverride, setHostOverride] = React.useState(null);

  const [accessStateByOwner, setAccessStateByOwner] = React.useState({});

  const [accessPopup, setAccessPopup] = React.useState(null);

  const [requestingByTarget, setRequestingByTarget] = React.useState({});







  // Initialize local media based on initial audio/video flags

  useEffect(() => {

    const constraints = {

      audio: initialAudioEnabled,

      video: initialVideoEnabled ? { width: 1280, height: 720 } : false,

    };



    initializeLocalStream(constraints).catch((error) => {

      console.error('Failed to initialize local media stream:', error);

    });

    // We intentionally run this once on mount to mirror the original behavior

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  // Expose test function globally for debugging

  useEffect(() => {

    if (typeof window !== 'undefined') {

      window.testAddChatMessage = testAddMessage;

      console.log('[VideoRoom] testAddChatMessage function available globally');

    }

  }, [testAddMessage]);



  const { allParticipants } = useMeetingParticipants({

    participants,

    localUserId: userId,

    isScreenSharing,

    screenShareUserId,

  });



  const localAuthUserId = React.useMemo(() => {

    const me = (allParticipants || []).find((p) => p.id === userId);

    return me && me.authUserId ? String(me.authUserId) : null;

  }, [allParticipants, userId]);



  const participantsByAuthId = React.useMemo(() => {

    const map = new Map();

    (allParticipants || []).forEach((p) => {

      if (p && p.authUserId) {

        map.set(String(p.authUserId), p);

      }

    });

    return map;

  }, [allParticipants]);



  const pendingIncomingCount = React.useMemo(() => {
    // Use the new state structure
    return pendingRequests ? pendingRequests.length : 0;
  }, [pendingRequests]);



  const myAccessState = React.useMemo(() => {
    // Use the session-based state for active controller
    const activeController = sessionConfig ? sessionConfig.targetUserId : currentController;
    
    return {
      ownerId: localAuthUserId,
      activeController: activeController,
      pendingRequests: pendingRequests || [],
    };
  }, [localAuthUserId, sessionConfig, currentController, pendingRequests]);



  // Old socket listeners are removed since we're using DeskLink socket system
  // The state is now managed through useDeskLinkSocket handlers above


  const requestAccess = React.useCallback(
    (targetAuthUserId) => {
      // Use the same request system as bottom panel
      const targetParticipant = participantsByAuthId.get(String(targetAuthUserId));
      if (!targetParticipant || !targetParticipant.targetUserId) {
        console.warn('[VideoRoom] Target participant not found or no targetUserId');
        return;
      }
      
      setRequestingByTarget((prev) => ({ ...prev, [String(targetAuthUserId)]: true }));
      
      requestControlForUser({
        targetUserId: targetParticipant.targetUserId,
        targetName: targetParticipant.name || targetParticipant.userName,
        senderAuthId: localAuthUserId
      });
    },
    [participantsByAuthId, localAuthUserId, requestControlForUser]
  );



  const acceptRequest = React.useCallback(
    (requesterAuthUserId) => {
      // Find the incoming request for this user
      if (incomingRequest && String(incomingRequest.fromUserId) === String(requesterAuthUserId)) {
        acceptIncomingRequest();
      }
    },
    [incomingRequest, acceptIncomingRequest]
  );



  const rejectRequest = React.useCallback(
    (requesterAuthUserId) => {
      // Find the incoming request for this user
      if (incomingRequest && String(incomingRequest.fromUserId) === String(requesterAuthUserId)) {
        rejectIncomingRequest();
      }
    },
    [incomingRequest, rejectIncomingRequest]
  );



  const revokeAccess = React.useCallback(() => {
    // End the current session if we're the controller
    if (sessionConfig && sessionConfig.sessionId) {
      // Send end message through the control channel
      sendControlMessage({ type: 'end-session' });
      setCurrentController(null);
    }
  }, [sessionConfig, sendControlMessage]);

  const switchAccess = React.useCallback(
    (targetUserId) => {
      // First revoke current access, then accept new request
      if (sessionConfig) {
        sendControlMessage({ type: 'end-session' });
      }
      
      // Accept the new request
      const targetParticipant = participantsByAuthId.get(String(targetUserId));
      if (targetParticipant && incomingRequest && String(incomingRequest.fromUserId) === String(targetUserId)) {
        acceptIncomingRequest();
      }
    },
    [sessionConfig, sendControlMessage, participantsByAuthId, incomingRequest, acceptIncomingRequest]
  );



  // Debug logs to verify participant and authUserId mapping for remote control

  React.useEffect(() => {

    console.log('[RemoteControl] localUserId:', userId);

    console.log('[RemoteControl] allParticipants (raw):', allParticipants);

    allParticipants?.forEach((p) => {

      console.log('[RemoteControl] participant', {

        meetingUserId: p.id,

        name: p.name,

        authUserId: p.authUserId || null,

      });

    });

  }, [allParticipants, userId]);



  // Build controller candidates: all non-local participants, with a best-effort

  // mapping to a backend user id (authUserId). We do NOT hide the UI when the

  // mapping is missing; instead we mark those entries as non-actionable so the

  // developer can see them and understand why the Request button is disabled.

  const controllerCandidates = React.useMemo(

    () =>

      (allParticipants || [])

        .filter((p) => p.id !== userId)

        .map((p) => ({

          ...p,

          targetUserId: p.authUserId ? String(p.authUserId) : null,

          hasBackendUser: !!p.authUserId,

        })),

    [allParticipants, userId]

  );



  // Agent Status Tracking

  // Moved here to ensure controllerCandidates is defined

  const [agentStatuses, setAgentStatuses] = React.useState({});



  useEffect(() => {

    let active = true;

    const fetchStatuses = async () => {

      if (!controllerCandidates || controllerCandidates.length === 0) return;



      const newStatuses = {};

      await Promise.all(

        controllerCandidates.map(async (p) => {

          if (!p.targetUserId) return;

          const status = await checkUserAgentStatus(p.targetUserId);

          if (active) newStatuses[p.id] = status;

        })

      );



      if (active) setAgentStatuses((prev) => ({ ...prev, ...newStatuses }));

    };



    fetchStatuses();

    const interval = setInterval(fetchStatuses, 30000); // 30s poll

    return () => { active = false; clearInterval(interval); };

  }, [controllerCandidates, checkUserAgentStatus]);



  const {

    hasScreenShare,

    activeScreenShareStream,

    screenShareParticipant,

  } = useScreenShare({

    isScreenSharing,

    screenShareUserId,

    screenShareStream,

    localScreenStream,

    participants,

    localUserId: userId,

  });



  const nonHostParticipants = React.useMemo(

    () => allParticipants.filter((p) => p.id !== userId),

    [allParticipants, userId]

  );



  // Handle leave or end meeting

  const handleLeave = () => {

    if (isHost) {

      // Host ends the meeting for everyone

      endMeeting();

      // onLeave will be called by handleMeetingEnded in useRoomClient

    } else {

      // Regular participant just leaves

      leaveRoom();

      if (onLeave) {

        onLeave();

      }

    }

  };



  // Note: onLeave is now handled in useRoomClient's handleMeetingEnded

  // This ensures all participants see the message before redirecting



  // Show meeting ended message briefly before redirecting

  if (meetingEnded) {

    return (

      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0F172A] text-white">

        <div className="text-center space-y-6 px-6 max-w-md">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 animate-pulse">

            <svg

              className="h-10 w-10 text-red-400"

              fill="none"

              viewBox="0 0 24 24"

              stroke="currentColor"

            >

              <path

                strokeLinecap="round"

                strokeLinejoin="round"

                strokeWidth={2}

                d="M6 18L18 6M6 6l12 12"

              />

            </svg>

          </div>

          <div className="space-y-3">

            <div className="text-3xl font-bold text-slate-200">

              Meeting Ended

            </div>

            <div className="text-lg text-slate-300">

              {isHost

                ? 'You have ended the meeting for all participants.'

                : meetingEndedBy

                  ? `${meetingEndedBy} has ended the meeting.`

                  : 'The host has ended the meeting.'}

            </div>

            <div className="text-sm text-slate-500 pt-4 animate-pulse">

              Redirecting to dashboard...

            </div>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="flex flex-col w-full h-screen bg-slate-950 text-white overflow-hidden relative">

      <div className="absolute top-4 right-4 z-50 pointer-events-auto">

        <button

          type="button"

          onClick={() => setIsAccessPanelOpen((p) => !p)}

          className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800"

          title="Remote Access"

        >

          <MousePointer2 className="w-5 h-5 text-slate-200" />

          {pendingIncomingCount > 0 && (

            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center border border-slate-900">

              {pendingIncomingCount}

            </span>

          )}

        </button>

      </div>



      {isAccessPanelOpen && (

        <div className="pointer-events-auto absolute top-16 right-4 z-50 w-[560px] max-w-[92vw] rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">

            <div className="text-sm font-semibold">Remote Access</div>

            <button

              type="button"

              onClick={() => setIsAccessPanelOpen(false)}

              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded border border-slate-700 hover:border-slate-500"

            >

              Close

            </button>

          </div>

          <div className="grid grid-cols-2 gap-0">

            <div className="border-r border-slate-800">

              <div className="px-4 py-2 text-[11px] uppercase tracking-widest text-slate-500 font-bold">Incoming Requests</div>

              <div className="px-4 pb-4 space-y-2 max-h-[340px] overflow-y-auto">

                {String(myAccessState.ownerId || '') !== String(localAuthUserId || '') ? (

                  <div className="text-slate-500 text-xs">You can manage requests only for your own PC.</div>

                ) : myAccessState.pendingRequests && myAccessState.pendingRequests.length > 0 ? (

                  myAccessState.pendingRequests.map((r) => {

                    const p = participantsByAuthId.get(String(r.userId));

                    const label = (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(r.userId));

                    return (

                      <div key={String(r.userId)} className="flex items-center justify-between rounded-md bg-slate-800/70 px-2 py-2">

                        <div className="text-xs text-slate-100 font-medium">{label}</div>

                        <div className="flex items-center gap-2">

                          <button

                            type="button"

                            onClick={() => acceptRequest(String(r.userId))}

                            className="text-[10px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"

                          >

                            Accept

                          </button>

                          <button

                            type="button"

                            onClick={() => rejectRequest(String(r.userId))}

                            className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"

                          >

                            Reject

                          </button>

                        </div>

                      </div>

                    );

                  })

                ) : (

                  <div className="text-slate-500 text-xs">No incoming requests.</div>

                )}

              </div>

            </div>

            <div>

              <div className="px-4 py-2 text-[11px] uppercase tracking-widest text-slate-500 font-bold">Current Access State</div>

              <div className="px-4 pb-4 space-y-3">

                <div className="rounded-md bg-slate-800/70 px-3 py-3">

                  <div className="text-[11px] text-slate-400">Currently controlling</div>

                  <div className="text-sm font-semibold text-slate-100">

                    {myAccessState.activeController

                      ? (() => {

                        const p = participantsByAuthId.get(String(myAccessState.activeController));

                        return (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(myAccessState.activeController));

                      })()

                      : 'No one'}

                  </div>

                  <div className="mt-2">

                    <button

                      type="button"

                      onClick={revokeAccess}

                      disabled={

                        !myAccessState.activeController ||

                        String(myAccessState.ownerId || '') !== String(localAuthUserId || '')

                      }

                      className={`text-xs px-3 py-1.5 rounded-md text-white ${!myAccessState.activeController || String(myAccessState.ownerId || '') !== String(localAuthUserId || '')

                        ? 'bg-slate-700 opacity-50 cursor-not-allowed'

                        : 'bg-red-600 hover:bg-red-500'

                        }`}

                    >

                      Revoke Access

                    </button>

                  </div>

                </div>



                {String(myAccessState.ownerId || '') === String(localAuthUserId || '') && (

                  <div className="rounded-md bg-slate-800/50 px-3 py-3">

                    <div className="text-[11px] text-slate-400">Quick switch</div>

                    <div className="mt-2 space-y-2 max-h-[180px] overflow-y-auto">

                      {(myAccessState.pendingRequests || []).map((r) => {

                        const p = participantsByAuthId.get(String(r.userId));

                        const label = (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(r.userId));

                        return (

                          <button

                            key={String(r.userId)}

                            type="button"

                            onClick={() => switchAccess(String(r.userId))}

                            className="w-full flex items-center justify-between rounded-md bg-slate-900/60 hover:bg-slate-900 px-2 py-2"

                          >

                            <span className="text-xs text-slate-200 font-medium">{label}</span>

                            <span className="text-[10px] text-slate-400">Accept & Switch</span>

                          </button>

                        );

                      })}

                      {(!myAccessState.pendingRequests || myAccessState.pendingRequests.length === 0) && (

                        <div className="text-slate-500 text-xs">No pending users.</div>

                      )}

                    </div>

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      )}



      {reactions && reactions.length > 0 && (

        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center z-30 overflow-visible">

          {reactions.map((reaction) => (

            <div key={reaction.id} className="mx-1 text-3xl emoji-float drop-shadow-lg">

              {reaction.emoji}

            </div>

          ))}

        </div>

      )}



      {/* Host notice toast (e.g. "Host muted you") */}

      {hostNotice && (

        <div className="pointer-events-none absolute top-4 right-4 z-40">

          <div className="rounded-md bg-slate-900/90 border border-slate-700 px-3 py-2 text-xs text-slate-100 shadow-lg">

            {hostNotice}

          </div>

        </div>

      )}



      {/* In-Meeting Remote Control Panel (VisionDesk Control Mode) */}
      {/* HIDE when remote desktop is active in main stage */}
      {isRemoteControlOpen && !isRemoteDesktopActive && (

        <div className="pointer-events-auto absolute bottom-28 right-6 z-40 w-[420px] max-w-[90vw]">

          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[260px]">

            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">

              <div className="flex flex-col">

                <span className="text-xs font-semibold text-slate-100">Remote Control</span>

                <span className="text-[10px] text-slate-400">In-meeting VisionDesk Control Mode</span>

              </div>

              <button

                type="button"

                onClick={toggleRemoteControlPanel}

                className="text-slate-400 hover:text-slate-100 text-xs px-2 py-1 rounded-md hover:bg-slate-800"

              >

                Close

              </button>

            </div>

            <div className="flex-1 bg-slate-950/80 p-2">

              {remoteDesktopStream ? (

                <RemoteVideoArea

                  stream={remoteDesktopStream}

                  onControlMessage={sendControlMessage}

                  sessionId={sessionConfig?.sessionId || ''}

                  token={sessionConfig?.sessionToken || ''}

                  permissions={permissions}

                  stats={remoteStats}

                />

              ) : (

                <div className="flex flex-col h-full text-xs text-slate-300">

                  <div className="mb-2 text-[11px] font-medium text-slate-200">Request control from someone in this meeting</div>

                  <div className="flex-1 overflow-auto rounded-lg bg-slate-900/70 border border-slate-800 p-2 space-y-1">

                    {controllerCandidates.length === 0 ? (

                      <div className="text-slate-500 text-[11px] text-center py-6">

                        Remote control unavailable: no participants with a resolved backend userId.

                      </div>

                    ) : (

                      controllerCandidates.map((p) => {

                        const isAgentOnline = agentStatuses[p.id] === 'online';

                        const statusColor = isAgentOnline ? 'bg-emerald-500' : 'bg-slate-600';

                        const statusText = isAgentOnline ? 'Ready' : 'Agent Offline';



                        return (

                          <div

                            key={p.id}

                            className="flex items-center justify-between rounded-md bg-slate-800/80 px-2 py-1"

                          >

                            <div className="flex flex-col">

                              <span className="text-[11px] font-medium text-slate-100 flex items-center gap-2">

                                {p.name || 'Participant'}

                                <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} title={statusText}></span>

                              </span>

                              <span className="text-[10px] text-slate-500 break-all">

                                {p.targetUserId ? (

                                  isAgentOnline ? 'Agent Ready' : 'Agent Not Detected'

                                ) : 'Not Registered'}

                              </span>

                            </div>

                            <div className="flex flex-col items-end gap-0.5">
                              <button
                                className="bg-blue-500 text-white px-3 py-1 rounded text-[10px] disabled:opacity-50 hover:bg-blue-400"
                                disabled={!p.targetUserId || !isAgentOnline || !meetingSocketReady}
                                onClick={() => {
                                  if (!meetingSocketReady) {
                                    console.warn('[VideoRoom] Request Access clicked but meetingSocket not ready yet');
                                    return;
                                  }
                                  console.log('[VideoRoom] Request Control clicked for', p.id, 'targetUserId:', p.targetUserId);
                                  requestControlForUser({
                                    targetUserId: p.targetUserId,
                                    targetName: p.name || p.userName,
                                    senderAuthId: localAuthUserId
                                  });
                                }}
                              >
                                {meetingSocketReady ? 'Request Control' : 'Connecting...'}
                              </button>
                            </div>

                          </div>

                        );

                      })

                    )
                    }

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}





      {/* Main Content Area */}

      <div className="flex-1 overflow-hidden flex">

        {isParticipantsOpen && (

          <div className="w-64 max-w-xs border-r border-slate-800 bg-slate-900/80 flex flex-col">

            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">

              <div className="text-sm font-semibold">Participants</div>

              <button

                type="button"

                onClick={() => setIsParticipantsOpen(false)}

                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded border border-slate-700 hover:border-slate-500"

              >

                Close

              </button>

            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 text-xs bg-slate-950/60">

              {allParticipants && allParticipants.length > 0 ? (

                allParticipants.map((p) => (

                  <div

                    key={p.id}

                    className="flex items-center justify-between rounded-md px-2 py-1 bg-slate-800/80 text-slate-100"

                  >

                    <span className="text-[12px] font-medium">

                      {p.name || p.userName || (p.id === userId ? 'You' : 'Participant')}

                    </span>

                    <div className="flex items-center gap-2">

                      {p.isHost && (

                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-50 border border-emerald-500/70">

                          Host

                        </span>

                      )}

                      {p.id !== userId && p.authUserId && localAuthUserId && (

                        <button

                          type="button"

                          onClick={() => requestAccess(String(p.authUserId))}

                          disabled={!!requestingByTarget[String(p.authUserId)]}

                          className={`text-[10px] px-2 py-1 rounded border ${requestingByTarget[String(p.authUserId)]

                            ? 'border-slate-600 text-slate-400 cursor-not-allowed'

                            : 'border-purple-500/60 text-purple-100 hover:bg-purple-600/20'

                            }`}

                        >

                          {requestingByTarget[String(p.authUserId)] ? 'Request Sent' : 'Request Access'}

                        </button>

                      )}

                    </div>

                  </div>

                ))

              ) : (

                <div className="text-center text-slate-500 text-[11px] mt-4">

                  No participants

                </div>

              )}

            </div>

          </div>

        )}



        {accessPopup && !!localAuthUserId && (

          <div className="pointer-events-auto absolute top-16 left-1/2 -translate-x-1/2 z-50">

            <div className="rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl px-4 py-3 flex items-center gap-3">

              <div className="text-xs text-slate-200">

                {(() => {

                  const p = participantsByAuthId.get(String(accessPopup.requesterId));

                  const label = (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(accessPopup.requesterId));

                  return `${label} is requesting access to your PC`;

                })()}

              </div>

              <button

                type="button"

                onClick={() => {

                  acceptRequest(String(accessPopup.requesterId));

                  setAccessPopup(null);

                }}

                className="text-[10px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"

              >

                Accept

              </button>

              <button

                type="button"

                onClick={() => {

                  rejectRequest(String(accessPopup.requesterId));

                  setAccessPopup(null);

                }}

                className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"

              >

                Reject

              </button>

              <button

                type="button"

                onClick={() => setAccessPopup(null)}

                className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-slate-500"

              >

                Dismiss

              </button>

            </div>

          </div>

        )}



        <div className={isChatOpen ? 'flex-1 overflow-hidden' : 'flex-1 overflow-hidden'}>

          {(hasScreenShare && activeScreenShareStream) || isRemoteDesktopActive ? (

            // Screen Share Layout: Large screen on left, participants on right
            // Remote Desktop Layout: Large desktop on left, participants on right

            <ScreenShareView

              screenStream={activeScreenShareStream || remoteDesktopStream}

              presenter={screenShareParticipant || { name: 'Remote Desktop' }}

              participants={allParticipants}

              localUserId={userId}

              activeSpeakerId={activeSpeakerId}

              onControlMessage={sendControlMessage}

              sessionId={sessionConfig?.sessionId || ''}

              sessionToken={sessionConfig?.sessionToken || ''}

              permissions={permissions}

              stats={remoteStats}

            />

          ) : (

            // Grid Layout: All participants in grid

            <MeetingGrid

              participants={allParticipants}

              localUserId={userId}

              activeSpeakerId={activeSpeakerId}

            />

          )}

        </div>



        {isChatOpen && (

          <div className="w-80 max-w-xs border-l border-slate-800 bg-slate-900/80">

            <MeetingChatPanel

              messages={chatMessages}

              currentUserId={userId}

              onSendMessage={sendChatMessage}

              onClose={() => setIsChatOpen(false)}

              isChatDisabled={!isHost && hostChatDisabled}

            />

          </div>

        )}

      </div>



      {/* Controls Bar */}

      <ControlBar

        isAudioEnabled={isAudioEnabled}

        isVideoEnabled={isVideoEnabled}

        isScreenSharing={isScreenSharing && screenShareUserId === userId}

        onToggleAudio={() => {

          if (!isHost && hostMicLocked) return;

          toggleAudio(!isAudioEnabled);

        }}

        onToggleVideo={() => {

          if (!isHost && hostCameraLocked) return;

          toggleVideo(!isVideoEnabled);

        }}

        onScreenShare={

          isScreenSharing && screenShareUserId === userId

            ? stopScreenShare

            : startScreenShare

        }

        onLeave={handleLeave}

        participantCount={allParticipants.length}

        roomId={roomId}

        isHost={isHost}

        onEndMeeting={isHost ? endMeeting : undefined}

        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}

        onToggleChat={() => setIsChatOpen((prev) => !prev)}

        onToggleReactions={() => setIsReactionsOpen((prev) => !prev)}

        onToggleHostTools={() => setIsHostPanelOpen((prev) => !prev)}

        canUseMic={isHost || !hostMicLocked}

        canUseCamera={isHost || !hostCameraLocked}

        isChatDisabled={hostChatDisabled}

        isRemoteControlOpen={isRemoteControlOpen}

        onToggleRemoteControl={toggleRemoteControlPanel}

      />



      {isReactionsOpen && (

        <div className="pointer-events-auto absolute bottom-28 left-1/2 -translate-x-1/2 z-40">

          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3 py-2 shadow-lg">

            {REACTION_EMOJIS.map((emoji) => (

              <button

                key={emoji}

                type="button"

                onClick={() => {

                  sendReaction(emoji);

                  setIsReactionsOpen(false);

                }}

                className="text-xl hover:scale-125 transition-transform"

              >

                {emoji}

              </button>

            ))}

          </div>

        </div>

      )}



      {isHost && isHostPanelOpen && (

        <div className="pointer-events-auto absolute bottom-28 right-6 z-40">

          <div className="w-64 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl p-3 space-y-3 text-xs">

            <div className="flex items-center justify-between">

              <span className="font-semibold text-slate-100">Host Controls</span>

              <button

                type="button"

                onClick={() => setIsHostPanelOpen(false)}

                className="text-slate-400 hover:text-slate-200 text-[10px] px-1"

              >

                Close

              </button>

            </div>



            <button

              type="button"

              onClick={muteAllParticipants}

              className="w-full rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5"

            >

              Mute all participants

            </button>



            <div className="space-y-1">

              <div className="flex items-center justify-between">

                <span className="text-[11px] text-slate-200">Participants can unmute</span>

                <button

                  type="button"

                  onClick={() => setMicLock(!hostMicLocked)}

                  className={`px-2 py-0.5 rounded-full text-[10px] border ${hostMicLocked

                    ? 'bg-slate-800 border-slate-600 text-slate-200'

                    : 'bg-emerald-700/70 border-emerald-500 text-emerald-50'

                    }`}

                >

                  {hostMicLocked ? 'Disabled' : 'Allowed'}

                </button>

              </div>



              <div className="flex items-center justify-between">

                <span className="text-[11px] text-slate-200">Participants camera</span>

                <button

                  type="button"

                  onClick={() => setCameraLock(!hostCameraLocked)}

                  className={`px-2 py-0.5 rounded-full text-[10px] border ${hostCameraLocked

                    ? 'bg-slate-800 border-slate-600 text-slate-200'

                    : 'bg-emerald-700/70 border-emerald-500 text-emerald-50'

                    }`}

                >

                  {hostCameraLocked ? 'Disabled' : 'Allowed'}

                </button>

              </div>



              <div className="flex items-center justify-between">

                <span className="text-[11px] text-slate-200">Chat for participants</span>

                <button

                  type="button"

                  onClick={() => setChatDisabled(!hostChatDisabled)}

                  className={`px-2 py-0.5 rounded-full text-[10px] border ${hostChatDisabled

                    ? 'bg-slate-800 border-slate-600 text-slate-200'

                    : 'bg-emerald-700/70 border-emerald-500 text-emerald-50'

                    }`}

                >

                  {hostChatDisabled ? 'Disabled' : 'Allowed'}

                </button>

              </div>

            </div>



            <div className="space-y-1">

              <span className="text-[11px] text-slate-200">Remove participant</span>

              <div className="flex items-center gap-2 mt-1">

                <select

                  value={selectedParticipantId}

                  onChange={(e) => setSelectedParticipantId(e.target.value)}

                  className="flex-1 bg-slate-800 border border-slate-600 text-[11px] rounded px-2 py-1 outline-none focus:border-blue-500"

                >

                  <option value="">Select...</option>

                  {nonHostParticipants.map((p) => (

                    <option key={p.id} value={p.id}>

                      {p.name || 'Participant'}

                    </option>

                  ))}

                </select>

                <button

                  type="button"

                  disabled={!selectedParticipantId}

                  onClick={() => {

                    if (!selectedParticipantId) return;

                    removeParticipant(selectedParticipantId);

                    setSelectedParticipantId('');

                  }}

                  className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-[11px] text-white disabled:opacity-60 disabled:cursor-not-allowed"

                >

                  Remove

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* Incoming DeskLink request modal (owner side) */}

      {incomingRequest && (

        <IncomingRequestModal
          requesterName={incomingRequest.callerName || 'Remote user'}
          deviceLabel={incomingRequest.receiverDeviceId || 'this device'}
          onAccept={acceptIncomingRequest}
          onReject={rejectIncomingRequest}
        />

      )}

    </div>

  );

}

const DiagnosticLogger = ({ p, requestingByTarget, meetingSocketReady, sessionConfig, remoteDesktopStream, isHost }) => {
  React.useEffect(() => {
    console.log('[RemoteControl-Diag]', {
      participant: p.name || p.userName,
      authUserId: p.authUserId,
      sessionConfig: !!sessionConfig,
      remoteDesktopStream: !!remoteDesktopStream,
      isHost,
      socketConnected: meetingSocketReady,
      disabledCondition: !!requestingByTarget[String(p.authUserId)] || !meetingSocketReady
    });
  }, [p.name, p.userName, p.authUserId, requestingByTarget, meetingSocketReady, sessionConfig, remoteDesktopStream, isHost]);
  return null;
};


export default function VideoRoom(props) {

  const derivedLocalAuthUserId = (() => {

    try {

      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('vd_user_profile') : null;

      if (!raw) return null;

      const profile = JSON.parse(raw);

      return profile?.id ? String(profile.id) : null;

    } catch {

      return null;

    }

  })();



  return (

    <MeetingRemoteControlProvider meetingId={props.roomId} localAuthUserId={derivedLocalAuthUserId}>

      <VideoRoomInner {...props} />

      <WebRTCDebugPanel />

    </MeetingRemoteControlProvider>

  );

}

