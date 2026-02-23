using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using SocketIOClient;
using DeskLinkAgent.IPC;

namespace DeskLinkAgent.Networking;

public class SocketClient : IAsyncDisposable
{
    private readonly string _deviceId;
    private readonly AgentIpcServer _ipc;
    private SocketIOClient.SocketIO? _client;

    public SocketClient(string deviceId, AgentIpcServer ipc)
    {
        _deviceId = deviceId;
        _ipc = ipc;
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

        _client = new SocketIOClient.SocketIO(serverUrl, new SocketIOOptions
        {
            Reconnection = true,
            ReconnectionAttempts = int.MaxValue,
            ReconnectionDelay = 2000,
            Auth = new Dictionary<string, object>
            {
                { "token", jwtToken }
            }
        });

        _client.OnConnected += async (_, __) =>
        {
            var sid = _client?.Id;
            Console.WriteLine($"[AGENT] Connected: socketId={sid}");
            await Emit("device-register", new { deviceId = _deviceId });
            Console.WriteLine("[AGENT] Registered successfully");
        };

        _client.OnDisconnected += (_, reason) =>
        {
            Console.Error.WriteLine("[AGENT] Disconnected: " + reason);
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
            _client?.Dispose();
        }
        catch { }
        return ValueTask.CompletedTask;
    }
}