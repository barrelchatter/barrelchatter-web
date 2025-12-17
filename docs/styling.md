# Design System & Styling

> SCSS architecture, design tokens, and styling patterns for BarrelChatter.

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Design Tokens](#design-tokens)
- [Component Patterns](#component-patterns)
- [Common Mixins](#common-mixins)
- [Responsive Design](#responsive-design)
- [Dark Theme](#dark-theme)

---

## Overview

BarrelChatter uses **SCSS Modules** for component-scoped styling with a shared design system.

### Key Principles

1. **Component-scoped** — Each component has its own `.module.scss` file
2. **Shared tokens** — Colors, spacing, typography from `_design-system.scss`
3. **Dark-first** — Designed primarily for dark mode
4. **Mobile-friendly** — Responsive breakpoints for all screen sizes

### Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Amber (Primary) | `#D4A574` | Buttons, links, accents |
| Dark Background | `#1A1A1A` | Page backgrounds |
| Card Background | `#2A2A2A` | Cards, modals |
| Surface | `#333333` | Inputs, hover states |
| Text Primary | `#FFFFFF` | Headings, important text |
| Text Secondary | `#AAAAAA` | Labels, hints |
| Text Muted | `#666666` | Disabled, placeholders |
| Success | `#4CAF50` | Good deals, success states |
| Warning | `#FFA000` | Warnings, alerts |
| Error | `#F44336` | Errors, danger actions |

---

## File Structure

```
src/styles/
├── _design-system.scss     # Variables, mixins, base styles
├── global.scss             # Global styles, resets
├── theme.scss              # Theme variable definitions
│
├── AppLayout.module.scss
├── LoginPage.module.scss
├── BottlesPage.module.scss
├── BottleDetailPage.module.scss
├── InventoryPage.module.scss
├── InventoryDetailPage.module.scss
├── TastingsPage.module.scss
├── WishlistPage.module.scss
├── TagsPage.module.scss
├── ProfilePage.module.scss
├── HomePage.module.scss
├── StorageLocationsPage.module.scss
│
├── Admin*.module.scss      # Admin page styles
│
├── PhotoUpload.module.scss
├── LogTastingModal.module.scss
├── NewBottleSubmissionModal.module.scss
├── StorageLocationSelect.module.scss
├── PurchaseLocationSelect.module.scss
├── BarrelTrackingSection.module.scss
├── BottlePricingCard.module.scss
├── DealBadge.module.scss
└── PurchaseInfoSection.module.scss
```

---

## Design Tokens

### Colors

```scss
// _design-system.scss

// Primary
$color-primary: #D4A574;
$color-primary-hover: #E5B685;
$color-primary-active: #C39463;

// Backgrounds
$bg-page: #1A1A1A;
$bg-card: #2A2A2A;
$bg-surface: #333333;
$bg-input: #333333;
$bg-hover: #3A3A3A;

// Text
$text-primary: #FFFFFF;
$text-secondary: #AAAAAA;
$text-muted: #666666;
$text-inverse: #1A1A1A;

// Status
$color-success: #4CAF50;
$color-warning: #FFA000;
$color-error: #F44336;
$color-info: #2196F3;

// Deals
$color-great-deal: #4CAF50;
$color-good-deal: #8BC34A;
$color-fair: #9E9E9E;
$color-above-avg: #FF9800;
$color-premium: #F44336;
```

### Spacing

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
```

### Typography

```scss
// Font family
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
              'Helvetica Neue', Arial, sans-serif;
$font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', monospace;

// Font sizes
$font-size-xs: 11px;
$font-size-sm: 13px;
$font-size-md: 15px;
$font-size-lg: 18px;
$font-size-xl: 24px;
$font-size-2xl: 32px;

// Font weights
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// Line heights
$line-height-tight: 1.2;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;
```

### Border Radius

```scss
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;
$radius-full: 9999px;
```

### Shadows

```scss
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
```

### Breakpoints

```scss
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
```

---

## Component Patterns

### Page Layout

```scss
.page {
  padding: $spacing-lg;
  max-width: 1400px;
  margin: 0 auto;
}

.headerRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
  gap: $spacing-md;
  
  h1 {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    margin: 0;
  }
}

.subtitle {
  color: $text-secondary;
  font-size: $font-size-md;
  margin-top: $spacing-xs;
}
```

### Cards

```scss
.card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.cardTitle {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
}
```

### Tables

```scss
.tableWrapper {
  overflow-x: auto;
  background: $bg-card;
  border-radius: $radius-lg;
}

.table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: $spacing-md;
    font-weight: $font-weight-medium;
    color: $text-secondary;
    font-size: $font-size-sm;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid $bg-surface;
  }
  
  td {
    padding: $spacing-md;
    color: $text-primary;
    border-bottom: 1px solid rgba($bg-surface, 0.5);
    vertical-align: top;
  }
  
  tr:hover td {
    background: $bg-hover;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
}
```

### Forms

```scss
.formRow {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  
  @media (max-width: $breakpoint-md) {
    flex-direction: column;
  }
}

.label {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-secondary;
}

.input {
  padding: $spacing-sm $spacing-md;
  background: $bg-input;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-size-md;
  transition: border-color 0.2s, background 0.2s;
  
  &:focus {
    outline: none;
    border-color: $color-primary;
    background: lighten($bg-input, 5%);
  }
  
  &::placeholder {
    color: $text-muted;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.textarea {
  min-height: 100px;
  resize: vertical;
}
```

### Buttons

```scss
// Primary button
.primaryButton {
  padding: $spacing-sm $spacing-lg;
  background: $color-primary;
  color: $text-inverse;
  border: none;
  border-radius: $radius-md;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }
  
  &:active:not(:disabled) {
    background: $color-primary-active;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Secondary button
.secondaryButton {
  padding: $spacing-sm $spacing-lg;
  background: transparent;
  color: $color-primary;
  border: 1px solid $color-primary;
  border-radius: $radius-md;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  
  &:hover:not(:disabled) {
    background: rgba($color-primary, 0.1);
  }
}

// Small button
.smallButton {
  padding: $spacing-xs $spacing-sm;
  background: $bg-surface;
  color: $text-primary;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: $bg-hover;
  }
}

// Danger button
.dangerButton {
  background: $color-error;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($color-error, 10%);
  }
}
```

### Modals

```scss
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.modal {
  background: $bg-card;
  border-radius: $radius-lg;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-xl;
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $bg-surface;
  
  h2 {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: 0;
  }
}

.modalBody {
  padding: $spacing-lg;
}

.modalFooter {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1px solid $bg-surface;
}

.closeButton {
  background: none;
  border: none;
  color: $text-secondary;
  font-size: $font-size-xl;
  cursor: pointer;
  padding: $spacing-xs;
  
  &:hover {
    color: $text-primary;
  }
}
```

### Badges & Chips

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.statusPending {
  background: rgba($color-warning, 0.2);
  color: $color-warning;
}

.statusApproved {
  background: rgba($color-success, 0.2);
  color: $color-success;
}

.statusRejected {
  background: rgba($color-error, 0.2);
  color: $color-error;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background: $bg-surface;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $text-secondary;
}
```

### View Mode Toggle

```scss
.viewToggle {
  display: flex;
  background: $bg-surface;
  border-radius: $radius-md;
  overflow: hidden;
}

.viewModeButton {
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  
  &:hover {
    background: $bg-hover;
  }
}

.viewModeButtonActive {
  @extend .viewModeButton;
  background: $color-primary;
  color: $text-inverse;
  
  &:hover {
    background: $color-primary-hover;
  }
}
```

---

## Common Mixins

```scss
// Truncate text with ellipsis
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Visually hidden (accessible)
@mixin sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

// Focus ring
@mixin focus-ring {
  outline: 2px solid $color-primary;
  outline-offset: 2px;
}

// Card base
@mixin card-base {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
}

// Table base
@mixin table-base {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: $spacing-md;
    text-align: left;
  }
  
  th {
    font-weight: $font-weight-medium;
    color: $text-secondary;
    font-size: $font-size-sm;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    color: $text-primary;
  }
}

// Grid layouts
@mixin card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

@mixin gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-md;
}

@mixin stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-md;
}
```

---

## Responsive Design

### Breakpoint Usage

```scss
// Mobile-first approach
.container {
  padding: $spacing-md;
  
  @media (min-width: $breakpoint-md) {
    padding: $spacing-lg;
  }
  
  @media (min-width: $breakpoint-lg) {
    padding: $spacing-xl;
  }
}

// Hide on mobile
.desktopOnly {
  display: none;
  
  @media (min-width: $breakpoint-md) {
    display: block;
  }
}

// Hide on desktop
.mobileOnly {
  display: block;
  
  @media (min-width: $breakpoint-md) {
    display: none;
  }
}
```

### Common Responsive Patterns

```scss
// Sidebar collapse
.appShell {
  display: flex;
  
  .sidebar {
    width: 240px;
    flex-shrink: 0;
    
    @media (max-width: $breakpoint-md) {
      display: none; // Or transform to drawer
    }
  }
  
  .mainArea {
    flex: 1;
    min-width: 0;
  }
}

// Form row stack
.formRow {
  display: flex;
  gap: $spacing-md;
  
  @media (max-width: $breakpoint-md) {
    flex-direction: column;
  }
}

// Grid responsive columns
.cardGrid {
  display: grid;
  gap: $spacing-lg;
  grid-template-columns: 1fr;
  
  @media (min-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## Dark Theme

BarrelChatter is designed dark-first. All colors are optimized for dark backgrounds.

### Color Philosophy

- **High contrast** for important text and actions
- **Reduced brightness** for large background areas
- **Accent color (amber)** provides warmth appropriate for bourbon
- **Status colors** use muted versions for backgrounds

### Preventing Light Flash

```scss
// In index.html or global.scss
html, body {
  background: $bg-page;
  color: $text-primary;
}

// Prevent flash of unstyled content
body {
  opacity: 0;
  transition: opacity 0.2s;
}

body.loaded {
  opacity: 1;
}
```

### Future Light Theme Support

To add light theme:

```scss
// theme.scss
:root {
  // Dark theme (default)
  --bg-page: #1A1A1A;
  --bg-card: #2A2A2A;
  --text-primary: #FFFFFF;
  // ... etc
}

[data-theme="light"] {
  --bg-page: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  // ... etc
}

// Usage
.card {
  background: var(--bg-card);
  color: var(--text-primary);
}
```