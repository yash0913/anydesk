using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using SocketIOClient;
using DeskLinkAgent.IPC;
using DeskLinkAgent.WebRTC;
using DeskLinkAgent.Remote;

namespace DeskLinkAgent.Networking;

public class SocketClient : IAsyncDisposable
{
    private readonly string _deviceId;
    private readonly AgentIpcServer _ipc;
    private SocketIOClient.SocketIO? _client;
    private WebRTCLauncher? _webrtc;
    private string? _serverUrl;
    private string? _agentJwt;
    private string? _activeMeetingId;
    private string? _attachedControllerId;
    private System.Timers.Timer? _heartbeatTimer;
    private readonly HostActivityDetector _hostDetector;

    public SocketClient(string deviceId, AgentIpcServer ipc)
    {
        _deviceId = deviceId;
        _ipc = ipc;

        // Setup 10s heartbeat timer
        _heartbeatTimer = new System.Timers.Timer(10000);
        _heartbeatTimer.Elapsed += async (s, e) => {
            if (_client != null && _client.Connected) {
                try {
                    await Emit("agent-heartbeat", new { deviceId = _deviceId });
                } catch { /* Suppress heartbeat errors to avoid process crash */ }
            }
        };
        _heartbeatTimer.AutoReset = true;

        _hostDetector = new HostActivityDetector();
        _hostDetector.OnActivityDetected += () =>
        {
            _webrtc?.NotifyHostActivity();
        };
        _hostDetector.Start();
    }

    public async Task<string?> AuthenticateAsync(string serverUrl)
    {
        try
        {
            Console.WriteLine("[AGENT] Requesting auth token...");
            using var http = new System.Net.Http.HttpClient();
            var payload = new { deviceId = _deviceId };
            var json = JsonSerializer.Serialize(payload);
            var resp = await http.PostAsync(serverUrl.TrimEnd('/') + "/api/agent/auth", new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json"));
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                Console.Error.WriteLine($"[AGENT] Auth failed: {(int)resp.StatusCode} {body}");
                return null;
            }
            using var doc = JsonDocument.Parse(body);
            var token = doc.RootElement.GetProperty("token").GetString();
            return token;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[AGENT] Auth exception: " + ex.Message);
            return null;
        }
    }

