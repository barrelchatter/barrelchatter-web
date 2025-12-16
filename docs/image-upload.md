# BarrelChatter Image Upload

Documentation for photo upload functionality.

---

## Overview

BarrelChatter uses DigitalOcean Spaces for image storage:

- **Bucket:** `barrelchatter-images`
- **Region:** NYC3
- **CDN:** Enabled for fast delivery
- **Access:** Private bucket with signed URLs

---

## Supported Images

### Bottle Photos

- Front label
- Back label
- Box/packaging
- Pour shots
- Collection displays

### Tasting Photos

- Glass/pour shots
- Flight photos
- Tasting notes

### User Avatars

- Profile pictures

---

## Technical Specifications

| Property | Value |
|----------|-------|
| Max file size | 10 MB |
| Formats | JPEG, PNG, WebP |
| Storage | DigitalOcean Spaces |
| Region | NYC3 |
| CDN | Enabled |

---

## Upload Flow

### Client-Side

1. User selects file via input
2. Validate file type and size
3. Create FormData object
4. Send to API endpoint
5. Display uploaded image

```jsx
import api from '../api/api';

async function uploadPhoto(file, bottleId) {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }
  
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File must be under 10MB');
  }
  
  // Upload
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('caption', 'Front label');
  formData.append('is_primary', 'false');
  
  const response = await api.upload(`/v1/bottles/${bottleId}/photos`, formData);
  
  return response.url;
}
```

### Server-Side

1. Receive multipart form data
2. Validate file type and size
3. Generate unique filename
4. Upload to DigitalOcean Spaces
5. Create database record
6. Return CDN URL

---

## API Endpoints

### Bottle Photos

```
GET    /v1/bottles/:id/photos           # List bottle photos
POST   /v1/bottles/:id/photos           # Upload photo
DELETE /v1/bottles/:id/photos/:photoId  # Delete photo
PUT    /v1/bottles/:id/photos/:photoId  # Update metadata
```

### Upload Request

```http
POST /v1/bottles/uuid/photos
Content-Type: multipart/form-data

photo: [binary file data]
caption: "Front label"
is_primary: "true"
```

### Upload Response

```json
{
  "id": "photo-uuid",
  "bottle_id": "bottle-uuid",
  "url": "https://barrelchatter-images.nyc3.cdn.digitaloceanspaces.com/bottles/uuid/photo-uuid.jpg",
  "caption": "Front label",
  "is_primary": true,
  "uploaded_by": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## File Input Component

```jsx
function PhotoUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Validate
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please select a JPEG, PNG, or WebP image');
      }
      
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be under 10MB');
      }
      
      // Upload
      await onUpload(file);
      
      // Clear input
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <div className={styles.uploadContainer}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
        className={styles.fileInput}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={styles.uploadButton}
      >
        {uploading ? 'Uploading...' : 'Add Photo'}
      </button>
      
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
```

---

## Image Display

### With Fallback

```jsx
function BottleImage({ src, alt }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={styles.placeholder}>
        <span>🥃</span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={styles.image}
    />
  );
}
```

### Lazy Loading

```jsx
<img
  src={photoUrl}
  alt={bottle.name}
  loading="lazy"
  decoding="async"
/>
```

---

## Image Optimization

### Recommended Practices

1. **Client-side compression** - Resize before upload
2. **Responsive images** - Use srcset for different sizes
3. **Lazy loading** - Load images as they enter viewport
4. **WebP format** - Smaller file sizes

### Future: Image Variants

Planned CDN-side transformations:
- Thumbnail (150x150)
- Card (400x400)
- Full (1200x1200)

```
/bottles/uuid/photo.jpg?w=400&h=400&fit=cover
```

---

## Storage Structure

```
barrelchatter-images/
├── bottles/
│   └── {bottle-id}/
│       ├── primary.jpg
│       └── {photo-id}.jpg
├── avatars/
│   └── {user-id}.jpg
└── tastings/
    └── {tasting-id}/
        └── {photo-id}.jpg
```

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| File too large | Exceeds 10MB | Compress or resize |
| Invalid format | Not JPEG/PNG/WebP | Convert format |
| Upload failed | Network issue | Retry upload |
| Permission denied | Invalid token | Re-authenticate |

```jsx
try {
  await uploadPhoto(file, bottleId);
} catch (err) {
  if (err.status === 413) {
    setError('File too large. Please use an image under 10MB.');
  } else if (err.status === 415) {
    setError('Invalid file type. Please use JPEG, PNG, or WebP.');
  } else {
    setError('Upload failed. Please try again.');
  }
}
```

---

## Security

### Validation

- Server validates file type by magic bytes (not just extension)
- File size enforced on both client and server
- Filenames sanitized before storage

### Access Control

- Photos scoped to bottle/user ownership
- Delete requires ownership or admin role
- Private bucket prevents direct access

### Content Moderation

Future: Implement image moderation for:
- Inappropriate content detection
- Spam prevention
- Quality guidelines
