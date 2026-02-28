import { useEffect, useRef } from 'react';
import { getSocket } from '../../../socket.js';

export function useChatSocket({ token, onMessage }) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const attachedSocketListenerRef = useRef(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token) return;

    const handlePrivateMessage = (msg) => {
      console.log('[socket] private-message received', msg);
      onMessageRef.current?.(msg);
    };

    let active = true;
    let cleanupSocket = null;

    getSocket(token).then(socket => {
      if (!active) return;
      socketRef.current = socket;
      cleanupSocket = socket;
      socket.on('private-message', handlePrivateMessage);
      attachedSocketListenerRef.current = handlePrivateMessage;
    }).catch(err => {
      console.error('[useChatSocket] Failed to get global socket:', err);
    });

    return () => {
      active = false;
      const s = cleanupSocket || socketRef.current;
      if (s && attachedSocketListenerRef.current) {
        s.off('private-message', attachedSocketListenerRef.current);
      }
      socketRef.current = null;
    };
  }, [token]);

  const sendMessage = (toPhone, text) => {
    if (!socketRef.current) return;
    socketRef.current.emit('private-message', { to: toPhone, text });
  };

  return { sendMessage };
}
