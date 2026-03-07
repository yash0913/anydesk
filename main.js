const { app, BrowserWindow, Menu, Tray, dialog, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

// Import logger with fallback
let AgentLogger;
try {
  AgentLogger = require('./scripts/agent-logger');
} catch (error) {
  console.warn('Agent logger not found, using console fallback');
  AgentLogger = class {
    constructor() {}
    info(msg) { console.log(`[Agent] ${msg}`); }
    error(msg) { console.error(`[Agent] ${msg}`); }
    warn(msg) { console.warn(`[Agent] ${msg}`); }
    debug(msg) { console.debug(`[Agent] ${msg}`); }
    getLogDir() { return require('os').tmpdir(); }
    getLogPath() { return require('path').join(require('os').tmpdir(), 'agent.log'); }
  };
}

let mainWindow;
let agentProcess = null;
let tray = null;
let logger = new AgentLogger();

// Agent Management Functions
function getAgentPath() {
  // Check if we're in development (main.js is in project root)
  const isDevelopment = __dirname.includes('VanillaIceCream');
  
  if (isDevelopment) {
    // Development: use build-resources from project root
    const devPath = path.join(__dirname, "build-resources", "agent", "DeskLinkAgent.exe");
    console.log(`[DEBUG] Development mode, looking for agent at: ${devPath}`);
    return devPath;
  } else {
    // Production: use app resources
    const prodPath = path.join(process.resourcesPath, "agent", "DeskLinkAgent.exe");
    console.log(`[DEBUG] Production mode, looking for agent at: ${prodPath}`);
    return prodPath;
  }
}

function startAgent() {
  if (agentProcess && !agentProcess.killed) {
    logger.info('Agent is already running');
    return;
  }

  const agentPath = getAgentPath();
  
  if (!fs.existsSync(agentPath)) {
    const errorMsg = `Agent not found at: ${agentPath}`;
    logger.error(errorMsg);
    return;
  }

  try {
    logger.info(`Starting agent from: ${agentPath}`);
    
    agentProcess = spawn(agentPath, [], {
      detached: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    agentProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      logger.info(`Agent stdout: ${output}`);
    });

    agentProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      logger.error(`Agent stderr: ${output}`);
    });

    agentProcess.on('close', (code) => {
      logger.info(`Agent process exited with code ${code}`);
      agentProcess = null;
    });

    agentProcess.on('error', (error) => {
      logger.error(`Failed to start agent: ${error.message}`);
      agentProcess = null;
    });

    logger.info('Agent started successfully');
  } catch (error) {
    logger.error(`Error starting agent: ${error.message}`);
  }
}

function stopAgent() {
  if (agentProcess && !agentProcess.killed) {
    logger.info('Stopping agent...');
    agentProcess.kill('SIGTERM');
    agentProcess = null;
    logger.info('Agent stopped');
  } else {
    logger.warn('Attempted to stop agent but it was not running');
  }
}

function restartAgent() {
  logger.info('Restarting agent...');
  stopAgent();
  setTimeout(startAgent, 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load built React app
  const startURL = process.env.ELECTRON_START_URL || 
    path.join(__dirname, "dist", "index.html");
  
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(startURL);
  } else {
    mainWindow.loadFile(startURL);
  }

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Start agent when window is ready
  mainWindow.once('ready-to-show', () => {
    startAgent();
  });

  // Create system tray
  createTray();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  
  // Only create tray if icon exists, otherwise skip
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath);
  } else {
    console.warn('Tray icon not found, skipping tray creation');
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show VisionDesk',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Restart Agent',
      click: () => {
        restartAgent();
      }
    },
    {
      label: 'Stop Agent',
      click: () => {
        stopAgent();
      }
    },
    {
      label: 'View Agent Logs',
      click: () => {
        const logPath = logger.getLogDir();
        shell.openPath(logPath).catch(err => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Logs Not Found',
            message: 'Agent logs directory not found. The agent may not have started yet.'
          });
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        stopAgent();
        app.quit();
      }
    }
  ]);

  tray.setToolTip('VisionDesk');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopAgent();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  stopAgent();
});