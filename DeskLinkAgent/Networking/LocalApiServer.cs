using WatsonWebserver;
using WatsonWebserver.Core;
using System.Text;
using System.Text.Json;
using System.IO;
using HttpMethod = WatsonWebserver.Core.HttpMethod;

namespace DeskLinkAgent.Networking;

public class LocalApiServer
{
    private readonly string _deviceId;
    private readonly Webserver _server;
    private Func<string, string, Task>? _provisionHandler;

    public const int Port = 17600;

    public LocalApiServer(string deviceId)
    {
        _deviceId = deviceId;
        
        WebserverSettings settings = new WebserverSettings
        {
            Hostname = "127.0.0.1",
            Port = Port
        };
        
        _server = new Webserver(settings, DefaultRoute);

        _server.Routes.PreRouting = (HttpContextBase ctx) =>
        {
            // simple CORS for local usage
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.Headers.Add("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
            ctx.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            if (ctx.Request.Method == HttpMethod.OPTIONS)
            {
                ctx.Response.StatusCode = 204;
                ctx.Response.Send().Wait();
                return Task.FromResult(false); // skip routing
            }
            return Task.FromResult(true);
        };

        _server.Routes.PreAuthentication.Static.Add(HttpMethod.GET, "/device-id", async (HttpContextBase ctx) =>
        {
            var payload = JsonSerializer.Serialize(new { deviceId = _deviceId });
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.Send(payload);
        });

        // POST /provision { serverUrl, agentJwt }
        _server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/provision", async (HttpContextBase ctx) =>
        {
            try
            {
                using var ms = new MemoryStream();
                await ctx.Request.Data.CopyToAsync(ms);
                var body = Encoding.UTF8.GetString(ms.ToArray());
                var json = JsonSerializer.Deserialize<ProvisionPayload>(body);
                if (json == null || string.IsNullOrWhiteSpace(json.serverUrl) || string.IsNullOrWhiteSpace(json.agentJwt))
                {
                    ctx.Response.StatusCode = 400;
                    await ctx.Response.Send("Invalid payload");
                    return;
                }

                Console.WriteLine("[AGENT] Received provisioning");

                if (_provisionHandler == null)
                {
                    ctx.Response.StatusCode = 503;
                    await ctx.Response.Send("Provision handler not ready");
                    return;
                }

                await _provisionHandler(json.serverUrl, json.agentJwt);
                ctx.Response.StatusCode = 200;
                await ctx.Response.Send("OK");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[LocalApi] /provision error: " + ex.Message);
                ctx.Response.StatusCode = 500;
                await ctx.Response.Send("Error");
            }
        });

        _server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/remote/start", async (HttpContextBase ctx) =>
        {
            Console.WriteLine("[LocalApi] remote start requested");
            ctx.Response.StatusCode = 200;
            await ctx.Response.Send("OK");
        });

        _server.Routes.PreAuthentication.Static.Add(HttpMethod.POST, "/remote/stop", async (HttpContextBase ctx) =>
        {
            Console.WriteLine("[LocalApi] remote stop requested");
            ctx.Response.StatusCode = 200;
            await ctx.Response.Send("OK");
        });
    }

    private async Task DefaultRoute(HttpContextBase ctx)
    {
        ctx.Response.StatusCode = 404;
        await ctx.Response.Send("Not Found");
    }

    public Task StartAsync()
    {
        _server.Start();
        return Task.CompletedTask;
    }

    public void SetProvisionHandler(Func<string, string, Task> handler)
    {
        _provisionHandler = handler;
    }

    public Task StopAsync()
    {
        _server.Stop();
        return Task.CompletedTask;
    }

    private class ProvisionPayload
    {
        public string serverUrl { get; set; } = string.Empty;
        public string agentJwt { get; set; } = string.Empty;
    }
}