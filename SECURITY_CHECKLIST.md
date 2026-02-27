===================================
DeskLink Agent v1.0.0
====================================
[AGENT] Starting...
[WebRTC] Failed to extract embedded WebRTC payload: The process cannot access the file 'C:\Users\yasha\AppData\Roaming\DeskLink\WebRTC\node\node.exe' because it is being used by another process.
[AGENT] DeviceId: 7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e
[IPC] Named pipe server started: DeskLinkAgentPipe
[AGENT] Waiting for provisioning from frontend...
[AGENT] Waiting for remote sessions...
[AGENT] Received provisioning
[AGENT] Connecting to backend...
[AGENT] Connected: socketId=7Lbp3_FIDeoe9q8nAAHn
[AGENT] Registered successfully
[SOCKET EVENT] desklink-remote-request
[SOCKET EVENT] desklink-session-start
[WebRTC] launcher created — session=69a039b0a60dedaaa67907b9 role=receiver serverUrl=https://anydesk.onrender.com
[WebRTC] Failed to extract embedded WebRTC payload: The process cannot access the file 'C:\Users\yasha\AppData\Roaming\DeskLink\WebRTC\node\node.exe' because it is being used by another process.
[WebRTC] Node helper started (PID: 21136)
[NodeHelper] [NodeHelper] Starting with config: {
[NodeHelper]   "serverUrl": "https://anydesk.onrender.com",
[NodeHelper]   "sessionId": "69a039b0a60dedaaa67907b9",
[NodeHelper]   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJyZWNlaXZlciIsInR5cGUiOiJkZXNrbGluay1zZXNzaW9uIiwiaWF0IjoxNzcyMTA4MjEwLCJleHAiOjE3NzIxMDg4MTB9.UFdhA234b7d4AuNK3VH8W9oP-yj2RONzL_mFChAKTUE",
[NodeHelper]   "deviceId": "7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e", 
[NodeHelper]   "userId": "",
[NodeHelper]   "remoteDeviceId": "web-692d649c1ff08ecdcebded67",
[NodeHelper]   "role": "receiver",
[NodeHelper]   "agentJwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MmQ2NDJiMWZmMDhlY2RjZWJkZWQ0ZCIsImFnZW50Ijp0cnVlLCJpYXQiOjE3NzIxMDgyMDMsImV4cCI6MTc3MjE5NDYwM30.8aEgaZWH3HTxFsBNVqeuORAHS2oVP5ZoPa8PogwegeQ"
[NodeHelper] }
[NodeHelper] [NodeHelper] Mode: Signaling via stdin/stdout (no socket)
[WebRTC] NodeHelper is ready, flushing buffered events
[NodeHelper] [NodeHelper] ===== NODEHELPER STARTING =====
[NodeHelper] [NodeHelper] Role: receiver
[NodeHelper] [NodeHelper] DeviceId: 7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e
[NodeHelper] [NodeHelper] SessionId: 69a039b0a60dedaaa67907b9
[NodeHelper] [NodeHelper] Mode: Signaling via stdin/stdout
[WebRTC] NodeHelper is ready, flushing buffered events
[NodeHelper] [NodeHelper] Initializing stdin reader...
[NodeHelper] [NodeHelper] Stdin reader initialized
[NodeHelper] [WebRTC] ===== INITIALIZING PEER CONNECTION =====
[NodeHelper] [WebRTC] Role: receiver
[NodeHelper] [WebRTC] ICE Servers: [{"urls":"stun:stun.l.google.com:19302"},{"urls":"stun:stun1.l.google.com:19302"},{"urls":"turn:openrelay.metered.ca:443","username":"openrelayproject","credential":"openrelayproject"},{"urls":"turn:openrelay.metered.ca:80","username":"openrelayproject","credential":"openrelayproject"}]
[NodeHelper] [WebRTC] ✓ Video track added from agent: 246b0331-41c7-4327-9299-1061a45de1a0     
[NodeHelper] [NodeHelper] ===== ROLE: RECEIVER =====
[NodeHelper] [NodeHelper] Waiting for offer from caller (via stdin)...
[SOCKET EVENT] webrtc-ice
[SOCKET EVENT] webrtc-ice
[SOCKET EVENT] webrtc-ice
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[SOCKET EVENT] webrtc-ice
[SOCKET EVENT] webrtc-ice
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] Forwarded webrtc-ice to NodeHelper
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected number in JSON at position 892
[NodeHelper] [Stdin] Failed line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line:
[NodeHelper] [Stdin] JSON parse error: Unexpected token  in JSON at position 0
[NodeHelper] [Stdin] Failed line:
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:552391383 1 udp 2122260224 192.168.1.101 45248 typ host generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 1        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:2415708104 1 tcp 1518217472 2409:4102:100e:4658:2427:5fff:fe3f:aab5 9 typ host tcptype active generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 2        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token t in JSON at position 437
[NodeHelper] [Stdin] Failed line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line:
[NodeHelper] [Stdin] JSON parse error: Unexpected token  in JSON at position 0
[NodeHelper] [Stdin] Failed line:
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:552391383 1 udp 2122260224 192.168.1.101 45248 typ host generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 3        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:2415708104 1 tcp 1518217472 2409:4102:100e:4658:2427:5fff:fe3f:aab5 9 typ host tcptype active generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[SOCKET EVENT] webrtc-ice
[SOCKET EVENT] webrtc-ice
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 4        
[SOCKET EVENT] webrtc-ice
[SOCKET EVENT] webrtc-ice
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[WebRTC] ForwardSignalingEvent called for webrtc-ice, NodeHelper ready: True
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 5        
[NodeHelper] [Stdin] Received raw line: nR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token R in JSON at position 1
[NodeHelper] [Stdin] Failed line: nR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}  
[NodeHelper] [Stdin] Received raw line:
[NodeHelper] [Stdin] JSON parse error: Unexpected token  in JSON at position 0
[NodeHelper] [Stdin] Failed line:
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:552391383 1 udp 2122260224 192.168.1.101 45248 typ host generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 6        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:2415708104 1 tcp 1518217472 2409:4102:100e:4658:2427:5fff:fe3f:aab5 9 typ host tcptype active generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 7        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token t in JSON at position 437
[NodeHelper] [Stdin] Failed line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line:
[WebRTC] Forwarded webrtc-ice to NodeHelper
[WebRTC] Forwarded webrtc-ice to NodeHelper
[WebRTC] Forwarded webrtc-ice to NodeHelper
[WebRTC] Forwarded webrtc-ice to NodeHelper
[NodeHelper] [Stdin] JSON parse error: Unexpected token  in JSON at position 0
[WebRTC] Forwarded webrtc-ice to NodeHelper
[NodeHelper] [Stdin] Failed line:
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:552391383 1 udp 2122260224 192.168.1.101 45248 typ host generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 8        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:2415708104 1 tcp 1518217472 2409:4102:100e:4658:2427:5fff:fe3f:aab5 9 typ host tcptype active generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 9        
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token t in JSON at position 437
[NodeHelper] [Stdin] Failed line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-c{"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:838164239 1 udp 2122063616 192.0.0.2 45603 typ host generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line:
[NodeHelper] [Stdin] JSON parse error: Unexpected token  in JSON at position 0
[NodeHelper] [Stdin] Failed line:
[WebRTC] Forwarded webrtc-ice to NodeHelper
[WebRTC] Forwarded webrtc-ice to NodeHelper
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:552391383 1 udp 2122260224 192.168.1.101 45248 typ host generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 10       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:2415708104 1 tcp 1518217472 2409:4102:100e:4658:2427:5fff:fe3f:aab5 9 typ host tcptype active generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 11       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3777136029 1 udp 1686052608 58.146.103.7 45248 typ srflx raddr 192.168.1.101 rport 45248 generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 12       
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3479145371 1 tcp 1518083840 192.0.0.2 9 typ host tcptype active generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}      
[WebRTC] Forwarded webrtc-ice to NodeHelper
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 13       
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3479145371 1 tcp 1518083840 192.0.0.2 9 typ host tcptype active generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}      
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 14       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3729131075 1 tcp 1518280448 192.168.1.101 9 typ host tcptype active generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}   
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 15       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:1901466460 1 udp 2122197248 2409:4102:100e:4658:2427:5fff:fe3f:aab5 47735 typ host generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 16       
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3479145371 1 tcp 1518083840 192.0.0.2 9 typ host tcptype active generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}      
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 17       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3729131075 1 tcp 1518280448 192.168.1.101 9 typ host tcptype active generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}   
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 18       
[NodeHelper] [Stdin] Received raw line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] JSON parse error: Unexpected token o in JSON at position 0
[NodeHelper] [Stdin] Failed line: ost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3479145371 1 tcp 1518083840 192.0.0.2 9 typ host tcptype active generation 0 ufrag uKGx network-id 2 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}      
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 19       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:3729131075 1 tcp 1518280448 192.168.1.101 9 typ host tcptype active generation 0 ufrag uKGx network-id 4 network-cost 10","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}   
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 20       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:1901466460 1 udp 2122197248 2409:4102:100e:4658:2427:5fff:fe3f:aab5 47735 typ host generation 0 ufrag uKGx network-id 1 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 21       
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-ice","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","candidate":{"candidate":"candidate:33651692 1 udp 2122131712 2409:40c2:100f:1988:ec2b:75ff:fe6b:d225 43541 typ host generation 0 ufrag uKGx network-id 3 network-cost 900","sdpMid":"0","sdpMLineIndex":0,"usernameFragment":"uKGx"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-ice
[NodeHelper] [Stdin] Received event: webrtc-ice
[NodeHelper] [WebRTC] Received ICE candidate from: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered: 22       
[SOCKET EVENT] webrtc-offer
[WebRTC] ForwardSignalingEvent called for webrtc-offer, NodeHelper ready: True
[WebRTC] Forwarded webrtc-offer to NodeHelper
[NodeHelper] [Stdin] Received raw line: {"type":"socket-event","eventName":"webrtc-offer","payload":{"sessionId":"69a039b0a60dedaaa67907b9","fromUserId":"692d649c1ff08ecdcebded67","fromDeviceId":"web-692d649c1ff08ecdcebded67","toDeviceId":"7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e","sdp":"v=0\r\no=- 4574172593339580962 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 35 36 37 38 39 40 41 42 100 101 103 104 107 108 109 114 43 44 115 116 117 118 119 120 121 122 45 46 47 48 123 124 125 49\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:uKGx\r\na=ice-pwd:cSHrP1hZ3pN3\u002BVPcHTzBLaL9\r\na=ice-options:trickle\r\na=fingerprint:sha-256 8F:CF:37:EE:78:0A:63:A1:65:A0:85:A9:4E:52:A9:69:ED:AA:0F:BA:CD:8F:84:7A:62:97:8D:94:94:14:76:BF\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 urn:3gpp:video-orientation\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=recvonly\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:35 VP9/90000\r\na=rtcp-fb:35 goog-remb\r\na=rtcp-fb:35 transport-cc\r\na=rtcp-fb:35 ccm fir\r\na=rtcp-fb:35 nack\r\na=rtcp-fb:35 nack pli\r\na=fmtp:35 profile-id=1\r\na=rtpmap:36 rtx/90000\r\na=fmtp:36 apt=35\r\na=rtpmap:37 VP9/90000\r\na=rtcp-fb:37 goog-remb\r\na=rtcp-fb:37 transport-cc\r\na=rtcp-fb:37 ccm fir\r\na=rtcp-fb:37 nack\r\na=rtcp-fb:37 nack pli\r\na=fmtp:37 profile-id=3\r\na=rtpmap:38 rtx/90000\r\na=fmtp:38 apt=37\r\na=rtpmap:39 AV1/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-idx=5;profile=0;tier=0\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:41 AV1/90000\r\na=rtcp-fb:41 goog-remb\r\na=rtcp-fb:41 transport-cc\r\na=rtcp-fb:41 ccm fir\r\na=rtcp-fb:41 nack\r\na=rtcp-fb:41 nack pli\r\na=fmtp:41 level-idx=5;profile=1;tier=0\r\na=rtpmap:42 rtx/90000\r\na=fmtp:42 apt=41\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:103 H264/90000\r\na=rtcp-fb:103 goog-remb\r\na=rtcp-fb:103 transport-cc\r\na=rtcp-fb:103 ccm fir\r\na=rtcp-fb:103 nack\r\na=rtcp-fb:103 nack pli\r\na=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:104 rtx/90000\r\na=fmtp:104 apt=103\r\na=rtpmap:107 H264/90000\r\na=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=rtcp-fb:107 ccm fir\r\na=rtcp-fb:107 nack\r\na=rtcp-fb:107 nack pli\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\na=rtpmap:108 rtx/90000\r\na=fmtp:108 apt=107\r\na=rtpmap:109 H264/90000\r\na=rtcp-fb:109 goog-remb\r\na=rtcp-fb:109 transport-cc\r\na=rtcp-fb:109 ccm fir\r\na=rtcp-fb:109 nack\r\na=rtcp-fb:109 nack pli\r\na=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\na=rtpmap:114 rtx/90000\r\na=fmtp:114 apt=109\r\na=rtpmap:43 H264/90000\r\na=rtcp-fb:43 goog-remb\r\na=rtcp-fb:43 transport-cc\r\na=rtcp-fb:43 ccm fir\r\na=rtcp-fb:43 nack\r\na=rtcp-fb:43 nack pli\r\na=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\na=rtpmap:44 rtx/90000\r\na=fmtp:44 apt=43\r\na=rtpmap:115 H264/90000\r\na=rtcp-fb:115 goog-remb\r\na=rtcp-fb:115 transport-cc\r\na=rtcp-fb:115 ccm fir\r\na=rtcp-fb:115 nack\r\na=rtcp-fb:115 nack pli\r\na=fmtp:115 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtpmap:116 rtx/90000\r\na=fmtp:116 apt=115\r\na=rtpmap:117 H264/90000\r\na=rtcp-fb:117 goog-remb\r\na=rtcp-fb:117 transport-cc\r\na=rtcp-fb:117 ccm fir\r\na=rtcp-fb:117 nack\r\na=rtcp-fb:117 nack pli\r\na=fmtp:117 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=64001f\r\na=rtpmap:118 rtx/90000\r\na=fmtp:118 apt=117\r\na=rtpmap:119 H264/90000\r\na=rtcp-fb:119 goog-remb\r\na=rtcp-fb:119 transport-cc\r\na=rtcp-fb:119 ccm fir\r\na=rtcp-fb:119 nack\r\na=rtcp-fb:119 nack pli\r\na=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:120 rtx/90000\r\na=fmtp:120 apt=119\r\na=rtpmap:121 H264/90000\r\na=rtcp-fb:121 goog-remb\r\na=rtcp-fb:121 transport-cc\r\na=rtcp-fb:121 ccm fir\r\na=rtcp-fb:121 nack\r\na=rtcp-fb:121 nack pli\r\na=fmtp:121 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\na=rtpmap:122 rtx/90000\r\na=fmtp:122 apt=121\r\na=rtpmap:45 H265/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=fmtp:45 level-id=150;profile-id=1;tier-flag=0;tx-mode=SRST\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45\r\na=rtpmap:47 H265/90000\r\na=rtcp-fb:47 goog-remb\r\na=rtcp-fb:47 transport-cc\r\na=rtcp-fb:47 ccm fir\r\na=rtcp-fb:47 nack\r\na=rtcp-fb:47 nack pli\r\na=fmtp:47 level-id=150;profile-id=2;tier-flag=0;tx-mode=SRST\r\na=rtpmap:48 rtx/90000\r\na=fmtp:48 apt=47\r\na=rtpmap:123 red/90000\r\na=rtpmap:124 rtx/90000\r\na=fmtp:124 apt=123\r\na=rtpmap:125 ulpfec/90000\r\na=rtpmap:49 flexfec-03/90000\r\na=rtcp-fb:49 goog-remb\r\na=rtcp-fb:49 transport-cc\r\na=fmtp:49 repair-window=10000000\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:uKGx\r\na=ice-pwd:cSHrP1hZ3pN3\u002BVPcHTzBLaL9\r\na=ice-options:trickle\r\na=fingerprint:sha-256 8F:CF:37:EE:78:0A:63:A1:65:A0:85:A9:4E:52:A9:69:ED:AA:0F:BA:CD:8F:84:7A:62:97:8D:94:94:14:76:BF\r\na=setup:actpass\r\na=mid:1\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2OWEwMzliMGE2MGRlZGFhYTY3OTA3YjkiLCJjYWxsZXJEZXZpY2VJZCI6IndlYi02OTJkNjQ5YzFmZjA4ZWNkY2ViZGVkNjciLCJyZWNlaXZlckRldmljZUlkIjoiN2VkZmY5M2Q2Y2NiOTJmNGRjYjQ4MTBlOTBkMGE4NzNhZTk1ZTdiMjFiZjk2MTQ5NjBjZTM4MTUyMDNjMjEyZSIsInJvbGUiOiJjYWxsZXIiLCJ0eXBlIjoiZGVza2xpbmstc2Vzc2lvbiIsImlhdCI6MTc3MjEwODIxMCwiZXhwIjoxNzcyMTA4ODEwfQ.EDWs9HwOgQvlM5OADTewPPe8eSJkEVZxZ57WVkY1v6M"}}
[NodeHelper] [Stdin] Parsed socket event: webrtc-offer
[NodeHelper] [Stdin] Received event: webrtc-offer
[NodeHelper] [WebRTC] ===== RECEIVED OFFER =====
[NodeHelper] [WebRTC] sessionId: 69a039b0a60dedaaa67907b9
[NodeHelper] [WebRTC] fromDeviceId: web-692d649c1ff08ecdcebded67
[NodeHelper] [WebRTC] toDeviceId: 7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e
[NodeHelper] [WebRTC] My deviceId: 7edff93d6ccb92f4dcb4810e90d0a873ae95e7b21bf9614960ce3815203c212e
[NodeHelper] [WebRTC] SDP type: present
[NodeHelper] [WebRTC] Active session updated: {
[NodeHelper]   activeSessionId: '69a039b0a60dedaaa67907b9',
[NodeHelper]   activeRemoteDeviceId: 'web-692d649c1ff08ecdcebded67',
[NodeHelper]   hasToken: true
[NodeHelper] }
[NodeHelper] [WebRTC] Setting remote description (offer)...
[NodeHelper] [WebRTC] Signaling state: have-remote-offer
[NodeHelper] [WebRTC] ✓ Remote description set
[NodeHelper] [WebRTC] Applying 22 buffered ICE candidates
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] ✓ Applied buffered ICE candidate
[NodeHelper] [WebRTC] Creating answer...
[NodeHelper] [WebRTC] Signaling state: stable
[NodeHelper] [WebRTC] ICE connection state: checking
[NodeHelper] [WebRTC] ICE checking candidates...
[NodeHelper] [WebRTC] ===== CONNECTION STATE CHANGE =====
[NodeHelper] [WebRTC] New state: connecting
[NodeHelper] [WebRTC] Attempting to connect...
[NodeHelper] [WebRTC] ✓ Local description set (answer)
[NodeHelper] [WebRTC] ✓✓✓ ANSWER SENT ✓✓✓
[NodeHelper] [WebRTC] Sending local ICE candidate
[NodeHelper] [WebRTC] Sending local ICE candidate
[NodeHelper] [WebRTC] Sending local ICE candidate
[WebRTC] Sent webrtc-answer from NodeHelper to socket
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[NodeHelper] [WebRTC] Sending local ICE candidate
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[NodeHelper] [WebRTC] Sending local ICE candidate
[NodeHelper] [WebRTC] Sending local ICE candidate
[NodeHelper] [WebRTC] Sending local ICE candidate
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[WebRTC] Sent webrtc-ice from NodeHelper to socket
[NodeHelper] [WebRTC] ICE gathering complete
# Security Checklist - DeskLink Part 3

