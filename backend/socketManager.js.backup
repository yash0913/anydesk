function emitToUser(userId, event, payload) {

  if (!ioInstance || !userId) return;

  const sockets = onlineUsersById.get(String(userId));
  if (!sockets || sockets.size === 0) {
    console.warn(`[emitToUser] No active sockets found for userId: ${userId}`);
    console.log(`[emitToUser-DEBUG] Current onlineUsersById registry:`, Array.from(onlineUsersById.keys()));
    return;
  }

  console.log(`[emitToUser-DEBUG] Called with:`, {
    targetUser: userId,
    event: event,
    payload: payload,
    socketsFound: Array.from(sockets),
    socketDetails: Array.from(sockets).map(socketId => {
      const socket = ioInstance.sockets.sockets.get(socketId);
      return {
        socketId,
        connected: socket?.connected,
        userId: socket?.userId,
        userPhone: socket?.userPhone
      };
    })
  });

  console.log(`[emitToUser] Sending ${event} to ${sockets.size} sockets for userId: ${userId}`);
  sockets.forEach((socketId) => {
    const target = ioInstance.sockets.sockets.get(socketId);
    if (target) {
      console.log(`[emitToUser-DEBUG] Emitting to socket ${socketId}:`, {
        event: event,
        payload: payload,
        socketConnected: target.connected,
        socketUserId: target.userId
      });
      target.emit(event, payload);
    } else {
      console.warn(`[emitToUser-DEBUG] Socket ${socketId} not found in ioInstance.sockets.sockets`);
    }
  });

}
