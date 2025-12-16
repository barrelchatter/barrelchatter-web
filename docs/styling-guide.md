# BarrelChatter Styling Guide

Best practices and patterns for styling components.

---

## Overview

BarrelChatter uses SCSS Modules with a centralized design system:

- **Scoped styles** - CSS Modules prevent class name conflicts
- **Design tokens** - CSS custom properties for consistency
- **Mixins** - Reusable component patterns
- **Dark theme** - Bourbon-inspired lounge aesthetic

---

## File Organization

```
src/styles/
├── _design-system.scss      # Core tokens and mixins (private)
├── _shared.module.scss      # Shared component patterns
├── global.scss              # Reset and base styles
└── [Component].module.scss  # Component-specific styles
```

### Naming Convention

- Page styles: `PageName.module.scss`
- Component styles: `ComponentName.module.scss`
- Partials (imported, not compiled): `_filename.scss`

---

## Creating Component Styles

### Basic Structure

```scss
// ComponentName.module.scss
@use './design-system' as *;

.container {
  // Layout
  display: flex;
  flex-direction: column;
  gap: var(--bc-space-4);
  
  // Sizing
  max-width: 800px;
  padding: var(--bc-space-6);
  
  // Appearance
  background: var(--bc-bg-elevated);
  border-radius: var(--bc-radius-xl);
}

.title {
  font-size: var(--bc-text-xl);
  font-weight: 600;
  color: var(--bc-text-primary);
}
```

### Using in Components

```jsx
import styles from '../styles/ComponentName.module.scss';

function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Title</h1>
    </div>
  );
}
```

---

## Using Design Tokens

### Import

Always import the design system at the top:

```scss
@use './design-system' as *;
```

### Colors

```scss
// Backgrounds
background: var(--bc-bg-base);      // Main background
background: var(--bc-bg-surface);   // Elevated surface
background: var(--bc-bg-elevated);  // Cards, modals
background: var(--bc-bg-hover);     // Hover states

// Text
color: var(--bc-text-primary);      // Main text
color: var(--bc-text-secondary);    // Muted text
color: var(--bc-text-tertiary);     // Disabled/hint

// Accent
color: var(--bc-accent);            // Primary accent
background: var(--bc-accent-deep);  // Deep accent

// Semantic
color: var(--bc-success);
color: var(--bc-warning);
color: var(--bc-danger);
color: var(--bc-info);
```

### Spacing

Use the 8px-based scale:

```scss
gap: var(--bc-space-2);     // 8px
padding: var(--bc-space-4); // 16px
margin: var(--bc-space-6);  // 24px
```

### Typography

```scss
font-size: var(--bc-text-sm);   // 13px
font-size: var(--bc-text-base); // 14px
font-size: var(--bc-text-lg);   // 18px
font-size: var(--bc-text-xl);   // 22px

line-height: var(--bc-leading-tight);  // 1.25
line-height: var(--bc-leading-normal); // 1.5

letter-spacing: var(--bc-tracking-wide); // 0.02em
```

### Border Radius

```scss
border-radius: var(--bc-radius-sm);   // 6px
border-radius: var(--bc-radius-md);   // 10px
border-radius: var(--bc-radius-lg);   // 14px
border-radius: var(--bc-radius-xl);   // 20px
border-radius: var(--bc-radius-full); // 9999px (pill)
```

### Shadows

```scss
box-shadow: var(--bc-shadow-sm);   // Subtle
box-shadow: var(--bc-shadow-md);   // Cards
box-shadow: var(--bc-shadow-lg);   // Elevated
box-shadow: var(--bc-shadow-xl);   // Modals
box-shadow: var(--bc-shadow-glow); // Accent glow
```

### Transitions

```scss
transition: all var(--bc-transition-fast);  // 0.1s
transition: all var(--bc-transition-base);  // 0.15s
transition: all var(--bc-transition-slow);  // 0.25s
```

---

## Using Mixins

### Buttons

```scss
.primaryButton {
  @include button-primary;
}

.secondaryButton {
  @include button-secondary;
}

.ghostButton {
  @include button-ghost;
}

.dangerButton {
  @include button-danger;
}

// Modifiers
.smallButton {
  @include button-secondary;
  @include button-sm;
}

.pillButton {
  @include button-primary;
  @include button-pill;
}
```

