using DeskLinkAgent.DeviceId;
using DeskLinkAgent.IPC;
using DeskLinkAgent.Networking;

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

        string backendUrl = args.Length > 0
            ? args[0]
            : (Environment.GetEnvironmentVariable("BACKEND_URL") ?? "https://your-backend.com");

        _socketClient = new SocketClient(deviceId, _ipcServer!);
        var jwt = await _socketClient.AuthenticateAsync(backendUrl);
        if (string.IsNullOrWhiteSpace(jwt))
        {
            Console.Error.WriteLine("[ERROR] Could not obtain auth token. Exiting.");
            await ShutdownAsync();
            return;
        }

        try
        {
            await _socketClient.ConnectAsync(backendUrl, jwt!);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[ERROR] Socket connection error: " + ex.Message);
            await ShutdownAsync();
            return;
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