## Authentication & Authorization

- [x] **JWT Authentication**: All API endpoints protected with JWT middleware
- [x] **Socket Authentication**: Socket.IO connections require valid JWT token
- [x] **Session Token Validation**: WebRTC signaling validates ephemeral session tokens
- [x] **Session Ownership**: Verify user owns session before allowing operations
- [x] **Device Ownership**: Verify user owns device before session creation
- [ ] **Two-Factor Authentication**: Implement 2FA for sensitive operations (future)

## Session Security

- [x] **Ephemeral Tokens**: Short-lived session tokens (5 min default)
- [x] **Token Expiration**: Tokens expire after configured time
- [x] **Session Isolation**: Each session has unique ID and isolated state
- [x] **Permission Model**: Granular permissions (view-only, control, clipboard, files)
- [x] **Audit Logging**: All session events logged with timestamps and user IDs

## Network Security

- [x] **CORS Configuration**: Restrict origins to known clients
- [x] **Rate Limiting**: Prevent session creation spam (1 req/sec per user)
- [ ] **TLS/HTTPS**: Enable in production (configure reverse proxy)
- [ ] **WSS (Secure WebSocket)**: Enable in production
- [x] **TURN Authentication**: HMAC-based long-term credentials

## Input Validation

- [x] **Request Validation**: Validate all API request parameters
- [x] **Session ID Format**: Validate session ID format
- [x] **Device ID Format**: Validate device ID format
- [x] **Coordinate Normalization**: Normalize mouse coordinates to 0-1 range
- [x] **Key Blocking**: Block dangerous key combinations (Ctrl+Alt+Del)

