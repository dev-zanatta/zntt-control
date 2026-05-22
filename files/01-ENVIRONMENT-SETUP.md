# 01 — Environment Setup

## Prerequisites

### 1. Node.js
Install Node.js LTS (v20 or v22).
Download from: https://nodejs.org/en/download

Verify installation:
```bash
node -v   # should return v20.x or v22.x
npm -v    # should return 10.x or higher
```

### 2. Quasar CLI
```bash
npm install -g @quasar/cli
quasar --version   # verify
```

### 3. Windows Build Tools (required for better-sqlite3 native compilation)
Run as Administrator in PowerShell:
```powershell
npm install -g windows-build-tools
```
Or install manually:
- Visual Studio Build Tools 2022 (C++ workload)
- Python 3.x

---

## Project Creation

### 1. Create Quasar project
```bash
quasar create zntt-control
```

Select the following options when prompted:
- Project name: `zntt-control`
- Vue version: **Vue 3**
- Quasar version: latest
- CSS preprocessor: **SCSS**
- Quasar components: Manually select → select all defaults
- ESLint: Yes
- Prettier: Yes

### 2. Enter the project folder
```bash
cd zntt-control
```

### 3. Add Electron mode
```bash
quasar mode add electron
```
This creates the `src-electron/` folder automatically.

---

## Install Dependencies

### Production dependencies
```bash
npm install better-sqlite3
npm install vue-draggable-plus
npm install @vueuse/core
```

### Dev dependencies
```bash
npm install -D electron-builder
npm install -D @electron/rebuild
```

### Rebuild better-sqlite3 for Electron
Add this script to `package.json`:
```json
"scripts": {
  "rebuild": "electron-rebuild -f -w better-sqlite3"
}
```

Run after installing:
```bash
npm run rebuild
```

> IMPORTANT: better-sqlite3 is a native Node module and must be compiled
> specifically for the Electron version being used. Always run rebuild after
> installing or updating either Electron or better-sqlite3.

---

## Electron Builder Configuration

In `package.json`, add the `build` section:
```json
"build": {
  "appId": "com.zntt.control",
  "productName": "zntt-control",
  "win": {
    "target": "nsis",
    "icon": "src-electron/icons/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  },
  "files": [
    "dist/electron/**/*"
  ],
  "extraResources": [
    {
      "from": "src-electron/",
      "to": ".",
      "filter": ["**/*"]
    }
  ]
}
```

---

## Running in Development
```bash
quasar dev -m electron
```

## Building for Production (Windows)
```bash
quasar build -m electron
```
Output: `dist/electron/` with the `.exe` installer.

---

## Node Version Management (optional but recommended)
Use `nvm-windows` to manage Node versions:
https://github.com/coreybutler/nvm-windows

```powershell
nvm install 20
nvm use 20
```
