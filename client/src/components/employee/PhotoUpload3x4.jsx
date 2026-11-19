import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { normalizeFileUrl } from '../../utils/fileUrl';

/**
 * 3×4 Passport Photo Upload Component
 * Matches corporate ID badge standard (3:4 aspect ratio).
 * Handles file validation, upload to /api/upload, and provides Change / Remove actions.
 */
export default function PhotoUpload3x4({ photoUrl, onPhotoChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.files?.[0]?.url;
      if (uploadedUrl) {
        onPhotoChange(uploadedUrl);
      } else {
        setError('Upload failed. No file URL returned.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Camera size={13} className="text-blue-600" />
          <span>3×4 Passport Photo</span>
        </span>
        {photoUrl && (
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
            <Check size={11} /> Ready
          </span>
        )}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleUpload}
      />

      {photoUrl ? (
        <div className="flex items-center gap-2.5 p-2 rounded-xl border border-blue-200 bg-blue-50/40">
          <div
            className="relative rounded-lg overflow-hidden border border-blue-300 shadow-xs bg-white shrink-0"
            style={{ width: '45px', height: '60px' }} // Exact 3:4 aspect ratio
          >
            <img
              src={normalizeFileUrl(photoUrl)}
              alt="3x4 Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
              3×4 Photo
            </span>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">Linked to ID Badge</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Change
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onPhotoChange('')}
                disabled={uploading}
                className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed px-3 py-2 text-center cursor-pointer transition flex items-center justify-center gap-2.5 ${
            uploading
              ? 'border-blue-400 bg-blue-50/60 cursor-wait'
              : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 bg-slate-50/50'
          }`}
          style={{ minHeight: '60px' }}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <RefreshCw size={14} className="animate-spin" />
              <span>Uploading 3×4 photo…</span>
            </div>
          ) : (
            <>
              <div className="h-8 w-6 rounded border border-slate-300 bg-white shadow-2xs flex items-center justify-center text-slate-400 shrink-0">
                <Camera size={13} className="text-blue-600" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-700 leading-tight">
                  Upload 3×4 Photo
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Passport size (JPG, PNG) for Staff ID Pass
                </div>
              </div>
              <Upload size={13} className="text-slate-400 shrink-0" />
            </>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-600 mt-1">⚠ {error}</p>}
    </div>
  );
}
