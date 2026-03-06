using System.Runtime.InteropServices;
using System.Diagnostics;

namespace DeskLinkAgent.Remote;

/// <summary>
/// Detects local host activity (mouse/keyboard) using global Windows hooks.
/// Ignores injected/simulated input to avoid self-triggering from remote control.
/// </summary>
public class HostActivityDetector : IDisposable
{
    public delegate void HostActivityDetectedHandler();
    public event HostActivityDetectedHandler? OnActivityDetected;

    private IntPtr _mouseHookId = IntPtr.Zero;
    private IntPtr _keyboardHookId = IntPtr.Zero;
    private LowLevelProc? _mouseProc;
    private LowLevelProc? _keyboardProc;

    private bool _disposed = false;
    private Thread? _hookThread;

    public void Start()
    {
        if (_hookThread != null) return;

        _mouseProc = MouseHookCallback;
        _keyboardProc = KeyboardHookCallback;

        _hookThread = new Thread(() =>
        {
            _mouseHookId = SetHook(WH_MOUSE_LL, _mouseProc);
            _keyboardHookId = SetHook(WH_KEYBOARD_LL, _keyboardProc);

            // Message loop required for hooks to work
            MSG msg;
            while (GetMessage(out msg, IntPtr.Zero, 0, 0))
            {
                TranslateMessage(ref msg);
                DispatchMessage(ref msg);
            }
        });

        _hookThread.IsBackground = true;
        _hookThread.Start();
        Console.WriteLine("[HostActivityDetector] Detection started.");
    }

    private IntPtr SetHook(int idHook, LowLevelProc proc)
    {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule!)
        {
            return SetWindowsHookEx(idHook, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);

    private IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var hookStruct = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
            // Ignore injected input (LLMHF_INJECTED = 0x01)
            if ((hookStruct.flags & 0x01) == 0)
            {
                OnActivityDetected?.Invoke();
            }
        }
        return CallNextHookEx(_mouseHookId, nCode, wParam, lParam);
    }

    private IntPtr KeyboardHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var hookStruct = Marshal.PtrToStructure<KBDLLHOOKSTRUCT>(lParam);
            // Ignore injected input (LLKHF_INJECTED = 0x10)
            if ((hookStruct.flags & 0x10) == 0)
            {
                OnActivityDetected?.Invoke();
            }
        }
        return CallNextHookEx(_keyboardHookId, nCode, wParam, lParam);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        if (_mouseHookId != IntPtr.Zero) UnhookWindowsHookEx(_mouseHookId);
        if (_keyboardHookId != IntPtr.Zero) UnhookWindowsHookEx(_keyboardHookId);
        
        // Signal message loop to exit if needed, or rely on IsBackground thread
    }

    #region Native Methods

    private const int WH_KEYBOARD_LL = 13;
    private const int WH_MOUSE_LL = 14;

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int x; public int y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSLLHOOKSTRUCT
    {
        public POINT pt;
        public uint mouseData;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT
    {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public POINT pt;
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern bool GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage([In] ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage([In] ref MSG lpMsg);

    #endregion
}
