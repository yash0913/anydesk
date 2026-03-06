using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;

namespace DeskLinkAgent.Remote
{
    public class MouseKeyboardController
    {
        // Import Windows API functions
        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        private static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll")]
        private static extern short GetAsyncKeyState(int vKey);

        // Constants for mouse events
        private const uint INPUT_MOUSE = 0;
        private const uint INPUT_KEYBOARD = 1;

        // Mouse event flags
        private const uint MOUSEEVENTF_MOVE = 0x0001;
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
        private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;

        // SendInput flags
        private const uint MOUSEEVENTF_WHEEL = 0x0800;
        private const uint KEYEVENTF_KEYUP = 0x0002;

        // Input structure
        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT
        {
            public uint type;
            public INPUTUNION u;
        }

        [StructLayout(LayoutKind.Explicit)]
        private struct INPUTUNION
        {
            [FieldOffset(0)]
            public MOUSEINPUT mi;
            [FieldOffset(0)]
            public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT
        {
            public int X;
            public int Y;
        }

        // Screen size for coordinate conversion
        private static int screenWidth = Screen.PrimaryScreen.Bounds.Width;
        private static int screenHeight = Screen.PrimaryScreen.Bounds.Height;

        public MouseKeyboardController()
        {
            Console.WriteLine("[MouseKeyboardController] Initialized");
            Console.WriteLine($"[MouseKeyboardController] Screen size: {screenWidth}x{screenHeight}");
        }

        public void MoveMouse(int x, int y)
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] Moving mouse to ({x}, {y})");
                
                // Ensure coordinates are within screen bounds
                x = Math.Max(0, Math.Min(screenWidth - 1, x));
                y = Math.Max(0, Math.Min(screenHeight - 1, y));

                bool success = SetCursorPos(x, y);
                Console.WriteLine($"[MouseKeyboardController] SetCursorPos result: {success}");
                
