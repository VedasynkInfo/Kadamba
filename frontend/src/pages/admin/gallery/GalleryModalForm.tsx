import { useState } from 'react';
import { TabStrip } from '@/components/ui/TabStrip';
import { Icon } from '@/components/icons';
import { Button, Input, Select } from '@/components/ui';
import type { GalleryCategory, GalleryMediaType } from '@/pages/gallery/data';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { SlugField } from '../components/SlugField';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { GALLERY_CATEGORIES, type GalleryFormData } from './types';

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
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">
              {editingId ? 'Edit Gallery Item' : 'Add New Media to Atelier'}
            </h2>
            <p className="text-xs opacity-70 mt-0.5">
              {editingId ? 'Modify media assets, categorization, and metadata' : 'Publish high-resolution photography and video reels'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <TabStrip
          items={[
            { id: 'content', label: 'Media & Details', icon: 'image' },
            { id: 'seo', label: 'SEO & Social Metadata', icon: 'seo' },
          ]}
          value={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          layoutId="modal-tab-gallerymodalform"
          className="px-6 gap-4"
          itemClassName="pb-2.5 pt-2"
        />

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
                  onChange={(value) =>
                    setForm((f) => ({ ...f, category: value as GalleryCategory }))
                  }
                  options={GALLERY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />

                <Select
                  label="Media Type *"
                  value={form.mediaType}
                  onChange={(value) =>
                    setForm((f) => ({ ...f, mediaType: value as GalleryMediaType }))
                  }
                  options={[
                    { value: 'image', label: 'Image' },
                    { value: 'video', label: 'Video' },
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
                  onChange={(value) => setForm((f) => ({ ...f, published: value === 'yes' }))}
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
          className="flex items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <div className="text-xs opacity-70">
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
