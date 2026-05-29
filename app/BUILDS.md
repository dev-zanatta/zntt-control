# zntt-control — Build Guide

## Prerequisites

### All platforms
1. **Rust toolchain** — install from https://rustup.rs/
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   # Windows: download and run rustup-init.exe from the same URL
   ```
2. **Node.js** v18+ and npm
3. Install npm dependencies:
   ```
   npm install
   ```
4. **Generate app icons** from the SVG source (one-time setup):
   ```
   npx tauri icon src-electron/icons/icon.png
   # or provide any 1024x1024 PNG:
   npx tauri icon path/to/your-icon.png
   ```
   This populates `src-tauri/icons/` with all required sizes.

### Windows only
- Visual Studio Build Tools (C++ workload) — required by Rust/Tauri
- For NSIS installer: install NSIS from https://nsis.sourceforge.io/

### macOS only
- Xcode Command Line Tools: `xcode-select --install`
- For universal binary: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`

### Linux only
- `libwebkit2gtk-4.1`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  ```
  sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
  ```

---

## Development

```bash
npm run tauri:dev
```

This starts the Quasar dev server and opens a native Tauri window simultaneously.
Hot reload works — changes in `src/` refresh the Tauri window automatically.

Alternatively, run them separately:
```bash
# Terminal 1
npm run dev          # Quasar dev server at http://localhost:9000

# Terminal 2
npm run tauri:dev    # Tauri window (waits for dev server to be ready)
```

---

## Building installers

### Windows — NSIS + MSI
> **Must run on a Windows machine** (or Windows CI runner).
> Cross-compilation from macOS/Linux is not supported for Windows targets.

```bash
npm run gen_installer_win
```

Output: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/zntt-control_1.0.0_x64-setup.exe`

### macOS — DMG (Universal: Intel + Apple Silicon)
> **Must run on a macOS machine** (Apple requirement for code signing and universal binaries).

```bash
npm run gen_installer_mac
```

Output: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/zntt-control_1.0.0_universal.dmg`

### Linux — AppImage + deb
> Can run on any Linux machine or Linux CI runner.

```bash
npm run gen_installer_linux
```

Output:
- `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/zntt-control_1.0.0_amd64.AppImage`
- `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/zntt-control_1.0.0_amd64.deb`

---

## CI/CD with GitHub Actions

To generate all three installers from a single push, use a matrix workflow.
The repository owner can request the `.github/workflows/build.yml` file to be generated.

Basic matrix strategy:
```yaml
strategy:
  matrix:
    include:
      - platform: windows-latest
        script: gen_installer_win
        target: x86_64-pc-windows-msvc
      - platform: macos-latest
        script: gen_installer_mac
        target: universal-apple-darwin
      - platform: ubuntu-22.04
        script: gen_installer_linux
        target: x86_64-unknown-linux-gnu
```

---

## Code signing (distribution)

### Windows
Set environment variables before building:
```
TAURI_SIGNING_PRIVATE_KEY=<your-private-key>
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<password>
```

### macOS
Requires an Apple Developer account. Set:
```
APPLE_CERTIFICATE=<base64-encoded-p12>
APPLE_CERTIFICATE_PASSWORD=<password>
APPLE_SIGNING_IDENTITY=<Developer ID>
APPLE_ID=<your-apple-id>
APPLE_PASSWORD=<app-specific-password>
APPLE_TEAM_ID=<team-id>
```

### Linux
No code signing required for AppImage/deb.

---

## Architecture notes

- **Database**: SQLite via `tauri-plugin-sql`, stored in the OS app data dir.
- **Files** (logos, attachments): stored in `appDataDir()/attachments/...` as absolute paths.
- **Future REST API**: change one import per domain service from
  `@/infrastructure/tauri/` → `@/infrastructure/http/`
  then run `npm install axios` and configure `src/infrastructure/api.js`.
