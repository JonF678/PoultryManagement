# Poultry Manager Desktop App

## Overview
This converts your existing Poultry Management PWA into a full desktop application using Electron, adding powerful desktop-specific features while maintaining all existing functionality.

## Desktop Features Added

### Native File Operations
- **File Import**: Native file dialogs for CSV imports
- **Export with Save Dialog**: Choose where to save exports
- **Automatic Backups**: Save backups to custom locations

### Desktop Integration
- **Native Menus**: File, Edit, View, Analytics, and Help menus
- **Keyboard Shortcuts**: 
  - Ctrl/Cmd+I: Import CSV
  - Ctrl/Cmd+E: Export Data
  - Ctrl/Cmd+B: Create Backup
  - Ctrl/Cmd+P: Print Reports
- **System Notifications**: Desktop notifications for operations
- **Window Management**: Proper desktop window with minimize/maximize

### Enhanced Functionality
- **Print Support**: Print production reports directly
- **Offline First**: Works completely offline as desktop app
- **Native Look**: Platform-specific styling and behaviors
- **Better Performance**: No browser overhead

## Quick Start

### Option 1: Development Mode
```bash
# Start the web server and Electron together
node desktop-build.js
electron electron/main.js
```

### Option 2: Standalone Mode
```bash
# For standalone desktop app (requires local files)
electron electron/main.js
```

## Building for Distribution

### Prerequisites
```bash
npm install -g electron-builder
```

### Build Commands
```bash
# Build for current platform
npx electron-builder --config electron-builder.json

# Build for all platforms
npx electron-builder --mac --win --linux --config electron-builder.json

# Create installer packages
npx electron-builder --publish=never --config electron-builder.json
```

### Output
- **Windows**: `.exe` installer in `dist/`
- **macOS**: `.dmg` file in `dist/`
- **Linux**: `.AppImage` and `.deb` in `dist/`

## File Structure
```
electron/
├── main.js          # Main Electron process
├── preload.js       # Secure bridge to web content
├── renderer.js      # Desktop-specific enhancements
electron-builder.json # Build configuration
desktop-build.js     # Build helper script
```

## Desktop vs Web Differences

| Feature | Web (PWA) | Desktop (Electron) |
|---------|-----------|-------------------|
| File Access | Download/Upload only | Native file dialogs |
| Notifications | Browser dependent | Native OS notifications |
| Printing | Browser print | Native print with options |
| Offline | Service worker cache | Full offline capability |
| Updates | Manual refresh | Auto-update support |
| Shortcuts | Limited browser shortcuts | Full keyboard shortcuts |
| Integration | Limited OS integration | Deep OS integration |

## Security Features
- **Context Isolation**: Secure communication between main and renderer
- **No Node Integration**: Web content runs in secure sandbox
- **Preload Script**: Safe API exposure to web content
- **CSP Ready**: Compatible with Content Security Policies

## Development Tips

### Debugging
- Use `F12` to open DevTools in development
- Check `electron/main.js` logs in terminal
- Use `console.log` in preload script for debugging

### Customization
- Modify `electron/main.js` for window behavior
- Update `electron/preload.js` for new desktop features
- Edit `electron-builder.json` for build options

### Performance
- The app loads your existing PWA in an Electron window
- All your existing code works without changes
- IndexedDB, localStorage, and all web APIs work normally

## Deployment
1. Test in development mode first
2. Build for target platforms
3. Test installers on target systems
4. Distribute via direct download or app stores

Your existing authentication system, data management, and all PWA features work exactly the same in the desktop version!