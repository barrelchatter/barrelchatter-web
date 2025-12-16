# BarrelChatter Modals

Documentation for modal dialogs and forms.

---

## Overview

Modals are used for focused interactions that require user input without leaving the current page context.

**Current Modals:**
- LogTastingModal - Log a pour/tasting
- NewBottleSubmissionModal - Submit new bottle to catalog

---

## Modal Pattern

### Structure

```jsx
function ExampleModal({ onClose, onSaved }) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Modal Title</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {/* Form or content */}
        </div>
        
        <div className={styles.footer}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
```

### Styling

```scss
@use './design-system' as *;

.backdrop {
  @include modal-backdrop;
}

.modal {
  @include modal-content;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--bc-space-4) var(--bc-space-5);
  border-bottom: 1px solid var(--bc-border-subtle);
  
  h2 {
    margin: 0;
    font-size: var(--bc-text-lg);
  }
}

.closeButton {
  @include button-ghost;
  font-size: 24px;
  line-height: 1;
  padding: var(--bc-space-1);
}

.content {
  padding: var(--bc-space-5);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--bc-space-2);
  padding: var(--bc-space-4) var(--bc-space-5);
  border-top: 1px solid var(--bc-border-subtle);
}
```

---

## LogTastingModal

**File:** `src/components/LogTastingModal.jsx`  
**Style:** `src/styles/LogTastingModal.module.scss`

### Purpose

Log a new pour/tasting with rating and notes.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `inventoryId` | string | No | Pre-select inventory item |
| `onClose` | function | Yes | Close handler |
| `onSaved` | function | No | Success callback |

### Usage

```jsx
// From inventory detail
<LogTastingModal
  inventoryId={item.id}
  onClose={() => setShowModal(false)}
  onSaved={() => {
    setShowModal(false);
    refreshTastings();
  }}
/>

// From home quick action (no pre-selection)
<LogTastingModal
  onClose={() => setShowModal(false)}
  onSaved={() => refreshActivity()}
/>
```

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Inventory Item | Select | Yes | Which bottle to log |
| Pour Amount | Number/Preset | Yes | Amount in oz |
| Rating | Number | No | 0-10 scale |
| Notes | Textarea | No | Freeform tasting notes |

### Pour Amount Presets

- 0.5 oz - Taste
- 1.0 oz - Standard pour
- 1.5 oz - Generous pour
- 2.0 oz - Double
- Custom - Enter any amount

### API Call

```javascript
await api.post('/v1/tastings', {
  inventory_id: selectedInventoryId,
  pour_amount_oz: pourAmount,
  rating: rating || null,
  notes: notes || null
});
```

---

## NewBottleSubmissionModal

**File:** `src/components/NewBottleSubmissionModal.jsx`  
**Style:** `src/styles/NewBottleSubmissionModal.module.scss`

### Purpose

Submit a new bottle for catalog inclusion.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | function | Yes | Close handler |
| `onSaved` | function | No | Success callback |

### Usage

```jsx
<NewBottleSubmissionModal
  onClose={() => setShowModal(false)}
  onSaved={() => {
    setShowModal(false);
    showSuccessToast('Bottle submitted for review');
  }}
/>
```

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Text | Yes | Bottle name |
| Brand | Text | No | Brand name |
| Distillery | Text | Yes | Distillery name |
| Type | Select | Yes | Whiskey type |
| Proof | Number | No | Proof/ABV |
| Age Statement | Text | No | Age if applicable |
| Description | Textarea | No | Detailed description |
| Mashbill | Text | No | Mashbill info |

### Type Options

- Bourbon
- Rye
- Scotch
- Irish
- Japanese
- Canadian
- American Single Malt
- Other

### API Call

```javascript
await api.post('/v1/bottles/submissions', {
  name: formData.name,
  brand: formData.brand,
  distillery: formData.distillery,
  type: formData.type,
  proof: formData.proof || null,
  age_statement: formData.ageStatement || null,
  description: formData.description || null,
  mashbill: formData.mashbill || null
});
```

### Submission Workflow

1. User fills form and submits
2. API creates submission with `pending` status
3. User sees success message
4. Moderator reviews in admin panel
5. Approved → Bottle added to catalog
6. Rejected → User notified (future)

---

## Creating New Modals

### 1. Create Component

```jsx
// src/components/NewModal.jsx
import React, { useState } from 'react';
import api from '../api/api';
import styles from '../styles/NewModal.module.scss';

function NewModal({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    field1: '',
    field2: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/v1/endpoint', formData);
      
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Modal Title</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Field 1
            <input
              name="field1"
              value={formData.field1}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </label>
          
          <label className={styles.label}>
            Field 2
            <input
              name="field2"
              value={formData.field2}
              onChange={handleChange}
              className={styles.input}
            />
          </label>
          
          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewModal;
```

### 2. Create Styles

```scss
// src/styles/NewModal.module.scss
@use './design-system' as *;

.backdrop {
  @include modal-backdrop;
}

.modal {
  @include modal-content;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--bc-space-4) var(--bc-space-5);
  border-bottom: 1px solid var(--bc-border-subtle);
  
  h2 {
    margin: 0;
    font-size: var(--bc-text-lg);
  }
}

.closeButton {
  @include button-ghost;
  font-size: 24px;
  line-height: 1;
}

.error {
  @include alert-error;
  margin: var(--bc-space-4) var(--bc-space-5) 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--bc-space-3);
  padding: var(--bc-space-5);
}

.label {
  @include label-base;
}

.input {
  @include input-base;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--bc-space-2);
  padding-top: var(--bc-space-3);
  border-top: 1px solid var(--bc-border-subtle);
  margin-top: var(--bc-space-2);
}

.cancelButton {
  @include button-secondary;
}

.submitButton {
  @include button-primary;
}
```

### 3. Use in Parent Component

```jsx
import NewModal from '../components/NewModal';

function ParentPage() {
  const [showModal, setShowModal] = useState(false);
  
  function handleSaved() {
    setShowModal(false);
    refreshData();
  }
  
  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Open Modal
      </button>
      
      {showModal && (
        <NewModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
```

---

## Accessibility

### Keyboard Navigation

- **Escape** - Close modal
- **Tab** - Navigate focusable elements
- **Enter** - Submit form

```jsx
useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Focus Trap

Keep focus within modal while open:

```jsx
useEffect(() => {
  const previouslyFocused = document.activeElement;
  modalRef.current?.focus();
  
  return () => previouslyFocused?.focus();
}, []);
```

### ARIA Attributes

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Modal Title</h2>
</div>
```

---

## Best Practices

### Do

- Close on backdrop click
- Close on Escape key
- Show loading state during submit
- Display validation errors clearly
- Focus first input on open
- Return focus on close

### Don't

- Nest modals within modals
- Use for simple confirmations (use dialog)
- Block user from dismissing
- Submit forms on Enter in textareas
- Leave scroll enabled on body
