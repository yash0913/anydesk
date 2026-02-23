import React from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  Users, MessageSquare, Smile, Settings, Info,
  MoreVertical, Share2,
} from 'lucide-react';

export default function ControlsBar({
  isAudioEnabled, isVideoEnabled, isScreenSharing, onToggleAudio, onToggleVideo,
  onScreenShare, onLeave, onEndMeeting, participantCount, roomId, isHost = false,
  onToggleParticipants, onToggleChat, onToggleReactions, onToggleHostTools,
  canUseMic = true, canUseCamera = true, isChatDisabled = false,
  isRemoteControlOpen = false, onToggleRemoteControl,
}) {

  // Helper for button styles to keep code clean
  const btnBase = "flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 active:scale-90 shadow-lg";
  const btnSecondary = "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 backdrop-blur-md";

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6">
      <div className="max-w-6xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-[28px] p-3 shadow-2xl flex items-center justify-between">

        {/* Left Section: Meeting Status */}
        <div className="hidden md:flex items-center gap-3 pl-4">
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
        <div className="flex items-center gap-3">
          {/* Audio */}
          <button
            onClick={onToggleAudio}
            className={`${btnBase} ${isAudioEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white animate-pulse-subtle'}`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Video */}
          <button
            onClick={onToggleVideo}
            className={`${btnBase} ${isVideoEnabled ? btnSecondary : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Interactive Tools Group */}
          <div className="flex items-center gap-2 bg-slate-800/40 p-1 rounded-2xl border border-slate-700/30">
            <button onClick={onToggleChat} className={`${btnBase} ${btnSecondary} border-none shadow-none`}>
              <MessageSquare size={20} />
            </button>
            <button onClick={onToggleReactions} className={`${btnBase} ${btnSecondary} border-none shadow-none`}>
              <Smile size={20} />
            </button>
            <button onClick={onScreenShare} className={`${btnBase} ${isScreenSharing ? 'bg-blue-600 text-white' : btnSecondary} border-none shadow-none`}>
              <Monitor size={20} />
            </button>
            <button onClick={onToggleRemoteControl} className={`${btnBase} ${isRemoteControlOpen ? 'bg-purple-600 text-white' : btnSecondary} border-none shadow-none`}>
              <Share2 size={20} />
            </button>
          </div>

          {/* Host/Settings */}
          <button className={`${btnBase} ${btnSecondary}`}>
            <Settings size={20} />
          </button>
        </div>

        {/* Right Section: Exit */}
        <div className="pr-2">
          <button
            onClick={isHost && onEndMeeting ? onEndMeeting : onLeave}
            className="group flex items-center gap-3 bg-red-500/10 hover:bg-red-600 border border-red-500/20 px-5 py-2.5 rounded-2xl transition-all duration-300"
          >
            <span className="text-sm font-bold text-red-500 group-hover:text-white transition-colors">
              {isHost ? 'End Meeting' : 'Leave'}
            </span>
            <div className="p-1.5 bg-red-500 rounded-lg text-white">
              <PhoneOff size={16} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}