                // Small delay to ensure the move is processed
                System.Threading.Thread.Sleep(1);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] MoveMouse error: {ex.Message}");
            }
        }

        public void MouseClick(string button)
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] ===== MOUSE CLICK START =====");
                Console.WriteLine($"[MouseKeyboardController] Button: {button}");
                
                // Get current cursor position
                GetCursorPos(out POINT currentPos);
                Console.WriteLine($"[MouseKeyboardController] Current position: ({currentPos.X}, {currentPos.Y})");

                // Use SendInput for more reliable click injection
                bool success = SendMouseClick(button);
                Console.WriteLine($"[MouseKeyboardController] SendInput result: {success}");
                
                if (!success)
                {
                    Console.WriteLine("[MouseKeyboardController] SendInput failed, trying mouse_event fallback");
                    // Fallback to mouse_event if SendInput fails
                    MouseClickFallback(button);
                }

                Console.WriteLine($"[MouseKeyboardController] ===== MOUSE CLICK END =====");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] MouseClick error: {ex.Message}");
            }
        }

        private bool SendMouseClick(string button)
        {
            try
            {
                uint downFlag, upFlag;
                
                switch (button?.ToLower())
                {
                    case "left":
                        downFlag = MOUSEEVENTF_LEFTDOWN;
                        upFlag = MOUSEEVENTF_LEFTUP;
                        break;
                    case "right":
                        downFlag = MOUSEEVENTF_RIGHTDOWN;
                        upFlag = MOUSEEVENTF_RIGHTUP;
                        break;
                    case "middle":
                        downFlag = MOUSEEVENTF_MIDDLEDOWN;
                        upFlag = MOUSEEVENTF_MIDDLEUP;
                        break;
                    default:
                        downFlag = MOUSEEVENTF_LEFTDOWN;
                        upFlag = MOUSEEVENTF_LEFTUP;
                        break;
                }

                // Create input events
                INPUT[] inputs = new INPUT[]
                {
                    new INPUT
                    {
                        type = INPUT_MOUSE,
                        u = new INPUTUNION
                        {
                            mi = new MOUSEINPUT
                            {
                                dx = 0,
                                dy = 0,
                                mouseData = 0,
                                dwFlags = downFlag,
                                time = 0,
                                dwExtraInfo = IntPtr.Zero
                            }
                        }
                    },
                    new INPUT
                    {
                        type = INPUT_MOUSE,
                        u = new INPUTUNION
                        {
                            mi = new MOUSEINPUT
                            {
                                dx = 0,
                                dy = 0,
                                mouseData = 0,
                                dwFlags = upFlag,
                                time = 0,
                                dwExtraInfo = IntPtr.Zero
                            }
                        }
                    }
                };

                Console.WriteLine($"[MouseKeyboardController] Sending {button} down/up via SendInput");
                bool result = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
                
                // Small delay between down and up for better compatibility
                if (result)
                {
                    System.Threading.Thread.Sleep(10);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] SendMouseClick error: {ex.Message}");
                return false;
            }
        }

        private void MouseClickFallback(string button)
        {
            try
            {
                uint downFlag, upFlag;
                
                switch (button?.ToLower())
                {
                    case "left":
                        downFlag = MOUSEEVENTF_LEFTDOWN;
                        upFlag = MOUSEEVENTF_LEFTUP;
                        break;
                    case "right":
                        downFlag = MOUSEEVENTF_RIGHTDOWN;
                        upFlag = MOUSEEVENTF_RIGHTUP;
                        break;
                    case "middle":
                        downFlag = MOUSEEVENTF_MIDDLEDOWN;
                        upFlag = MOUSEEVENTF_MIDDLEUP;
                        break;
                    default:
                        downFlag = MOUSEEVENTF_LEFTDOWN;
                        upFlag = MOUSEEVENTF_LEFTUP;
                        break;
                }

                Console.WriteLine($"[MouseKeyboardController] Sending {button} down/up via mouse_event fallback");
                
                // Mouse down
                mouse_event(downFlag, 0, 0, 0, 0);
                System.Threading.Thread.Sleep(10); // Small delay
                
                // Mouse up
                mouse_event(upFlag, 0, 0, 0, 0);
                
                Console.WriteLine($"[MouseKeyboardController] mouse_event fallback completed");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] MouseClickFallback error: {ex.Message}");
            }
        }

        public void KeyPress(string key)
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] KeyPress: {key}");
                
                // Convert string key to virtual key code
                ushort vkCode = ConvertKeyToVirtualKey(key);
                if (vkCode == 0)
                {
                    Console.WriteLine($"[MouseKeyboardController] Unknown key: {key}");
                    return;
                }

                // Create key down and up events
                INPUT[] inputs = new INPUT[]
                {
                    new INPUT
                    {
                        type = INPUT_KEYBOARD,
                        u = new INPUTUNION
                        {
                            ki = new KEYBDINPUT
                            {
                                wVk = vkCode,
                                wScan = 0,
                                dwFlags = 0, // Key down
                                time = 0,
                                dwExtraInfo = IntPtr.Zero
                            }
                        }
                    },
                    new INPUT
                    {
                        type = INPUT_KEYBOARD,
                        u = new INPUTUNION
                        {
                            ki = new KEYBDINPUT
                            {
                                wVk = vkCode,
                                wScan = 0,
                                dwFlags = KEYEVENTF_KEYUP, // Key up
                                time = 0,
                                dwExtraInfo = IntPtr.Zero
                            }
                        }
                    }
                };

                Console.WriteLine($"[MouseKeyboardController] Sending key {key} via SendInput");
                bool result = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
                Console.WriteLine($"[MouseKeyboardController] SendInput key result: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] KeyPress error: {ex.Message}");
            }
        }

        private ushort ConvertKeyToVirtualKey(string key)
        {
            if (string.IsNullOrEmpty(key)) return 0;
            
            // Handle special keys
            switch (key.ToLower())
            {
                case "enter": return 13;
                case "escape": return 27;
                case "space": return 32;
                case "tab": return 9;
                case "backspace": return 8;
                case "delete": return 46;
                case "arrowup": return 38;
                case "arrowdown": return 40;
                case "arrowleft": return 37;
                case "arrowright": return 39;
                case "shift": return 16;
                case "ctrl": return 17;
                case "alt": return 18;
                case "win": return 91;
            }

            // Handle single character keys
            if (key.Length == 1)
            {
                char c = key[0];
                if (char.IsLetter(c))
                {
                    // Convert to uppercase for virtual key codes
                    return (ushort)char.ToUpper(c);
                }
                else if (char.IsDigit(c))
                {
                    return (ushort)c;
                }
            }

            return 0;
        }

        // Helper method to test if the controller is working
        public void TestClick()
        {
            Console.WriteLine("[MouseKeyboardController] ===== TEST CLICK =====");
            MouseClick("left");
            Console.WriteLine("[MouseKeyboardController] ===== TEST CLICK END =====");
        }
    }
}
