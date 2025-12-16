# BarrelChatter Design System

A bourbon-inspired dark lounge aesthetic for the BarrelChatter web application.

## Overview

The design system provides consistent visual language across all pages through:

- **CSS Custom Properties** - Design tokens for colors, spacing, typography
- **SCSS Mixins** - Reusable component patterns
- **Module Styles** - Page-specific implementations

## Files

| File | Purpose |
|------|---------|
| `_design-system.scss` | Core tokens and mixins |
| `_shared.module.scss` | Shared component patterns |
| `global.scss` | Reset and base styles |
| `[Page].module.scss` | Page-specific styles |

## Color Palette

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--bc-bg-base` | `#121212` | Main background |
| `--bc-bg-surface` | `#1c1c1c` | Elevated surfaces |
| `--bc-bg-elevated` | `#252525` | Cards, modals |
| `--bc-bg-hover` | `#2e2e2e` | Hover states |

### Accent Colors (Bourbon Brass)

| Token | Value | Usage |
|-------|-------|-------|
| `--bc-accent` | `#c9a66b` | Primary accent |
| `--bc-accent-hover` | `#d4b47a` | Accent hover state |
| `--bc-accent-muted` | `#a08050` | Subdued accent |
| `--bc-accent-deep` | `#5a3e36` | Smoked oak accent |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bc-text-primary` | `#f0e6d6` | Primary text (cream) |
| `--bc-text-secondary` | `#b8a890` | Secondary text |
| `--bc-text-tertiary` | `#7a6f60` | Disabled/hint text |
| `--bc-text-inverse` | `#1a1612` | Text on accent backgrounds |

### Semantic Colors

| Category | Token | Value |
|----------|-------|-------|
| Success | `--bc-success` | `#6fbf73` |
| Warning | `--bc-warning` | `#d4a84b` |
| Danger | `--bc-danger` | `#c45c52` |
| Info | `--bc-info` | `#5b9bd5` |

Each semantic color has `-bg` and `-border` variants for alert/badge styling.

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bc-border-subtle` | `rgba(255,255,255,0.06)` | Subtle divisions |
| `--bc-border-default` | `rgba(255,255,255,0.10)` | Default borders |
| `--bc-border-strong` | `rgba(255,255,255,0.18)` | Emphasized borders |
| `--bc-border-accent` | `rgba(201,166,107,0.4)` | Accent borders |

## Spacing Scale

Based on an 8px grid with half-step at 4px:

| Token | Value | Pixels |
|-------|-------|--------|
| `--bc-space-0` | `0` | 0 |
| `--bc-space-1` | `4px` | 4 |
| `--bc-space-2` | `8px` | 8 |
| `--bc-space-3` | `12px` | 12 |
| `--bc-space-4` | `16px` | 16 |
| `--bc-space-5` | `20px` | 20 |
| `--bc-space-6` | `24px` | 24 |
| `--bc-space-8` | `32px` | 32 |
| `--bc-space-10` | `40px` | 40 |
| `--bc-space-12` | `48px` | 48 |
| `--bc-space-16` | `64px` | 64 |

## Typography

### Font Families

| Token | Value |
|-------|-------|
| `--bc-font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `--bc-font-mono` | `'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace` |

### Font Sizes

| Token | Value | Pixels |
|-------|-------|--------|
| `--bc-text-xs` | `11px` | 11 |
| `--bc-text-sm` | `13px` | 13 |
| `--bc-text-base` | `14px` | 14 |
| `--bc-text-md` | `15px` | 15 |
| `--bc-text-lg` | `18px` | 18 |
| `--bc-text-xl` | `22px` | 22 |
| `--bc-text-2xl` | `28px` | 28 |
| `--bc-text-3xl` | `36px` | 36 |

### Line Heights

| Token | Value |
|-------|-------|
| `--bc-leading-tight` | `1.25` |
| `--bc-leading-normal` | `1.5` |
| `--bc-leading-relaxed` | `1.75` |

### Letter Spacing

| Token | Value |
|-------|-------|
| `--bc-tracking-tight` | `-0.01em` |
| `--bc-tracking-normal` | `0` |
| `--bc-tracking-wide` | `0.02em` |
| `--bc-tracking-wider` | `0.06em` |
| `--bc-tracking-widest` | `0.12em` |

## Border Radius

| Token | Value |
|-------|-------|
| `--bc-radius-xs` | `4px` |
| `--bc-radius-sm` | `6px` |
| `--bc-radius-md` | `10px` |
| `--bc-radius-lg` | `14px` |
| `--bc-radius-xl` | `20px` |
| `--bc-radius-2xl` | `28px` |
| `--bc-radius-full` | `9999px` |

## Shadows

