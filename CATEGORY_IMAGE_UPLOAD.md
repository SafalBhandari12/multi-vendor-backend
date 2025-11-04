# Category Management API - Image Upload Guide

## Overview

The category management system now supports image uploads via multipart form data using Multer and ImageKit.

## Changes Made

### 1. **Validation Schema Updated**

- Removed `image: z.string().url()` field
- Images are now uploaded as files, not URLs
- Field names: `name`, `slug`, `description`, `parentId` (in form data)

### 2. **Service Layer Updated**

- Added `ImageKitService` integration
- Images uploaded to ImageKit's `categories` folder
- Automatic filename generation: `category-{slug}-{timestamp}`
- Old images automatically deleted when updating
- Error handling for failed deletions doesn't block updates

### 3. **Controller Updated**

- File handling from `req.file`
- Image file validation (required for create, optional for update)
- File passed to service for upload

### 4. **Routes Updated**

- Added `upload.single("image")` middleware to POST and PUT routes
- Multer configured for:
  - Max file size: 10 MB
  - Allowed types: JPEG, PNG, GIF, WebP, PDF
  - Memory storage (processed directly)

## API Usage

### Create Category with Image

**Request:**

```
POST /admin/categories/create
Content-Type: multipart/form-data

Form Data:
- name: "Antibiotics" (required)
- slug: "antibiotics" (required)
- description: "Antibiotic medications" (optional)
- parentId: "parent_category_id" (optional)
- image: <file> (required - JPG, PNG, GIF, WebP, or PDF)
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/admin/categories/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=Antibiotics" \
  -F "slug=antibiotics" \
  -F "description=Antibiotic medications" \
  -F "image=@/path/to/image.jpg"
```

**Response:**

```json
{
  "ok": true,
  "message": "Category created successfully",
  "category": {
    "id": "clx1234...",
    "name": "Antibiotics",
    "slug": "antibiotics",
    "description": "Antibiotic medications",
    "image": "https://ik.imagekit.io/nxsxsg7ps/categories/category-antibiotics-1699123456789.jpg",
    "isActive": true,
    "parentId": null,
    "createdAt": "2025-11-04T10:30:00.000Z"
  }
}
```

### Update Category with New Image

**Request:**

```
PUT /admin/categories/clx1234...
Content-Type: multipart/form-data

Form Data:
- name: "Updated Name" (optional)
- slug: "updated-slug" (optional)
- description: "Updated description" (optional)
- image: <file> (optional - replaces old image)
- isActive: true (optional)
```

**cURL Example:**

```bash
curl -X PUT http://localhost:3000/admin/categories/clx1234... \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=Updated Antibiotics" \
  -F "image=@/path/to/new-image.png"
```

**Response:**

```json
{
  "ok": true,
  "message": "Category updated successfully",
  "category": {
    "id": "clx1234...",
    "name": "Updated Antibiotics",
    "slug": "antibiotics",
    "image": "https://ik.imagekit.io/nxsxsg7ps/categories/category-antibiotics-1699123457890.png",
    "isActive": true,
    "updatedAt": "2025-11-04T10:35:00.000Z"
  }
}
```

## Error Handling

### Missing Image on Create

```json
{
  "ok": false,
  "message": "Image file is required"
}
```

### Invalid File Type

```json
{
  "ok": false,
  "message": "Invalid file type. Only images and PDFs are allowed."
}
```

### File Too Large

```json
{
  "ok": false,
  "message": "File size exceeds 10 MB limit"
}
```

### Validation Error

```json
{
  "ok": false,
  "message": "Validation failed",
  "errors": {
    "fieldErrors": {
      "name": ["String must contain at least 2 character(s)"]
    }
  }
}
```

## Image Upload Details

### ImageKit Configuration

- **Public Key**: From `.env` file (`IMAGE_KIT_PUBLIC_KEY`)
- **Private Key**: From `.env` file (`IMAGE_KIT_PRIVATE_KEY`)
- **URL Endpoint**: From `.env` file (`IMAGE_KIT_URL_ENDPOINT`)
- **Upload Folder**: `categories`

### File Processing

1. File received via multipart form data
2. Stored in memory by multer
3. Validated against allowed MIME types
4. Uploaded to ImageKit with automatic naming
5. URL stored in database
6. On update: Old image deleted, new image uploaded

### Activity Logging

All operations logged with:

- Admin ID
- IP Address
- User Agent
- Previous image URL (on update)
- New image URL
- Timestamp

## Frontend Implementation

### JavaScript/Fetch Example

```javascript
const formData = new FormData();
formData.append("name", "Antibiotics");
formData.append("slug", "antibiotics");
formData.append("description", "Antibiotic medications");
formData.append("image", imageFileInput.files[0]);

const response = await fetch("/admin/categories/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});

const data = await response.json();
```

### React Example

```jsx
const [image, setImage] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", name);
  formData.append("slug", slug);
  formData.append("description", description);
  if (image) {
    formData.append("image", image);
  }

  const response = await fetch("/admin/categories/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.ok) {
    console.log("Category created:", data.category);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input
      type='file'
      accept='image/*'
      onChange={(e) => setImage(e.target.files[0])}
    />
    {/* other fields */}
  </form>
);
```

## Multer Configuration

**File Limits:**

- Max Size: 10 MB
- Allowed Types: JPEG, PNG, GIF, WebP, PDF

**Storage:**

- Type: Memory storage
- Processing: Direct buffer handling
- No temporary files created

## Notes

- Images are required when creating categories
- Images are optional when updating categories
- Old images are automatically cleaned up on update
- Image deletion failure doesn't block category updates
- All operations are transactional (category + audit log)
- Image URLs are returned in responses for immediate display
