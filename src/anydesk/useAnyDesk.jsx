import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useAuth } from "../modules/auth/hooks/useAuth";

export function useAnyDesk(roomId) {
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const { token } = useAuth();

  const socketRef = useRef(null);
  const handlersRef = useRef(null);

  useEffect(() => {
    if (!token || !roomId) return;

    let active = true;
    let cleanupSocket = null;

    const onConnected = () => setConnected(true);
    const onStream = (stream) => setRemoteStream(stream);

    getSocket(token).then(s => {
      if (!active) return;
      socketRef.current = s;
      cleanupSocket = s;
      handlersRef.current = { onConnected, onStream };

      s.emit("anydesk:join", { roomId });
      s.on("anydesk:connected", onConnected);
      s.on("anydesk:stream", onStream);
    });

    return () => {
      active = false;
      const s = cleanupSocket || socketRef.current;
      const h = handlersRef.current;
      if (s && h) {
        s.emit("anydesk:leave", { roomId });
        s.off("anydesk:connected", h.onConnected);
        s.off("anydesk:stream", h.onStream);
      }
      socketRef.current = null;
    };
  }, [roomId, token]);

  return { connected, remoteStream };
}