### Forms

```scss
.input {
  @include input-base;
}

.select {
  @include select-base;
}

.label {
  @include label-base;
}
```

### Cards

```scss
.card {
  @include card;
  padding: var(--bc-space-4);
}

.clickableCard {
  @include card-interactive;
}
```

### Tables

```scss
.tableWrapper {
  @include table-wrapper;
}

.table {
  @include table-base;
}
```

### Modals

```scss
.backdrop {
  @include modal-backdrop;
}

.modal {
  @include modal-content;
}
```

### Badges

```scss
.badge { @include badge-default; }
.badgeSuccess { @include badge-success; }
.badgeDanger { @include badge-danger; }
.badgeAccent { @include badge-accent; }
```

### Alerts

```scss
.error { @include alert-error; }
.success { @include alert-success; }
.warning { @include alert-warning; }
.info { @include alert-info; }
```

---

## Common Patterns

### Page Layout

```scss
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
  flex-wrap: wrap;
}

.subtitle {
  margin-top: var(--bc-space-1);
  font-size: var(--bc-text-sm);
  color: var(--bc-text-secondary);
}
```

### Form Layout

```scss
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

.formField {
  flex: 1;
  min-width: 200px;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bc-space-2);
  margin-top: var(--bc-space-2);
}
```

### Grid Layouts

```scss
// Responsive card grid
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--bc-space-4);
}

// Fixed column grid
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--bc-space-3);
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}
```

### Link Styles

```scss
.link {
  color: var(--bc-accent);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.subtleLink {
  color: var(--bc-text-primary);
  text-decoration: none;
  
  &:hover {
    color: var(--bc-accent);
  }
}
```

### Empty States

```scss
.emptyState {
  text-align: center;
  padding: var(--bc-space-8) var(--bc-space-4);
  color: var(--bc-text-secondary);
}

.emptyIcon {
  font-size: 48px;
  margin-bottom: var(--bc-space-3);
  opacity: 0.5;
}

.emptyTitle {
  font-size: var(--bc-text-lg);
  font-weight: 600;
  margin-bottom: var(--bc-space-2);
}

.emptyDescription {
  font-size: var(--bc-text-sm);
  margin-bottom: var(--bc-space-4);
}
```

---

## Responsive Design

### Breakpoints

```scss
// Mobile first approach
.container {
  padding: var(--bc-space-3);
  
  @media (min-width: 768px) {
    padding: var(--bc-space-6);
  }
  
  @media (min-width: 1200px) {
    padding: var(--bc-space-8);
  }
}
```

### Common Breakpoints

| Breakpoint | Target |
|------------|--------|
| 480px | Small phones |
| 768px | Tablets |
| 1024px | Small desktops |
| 1200px | Large desktops |

---

## Accessibility

### Focus States

Always include visible focus states:

```scss
.button {
  &:focus-visible {
    @include focus-ring;
  }
}
```

### Color Contrast

Ensure sufficient contrast:
- Primary text on background: 7:1+
- Secondary text on background: 4.5:1+
- Interactive elements: 3:1+

### Motion

Respect reduced motion preferences:

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Anti-Patterns

### ❌ Avoid

```scss
// Hardcoded colors
color: #c9a66b;  // Use var(--bc-accent)

// Arbitrary spacing
padding: 13px;   // Use var(--bc-space-3) or var(--bc-space-4)

// Inline styles in JSX
<div style={{ color: 'red' }}>  // Use CSS classes

// Deep nesting
.page .card .content .item { }  // Keep nesting shallow

// !important
color: red !important;  // Fix specificity instead
```

### ✅ Prefer

```scss
// Design tokens
color: var(--bc-accent);
padding: var(--bc-space-4);

// Flat selectors
.cardItem { }

// Mixins for common patterns
@include button-primary;
```

---

## Performance Tips

1. **Avoid @import** - Use @use for better compilation
2. **Minimize nesting** - Keep selectors flat
3. **Use CSS variables** - Enable runtime theming
4. **Limit animations** - Use sparingly for polish
5. **Optimize images** - Use WebP, proper sizing