## Data Protection

- [x] **Password Hashing**: bcrypt for password storage
- [x] **Token Signing**: JWT tokens signed with secret
- [x] **Sensitive Data**: No passwords in logs or responses
- [ ] **Encryption at Rest**: Encrypt sensitive DB fields (future)
- [ ] **End-to-End Encryption**: E2E encrypt control messages (future)

## Access Control

- [x] **Contact-Based Access**: Only contacts can request sessions
- [x] **Explicit Acceptance**: Receiver must explicitly accept
- [x] **Permission Toggles**: Receiver controls what caller can do
- [x] **Session Termination**: Either party can end session
- [ ] **IP Whitelisting**: Restrict by IP in production (optional)

## Monitoring & Auditing

- [x] **Audit Logs**: Session events logged to database
- [x] **Structured Logging**: Logs include sessionId, userId, timestamps
- [x] **Metrics Endpoint**: Prometheus metrics for monitoring
- [ ] **Sentry Integration**: Error tracking (configure)
- [ ] **Log Aggregation**: Centralized logging (ELK/Splunk)

## TURN Server Security

- [x] **Shared Secret**: TURN uses shared secret for auth
- [x] **Dynamic Credentials**: Temporary credentials per session
- [x] **No Static Users**: Avoid hardcoded user/pass
- [ ] **TLS Certificates**: Enable TLS for TURN in production
- [ ] **Firewall Rules**: Restrict TURN server access

