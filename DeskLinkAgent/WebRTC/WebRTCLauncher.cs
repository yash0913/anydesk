using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace DeskLinkAgent.WebRTC;

/// <summary>
/// Launcher for Node.js WebRTC helper process
/// This is a prototype implementation for rapid development
/// For production, replace with native WebRTC bindings
/// </summary>
public class WebRTCLauncher : IDisposable
{
    private Process? _nodeProcess;
    private readonly string _sessionId;
    private readonly string _token;
    private readonly string _deviceId;
    private readonly string _userId;
    private readonly string _remoteDeviceId;
    private readonly string _role;
    private readonly string _serverUrl;
    private readonly string _agentJwt;
    private bool _isShuttingDown = false;
    private readonly object _stdinLock = new object();
    private static string _currentActiveSessionId = null;
    private static readonly object _sessionLock = new object();

    /// <summary>
    /// Get the session ID for this WebRTC launcher
    /// </summary>
    public string SessionId => _sessionId;

    public WebRTCLauncher(
        string sessionId,
        string token,
        string deviceId,
        string userId,
        string remoteDeviceId,
        string role,
        string serverUrl,
        string agentJwt)
    {
        // 🔒 CRITICAL: Validate and set active session
        lock (_sessionLock)
        {
            if (_currentActiveSessionId != null && _currentActiveSessionId != sessionId)
            {
                Console.WriteLine($"[WebRTC] ❌ Session conflict: rejecting stale session {sessionId}, current active is {_currentActiveSessionId}");
                throw new InvalidOperationException($"Session {sessionId} is not the active session");
            }
            
            _currentActiveSessionId = sessionId;
            Console.WriteLine($"[WebRTC] ✅ Set active session: {sessionId}");
        }
        
        _sessionId = sessionId;
        _token = token;
        _deviceId = deviceId;
        _userId = userId;
        _remoteDeviceId = remoteDeviceId;
        _role = role;
        _serverUrl = serverUrl ?? "https://anydesk.onrender.com";
        _agentJwt = agentJwt;

        Console.WriteLine($"[WebRTC] launcher created — session={sessionId} role={role} serverUrl={_serverUrl}");
    }

    public async Task Start()
    {
        try
        {
            WebRtcBootstrapper.EnsureExtracted();
            var baseDir = WebRtcBootstrapper.WebRtcBasePath;
            var helperPath = Path.Combine(baseDir, "NodeHelper.js");
            var nodeExe = Path.Combine(baseDir, "node", "node.exe");

            if (!File.Exists(helperPath))
            {
                throw new FileNotFoundException($"Node helper not found: {helperPath}");
            }

            if (!File.Exists(nodeExe))
            {
                throw new FileNotFoundException($"Bundled node.exe not found: {nodeExe}");
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = $"\"{helperPath}\" \"{_serverUrl}\" \"{_sessionId}\" \"{_token}\" \"{_deviceId}\" \"{_userId}\" \"{_remoteDeviceId}\" \"{_role}\" \"{_agentJwt}\"",
                WorkingDirectory = baseDir,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                CreateNoWindow = true,
                // IMPORTANT: Use UTF8 without BOM for Stdin
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
                StandardInputEncoding = new UTF8Encoding(false) 
            };

            _nodeProcess = new Process { StartInfo = startInfo };

            // Start the process first
            _nodeProcess.Start();
            Console.WriteLine($"[WebRTC] Node helper started (PID: {_nodeProcess.Id})");

            // Add delay to ensure process is fully ready
            await Task.Delay(1000);
            Console.WriteLine("[WebRTC] Node helper ready - starting stream setup");

            // Setup stream reading after process has started
            _nodeProcess.BeginErrorReadLine();
            
            _nodeProcess.ErrorDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    Console.WriteLine($"[NodeHelper] {e.Data}");
                }
            };

            // Start async reader for NodeHelper stdout messages
            _ = Task.Run(async () => await ReadNodeHelperOutputAsync());

