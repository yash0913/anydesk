import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../socket.js';

export function useDeskLinkSocket({ token, onRemoteRequest, onRemoteResponse }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Keep latest callbacks in refs so we don't have to recreate the socket when they change
  const onRemoteRequestRef = useRef(onRemoteRequest);
  const onRemoteResponseRef = useRef(onRemoteResponse);

  useEffect(() => {
    onRemoteRequestRef.current = onRemoteRequest;
  }, [onRemoteRequest]);

  useEffect(() => {
    onRemoteResponseRef.current = onRemoteResponse;
  }, [onRemoteResponse]);

  // Create the socket once per token (or when token changes)
  useEffect(() => {
    const effectiveToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('vd_auth_token')
        : null);

    if (!effectiveToken) {
      console.warn('[useDeskLinkSocket] no token available yet; socket will not connect');
      return;
    }

    // Create/get global socket instance
    getSocket(effectiveToken).then(s => {
      socketRef.current = s;
      setSocket(s);
      console.log('[useDeskLinkSocket] Global socket connected:', s.id);

      // Expose as shared socket for other modules (e.g. useDeskLinkWebRTC)
      try { window.__desklinkSocket = s; } catch (e) {}

      s.on('connect', () => {
        console.log('[useDeskLinkSocket] connected', s.id);
      });

      s.on('disconnect', (reason) => {
        console.log('[useDeskLinkSocket] disconnected', reason);
      });

      s.on('connect_error', (err) => {
        try {
          console.error('[useDeskLinkSocket] connect_error', err && (err.message || JSON.stringify(err)));
        } catch (e) {
          console.error('[useDeskLinkSocket] connect_error', err);
        }
      });

      // app events (use refs so we don't recreate handlers)
      s.on('desklink-remote-request', (payload) => {
        console.log('[useDeskLinkSocket] remote-request', payload);
        onRemoteRequestRef.current?.(payload);
      });

      s.on('desklink-remote-response', (payload) => {
        console.log('[useDeskLinkSocket] remote-response', payload);
        onRemoteResponseRef.current?.(payload);
      });

      // AnyDesk-style event names
      s.on('remote-access-request', (payload) => {
        console.log('[useDeskLinkSocket] remote-access-request', payload);
        onRemoteRequestRef.current?.(payload);
      });

      s.on('remote-access-accepted', (payload) => {
        console.log('[useDeskLinkSocket] remote-access-accepted', payload);
        onRemoteResponseRef.current?.({ ...payload, status: payload.status || 'accepted' });
      });

      s.on('remote-access-rejected', (payload) => {
        console.log('[useDeskLinkSocket] remote-access-rejected', payload);
        onRemoteResponseRef.current?.({ ...payload, status: payload.status || 'rejected' });
      });
    }).catch(err => {
      console.error('[useDeskLinkSocket] Failed to get socket:', err);
    });

    return () => {
      try {
        const globalSocket = typeof window !== 'undefined' ? window.__desklinkSocket : null;
        const weCreatedShared = globalSocket === socketRef.current;
        console.log(
          weCreatedShared
            ? '[useDeskLinkSocket] cleanup: we created the shared socket — leaving it connected'
            : '[useDeskLinkSocket] cleanup: not owner of shared socket — leaving it connected'
        );
      } catch (err) {
        console.warn('[useDeskLinkSocket] cleanup error', err);
      }
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  return { socket };
}