## Code Security

- [x] **Dependency Scanning**: Regular `npm audit`
- [x] **Input Sanitization**: Sanitize user inputs
- [x] **SQL Injection**: Use Mongoose (parameterized queries)
- [x] **XSS Prevention**: React escapes by default
- [ ] **CSRF Protection**: Add CSRF tokens for state-changing ops
- [ ] **Content Security Policy**: Configure CSP headers

## Agent Security

- [x] **Device ID Validation**: Validate device ID on registration
- [x] **Token-Based Auth**: Agent authenticates with JWT
- [x] **Input Rate Limiting**: Limit control message rate
- [x] **Safe Key Injection**: Block dangerous key combinations
- [ ] **Code Signing**: Sign agent executable (production)
- [ ] **Auto-Update**: Secure update mechanism

## Docker Security

- [ ] **Non-Root User**: Run containers as non-root
- [ ] **Read-Only Filesystem**: Where possible
- [ ] **Secret Management**: Use Docker secrets for sensitive data
- [ ] **Image Scanning**: Scan images for vulnerabilities
- [ ] **Network Isolation**: Use Docker networks

## Production Hardening

- [ ] **Environment Variables**: Never commit secrets to git
- [ ] **Secrets Management**: Use vault or secret manager
- [ ] **HTTPS Only**: Enforce HTTPS in production
- [ ] **Security Headers**: Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] **Regular Updates**: Keep dependencies updated
- [ ] **Penetration Testing**: Conduct security audit
- [ ] **Incident Response**: Have incident response plan

## Compliance

- [ ] **GDPR**: Implement data deletion, export
- [ ] **Privacy Policy**: Document data collection
- [ ] **Terms of Service**: Define acceptable use
- [ ] **Data Retention**: Define retention policies

---

## Immediate Actions Required for Production

1. **Enable TLS/HTTPS**:
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://backend:5000;
       }
   }
   ```

2. **Configure TURN with TLS**:
   ```conf
   cert=/etc/coturn/cert.pem
   pkey=/etc/coturn/privkey.pem
   ```

3. **Add CSRF Protection**:
   ```javascript
   const csrf = require('csurf');
   app.use(csrf({ cookie: true }));
   ```

4. **Configure Sentry**:
   ```javascript
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   ```

5. **Set Security Headers**:
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

---

## Security Contacts

- **Security Issues**: Report to security@desklink.com
- **Vulnerability Disclosure**: Follow responsible disclosure
- **Bug Bounty**: (Configure if applicable)

---

## Review Schedule

- **Weekly**: Review audit logs
- **Monthly**: Dependency updates and security patches
- **Quarterly**: Security audit and penetration testing
- **Annually**: Full security review and compliance check