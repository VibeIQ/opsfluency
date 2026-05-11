'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ImageIcon, Loader2, Save, Trash2, Upload, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { detectEmbed } from '@/lib/qr/embed';
import {
  updateSopVideoUrl,
  uploadSopImage,
  deleteSopImage,
  updateSopImageCaption,
} from '../../_actions';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SOP_IMAGES_BUCKET = 'sop-images';

function imagePublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${SOP_IMAGES_BUCKET}/${storagePath}`;
}

export interface SopImageRow {
  id: string;
  storage_path: string;
  caption_en: string | null;
  caption_es: string | null;
  sort_order: number;
}

interface Props {
  sopId: string;
  initialVideoUrl: string | null;
  images: SopImageRow[];
}

function requiresAccountWarning(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return (
      h.includes('drive.google.com') ||
      h.includes('docs.google.com') ||
      h.includes('sharepoint.com') ||
      h.includes('onedrive.live.com') ||
      h.includes('microsoftstream.com')
    );
  } catch {
    return false;
  }
}

// ── Video section ─────────────────────────────────────────────────────────────

function VideoSection({ sopId, initialVideoUrl }: { sopId: string; initialVideoUrl: string | null }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = videoUrl.trim() !== (initialVideoUrl ?? '');
  const trimmed = videoUrl.trim();
  const embedInfo = (() => {
    if (!trimmed) return null;
    try { return detectEmbed(trimmed); } catch { return null; }
  })();
  const isEmbeddable = embedInfo !== null && embedInfo.provider !== 'generic';
  const showAccountWarning = !!trimmed && requiresAccountWarning(trimmed);

  function save() {
    if (trimmed) {
      try { new URL(trimmed); } catch {
        setError('Enter a valid URL, e.g. https://www.youtube.com/watch?v=...');
        return;
      }
    }
    setError(null);
    startTransition(async () => {
      const r = await updateSopVideoUrl({ sop_id: sopId, video_url: trimmed || null });
      if (!r.ok) { setError(r.error.message ?? r.error.code); return; }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-dc-text">Video</h3>
        <p className="mt-0.5 text-xs text-dc-text-3">
          Paste a YouTube, Loom, or Vimeo URL. Workers see a &quot;Watch video&quot; button that opens
          the video without leaving the SOP.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sop-video-url" className="text-sm font-medium text-dc-text">
          Video URL
        </label>
        <input
          id="sop-video-url"
          type="url"
          value={videoUrl}
          onChange={(e) => { setVideoUrl(e.target.value); setError(null); }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
        <p className="text-xs text-dc-text-3">
          YouTube, Loom, and Vimeo URLs embed automatically. Other links open in the browser.
        </p>
      </div>

      {showAccountWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-400/8 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" strokeWidth={2} aria-hidden />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Workers will need a Google or Microsoft account to open this link. Consider uploading
            to YouTube, Loom, or Vimeo instead — those embed directly and require no account.
          </p>
        </div>
      )}

      {isEmbeddable && embedInfo && (
        <div>
          <p className="mb-2 text-xs font-medium text-dc-text-3">Preview</p>
          <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedInfo.embed_url}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {!trimmed && !initialVideoUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--dc-edge)] px-4 py-5 text-sm text-dc-text-3">
          <Video className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
          No video attached. Paste a URL above to add one.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {savedAt && !dirty && (
          <span className="text-xs text-dc-text-3">Saved {savedAt.toLocaleTimeString()}</span>
        )}
        {error && (
          <p className="mr-auto text-sm text-(--color-signal-urgent)" role="alert">{error}</p>
        )}
        {(trimmed || initialVideoUrl) && (
          <Button
            plain
            onClick={() => { setVideoUrl(''); setError(null); }}
            disabled={isPending}
          >
            <Trash2 data-slot="icon" strokeWidth={2} />
            Remove video
          </Button>
        )}
        <Button color="brand" onClick={save} disabled={!dirty || isPending}>
          <Save data-slot="icon" strokeWidth={2} />
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

// ── Image card ────────────────────────────────────────────────────────────────

function ImageCard({ image, sopId }: { image: SopImageRow; sopId: string }) {
  const router = useRouter();
  const [caption, setCaption] = useState(image.caption_en ?? '');
  const [captionEs, setCaptionEs] = useState(image.caption_es);
  const [captionSavedAt, setCaptionSavedAt] = useState<Date | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [isSavingCaption, startSaveCaption] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const captionDirty = caption !== (image.caption_en ?? '');

  function saveCaption() {
    setCaptionError(null);
    startSaveCaption(async () => {
      const r = await updateSopImageCaption({
        image_id: image.id,
        sop_id: sopId,
        caption_en: caption.trim() || null,
      });
      if (!r.ok) { setCaptionError(r.error.message ?? r.error.code); return; }
      if (r.ok && r.data) setCaptionEs(r.data.caption_es);
      setCaptionSavedAt(new Date());
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startDelete(async () => {
      await deleteSopImage({ image_id: image.id, sop_id: sopId });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePublicUrl(image.storage_path)}
        alt={image.caption_en ?? 'SOP image'}
        className="w-full rounded-md object-cover"
        style={{ maxHeight: '180px' }}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-dc-text-3">
          Caption (English)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={caption}
            onChange={(e) => { setCaption(e.target.value); setCaptionSavedAt(null); }}
            placeholder="Add a caption…"
            maxLength={500}
            className="flex-1 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-2.5 py-1.5 text-xs text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50"
            disabled={isSavingCaption}
          />
          <button
            onClick={saveCaption}
            disabled={!captionDirty || isSavingCaption}
            className="flex items-center gap-1 rounded-md bg-(--color-brand) px-2.5 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSavingCaption
              ? <Loader2 className="size-3 animate-spin" aria-hidden />
              : <Save className="size-3" aria-hidden />}
            Save
          </button>
        </div>
        {captionError && (
          <p className="text-xs text-(--color-signal-urgent)">{captionError}</p>
        )}
        {captionSavedAt && !captionDirty && (
          <p className="text-xs text-dc-text-3">Saved at {captionSavedAt.toLocaleTimeString()}</p>
        )}
      </div>

      {captionEs && (
        <div>
          <p className="text-xs font-medium text-dc-text-3">Spanish (auto-translated)</p>
          <p className="mt-0.5 text-xs text-dc-text-2 italic">{captionEs}</p>
        </div>
      )}

      <div className="flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-dc-text-3">Delete this image?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-2 py-1 text-xs text-dc-text-2 hover:bg-dc-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/10 disabled:opacity-50"
            >
              {isDeleting
                ? <Loader2 className="size-3 animate-spin" aria-hidden />
                : <Trash2 className="size-3" aria-hidden />}
              Yes, delete
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-dc-text-3 hover:bg-dc-surface hover:text-(--color-signal-urgent)"
          >
            <Trash2 className="size-3" aria-hidden />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Images section ────────────────────────────────────────────────────────────

function ImagesSection({ sopId, images }: { sopId: string; images: SopImageRow[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setUploadError('Only JPEG, PNG, and WebP images are supported.');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds 10 MB.`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const r = await uploadSopImage({
          sop_id: sopId,
          filename: file.name,
          mime_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          file_base64: base64,
        });
        if (!r.ok) {
          setUploadError(r.error.message ?? r.error.code);
          break;
        }
      }
      router.refresh();
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-dc-text">Images</h3>
        <p className="mt-0.5 text-xs text-dc-text-3">
          Upload diagrams, photos, or charts. Workers see a gallery at the bottom of the SOP.
          Captions auto-translate to Spanish when saved. Max 20 images, 10 MB each.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <ImageCard key={img.id} image={img} sopId={sopId} />
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-[color:var(--dc-edge)] px-5 py-6 text-sm text-dc-text-3">
          <ImageIcon className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>No images yet. Upload diagrams, photos, or charts to help workers follow procedures.</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-label="Upload images"
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />

      {uploadError && (
        <p className="text-sm text-(--color-signal-urgent)" role="alert">{uploadError}</p>
      )}

      <div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= 20}
          plain
        >
          {uploading
            ? <Loader2 data-slot="icon" className="animate-spin" />
            : <Upload data-slot="icon" strokeWidth={2} />}
          {uploading ? 'Uploading…' : 'Add images'}
        </Button>
        {images.length >= 20 && (
          <p className="mt-1 text-xs text-dc-text-3">Maximum of 20 images reached.</p>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MediaClient({ sopId, initialVideoUrl, images }: Props) {
  return (
    <div className="flex flex-col gap-8 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      <VideoSection sopId={sopId} initialVideoUrl={initialVideoUrl} />

      <div className="border-t border-[color:var(--dc-edge)]" />

      <ImagesSection sopId={sopId} images={images} />
    </div>
  );
}
