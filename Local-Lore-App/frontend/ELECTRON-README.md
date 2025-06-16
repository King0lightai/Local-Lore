# Local Lore Electron Setup

This document explains how to use the Electron configuration for the Local Lore application.

## Development Mode

### Prerequisites
1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Install Electron dependencies:
   ```bash
   npm install electron electron-builder --save-dev
   ```

### Running in Development

1. **Start the backend server** (in a separate terminal):
   ```bash
   cd ../backend
   npm start
   ```

2. **Start the MCP server** (in another terminal):
   ```bash
   cd ../mcp-server
   npm start
   ```

3. **Start the frontend development server** (in another terminal):
   ```bash
   npm start
   ```

4. **Start the Electron app** (after the above are running):
   ```bash
   npm run electron-dev
   ```

   Or use the batch file:
   ```bash
   start-electron-dev.bat
   ```

### Development Features
- Loads from `http://localhost:3000`
- Opens Developer Tools automatically
- Hot reload works as expected
- Backend services should be started manually

## Production Build

### Building the Application

1. **Build for Windows** (recommended):
   ```bash
   build-electron.bat
   ```

2. **Manual build process**:
   ```bash
   # Install all dependencies
   npm install
   
   # Build React app
   npm run build
   
   # Build Electron app
   npm run electron-dist
   ```

### Production Features
- Loads built files from `dist/` directory
- Automatically starts backend and MCP servers
- No developer tools
- Self-contained executable

## Available Scripts

- `npm run electron` - Run Electron with built files
- `npm run electron-dev` - Run Electron in development mode
- `npm run electron-pack` - Build and package for current platform
- `npm run electron-dist` - Build for distribution (no publishing)

## Build Outputs

- **Windows**: `dist-electron/Local Lore Setup.exe`
- **macOS**: `dist-electron/Local Lore.dmg`
- **Linux**: `dist-electron/Local Lore.AppImage`

## Icon Setup

The application uses `public/logo.png` as the icon. For Windows builds, you may want to convert it to ICO format:

1. Run `convert-icons.bat` (requires ImageMagick)
2. Or manually convert `public/logo.png` to `public/logo.ico`

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Make sure all dependencies are installed in all directories (frontend, backend, mcp-server)

2. **Backend/MCP connection issues**: In development mode, ensure all services are running before starting Electron

3. **Build failures**: Check that all paths in `package.json` build configuration are correct

4. **Icon not showing**: Make sure `public/logo.png` exists and is a valid PNG file

### Development Workflow

The Electron configuration is designed to work seamlessly with your existing development workflow:

1. Your existing `npm start` command continues to work for web development
2. Backend and MCP servers start as usual
3. Electron app connects to the same localhost:3000 during development
4. All hot reload and development features continue to work

### Production Deployment

The production build includes:
- All frontend assets
- Backend server code and dependencies
- MCP server code and dependencies
- Electron wrapper with automatic service startup

This creates a single, distributable application that doesn't require separate installation of Node.js or manual service startup.