# 06 — Theme System

## Design Goals
- Support light and dark themes from day one
- Architecture ready for additional themes in the future
- All colors and design tokens controlled via CSS custom properties
- Theme applied by setting `data-theme` attribute on `<html>` element
- No JavaScript color logic — purely CSS-driven

---

## Token Structure

All tokens prefixed with `--zntt-` to avoid conflicts with Quasar variables.

**`src/assets/themes/variables.css`**
```css
/* === LAYOUT === */
:root {
  --zntt-sidebar-width: 64px;
  --zntt-border-radius: 8px;
  --zntt-border-radius-sm: 4px;
  --zntt-border-radius-lg: 12px;
  --zntt-transition: 150ms ease;
}

/* === DARK THEME (default) === */
:root,
:root[data-theme="dark"] {
  --zntt-bg-primary:    #0d0d0d;
  --zntt-bg-surface:    #1a1a1a;
  --zntt-bg-surface-2:  #222222;
  --zntt-bg-hover:      #2a2a2a;

  --zntt-border:        #2a2a2a;
  --zntt-border-subtle: #1e1e1e;

  --zntt-accent:        #7c6af7;
  --zntt-accent-hover:  #6b58e8;
  --zntt-accent-muted:  rgba(124, 106, 247, 0.15);
  --zntt-teal:          #3ecfcf;
  --zntt-teal-muted:    rgba(62, 207, 207, 0.15);

  --zntt-text-primary:  #e8e8e8;
  --zntt-text-secondary:#888888;
  --zntt-text-disabled: #555555;
  --zntt-text-inverse:  #0d0d0d;

  --zntt-danger:        #e05c5c;
  --zntt-danger-muted:  rgba(224, 92, 92, 0.15);
  --zntt-success:       #4caf82;
  --zntt-success-muted: rgba(76, 175, 130, 0.15);
  --zntt-warning:       #e0a050;
  --zntt-warning-muted: rgba(224, 160, 80, 0.15);

  --zntt-priority-high:   #e05c5c;
  --zntt-priority-medium: #e0a050;
  --zntt-priority-low:    #4caf82;

  --zntt-shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --zntt-shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --zntt-shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
}

/* === LIGHT THEME === */
:root[data-theme="light"] {
  --zntt-bg-primary:    #f0f0f0;
  --zntt-bg-surface:    #ffffff;
  --zntt-bg-surface-2:  #f8f8f8;
  --zntt-bg-hover:      #eeeeee;

  --zntt-border:        #e0e0e0;
  --zntt-border-subtle: #ebebeb;

  --zntt-accent:        #6b58e8;
  --zntt-accent-hover:  #5a47d4;
  --zntt-accent-muted:  rgba(107, 88, 232, 0.1);
  --zntt-teal:          #2ab5b5;
  --zntt-teal-muted:    rgba(42, 181, 181, 0.1);

  --zntt-text-primary:  #1a1a1a;
  --zntt-text-secondary:#666666;
  --zntt-text-disabled: #aaaaaa;
  --zntt-text-inverse:  #ffffff;

  --zntt-danger:        #cc4444;
  --zntt-danger-muted:  rgba(204, 68, 68, 0.1);
  --zntt-success:       #3a9e6e;
  --zntt-success-muted: rgba(58, 158, 110, 0.1);
  --zntt-warning:       #c47a20;
  --zntt-warning-muted: rgba(196, 122, 32, 0.1);

  --zntt-priority-high:   #cc4444;
  --zntt-priority-medium: #c47a20;
  --zntt-priority-low:    #3a9e6e;

  --zntt-shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --zntt-shadow-md: 0 4px 12px rgba(0,0,0,0.12);
  --zntt-shadow-lg: 0 8px 32px rgba(0,0,0,0.16);
}
```

---

## Adding a New Theme (Future)

1. Add a new block in `variables.css`:
```css
:root[data-theme="ocean"] {
  --zntt-bg-primary:   #0a1628;
  --zntt-bg-surface:   #0f2040;
  /* ... all tokens ... */
}
```

2. Add the theme name to the settings options list.

3. The `uiStore.setTheme('ocean')` call handles the rest — no other code changes needed.

---

## Typography

**`src/assets/themes/variables.css`** — typography section
```css
:root {
  --zntt-font-ui:   'Inter', system-ui, sans-serif;
  --zntt-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --zntt-text-xs:   11px;
  --zntt-text-sm:   12px;
  --zntt-text-base: 14px;
  --zntt-text-md:   16px;
  --zntt-text-lg:   20px;
  --zntt-text-xl:   24px;
}
```

Load fonts via Google Fonts in `index.html` or via npm packages:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Quasar Integration

Override Quasar's default colors to use the theme tokens.

**`src/css/quasar.variables.scss`**
```scss
$primary:   #7c6af7;
$secondary: #3ecfcf;
$accent:    #7c6af7;
$dark:      #1a1a1a;
$positive:  #4caf82;
$negative:  #e05c5c;
$info:      #3ecfcf;
$warning:   #e0a050;
```

For component-level styles, always use CSS variables instead of hardcoded colors:
```css
/* ✅ correct */
background: var(--zntt-bg-surface);
color: var(--zntt-text-primary);

/* ❌ avoid */
background: #1a1a1a;
color: #e8e8e8;
```

---

## ThemeToggle Component

**`src/components/common/ThemeToggle.vue`**
```vue
<template>
  <button class="theme-toggle" @click="toggle" :title="`Switch to ${nextTheme} mode`">
    <span class="icon">{{ uiStore.theme === 'dark' ? '☀️' : '🌙' }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useUiStore } from 'src/stores/uiStore'

const uiStore = useUiStore()

const nextTheme = computed(() => uiStore.theme === 'dark' ? 'light' : 'dark')

function toggle() {
  uiStore.setTheme(nextTheme.value)
}
</script>
```

---

## Theme Initialization

In `App.vue`, initialize theme before render:
```vue
<script setup>
import { onMounted } from 'vue'
import { useUiStore } from 'src/stores/uiStore'

const uiStore = useUiStore()

onMounted(async () => {
  await uiStore.initTheme()
})
</script>
```
