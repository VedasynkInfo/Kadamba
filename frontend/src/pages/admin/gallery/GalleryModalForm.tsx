import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { GalleryCategory, GalleryMediaType } from '@/pages/gallery/data';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { SlugField } from '../components/SlugField';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { GALLERY_CATEGORIES, type GalleryFormData } from './types';
import { cn } from '@/utils/cn';

interface GalleryModalFormProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  form: GalleryFormData;
  setForm: React.Dispatch<React.SetStateAction<GalleryFormData>>;
  slugAuto: boolean;
  setSlugAuto: (auto: boolean) => void;
  seoAuto: SeoAutoFlags;
  setSeoAuto: React.Dispatch<React.SetStateAction<SeoAutoFlags>>;
  onTitleChange: (title: string) => void;
  onSrcChange: (src: string) => void;
  onRegenerateSeo: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function GalleryModalForm({
  open,
  onClose,
  editingId,
  form,
  setForm,
  slugAuto,
  setSlugAuto,
  seoAuto: _seoAuto,
  setSeoAuto,
  onTitleChange,
  onSrcChange,
  onRegenerateSeo,
  onSave,
  saving,
}: GalleryModalFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">
              {editingId ? 'Edit Gallery Item' : 'Add New Media to Atelier'}
            </h2>
            <p className="text-xs opacity-60 mt-0.5">
              {editingId ? 'Modify media assets, categorization, and metadata' : 'Publish high-resolution photography and video reels'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-6 pt-2 gap-4 text-xs font-semibold"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'content'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)]'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            🖼️ Media & Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'seo'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)]'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            🌐 SEO & Social Metadata
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'content' ? (
            <>
              <Input
                label="Title *"
                required
                placeholder="e.g. Royal Silk Zardosi Bridal Frame"
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
              />

              <SlugField
                collection="gallery"
                value={form.slug}
                excludeId={editingId ?? undefined}
                autoManaged={slugAuto}
                titleForAuto={form.title}
                onChange={(slug, opts) => {
                  if (opts?.locked) setSlugAuto(false);
                  setForm((f) => ({ ...f, slug }));
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category *"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as GalleryCategory }))
                  }
                  options={GALLERY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />

                <Select
                  label="Media Type *"
                  value={form.mediaType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mediaType: e.target.value as GalleryMediaType }))
                  }
                  options={[
                    { value: 'image', label: '🖼️ Image' },
                    { value: 'video', label: '🎥 Video' },
                  ]}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
                <MediaUpload
                  label="Media File *"
                  required
                  folder="gallery"
                  allowVideo
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                  value={form.src}
                  onChange={onSrcChange}
                  hint="Upload high-res photography or video reel"
                />
                <BannerSizeGuide context="gallery" />
              </div>

              {form.mediaType === 'video' ? (
                <MediaUpload
                  label="Poster Thumbnail"
                  folder="gallery"
                  enableCrop
                  cropAspect={4 / 5}
                  value={form.poster || ''}
                  onChange={(url) => setForm((f) => ({ ...f, poster: url }))}
                  hint="Cover frame displayed before video starts"
                />
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Sort Order"
                  type="number"
                  placeholder="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                />

                <Select
                  label="Visibility Status"
                  value={form.published ? 'yes' : 'no'}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'yes' }))}
                  options={[
                    { value: 'yes', label: 'Published (Live)' },
                    { value: 'no', label: 'Draft (Hidden)' },
                  ]}
                />
              </div>

              <Input
                label="Alt Text (Accessibility & SEO)"
                placeholder="Descriptive text for visually impaired readers and search engines"
                value={form.alt}
                onChange={(e) => {
                  setSeoAuto((a) => ({ ...a, imageAlt: false }));
                  setForm((f) => ({ ...f, alt: e.target.value }));
                }}
              />
            </>
          ) : (
            <div className="space-y-4">
              <SeoFields
                value={{
                  metaTitle: form.metaTitle ?? '',
                  metaDescription: form.metaDescription ?? '',
                  ogTitle: form.ogTitle,
                  ogDescription: form.ogDescription,
                  ogImage: form.ogImage,
                  twitterTitle: form.twitterTitle,
                  twitterDescription: form.twitterDescription,
                  twitterImage: form.twitterImage,
                }}
                onChange={(next, lockedField) => {
                  if (lockedField) setSeoAuto((a) => ({ ...a, [lockedField]: false }));
                  setForm((f) => ({ ...f, ...next }));
                }}
                onRegenerate={onRegenerateSeo}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="text-xs opacity-50">
            {form.title ? `Item: "${form.title}"` : 'Fill required fields (*)'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={onSave}
              className="font-bold shadow-xs"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Media'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
