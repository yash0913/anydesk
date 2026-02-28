import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../socket.js';

export function useDeskLinkSocket({ token, onRemoteRequest, onRemoteResponse }) {
  const socketRef = useRef(null);
  const attachedSocketListenersRef = useRef({});
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
      console.log('[useDeskLinkSocket] Shared global socket ready:', s.id);

      // app events
      const onRemoteRequest = (payload) => {
        console.log('[useDeskLinkSocket] remote-request', payload);
        onRemoteRequestRef.current?.(payload);
      };

      const onRemoteResponse = (payload) => {
        console.log('[useDeskLinkSocket] remote-response', payload);
        onRemoteResponseRef.current?.(payload);
      };

      // AnyDesk-style event names
      const onAccessRequest = (payload) => {
        console.log('[useDeskLinkSocket] remote-access-request', payload);
        onRemoteRequestRef.current?.(payload);
      };

      const onAccessAccepted = (payload) => {
        console.log('[useDeskLinkSocket] remote-access-accepted', payload);
        onRemoteResponseRef.current?.({ ...payload, status: payload.status || 'accepted' });
      };

      const onAccessRejected = (payload) => {
        console.log('[useDeskLinkSocket] remote-access-rejected', payload);
        onRemoteResponseRef.current?.({ ...payload, status: payload.status || 'rejected' });
      };

      s.on('desklink-remote-request', onRemoteRequest);
      s.on('desklink-remote-response', onRemoteResponse);
      s.on('remote-access-request', onAccessRequest);
      s.on('remote-access-accepted', onAccessAccepted);
      s.on('remote-access-rejected', onAccessRejected);

      // Store cleanup functions to avoid off('*') which might clear other listeners
      attachedSocketListenersRef.current = {
        'desklink-remote-request': onRemoteRequest,
        'desklink-remote-response': onRemoteResponse,
        'remote-access-request': onAccessRequest,
        'remote-access-accepted': onAccessAccepted,
        'remote-access-rejected': onAccessRejected
      };

    }).catch(err => {
      console.error('[useDeskLinkSocket] Failed to get socket:', err);
    });

    return () => {
      if (socketRef.current) {
        console.log('[useDeskLinkSocket] cleaning up listeners from shared global socket');
        Object.entries(attachedSocketListenersRef.current || {}).forEach(([ev, fn]) => {
          socketRef.current.off(ev, fn);
        });
      }
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  return { socket };
}
