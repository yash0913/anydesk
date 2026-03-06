import React, { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  Users, MessageSquare, Smile, Settings, Info,
  MoreVertical, MousePointer2, X,
} from 'lucide-react';

export default function ControlsBar({
  isAudioEnabled, isVideoEnabled, isScreenSharing, onToggleAudio, onToggleVideo,
  onScreenShare, onLeave, onEndMeeting, participantCount, roomId, isHost = false,
  onToggleParticipants, onToggleChat, onToggleReactions, onToggleHostTools,
  canUseMic = true, canUseCamera = true, isChatDisabled = false,
  isRemoteControlOpen = false, onToggleRemoteControl,
  pendingRequestCount = 0,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Helper for button styles to keep code clean
  const btnBase = "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl transition-all duration-200 active:scale-90 shadow-lg flex-shrink-0";
  const btnSecondary = "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 backdrop-blur-md";

  return (
    <>
      {/* Hover area at bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-16 z-40"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Control Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 lg:px-6 transition-transform duration-300 ease-out ${
          isHovered ? 'translate-y-0' : 'translate-y-full'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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

              {/* Chat & Reactions - always visible on mobile */}
              <button onClick={onToggleChat} className={`${btnBase} ${btnSecondary}`}>
                <MessageSquare size={18} />
              </button>
              <button onClick={onToggleReactions} className={`${btnBase} ${btnSecondary}`}>
                <Smile size={18} />
              </button>
            </div>

            {/* Mobile hamburger menu */}
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${btnBase} ${btnSecondary}`}
                title="More options"
              >
                {isMobileMenuOpen ? <X size={20} /> : <MoreVertical size={20} />}
              </button>

              {/* Mobile menu dropdown */}
              {isMobileMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-2 space-y-1 z-[60]">
                  {/* Screen Share */}
                  <button
                    onClick={() => {
                      onScreenShare();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Monitor size={18} />
                    <span className="text-sm font-medium">
                      {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                    </span>
                  </button>

                  {/* Remote Control */}
                  <button
                    onClick={() => {
                      onToggleRemoteControl();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isRemoteControlOpen ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <div className="relative">
                      <MousePointer2 size={18} />
                      {pendingRequestCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                          {pendingRequestCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">Remote Control</span>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      onToggleHostTools && onToggleHostTools();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  {/* Participants */}
                  <button
                    onClick={() => {
                      onToggleParticipants();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Users size={18} />
                    <span className="text-sm font-medium">Participants ({participantCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Leave button */}
            <button
              onClick={isHost && onEndMeeting ? onEndMeeting : onLeave}
              className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 p-2 rounded-2xl transition-all duration-300 flex-shrink-0"
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

      {/* Close mobile menu when clicking outside */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}