            _nodeProcess.OutputDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    Console.WriteLine($"[NodeHelper] {e.Data}");
                }
            };
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WebRTC] Failed to start Node helper: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Notify NodeHelper that the host is performing local input activity
    /// </summary>
    public void NotifyHostActivity()
    {
        if (_nodeProcess == null || _isShuttingDown) return;

        try
        {
            // Safely check if process has exited without throwing exception
            if (_nodeProcess.Id > 0)
            {
                try
                {
                    if (_nodeProcess.HasExited) return;
                }
                catch (InvalidOperationException)
                {
                    // Process is not valid, return early
                    return;
                }
            }
            else
            {
                return;
            }

            var message = JsonSerializer.Serialize(new
            {
                type = "host-active",
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });

            lock (_stdinLock)
            {
                _nodeProcess.StandardInput.WriteLine(message);
                _nodeProcess.StandardInput.Flush();
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WebRTC] Error notifying host activity: {ex.Message}");
        }
    }

    /// <summary>
    /// Notify NodeHelper about a socket event (e.g. agent-attach-controller)
    /// </summary>
    public void NotifySocketEvent(string eventName, JsonElement payload)
    {
        ForwardSignalingEvent(eventName, payload);
    }

    /// <summary>
    /// Forward a signaling event from socket to NodeHelper via stdin with proper framing
    /// </summary>
    public void ForwardSignalingEvent(string eventName, JsonElement payload)
    {
        if (_nodeProcess == null || _nodeProcess.HasExited || _isShuttingDown)
        {
            Console.WriteLine($"[WebRTC] Cannot forward {eventName}: NodeHelper not running");
            return;
        }

        try
        {
            var message = JsonSerializer.Serialize(new
            {
                type = "socket-event",
                eventName,
                payload
            }, new JsonSerializerOptions 
            { 
                WriteIndented = false,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            
            // Use lock to prevent concurrent writes
            lock (_stdinLock)
            {
                // Newline-delimited JSON (no length prefix)
               _nodeProcess.StandardInput.WriteLine(message);
               _nodeProcess.StandardInput.Flush();
                
                Console.WriteLine($"[WebRTC] Forwarded {eventName} to NodeHelper");
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WebRTC] Error forwarding {eventName}: {ex.Message}");
            Console.Error.WriteLine($"[WebRTC] Exception details: {ex}");
        }
    }

    /// <summary>
    /// Read stdout from NodeHelper and forward signaling messages to socket
    /// </summary>
    private async Task ReadNodeHelperOutputAsync()
    {
        var buffer = new StringBuilder();
        
        while (_nodeProcess != null && !_nodeProcess.HasExited)
        {
            try
            {
                var line = await _nodeProcess.StandardOutput.ReadLineAsync();
                if (string.IsNullOrEmpty(line)) continue;

                // Check if it's a signaling message (prefixed with [SIGNALING])
                if (line.StartsWith("[SIGNALING]"))
                {
                    var jsonStr = line.Substring("[SIGNALING]".Length).Trim();
                    
                    // 🔒 CRITICAL: Validate session before processing
                    try
                    {
                        var test = JsonDocument.Parse(jsonStr);
                        var payload = test.RootElement.GetProperty("payload");
                        
                        if (payload.TryGetProperty("sessionId", out var sessionIdEl))
                        {
                            var messageSessionId = sessionIdEl.GetString();
                            lock (_sessionLock)
                            {
                                if (_currentActiveSessionId != messageSessionId)
                                {
                                    Console.WriteLine($"[WebRTC] ❌ Discarding stale signaling for session {messageSessionId}, active is {_currentActiveSessionId}");
                                    continue; // Skip this stale message
                                }
                            }
                        }
                        
                        Console.WriteLine($"[WebRTC] Valid JSON received ({jsonStr.Length} chars)");
                        OnSignalingMessageFromNodeHelper?.Invoke(jsonStr);
                    }
                    catch (JsonException jsonEx)
                    {
                        Console.Error.WriteLine($"[WebRTC] Invalid JSON from NodeHelper: {jsonEx.Message}");
                        Console.Error.WriteLine($"[WebRTC] JSON preview: {jsonStr.Substring(0, Math.Min(200, jsonStr.Length))}...");
                    }
                }
                else
                {
                    Console.WriteLine($"[WebRTC] Non-signaling output: {line.Substring(0, Math.Min(100, line.Length))}...");
                }
            }
            catch (Exception ex)
            {
                if (!_isShuttingDown)
                {
                    Console.Error.WriteLine($"[WebRTC] Error reading NodeHelper output: {ex.Message}");
                }
                break;
            }
        }
    }

    /// <summary>
    /// Event raised when NodeHelper wants to send a signaling message to socket
    /// </summary>
    public event Action<string>? OnSignalingMessageFromNodeHelper;

    public void Stop()
    {
        _isShuttingDown = true;
        
        // 🔒 CRITICAL: Clear active session
        lock (_sessionLock)
        {
            if (_currentActiveSessionId == _sessionId)
            {
                Console.WriteLine($"[WebRTC] 🗑️ Clearing active session: {_sessionId}");
                _currentActiveSessionId = null;
            }
        }
        
        if (_nodeProcess != null && !_nodeProcess.HasExited)
        {
            try
            {
                _nodeProcess.Kill(true);
                _nodeProcess.WaitForExit(5000);
                Console.WriteLine("[WebRTC] Node helper stopped");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[WebRTC] Error stopping Node helper: {ex.Message}");
            }
        }
    }

    public void Dispose()
    {
        Stop();
        _nodeProcess?.Dispose();
    }
}
