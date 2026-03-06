using DeskLinkAgent.DeviceId;
using DeskLinkAgent.IPC;
using DeskLinkAgent.Networking;
using DeskLinkAgent.WebRTC;

namespace DeskLinkAgent;

internal class Program
{
    private const string Version = "1.0.0";

    private static LocalApiServer? _apiServer;
    private static AgentIpcServer? _ipcServer;
    private static SocketClient? _socketClient;

    public static async Task Main(string[] args)
    {
        AppDomain.CurrentDomain.UnhandledException += (s, e) =>
        {
            Console.Error.WriteLine($"[ERROR] Unhandled exception: {e.ExceptionObject}");
        };

        Console.WriteLine("====================================");
        Console.WriteLine($"DeskLink Agent v{Version}");
        Console.WriteLine("====================================");
        Console.WriteLine("[AGENT] Starting...");

        try
        {
            WebRtcBootstrapper.EnsureExtracted();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[WebRTC] Startup extraction failed: " + ex.Message);
        }

        string deviceId = DeviceIdProvider.GetOrCreateDeviceId();
        Console.WriteLine($"[AGENT] DeviceId: {deviceId}");

        try
        {
            _apiServer = new LocalApiServer(deviceId);
            await _apiServer.StartAsync();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[ERROR] Failed to start Local API: " + ex.Message);
        }

        try
        {
            _ipcServer = new AgentIpcServer(deviceId);
            _ipcServer.Start();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[ERROR] Failed to start IPC server: " + ex.Message);
        }

        _socketClient = new SocketClient(deviceId, _ipcServer!);

        // Setup provisioning handler so frontend can link this agent to the logged-in user dynamically
        _apiServer?.SetProvisionHandler(async (serverUrl, agentJwt) =>
        {
            try
            {
                await _socketClient.ConnectAsync(serverUrl, agentJwt);
            }
            catch (Exception connEx)
            {
                Console.Error.WriteLine("[ERROR] Provision connect failed: " + connEx.Message);
            }
        });

        // If a backend URL is passed via args or env, optionally try unauth auth flow; otherwise, wait for provisioning
        string? backendUrl = args.Length > 0 ? args[0] : Environment.GetEnvironmentVariable("BACKEND_URL");
        if (!string.IsNullOrWhiteSpace(backendUrl))
        {
            var jwt = await _socketClient.AuthenticateAsync(backendUrl!);
            if (!string.IsNullOrWhiteSpace(jwt))
            {
                try
                {
                    await _socketClient.ConnectAsync(backendUrl!, jwt!);
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("[ERROR] Socket connection error: " + ex.Message);
                }
            }
            else
            {
                Console.WriteLine("[AGENT] Waiting for provisioning from frontend...");
            }
        }
        else
        {
            Console.WriteLine("[AGENT] Waiting for provisioning from frontend...");
        }

        Console.WriteLine("[AGENT] Waiting for remote sessions...");

        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (s, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
        };

        try
        {
            await Task.Delay(Timeout.Infinite, cts.Token);
        }
        catch (TaskCanceledException)
        {
        }

        await ShutdownAsync();
    }

    private static async Task ShutdownAsync()
    {
        Console.WriteLine("[AGENT] Shutting down...");
        try { await (_apiServer?.StopAsync() ?? Task.CompletedTask); } catch (Exception ex) { Console.Error.WriteLine("[ERROR] API stop: " + ex.Message); }
        try { _ipcServer?.Dispose(); } catch (Exception ex) { Console.Error.WriteLine("[ERROR] IPC dispose: " + ex.Message); }
        try { await (_socketClient?.DisposeAsync() ?? ValueTask.CompletedTask); } catch (Exception ex) { Console.Error.WriteLine("[ERROR] Socket dispose: " + ex.Message); }
        Console.WriteLine("[AGENT] Bye.");
    }
}