import { app, BrowserWindow, shell, dialog } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;
let mcpProcess;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Keep a global reference of backend and MCP processes
let processes = [];

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the appropriate URL
  if (isDev) {
    // In development, load from localhost:3000
    mainWindow.loadURL('http://localhost:3000');
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServices() {
  if (isDev) {
    // In development, assume services are started manually
    console.log('Development mode: Backend services should be started manually');
    return;
  }

  // In production, start backend and MCP servers
  const backendPath = path.join(__dirname, '../../backend');
  const mcpPath = path.join(__dirname, '../../mcp-server');

  // Start backend server
  if (fs.existsSync(path.join(backendPath, 'server-improved.js'))) {
    console.log('Starting backend server...');
    backendProcess = spawn('node', ['server-improved.js'], {
      cwd: backendPath,
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log('Backend:', data.toString());
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
    });

    processes.push(backendProcess);
  }

  // Start MCP server
  if (fs.existsSync(path.join(mcpPath, 'server.js'))) {
    console.log('Starting MCP server...');
    mcpProcess = spawn('node', ['server.js'], {
      cwd: mcpPath,
      stdio: 'pipe'
    });

    mcpProcess.stdout.on('data', (data) => {
      console.log('MCP:', data.toString());
    });

    mcpProcess.stderr.on('data', (data) => {
      console.error('MCP Error:', data.toString());
    });

    processes.push(mcpProcess);
  }
}

function stopBackendServices() {
  processes.forEach(process => {
    if (process && !process.killed) {
      process.kill();
    }
  });
  processes = [];
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  
  // Start backend services in production
  if (!isDev) {
    startBackendServices();
  }

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop backend services
  stopBackendServices();
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Stop backend services before quitting
  stopBackendServices();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});

// Handle certificate errors (for development)
if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('http://localhost:') || url.startsWith('https://localhost:')) {
      // Ignore certificate errors for localhost in development
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  });
}