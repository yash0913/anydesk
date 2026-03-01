/**

 * VideoRoom - Main meeting room component with Zoom-like layout

 * Handles grid layout and screen share layout with sidebar

 */



import React, { useEffect } from 'react';

import { useRoomClient } from './useRoomClient.js';

import { useMeetingParticipants } from './useMeetingParticipants.js';

import { useScreenShare } from './useScreenShare.js';

import MeetingGrid from './MeetingGrid.jsx';

import ControlBar from './ControlBar.jsx';

import ScreenShareView from './ScreenShareView.jsx';

import MeetingChatPanel from './MeetingChatPanel.jsx';

import { MeetingRemoteControlProvider, useMeetingRemoteControl } from './meetingRemoteControlContext.jsx';

import RemoteVideoArea from '../../modules/desklink/components/RemoteVideoArea.jsx';

import IncomingRequestModal from '../../modules/desklink/components/IncomingRequestModal.jsx';

import { useDeskLinkSocket } from '../../modules/desklink/hooks/useDeskLinkSocket.js';
import { getSocket } from '../../socket.js';
import { MousePointer2 } from 'lucide-react';

import { WebRTCDebugPanel } from "./WebRTCDebugPanel";
import { RemoteAccessProvider } from "./RemoteAccessContext.jsx";
import { useRemoteAccess } from "./RemoteAccessContext.jsx";



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

  // Use centralized remote access state
  const {
    currentController,
    pendingRequests,
    hostOverride,
    requestAccess,
    acceptRequest,
    rejectRequest,
    revokeAccess,
    switchAccess,
    setParticipants,
    hasControl,
    isController
  } = useRemoteAccess();

  // Update participants list when it changes
  useEffect(() => {
    setParticipants(allParticipants);
  }, [allParticipants, setParticipants]);

  // Debug logs to track state updates
  useEffect(() => {
    console.log('[RemoteAccess] TOP PANEL STATE UPDATE:', {
      currentController,
      pendingRequests,
      hostOverride,
      hasControl,
      isController
    });
  }, [currentController, pendingRequests, hostOverride, hasControl, isController]);



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

    if (!localAuthUserId) return 0;

    const mine = accessStateByOwner[String(localAuthUserId)];

    const pending = mine && Array.isArray(mine.pendingRequests) ? mine.pendingRequests : [];

    return pending.length;

  }, [accessStateByOwner, localAuthUserId]);



  const myAccessState = React.useMemo(() => {

    if (!localAuthUserId) return { ownerId: null, activeController: null, pendingRequests: [] };

    const mine = accessStateByOwner[String(localAuthUserId)] || null;

    return {

      ownerId: localAuthUserId,

      activeController: mine ? mine.activeController || null : null,

      pendingRequests: mine && Array.isArray(mine.pendingRequests) ? mine.pendingRequests : [],

    };

  }, [accessStateByOwner, localAuthUserId]);



  useEffect(() => {

    const socket = meetingSocket;

    if (!socket) return;



    const handleAccessState = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      if (!payload.ownerId) return;

      const ownerId = String(payload.ownerId);

      setAccessStateByOwner((prev) => ({

        ...prev,

        [ownerId]: {

          ownerId,

          activeController: payload.activeController || null,

          pendingRequests: Array.isArray(payload.pendingRequests) ? payload.pendingRequests : [],

        },

      }));

    };



    const handleIncoming = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      if (localAuthUserId && payload.ownerId && String(payload.ownerId) !== String(localAuthUserId)) return;

      setAccessPopup({

        requesterId: payload.requesterId,

        requestedAt: payload.requestedAt || Date.now(),

      });

    };



    const handleGranted = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      const ownerId = payload.ownerId;

      setRequestingByTarget((prev) => {

        const next = { ...prev };

        if (ownerId) delete next[String(ownerId)];

        return next;

      });

    };



    const handleRevoked = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      // state is already synced via access-state; keep minimal local cleanup

    };



    const handleRejected = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      const ownerId = payload.ownerId;

      setRequestingByTarget((prev) => {

        const next = { ...prev };

        if (ownerId) delete next[String(ownerId)];

        return next;

      });

    };



    const handleErr = (payload) => {

      if (!payload || String(payload.meetingId || '') !== String(roomId)) return;

      console.warn('[access-error]', payload.message);

    };



    socket.on('access-state', handleAccessState);

    socket.on('incoming-access-request', handleIncoming);

    socket.on('access-granted', handleGranted);

    socket.on('access-revoked', handleRevoked);

    socket.on('access-rejected', handleRejected);

    socket.on('access-error', handleErr);

    return () => {

      socket.off('access-state', handleAccessState);

      socket.off('incoming-access-request', handleIncoming);

      socket.off('access-granted', handleGranted);

      socket.off('access-revoked', handleRevoked);

      socket.off('access-rejected', handleRejected);

      socket.off('access-error', handleErr);

    };

  }, [roomId, localAuthUserId]);



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

                {!isHost ? (

                  <div className="text-slate-500 text-xs">You can manage requests only as host.</div>

                ) : pendingRequests.length > 0 ? (

                  pendingRequests.map((requesterId) => {

                    const p = allParticipants.find(p => p.authUserId === requesterId);

                    const label = (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(requesterId));

                    return (

                      <div key={String(requesterId)} className="flex items-center justify-between rounded-md bg-slate-800/70 px-2 py-2">

                        <div className="text-xs text-slate-100 font-medium">{label}</div>

                        <div className="flex items-center gap-2">

                          <button

                            type="button"

                            onClick={() => acceptRequest(requesterId)}

                            className="text-[10px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"

                          >

                            Accept

                          </button>

                          <button

                            type="button"

                            onClick={() => rejectRequest(requesterId)}

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

                    {currentController

                      ? (() => {

                        const p = allParticipants.find(p => p.authUserId === currentController);

                        return (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(currentController));

                      })()

                      : 'No one'}

                  </div>

                  <div className="mt-2">

                    <button

                      type="button"

                      onClick={revokeAccess}

                      disabled={!currentController || !isHost}

                      className={`text-xs px-3 py-1.5 rounded-md text-white ${!currentController || !isHost

                        ? 'bg-slate-700 opacity-50 cursor-not-allowed'

                        : 'bg-red-600 hover:bg-red-500'

                        }`}

                    >

                      Revoke Access

                    </button>

                  </div>

                </div>



                {isHost && (

                  <div className="rounded-md bg-slate-800/50 px-3 py-3">

                    <div className="text-[11px] text-slate-400">Quick switch</div>

                    <div className="mt-2 space-y-2 max-h-[180px] overflow-y-auto">

                      {pendingRequests.map((requesterId) => {

                        const p = allParticipants.find(p => p.authUserId === requesterId);

                        const label = (p && (p.name || p.userName)) ? (p.name || p.userName) : shortId(String(requesterId));

                        return (

                          <button

                            key={String(requesterId)}

                            type="button"

                            onClick={() => acceptRequest(requesterId)}

                            className="w-full flex items-center justify-between rounded-md bg-slate-900/60 hover:bg-slate-900 px-2 py-2"

                          >

                            <span className="text-xs text-slate-200 font-medium">{label}</span>

                            <span className="text-[10px] text-slate-400">Accept & Switch</span>

                          </button>

                        );

                      })}

                      {pendingRequests.length === 0 && (

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

                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700">

                            <div className="flex items-center gap-2">

                              <div className={`w-2 h-2 rounded-full ${statusColor}`} />

                              <span className="text-slate-200">{p.name || p.userName}</span>

                              <span className="text-slate-500 text-[10px]">{statusText}</span>

                            </div>

                            <div className="flex items-center gap-2">

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



  // Get socket for RemoteAccessProvider
  const [socket, setSocket] = React.useState(null);

  React.useEffect(() => {
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

    getSocket(authToken).then(s => {
      if (!active) return;
      setSocket(s);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MeetingRemoteControlProvider meetingId={props.roomId} localAuthUserId={derivedLocalAuthUserId}>
      <RemoteAccessProvider 
        roomId={props.roomId} 
        userId={userId || derivedLocalAuthUserId} 
        isHost={props.isHost}
        socket={socket}
      >
        <VideoRoomInner {...props} />
        <WebRTCDebugPanel />
      </RemoteAccessProvider>
    </MeetingRemoteControlProvider>
  );

}

