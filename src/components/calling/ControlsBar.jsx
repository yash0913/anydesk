import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  Users, MessageSquare, Smile, Settings, Info,
  MousePointer2,
} from 'lucide-react';

export default function ControlsBar({
  isAudioEnabled, isVideoEnabled, isScreenSharing, onToggleAudio, onToggleVideo,
  onScreenShare, onLeave, onEndMeeting, participantCount, roomId, isHost = false,
  onToggleParticipants, onToggleChat, onToggleReactions, onToggleHostTools,
  canUseMic = true, canUseCamera = true, isChatDisabled = false,
  isRemoteControlOpen = false, onToggleRemoteControl,
  pendingRequestCount = 0,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileVisible, setIsMobileVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const isMobileRef = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 1024 || 'ontouchstart' in window;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile tap to show/hide logic
  const handleMeetingAreaTap = () => {
    if (isMobileRef.current) {
      setIsMobileVisible(true);
      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      // Hide after 3 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setIsMobileVisible(false);
      }, 3000);
    }
  };

  // Desktop hover logic
  const handleMouseEnter = () => {
    if (!isMobileRef.current) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileRef.current) {
      setIsHovered(false);
    }
  };

  // Helper for button styles to keep code clean
  const btnBase = "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl transition-all duration-200 active:scale-90 shadow-lg flex-shrink-0";
  const btnSecondary = "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 backdrop-blur-md";

  return (
    <>
      {/* Meeting area tap handler for mobile */}
      <div 
        className="fixed inset-0 z-30 lg:hidden"
        onClick={handleMeetingAreaTap}
        onTouchStart={handleMeetingAreaTap}
      />
      
      {/* Hover area at bottom - desktop only */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-16 z-40 hidden lg:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Control Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 lg:px-6 transition-transform duration-300 ease-out ${
          isMobileRef.current ? (isMobileVisible ? 'translate-y-0' : 'translate-y-full') : 
          (isHovered ? 'translate-y-0' : 'translate-y-full')
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-6xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-[28px] p-3 shadow-2xl flex items-center justify-between gap-3 overflow-x-auto flex-nowrap mb-6">

          {/* Mobile View */}
          <div className="lg:hidden flex items-center gap-2 w-full">
            {/* Core mobile controls */}
            <div className="flex items-center gap-2 flex-1">
              {/* Audio */}
              <button
                onClick={onToggleAudio}
                className={`${btnBase} ${isAudioEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white animate-pulse-subtle'}`}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Video */}
              <button
                onClick={onToggleVideo}
                className={`${btnBase} ${isVideoEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white'}`}
                title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Chat & Reactions */}
              <button onClick={onToggleChat} className={`${btnBase} ${btnSecondary}`}>
                <MessageSquare size={18} />
              </button>
              <button onClick={onToggleReactions} className={`${btnBase} ${btnSecondary}`}>
                <Smile size={18} />
              </button>

              {/* Screen Share */}
              <button
                onClick={onScreenShare}
                className={`${btnBase} ${isScreenSharing ? 'bg-blue-600 text-white' : btnSecondary}`}
                title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
              >
                <Monitor size={18} />
              </button>

              {/* Remote Control */}
              <button
                onClick={onToggleRemoteControl}
                className={`${btnBase} ${isRemoteControlOpen ? 'bg-purple-600 text-white' : btnSecondary}`}
                title="Remote Control"
              >
                <div className="relative">
                  <MousePointer2 size={18} />
                  {pendingRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {pendingRequestCount}
                    </span>
                  )}
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={onToggleHostTools}
                className={`${btnBase} ${btnSecondary}`}
                title="Settings"
              >
                <Settings size={18} />
              </button>

              {/* Participants */}
              <button
                onClick={onToggleParticipants}
                className={`${btnBase} ${btnSecondary}`}
                title="Participants"
              >
                <Users size={18} />
              </button>
            </div>

            {/* Leave button */}
            <button
              onClick={isHost && onEndMeeting ? onEndMeeting : onLeave}
              className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 p-2 rounded-2xl transition-all duration-300 flex-shrink-0"
              title={isHost ? 'End Meeting' : 'Leave'}
            >
              <PhoneOff size={16} className="text-red-500" />
            </button>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:flex items-center gap-3 w-full">
            {/* Left Section: Meeting Status */}
            <div className="flex items-center gap-3 pl-4 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Meeting ID</span>
                <span className="text-sm font-mono text-indigo-400 font-semibold">{roomId}</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-800 mx-2" />
              <button onClick={onToggleParticipants} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">{participantCount}</span>
              </button>
            </div>

            {/* Center Section: Core Controls */}
            <div className="flex items-center gap-3 min-w-max flex-shrink-0 flex-1 justify-center">
              {/* Audio */}
              <button
                onClick={onToggleAudio}
                className={`${btnBase} ${isAudioEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white animate-pulse-subtle'}`}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Video */}
              <button
                onClick={onToggleVideo}
                className={`${btnBase} ${isVideoEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white'}`}
                title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Interactive Tools Group */}
              <div className="flex items-center gap-1.5 bg-slate-800/40 p-1 rounded-xl border border-slate-700/30">
                <button onClick={onToggleChat} className={`${btnBase} ${btnSecondary} border-none shadow-none`}>
                  <MessageSquare size={18} />
                </button>
                <button onClick={onToggleReactions} className={`${btnBase} ${btnSecondary} border-none shadow-none`}>
                  <Smile size={18} />
                </button>
                <button onClick={onScreenShare} className={`${btnBase} ${isScreenSharing ? 'bg-blue-600 text-white' : btnSecondary} border-none shadow-none`}>
                  <Monitor size={18} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button onClick={onToggleRemoteControl} className={`${btnBase} ${isRemoteControlOpen ? 'bg-purple-600 text-white' : btnSecondary} border-none shadow-none`}>
                    <MousePointer2 size={18} />
                  </button>
                  {pendingRequestCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        lineHeight: 1,
                        boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                        pointerEvents: 'none',
                      }}
                    >
                      {pendingRequestCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Host/Settings */}
              <button 
                onClick={onToggleHostTools}
                className={`${btnBase} ${btnSecondary}`}
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Right Section: Exit */}
            <div className="pr-1 sm:pr-2 flex-shrink-0">
              <button
                onClick={isHost && onEndMeeting ? onEndMeeting : onLeave}
                className="group flex items-center gap-2 sm:gap-3 bg-red-500/10 hover:bg-red-600 border border-red-500/20 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl transition-all duration-300 flex-shrink-0"
              >
                <span className="hidden lg:inline text-sm font-bold text-red-500 group-hover:text-white transition-colors">
                  {isHost ? 'End Meeting' : 'Leave'}
                </span>
                <div className="p-1.5 bg-red-500 rounded-lg text-white flex items-center justify-center">
                  <PhoneOff size={16} className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
