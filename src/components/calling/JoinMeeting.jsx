import React, { useState, useEffect } from 'react';
import { X, LogIn, Hash, User, MicOff, VideoOff, AlertCircle } from 'lucide-react';

/**
 * JoinMeeting - Professional VisionDesk Join Experience
 */
export default function JoinMeeting({ onClose, onJoin }) {
  const [meetingId, setMeetingId] = useState('');
  const [userName, setUserName] = useState('');
  const [dontConnectAudio, setDontConnectAudio] = useState(false);
  const [turnOffVideo, setTurnOffVideo] = useState(false);
  const [error, setError] = useState('');

  // Persistent user profile loading
  useEffect(() => {
    try {
      const userProfile = localStorage.getItem('vd_user_profile');
      if (userProfile) {
        const user = JSON.parse(userProfile);
        setUserName(user.name || user.username || user.email?.split('@')[0] || '');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, []);

  const handleJoin = () => {
    if (!meetingId.trim()) {
      setError('A valid Meeting ID is required');
      return;
    }
    if (!userName.trim()) {
      setError('Please provide a display name');
      return;
    }

    setError('');
    onJoin({
      meetingId: meetingId.trim(),
      userName: userName.trim(),
      dontConnectAudio,
      turnOffVideo,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header Section */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Join Meeting</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Section */}
        <div className="px-8 py-4 space-y-6">

          {/* Inputs */}
          <div className="space-y-4">
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Hash className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={meetingId}
                onChange={(e) => { setMeetingId(e.target.value); setError(''); }}
                onKeyDown={handleKeyPress}
                placeholder="Meeting ID or Link"
                className="w-full bg-slate-950/50 border border-white/[0.1] rounded-2xl py-4 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all outline-none"
                autoFocus
              />
            </div>

            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => { setUserName(e.target.value); setError(''); }}
                onKeyDown={handleKeyPress}
                placeholder="Your Display Name"
                className="w-full bg-slate-950/50 border border-white/[0.1] rounded-2xl py-4 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all outline-none"
              />
            </div>
          </div>

          {/* Setting Cards (Replacing simple checkboxes) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDontConnectAudio(!dontConnectAudio)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${dontConnectAudio
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                }`}
            >
              <MicOff className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Mute Mic</span>
            </button>

            <button
              onClick={() => setTurnOffVideo(!turnOffVideo)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${turnOffVideo
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                }`}
            >
              <VideoOff className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Camera Off</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 pb-8 pt-4 flex flex-col gap-3">
          <button
            onClick={handleJoin}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Join Meeting Room
            <LogIn className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-slate-500 font-bold text-xs hover:text-slate-300 transition-colors tracking-widest uppercase"
          >
            Nevermind, Go Back
          </button>
        </div>
      </div>
    </div>
  );
}