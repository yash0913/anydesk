const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startURL =
    process.env.ELECTRON_START_URL ||
  win.loadFile(path.join(__dirname, "dist", "index.html"));

mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  win.webContents.openDevTools(); // keep this for debugging
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});