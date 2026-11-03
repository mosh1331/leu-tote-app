// components/ImageKitUploader.jsx
'use client';

import { useState } from 'react';

export default function ImageKitUploader({ onUploadSuccess, folder = '/leu-totes' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check client-side limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    try {
      // 1. Fetch authentication parameters from backend
      const authRes = await fetch('/api/admin/imagekit-auth');
      if (!authRes.ok) throw new Error('Failed to retrieve upload signature');
      const authData = await authRes.json();

      // 2. Prepare multipart upload payload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name.replace(/\s+/g, '-').toLowerCase());
      formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');

      // 3. Upload directly to ImageKit Upload API
      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(result.message || 'Image upload failed');
      }

      // 4. Return URL with automatic WebP/AVIF format and responsive optimization query
      const optimizedUrl = `${result.url}?tr=q-85,f-auto`;
      onUploadSuccess(optimizedUrl, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-700 mb-1">
        Product Image
      </label>

      <div className="flex items-center space-x-4 border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        {preview ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/10 flex-shrink-0 bg-white">
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0 text-xs">
            No Image
          </div>
        )}

        <div className="flex-1 min-w-0">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            {uploading ? 'Optimizing & uploading to ImageKit...' : 'Auto-converts to WebP/AVIF at high resolution'}
          </p>
          {error && <p className="text-[11px] text-red-500 font-semibold mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}