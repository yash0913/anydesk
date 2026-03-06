using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;

namespace DeskLinkAgent.WebRTC;

public static class WebRtcBootstrapper
{
    public static string WebRtcBasePath
    {
        get
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            return Path.Combine(appData, "DeskLink", "WebRTC");
        }
    }

    public static void EnsureExtracted()
    {
        var targetDir = WebRtcBasePath;
        Directory.CreateDirectory(targetDir);

        try
        {
            ExtractEmbeddedPayloadZip(targetDir);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WebRTC] Failed to extract embedded WebRTC payload: {ex.Message}");
            return;
        }

        ValidateRuntimeDependencies(targetDir);
    }

    private static void ExtractEmbeddedPayloadZip(string targetDir)
    {
        var asm = Assembly.GetExecutingAssembly();
        const string resourceName = "DeskLinkAgent.WebRTC.webrtc_payload.zip";

        using var zipStream = asm.GetManifestResourceStream(resourceName);
        if (zipStream == null)
        {
            throw new InvalidOperationException($"Embedded resource not found: {resourceName}");
        }

        // We always try to extract to ensure scripts like NodeHelper.js are up to date.
        // The loop below handles individual file locks (like node.exe) gracefully.


        // Optimization: Still extract NodeHelper.js (it's small and rarely locked)
        // But skip node.exe if it exists to avoid the lock error.
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);
        foreach (var entry in archive.Entries)
        {
            try
            {
                var normalized = entry.FullName.Replace('/', Path.DirectorySeparatorChar);
                var destPath = Path.Combine(targetDir, normalized);

                if (string.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(destPath);
                    continue;
                }

                var destDir = Path.GetDirectoryName(destPath);
                if (!string.IsNullOrWhiteSpace(destDir))
                {
                    Directory.CreateDirectory(destDir);
                }

                // ONLY skip node.exe if it exists
                if (destPath.EndsWith("node.exe", StringComparison.OrdinalIgnoreCase) && File.Exists(destPath))
                {
                    continue;
                }

                entry.ExtractToFile(destPath, overwrite: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WebRTC] Warning: Could not extract {entry.FullName}: {ex.Message}");
            }
        }
    }

    private static void ValidateRuntimeDependencies(string baseDir)
    {
        var nodeExe = Path.Combine(baseDir, "node", "node.exe");
        if (!File.Exists(nodeExe))
        {
            Console.Error.WriteLine("[WebRTC] CRITICAL: Missing bundled Node runtime after extraction.");
            Console.Error.WriteLine($"[WebRTC] Expected file: {nodeExe}");
        }

        var wrtcDir = Path.Combine(baseDir, "node_modules", "wrtc");
        if (Directory.Exists(wrtcDir))
        {
            return;
        }

        Console.Error.WriteLine("[WebRTC] CRITICAL: Missing node dependency 'wrtc' after extraction.");
        Console.Error.WriteLine($"[WebRTC] Expected directory: {wrtcDir}");
        Console.Error.WriteLine("[WebRTC] This usually means your release/package did not include WebRTC/node_modules.");

        try
        {
            var top = Directory.GetFileSystemEntries(baseDir)
                .Select(Path.GetFileName)
                .OrderBy(x => x)
                .ToArray();
            Console.Error.WriteLine("[WebRTC] Extracted WebRTC dir contents (top-level): " + string.Join(", ", top));
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[WebRTC] Failed to list extracted WebRTC directory: " + ex.Message);
        }
    }
}