| Token | Value |
|-------|-------|
| `--bc-shadow-sm` | `0 2px 8px rgba(0,0,0,0.25)` |
| `--bc-shadow-md` | `0 4px 16px rgba(0,0,0,0.35)` |
| `--bc-shadow-lg` | `0 8px 32px rgba(0,0,0,0.45)` |
| `--bc-shadow-xl` | `0 16px 48px rgba(0,0,0,0.55)` |
| `--bc-shadow-glow` | `0 0 20px rgba(201,166,107,0.15)` |

## Transitions

| Token | Value |
|-------|-------|
| `--bc-transition-fast` | `0.1s ease` |
| `--bc-transition-base` | `0.15s ease` |
| `--bc-transition-slow` | `0.25s ease` |
| `--bc-transition-bounce` | `0.3s cubic-bezier(0.34, 1.56, 0.64, 1)` |

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--bc-z-dropdown` | `100` | Dropdowns |
| `--bc-z-sticky` | `200` | Sticky headers |
| `--bc-z-modal-backdrop` | `900` | Modal overlay |
| `--bc-z-modal` | `1000` | Modal content |
| `--bc-z-toast` | `1100` | Toast notifications |

---

## Component Mixins

### Buttons

```scss
@use './design-system' as *;

// Primary button (main CTA)
.primaryButton {
  @include button-primary;
}

// Secondary button (less prominent)
.secondaryButton {
  @include button-secondary;
}

// Ghost button (minimal)
.ghostButton {
  @include button-ghost;
}

// Danger button
.dangerButton {
  @include button-danger;
}

// Size modifier
.smallButton {
  @include button-secondary;
  @include button-sm;
}

// Shape modifier
.pillButton {
  @include button-primary;
  @include button-pill;
}
```

### Forms

```scss
// Text input
.input {
  @include input-base;
}

// Select dropdown
.select {
  @include select-base;
}

// Label with input
.label {
  @include label-base;
}
```

### Cards

```scss
// Static card
.card {
  @include card;
}

// Interactive card with hover effect
.clickableCard {
  @include card-interactive;
}
```

### Tables

```scss
// Table wrapper with rounded corners
.tableWrapper {
  @include table-wrapper;
}

// Table element
.table {
  @include table-base;
}
```

### Modals

```scss
// Modal backdrop
.backdrop {
  @include modal-backdrop;
}

// Modal content container
.modal {
  @include modal-content;
}
```

### Badges

```scss
.badge { @include badge-default; }
.badgeAccent { @include badge-accent; }
.badgeSuccess { @include badge-success; }
.badgeDanger { @include badge-danger; }
```

### Alerts

```scss
.error { @include alert-error; }
.success { @include alert-success; }
.warning { @include alert-warning; }
.info { @include alert-info; }
```

### Utilities

```scss
// Focus ring for accessibility
&:focus-visible {
  @include focus-ring;
}

// Text truncation
.truncated {
  @include truncate;
}

// Hide scrollbar
.noScrollbar {
  @include hide-scrollbar;
}
```

---

## Usage Examples

### Page Layout

```scss
@use './design-system' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: var(--bc-space-4);
}

.headerRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--bc-space-4);
  
  h1 {
    margin: 0;
    font-size: var(--bc-text-xl);
  }
}

.subtitle {
  margin: var(--bc-space-1) 0 0;
  font-size: var(--bc-text-sm);
  color: var(--bc-text-secondary);
}

.addButton {
  @include button-primary;
}
```

### Data Table

```scss
@use './design-system' as *;

.tableWrapper {
  @include table-wrapper;
}

.table {
  @include table-base;
}

.nameLink {
  color: var(--bc-text-primary);
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    color: var(--bc-accent);
    text-decoration: underline;
  }
}

.actionsCell {
  white-space: nowrap;
}

.smallButton {
  @include button-secondary;
  @include button-sm;
}
```

### Form Card

```scss
@use './design-system' as *;

.formCard {
  @include card;
  padding: var(--bc-space-4) var(--bc-space-5);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--bc-space-3);
}

.formRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bc-space-3);
}

.label {
  @include label-base;
  flex: 1;
  min-width: 0;
}

.input {
  @include input-base;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bc-space-2);
}
```

---

## Best Practices

### DO

- Always use design system tokens instead of hardcoded values
- Use mixins for consistent component styling
- Follow the 8px spacing scale
- Maintain visual hierarchy with text size tokens
- Use semantic colors for feedback states

### DON'T

- Hardcode colors like `#c9a66b` - use `var(--bc-accent)`
- Use arbitrary spacing like `13px` - use `var(--bc-space-3)`
- Create new button styles - use existing mixins
- Mix different border-radius values on the same element
- Override mixin defaults without good reason

### File Organization

1. Import design system at top of every `.module.scss`:
   ```scss
   @use './design-system' as *;
   ```

2. Group styles by component/section with comments:
   ```scss
   // ============================================================================
   // HEADER
   // ============================================================================
   
   .headerRow { ... }
   ```

3. Keep page-specific styles in their own module file
4. Extract truly shared patterns to `_shared.module.scss`