    public async Task ConnectAsync(string serverUrl, string jwtToken)
    {
        Console.WriteLine("[AGENT] Connecting to backend...");

        _serverUrl = serverUrl;
        _agentJwt = jwtToken;

        _client = new SocketIOClient.SocketIO(serverUrl, new SocketIOOptions
        {
            Reconnection = true,
            ReconnectionAttempts = int.MaxValue,
            ReconnectionDelay = 2000,
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket,
            Auth = new Dictionary<string, object>
            {
                { "token", jwtToken }
            }
        });

        _client.OnConnected += async (_, __) =>
        {
            var sid = _client?.Id;
            Console.WriteLine($"[AGENT] Connected: socketId={sid}");

            // Start heartbeat timer
            _heartbeatTimer?.Start();

            // Emit unified 'register' event with rich payload so backend maps deviceId -> socket
            var payload = new
            {
                deviceId = _deviceId,
                deviceType = "native-agent",
                platform = "agent",
                label = "DeskLink Agent",
                osInfo = Environment.OSVersion.ToString(),
                deviceName = Environment.MachineName
            };
            await Emit("register", payload);
            Console.WriteLine("[AGENT] Registered successfully");
        };

        _client.OnDisconnected += (_, reason) =>
        {
            Console.Error.WriteLine("[AGENT] Disconnected: " + reason);
            _heartbeatTimer?.Stop();
        };

        _client.OnError += (sender, error) =>
        {
            Console.Error.WriteLine("[AGENT] Connection Error: " + error);
        };

        _client.OnAny((eventName, response) =>
        {
            Console.WriteLine("[SOCKET EVENT] " + eventName);
        });

        _client.On("remote-request", _ =>
        {
            try { _ipc.NotifyIncomingRemoteRequest(); } catch (Exception e) { Console.Error.WriteLine("[IPC] NotifyIncomingRemoteRequest error: " + e.Message); }
        });

        _client.On("remote-accept", _ =>
        {
            try { _ipc.NotifyRemoteSessionAccepted(); } catch (Exception e) { Console.Error.WriteLine("[IPC] NotifyRemoteSessionAccepted error: " + e.Message); }
        });

        _client.On("remote-end", _ =>
        {
            try { _ipc.NotifyRemoteSessionEnded(); } catch (Exception e) { Console.Error.WriteLine("[IPC] NotifyRemoteSessionEnded error: " + e.Message); }
        });

        _client.On("agent-attach-controller", response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();
                _attachedControllerId = el.TryGetProperty("controllerId", out var idEl) ? idEl.GetString() : null;
                Console.WriteLine($"[AGENT] Attached controller updated: {_attachedControllerId}");
                
                // Forward to active helper if running
                _webrtc?.NotifySocketEvent("agent-attach-controller", el);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[AGENT] Error handling agent-attach-controller: " + ex.Message);
            }
        });

        // Meeting: backend routes remote-access-request ONLY to the host native agent device.
        // Agent must be the offer creator.
        _client.On("remote-access-request", async response =>
        {
            try
            {
                Console.WriteLine("[AGENT] Remote access request received");

                var el = response.GetValue<JsonElement>();

                var meetingId = el.TryGetProperty("meetingId", out var midEl) ? midEl.GetString() : null;
                if (string.IsNullOrWhiteSpace(meetingId))
                {
                    Console.Error.WriteLine("[AGENT] remote-access-request missing meetingId");
                    return;
                }

                _activeMeetingId = meetingId;

                // Derive a deterministic sessionId for this meeting control session.
                // (Backend token validation is already enforced for signaling; do not change SDP/ICE.)
                var sessionId = $"meeting:{meetingId}";

                // Stop any previous helper
                try { _webrtc?.Dispose(); } catch { }
                _webrtc = null;

                // role=caller because agent must create SDP offer
                _webrtc = new WebRTCLauncher(
                    sessionId: sessionId,
                    token: "meeting", // token will be provided by backend in a later hardening pass
                    deviceId: _deviceId,
                    userId: "",
                    remoteDeviceId: "", // browser is not a device; backend relays by meeting membership
                    role: "caller",
                    serverUrl: _serverUrl ?? serverUrl,
                    agentJwt: _agentJwt ?? jwtToken
                );

                _webrtc.OnSignalingMessageFromNodeHelper += (jsonStr) =>
                {
                    try
                    {
                        var msg = JsonDocument.Parse(jsonStr);
                        var eventName = msg.RootElement.GetProperty("event").GetString();
                        var payload = msg.RootElement.GetProperty("payload");

                        // For meeting flow we only need to tag the offer with meetingId.
                        if (eventName == "webrtc-offer" && !string.IsNullOrWhiteSpace(_activeMeetingId))
                        {
                            var offerSdp = payload.TryGetProperty("sdp", out var sdpEl) ? sdpEl.GetString() : null;
                            if (!string.IsNullOrWhiteSpace(offerSdp))
                            {
                                var meetingOfferPayload = new
                                {
                                    meetingId = _activeMeetingId,
                                    fromDeviceId = _deviceId,
                                    sdp = offerSdp
                                };
                                _ = Emit("webrtc-offer", meetingOfferPayload);
                                Console.WriteLine("[WebRTC] Sent webrtc-offer (meeting) from NodeHelper to socket");
                                return;
                            }
                        }

                        _ = Emit(eventName!, payload);
                        Console.WriteLine($"[WebRTC] Sent {eventName} from NodeHelper to socket");
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine("[WebRTC] Error forwarding NodeHelper message: " + ex.Message);
                    }
                };

                await _webrtc.Start();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[AGENT] Failed to handle remote-access-request: " + ex.Message);
            }
        });

        // Start WebRTC helper for host (agent) side when session begins.
        _client.On("desklink-session-start", async response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();

                var sessionId = el.TryGetProperty("sessionId", out var sidEl) ? sidEl.GetString() : null;
                var token = el.TryGetProperty("token", out var tokEl) ? tokEl.GetString() : null;
                var callerDeviceId = el.TryGetProperty("callerDeviceId", out var cdEl) ? cdEl.GetString() : null;

                // Stop any previous helper if it's a DIFFERENT session
                if (_webrtc != null)
                {
                    if (_webrtc.SessionId == sessionId)
                    {
                        Console.WriteLine($"[WebRTC] Session {sessionId} already active and healthy. Ignoring redundant start.");
                        return;
                    }

                    try { _webrtc.Dispose(); } catch { }
                    _webrtc = null;
                }

                // role=receiver because agent is the host side
                _webrtc = new WebRTCLauncher(
                    sessionId: sessionId ?? "",
                    token: token ?? "",
                    deviceId: _deviceId,
                    userId: "", // optional; backend allows missing fromUserId for signaling validation
                    remoteDeviceId: _attachedControllerId ?? callerDeviceId ?? "",
                    role: "receiver",
                    serverUrl: _serverUrl ?? "https://anydesk.onrender.com",
                    agentJwt: _agentJwt ?? ""
                );

                // Forward signaling messages from NodeHelper to socket
                _webrtc.OnSignalingMessageFromNodeHelper += (jsonStr) =>
                {
                    try
                    {
                        var msg = JsonDocument.Parse(jsonStr);
                        var eventName = msg.RootElement.GetProperty("event").GetString();
                        var payload = msg.RootElement.GetProperty("payload");
                        _ = Emit(eventName!, payload);
                        Console.WriteLine($"[WebRTC] Sent {eventName} from NodeHelper to socket");
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine("[WebRTC] Error forwarding NodeHelper message: " + ex.Message);
                    }
                };

                await _webrtc.Start();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[WebRTC] Failed to start helper on desklink-session-start: " + ex.Message);
            }
        });

        // Forward WebRTC signaling events from socket to NodeHelper
        _client.On("webrtc-offer", response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();
                _webrtc?.ForwardSignalingEvent("webrtc-offer", el);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[WebRTC] Error forwarding webrtc-offer: " + ex.Message);
            }
        });

        _client.On("webrtc-answer", response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();
                _webrtc?.ForwardSignalingEvent("webrtc-answer", el);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[WebRTC] Error forwarding webrtc-answer: " + ex.Message);
            }
        });

        _client.On("webrtc-ice", response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();
                _webrtc?.ForwardSignalingEvent("webrtc-ice", el);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[WebRTC] Error forwarding webrtc-ice: " + ex.Message);
            }
        });

        _client.On("webrtc-cancel", async response =>
        {
            try
            {
                var el = response.GetValue<JsonElement>();
                var sessionId = el.TryGetProperty("sessionId", out var sidEl) ? sidEl.GetString() : null;
                
                Console.WriteLine($"[WebRTC] 🚫 Received webrtc-cancel for session: {sessionId}");
                
                // 🔒 CRITICAL: Stop current session if it matches
                if (_webrtc != null && sessionId == _webrtc.SessionId)
                {
                    Console.WriteLine($"[WebRTC] 🗑️ Stopping WebRTC session: {sessionId}");
                    _webrtc.Stop();
                    _webrtc.Dispose();
                    _webrtc = null;
                }
                else
                {
                    Console.WriteLine($"[WebRTC] ℹ️ Cancel for different session. Current: {_webrtc?.SessionId}, Cancelled: {sessionId}");
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[WebRTC] Error handling webrtc-cancel: " + ex.Message);
            }
            await Task.CompletedTask;
        });

        await SafeConnectAsync();
    }

    private async Task SafeConnectAsync()
    {
        var delay = 1000;
        while (true)
        {
            try
            {
                if (_client == null) return;
                await _client.ConnectAsync();
                return;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[AGENT] Connect error: {ex.Message}. Retrying in {delay}ms...");
                await Task.Delay(delay);
                delay = Math.Min(delay * 2, 15000);
            }
        }
    }

    public async Task Emit(string eventName, object payload)
    {
        try
        {
            if (_client == null) return;
            await _client.EmitAsync(eventName, payload);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Socket] emit error ({eventName}): {ex.Message}");
        }
    }

    public ValueTask DisposeAsync()
    {
        try
        {
            _heartbeatTimer?.Stop();
            _heartbeatTimer?.Dispose();
            _heartbeatTimer = null;

            try { _webrtc?.Dispose(); } catch { }
            _webrtc = null;
            _client?.Dispose();
            _hostDetector.Dispose();
        }
        catch { }
        return ValueTask.CompletedTask;
    }
}