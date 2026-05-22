# 08 — Build & Distribution (Windows)

## Build Tool
`electron-builder` — generates a Windows NSIS installer (.exe)

---

## quasar.config.js — Electron section

```js
electron: {
  bundler: 'builder',
  builder: {
    appId: 'com.zntt.control',
    productName: 'zntt-control',
    copyright: 'Personal use',

    win: {
      target: [{ target: 'nsis', arch: ['x64'] }],
      icon: 'src-electron/icons/icon.ico'
    },

    nsis: {
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: 'zntt-control'
    },

    // Ensure native modules are rebuilt for the target Electron version
    afterPack: async (context) => {
      // electron-rebuild runs automatically via package.json hooks
    }
  }
}
```

---

## package.json scripts

```json
"scripts": {
  "dev": "quasar dev -m electron",
  "build": "quasar build -m electron",
  "rebuild": "electron-rebuild -f -w better-sqlite3",
  "postinstall": "npm run rebuild"
}
```

---

## Build Command

```bash
quasar build -m electron
```

Output:
```
dist/
└── electron/
    ├── Packaged/        ← unpacked app (for testing)
    └── zntt-control Setup 1.0.0.exe   ← installer
```

---

## App Icon

Place the icon at `src-electron/icons/icon.ico`.
Requirements: ICO format, minimum 256×256px.
Tools: https://icoconvert.com or GIMP

---

## Update Strategy

### Philosophy
No auto-update mechanism. Updates are manual reinstalls.
The NSIS installer is configured to NOT wipe userData on reinstall.

### What gets updated
- The app files (JS, assets, Electron binaries)

### What is NEVER touched
- `%APPDATA%\zntt-control\database.sqlite`
- `%APPDATA%\zntt-control\attachments\`

### Migration on update
When a new version includes a new migration file:
1. User installs new version over old
2. App starts → `runMigrations()` runs
3. New migration detected (not in `_migrations` table)
4. Migration applied automatically
5. User sees no disruption

### Version bump workflow
1. Update `version` in `package.json`
2. Add new migration file if schema changed: `002_add_new_column.js`
3. Run `quasar build -m electron`
4. Distribute new `.exe`

---

## Native Module Rebuild

`better-sqlite3` is a native Node.js addon compiled for a specific Node/Electron ABI.
It MUST be rebuilt against the Electron version before building.

```bash
# Run before every build
npx electron-rebuild -f -w better-sqlite3
```

Or add to build script:
```json
"prebuild": "npm run rebuild"
```

If you see errors like `NODE_MODULE_VERSION mismatch` at runtime,
it means the rebuild step was skipped.

---

## Testing the Build

Before distributing:
1. Run `quasar build -m electron`
2. Navigate to `dist/electron/Packaged/`
3. Run `zntt-control.exe` directly to test the unpacked version
4. Verify: DB creates in AppData, attachments save correctly, drag-drop works
5. If OK, run the `Setup.exe` installer and test installed version

---

## AppData Location (for reference)

During development:
```
%APPDATA%\zntt-control\   ← or the dev app name set by Electron
```

In production (after install):
```
C:\Users\{user}\AppData\Roaming\zntt-control\
├── database.sqlite
└── attachments\
```

To verify during development, add a button in Settings → "Open Data Folder":
```js
const { shell, app } = require('electron')
shell.openPath(app.getPath('userData'))
```
