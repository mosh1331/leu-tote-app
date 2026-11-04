// components/MultiImageKitUploader.jsx
'use client';

import { useState } from 'react';

export default function MultiImageKitUploader({
  images = [],
  onChange,
  folder = '/leu-totes/catalog',
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState(null);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate 15MB file size limit
    const oversized = files.find((f) => f.size > 15 * 1024 * 1024);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the 15MB limit.`);
      e.target.value = '';
      return;
    }

    // Lock file picker immediately while uploading
    setUploading(true);
    setError(null);
    const uploadedImages = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`Uploading ${i + 1} of ${files.length}...`);

        // Fetch a FRESH, UNIQUE single-use auth token for EVERY individual file
        const authRes = await fetch('/api/admin/imagekit-auth', { cache: 'no-store' });
        if (!authRes.ok) {
          throw new Error('Failed to generate upload signature.');
        }
        const authData = await authRes.json();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name.replace(/\s+/g, '-').toLowerCase());
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire);
        formData.append('token', authData.token); // Unique UUID token per file
        formData.append('folder', folder);
        formData.append('useUniqueFileName', 'true');

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(data.message || `Failed to upload ${file.name}`);
        }

        const optimizedUrl = `${data.url}?tr=q-85,f-auto`;

        uploadedImages.push({
          image_url: optimizedUrl,
          file_id: data.fileId, // Preserved for ImageKit deletion cleanup
          alt_text: file.name.split('.')[0].replace(/[-_]/g, ' '),
          is_primary: images.length === 0 && uploadedImages.length === 0, // First photo defaults to primary cover
        });
      }

      onChange([...images, ...uploadedImages]);
    } catch (err) {
      setError(err.message || 'Error uploading photos');
    } finally {
      // Re-enable file input once upload batch finishes
      setUploading(false);
      setProgressText('');
      e.target.value = '';
    }
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (disabled) return;
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === indexToPrimary,
    }));
    onChange(updated);
  };

  const handleRemove = (indexToRemove) => {
    if (disabled) return;
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Product Images ({images.length})
        </label>
        <span className="text-[11px] text-gray-400">
          ★ Star marks the Cover image for catalog &amp; WhatsApp share
        </span>
      </div>

      {/* Upload Drop Zone - Disabled while uploading */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
          uploading
            ? 'border-indigo-400 bg-indigo-50/50 cursor-not-allowed opacity-90'
            : disabled
            ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
            : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              uploading ? 'bg-indigo-600 text-white animate-spin' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {uploading ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">
              {uploading ? progressText : disabled ? 'Editing Locked (Draft to Edit)' : 'Select Bag Photos'}
            </p>
            <p className="text-[10px] text-gray-400">
              {uploading ? 'Uploading to ImageKit with unique tokens...' : 'Multi-selection enabled (up to 15MB each)'}
            </p>
          </div>
        </div>

        <label
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            uploading || disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm cursor-pointer'
          }`}
        >
          <span>{uploading ? 'Uploading...' : 'Browse Photos'}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading || disabled}
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

      {/* Uploaded Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative rounded-xl overflow-hidden border-2 bg-white shadow-sm transition-all ${
                img.is_primary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
              }`}
            >
              <div className="relative w-full h-28 bg-gray-50 flex items-center justify-center">
                <img
                  src={img.image_url}
                  alt={img.alt_text || 'Photo'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Cover Badge */}
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  ★ PRIMARY
                </span>
              )}

              {/* Card Controls */}
              {!disabled && (
                <div className="p-1.5 bg-white flex items-center justify-between text-[11px] border-t">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className={`font-semibold hover:underline ${
                      img.is_primary ? 'text-gray-400 cursor-default' : 'text-blue-600'
                    }`}
                    disabled={img.is_primary}
                  >
                    {img.is_primary ? 'Active Cover' : 'Make Cover'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-red-500 hover:text-red-700 font-bold px-1"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}