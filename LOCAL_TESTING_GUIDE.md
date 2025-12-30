# Local Testing Guide for VisionDesk

This guide explains how to run the VisionDesk application fully locally on your PC and allow a friend's PC on the same network (LAN) to connect and test features like DeskLink (AnyDesk-like remote access) and Device ID generation.

## Prerequisites
- **Node.js** (Installed)
- **.NET SDK** (Installed)
- **MongoDB** (You have a cloud URI in `.env`, so this is ready)
- Both PCs must be on the **Same Wi-Fi/Network**.

## Step 1: Find Your Local IP Address
You (the host) need to know your local IP address so your friend can connect to you.
1. Open PowerShell or Command Prompt.
2. Run `ipconfig`.
3. Look for "IPv4 Address" (e.g., `192.168.1.15`).
   *Note this down. We will call this `<YOUR_IP>`.*

---

## Step 2: Start the Backend (Server)
The backend manages connections and signaling.

1. Open a new Terminal (PowerShell).
2. Navigate to the backend folder:
   ```powershell
   cd backend
   ```
3. Install dependencies (if not done):
   ```powershell
   npm install
   ```
4. Start the server:
   ```powershell
   npm start
   ```
   *You should see: "Server running on port 5000"*

---

## Step 3: Start the DeskLink Agent (Native Device ID)
This is the native program that generates the "real" Device ID.

**On YOUR PC (Host/Agent):**
1. Open a **new** Terminal.
2. Navigate to `DeskLinkAgent`:
   ```powershell
   cd DeskLinkAgent
   ```
3. Run the agent, pointing it to your local backend:
   ```powershell
   dotnet run http://localhost:5000
   ```
   *You should see: "[DeskLinkAgent] deviceId=..." and "Connecting to backend at: http://localhost:5000"*

**On FRIEND'S PC (If they want to be an Agent too):**
*They need the `DeskLinkAgent` code or built binary.*
1. They run:
   ```powershell
   dotnet run http://<YOUR_IP>:5000
   ```
   *(Replace `<YOUR_IP>` with the IP you found in Step 1)*

---

## Step 4: Start the Frontend (Web UI)
This is the visual interface.

1. Open a **new** Terminal (root folder).
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the dev server exposed to the network:
   ```powershell
   npm run dev
   ```
   *You should see: "Network: http://<YOUR_IP>:5173/"*

---

## Step 5: How to Test

### 1. Verify Native Device ID
- Look at the **Step 3 Terminal**. You will see a `deviceId` like `550e8400...`.
- This confirms the native program is running and generating IDs locally.

### 2. Verify Connection (Wiring)
- **You (Host)**: Open Chrome and go to `http://localhost:5173`.
- **Friend**: Open Chrome and go to `http://<YOUR_IP>:5173`.
- Both of you should see the login/welcome screen.
- **Login**: Use valid credentials (or Sign up).
- **Navigate to DeskLink**: Go to specific workspace -> DeskLink.
- **Check Status**:
    - The frontend should automatically connect to the backend at `<YOUR_IP>:5000`.
    - If you see "Connected" or can generate a Web ID, that's good.
    - To use the **Native ID** for remote access, you might need to copy the ID printed in the **DeskLinkAgent terminal** and enter it in the connection box on the other PC.

### Troubleshooting
- **Firewall**: If your friend cannot load the page, your Windows Firewall might be blocking Node.js.
  - Quick fix: Allow "Node.js JavaScript Runtime" through firewall, or temporarily disable firewall for Private networks.
- **Connection Refused**: Ensure Backend is running on port 5000.
