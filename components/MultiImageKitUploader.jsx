// components/MultiImageKitUploader.jsx
'use client';

import { useState } from 'react';

export default function MultiImageKitUploader({
  images = [],
  onChange,
  folder = '/leu-totes/catalog',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState(null);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedList = [...images];

    try {
      // 1. Fetch ImageKit upload credentials once
      const authRes = await fetch('/api/admin/imagekit-auth');
      if (!authRes.ok) throw new Error('Failed to retrieve ImageKit signature');
      const authData = await authRes.json();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        if (file.size > 15 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 15MB limit`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name.replace(/\s+/g, '-').toLowerCase());
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire);
        formData.append('token', authData.token);
        formData.append('folder', folder);
        formData.append('useUniqueFileName', 'true');

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(result.message || 'ImageKit upload failed');

        // Automatically optimize on delivery (AVIF/WebP + 85% quality)
        const optimizedUrl = `${result.url}?tr=q-85,f-auto`;

        uploadedList.push({
          image_url: optimizedUrl,
          alt_text: file.name.split('.')[0],
          is_primary: uploadedList.length === 0, // First photo is default primary
          display_order: uploadedList.length,
        });
      }

      onChange(uploadedList);
    } catch (err) {
      setError(err.message || 'Upload error');
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = ''; // Reset input to allow re-uploading the same file if needed
    }
  };

  const handleSetPrimary = (index) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If the primary image was removed, assign primary to the first available image
    if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Product Images ({images.length})
        </label>
        <span className="text-[11px] text-gray-400">First image or selected star is Primary</span>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-center">
        <input
          type="file"
          id="multi-image-input"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFilesSelected}
          className="hidden"
        />
        <label
          htmlFor="multi-image-input"
          className="cursor-pointer inline-flex flex-col items-center justify-center space-y-1.5"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {uploading ? uploadProgress : 'Click to select multiple bag photos'}
          </span>
          <span className="text-[10px] text-gray-400">JPG, PNG, WebP up to 15MB each</span>
        </label>
      </div>

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden border-2 bg-white group aspect-square flex items-center justify-center ${
                img.is_primary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text || `Product image ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary Badge */}
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  PRIMARY
                </span>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full text-[10px] font-bold shadow"
                    title="Set as Hero/Primary"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                  title="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}