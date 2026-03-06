import React, { useState, useCallback } from 'react';
import SidebarShell from '../../../chatspace/components/SidebarShell.jsx';
import NewMeetingButton from './NewMeetingButton.jsx';
import JoinMeetingButton from './JoinMeetingButton.jsx';
import SettingsIcon from './SettingsIcon.jsx';
import NewMeetingPreview from '@/components/calling/NewMeetingPreview.jsx';
import JoinMeeting from '@/components/calling/JoinMeeting.jsx';
import VideoRoom from '@/components/calling/VideoRoom.jsx';

export default function MeetDashboard() {
  // Consolidated state for modal visibility
  const [activeModal, setActiveModal] = useState(null); // 'new', 'join', or null
  const [meetingState, setMeetingState] = useState(null);

  const handleStartMeeting = useCallback(async (previewData) => {
    try {
      const roomId = crypto.randomUUID();
      setMeetingState({
        roomId,
        userName: 'You',
        isHost: true,
        localStream: previewData.localStream,
        initialAudioEnabled: previewData.isAudioEnabled,
        initialVideoEnabled: previewData.isVideoEnabled,
      });
      setActiveModal(null);
    } catch (error) {
      console.error('Error starting meeting:', error);
    }
  }, []);

  const handleJoinMeetingSubmit = useCallback(async (joinData) => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(joinData.meetingId)) return alert('Invalid ID');

      const constraints = {
        audio: !joinData.dontConnectAudio,
        video: !joinData.turnOffVideo ? { width: 1280, height: 720 } : false,
      };

      const localStream = await navigator.mediaDevices.getUserMedia(constraints);

      setMeetingState({
        roomId: joinData.meetingId,
        userName: joinData.userName,
        isHost: false,
        localStream,
        initialAudioEnabled: !joinData.dontConnectAudio,
        initialVideoEnabled: !joinData.turnOffVideo,
      });
      setActiveModal(null);
    } catch (error) {
      alert('Media Access Denied. Check Permissions.');
    }
  }, []);

  const handleLeaveMeeting = useCallback(() => {
    if (meetingState?.localStream) {
      meetingState.localStream.getTracks().forEach((track) => track.stop());
    }
    setMeetingState(null);
  }, [meetingState]);

  if (meetingState) {
    return (
      <VideoRoom
        {...meetingState}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-50">
      <SidebarShell />

<main className="relative flex-1 overflow-y-auto custom-scrollbar">        {/* Dynamic Background Glows - Adds Depth */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute -right-[5%] bottom-[5%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        {/* Glassmorphism Outer Container */}
        <div className="relative z-10 flex h-full flex-col px-6 py-8 sm:px-12 lg:px-20">
          
          {/* Header Section */}
          <header className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                VisionDesk <span className="text-blue-500">MeetSpace</span>
              </h1>
              <p className="text-sm text-slate-400">Face-to-face collaboration, instantly.</p>
            </div>
          
          </header>

          {/* Hero Content Area */}
          <div className="flex flex-1 flex-col items-center justify-center space-y-12">
            <div className="flex flex-col items-center text-center space-y-4 max-w-2xl animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">System Ready</span>
              </div>
              
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Seamless meetings, <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  built for VisionDesk.
                </span>
              </h2>
              
              <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                Connect with your team in high-definition. Create instant rooms or join sessions with a code.
              </p>
            </div>

            {/* Action Buttons Container */}
            <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
              <div className="transform transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-orange-500/10">
                <NewMeetingButton onClick={() => setActiveModal('new')} />
              </div>
              <div className="transform transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/10">
                <JoinMeetingButton onClick={() => setActiveModal('join')} />
              </div>
            </div>
          </div>

          {/* Footer Subtle Text */}
<footer className="mt-8 text-center text-[11px] text-slate-600 uppercase tracking-widest pb-4">
              VisionDesk Encrypted Media Protocol 1.0
          </footer>
        </div>
      </main>

      {/* Modals with Clean Transitions */}
      {activeModal === 'new' && (
        <NewMeetingPreview
          onClose={() => setActiveModal(null)}
          onStart={handleStartMeeting}
        />
      )}

      {activeModal === 'join' && (
        <JoinMeeting
          onClose={() => setActiveModal(null)}
          onJoin={handleJoinMeetingSubmit}
        />
      )}
    </div>
  );
}