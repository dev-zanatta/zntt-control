# App Icons

Place the following files in this directory:

- **`icon.png`** — 512×512 or 1024×1024 PNG (used at runtime for the window/taskbar icon in dev mode)
- **`icon.ico`** — Windows ICO file (required for the installer build via electron-builder)
  - Should contain multiple sizes: 16, 24, 32, 48, 64, 128, 256 px
  - Convert `icon.png` to ICO using https://icoconvert.com or ImageMagick

The PNG logo shared in the chat (1080×1080) is the source file.
Save it as `icon.png` and convert to `icon.ico` before running `quasar build -m electron`.
