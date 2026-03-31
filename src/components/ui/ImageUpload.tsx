'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File) => {
    if (!ALLOWED.has(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and GIF are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url!);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const trigger = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Image{' '}
        <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      {/* Hidden native file input — accept="image/*" lets mobile users pick from gallery OR camera */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || uploading}
      />

      {value ? (
        /* ── Preview state ── */
        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
          <div className="relative w-full aspect-video">
            <Image
              src={value}
              alt="Product image preview"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
            />
          </div>

          {/* Desktop overlay: hover to show Replace / Remove */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={trigger}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <RefreshCw size={13} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <X size={13} /> Remove
            </button>
          </div>

          {/* Mobile: always-visible action bar below the image */}
          <div className="sm:hidden flex border-t border-gray-200">
            <button
              type="button"
              onClick={trigger}
              disabled={disabled || uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Replace
            </button>
            <div className="w-px bg-gray-200" />
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty / drop zone ── */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload product image"
          onClick={trigger}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && trigger()}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            'w-full min-h-[148px] rounded-2xl border-2 border-dashed',
            'flex flex-col items-center justify-center gap-2',
            'transition-all select-none',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            dragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-brand-400 hover:bg-gray-50/60',
          ].join(' ')}
        >
          {uploading ? (
            <>
              <Loader2 size={26} className="text-brand-500 animate-spin" />
              <p className="text-sm text-gray-500">Uploading…</p>
            </>
          ) : (
            <>
              <ImagePlus size={26} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-600 text-center px-4">
                <span className="text-brand-600 font-semibold">Tap to upload</span>
                <span className="hidden sm:inline text-gray-500"> or drag &amp; drop</span>
              </p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF &middot; max 5 MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
