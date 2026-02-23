import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, Play, X, ChevronUp, Camera } from 'lucide-react';

export default function NewMeetingPreview({ onClose, onStart }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Real-time audio level monitoring
  const monitorAudio = useCallback((stream) => {
    if (!stream.getAudioTracks().length) return;

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setAudioLevel(average);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }, []);

  const updateStream = async (audioId, videoId) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        audio: isAudioEnabled ? { deviceId: audioId ? { exact: audioId } : undefined } : false,
        video: isVideoEnabled ? {
          deviceId: videoId ? { exact: videoId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (isAudioEnabled) monitorAudio(stream);
    } catch (error) {
      console.error('Error updating stream:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);

        const aId = audioInputs[0]?.deviceId;
        const vId = videoInputs[0]?.deviceId;
        setSelectedAudioDevice(aId);
        setSelectedVideoDevice(vId);

        initialStream.getTracks().forEach(t => t.stop());
        await updateStream(aId, vId);
      } catch (error) {
        console.error('Initialization failed', error);
      }
    };
    init();

    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && localStream && isVideoEnabled) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Preview area */}
        <div className="flex-[1.5] relative bg-black aspect-video md:aspect-auto flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          {isVideoEnabled && localStream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover mirror"
              />
              <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Preview</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                <Camera className="w-10 h-10 text-slate-500" />
              </div>
              <div>
                <p className="text-white font-medium">Camera is paused</p>
                <p className="text-slate-500 text-sm">Others won't see you until you join</p>
              </div>
            </div>
          )}

          {/* Audio Visualizer Overlay */}
          {isAudioEnabled && (
            <div className="absolute bottom-4 left-4 flex gap-[2px] items-end h-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(20, (audioLevel / 100) * (100 - i * 5))}%` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Settings & Actions */}
        <div className="flex-1 flex flex-col p-8 bg-slate-900/50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
              <p className="text-slate-400 text-sm mt-1">Check your setup before entering</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Audio Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audio Input</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${isAudioEnabled
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  <span className="font-medium text-sm">{isAudioEnabled ? 'Mic On' : 'Mic Off'}</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                    className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className={`w-5 h-5 transition-transform ${showAudioDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showAudioDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-20">
                      {audioDevices.map(d => (
                        <button
                          key={d.deviceId}
                          onClick={() => { setSelectedAudioDevice(d.deviceId); setShowAudioDropdown(false); updateStream(d.deviceId, selectedVideoDevice); }}
                          className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-colors ${selectedAudioDevice === d.deviceId ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                          {d.label || 'Default Microphone'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Input</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${isVideoEnabled
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  <span className="font-medium text-sm">{isVideoEnabled ? 'Video On' : 'Video Off'}</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowVideoDropdown(!showVideoDropdown)}
                    className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className={`w-5 h-5 transition-transform ${showVideoDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showVideoDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-20">
                      {videoDevices.map(d => (
                        <button
                          key={d.deviceId}
                          onClick={() => { setSelectedVideoDevice(d.deviceId); setShowVideoDropdown(false); updateStream(selectedAudioDevice, d.deviceId); }}
                          className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-colors ${selectedVideoDevice === d.deviceId ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                          {d.label || 'Default Camera'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => onStart({ localStream, isAudioEnabled, isVideoEnabled, selectedAudioDevice, selectedVideoDevice })}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Meeting
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
}