import { useState } from 'react';
import { Button, Checkbox, Input, Select, Textarea } from '@/components/ui';
import type { BlogCategory, BlogPost } from '@/pages/blogs/data';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { SlugField } from '../components/SlugField';
import { TagsInput } from '../components/TagsInput';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { BLOG_CATEGORIES } from './types';
import { cn } from '@/utils/cn';

interface BlogsModalFormProps {
  open: boolean;
  onClose: () => void;
  isNew: boolean;
  form: BlogPost;
  setForm: React.Dispatch<React.SetStateAction<BlogPost>>;
  slugAuto: boolean;
  setSlugAuto: (auto: boolean) => void;
  seoAuto: SeoAutoFlags;
  setSeoAuto: React.Dispatch<React.SetStateAction<SeoAutoFlags>>;
  bodyText: string;
  setBodyText: (text: string) => void;
  onTitleChange: (title: string) => void;
  onRegenerateSeo: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function BlogsModalForm({
  open,
  onClose,
  isNew,
  form,
  setForm,
  slugAuto,
  setSlugAuto,
  seoAuto: _seoAuto,
  setSeoAuto,
  bodyText,
  setBodyText,
  onTitleChange,
  onRegenerateSeo,
  onSave,
  saving,
}: BlogsModalFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content');

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
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">
              {isNew ? 'Publish New Editorial Article' : 'Edit Editorial Article'}
            </h2>
            <p className="text-xs opacity-60 mt-0.5">
              {isNew ? 'Craft bridal stories, styling guides, and studio notes' : 'Update article content, authorship, and search optimization'}
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
            📝 Article Content
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'settings'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)]'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            ⚙️ Tags & Settings
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
            🌐 SEO & Search Snippets
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'content' ? (
            <>
              <Input
                label="Article Title *"
                required
                placeholder="e.g. The Art of Handcrafted Zardosi: A Bridal Guide"
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
              />

              <SlugField
                collection="blogs"
                value={form.slug}
                excludeId={isNew ? undefined : form.id}
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
                    setForm((f) => ({ ...f, category: e.target.value as BlogCategory }))
                  }
                  options={BLOG_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />

                <Input
                  label="Author"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
              </div>

              <Textarea
                label="Article Excerpt *"
                required
                rows={2}
                placeholder="A compelling 1-2 sentence lead paragraph"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />

              <Textarea
                label="Full Article Body *"
                required
                rows={7}
                placeholder="Write the editorial article. Separate paragraphs with a blank line."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />

              <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
                <MediaUpload
                  label="Cover Image *"
                  required
                  folder="blogs"
                  value={form.coverImage || ''}
                  onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                  hint="Hero landscape editorial image (1200×675)"
                />
                <BannerSizeGuide context="cover" />
              </div>
            </>
          ) : activeTab === 'settings' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Estimated Read Time (Minutes)"
                  type="number"
                  value={form.readMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, readMinutes: Number(e.target.value) || 1 }))
                  }
                />

                <Input
                  label="Publication Date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <TagsInput
                label="Article Tags"
                labels={form.tags || []}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                placeholder="e.g. Bridal, Styling, Zardosi, Trends"
              />

              <div className="rounded-xl p-3 border space-y-2" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}>
                <Checkbox
                  id="blog-featured"
                  label="Feature this article on journal homepage banner"
                  checked={Boolean(form.featured)}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                />
              </div>

              <Select
                label="Visibility Status"
                value={form.published ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'yes' }))}
                options={[
                  { value: 'yes', label: 'Published (Live on Journal)' },
                  { value: 'no', label: 'Draft (Hidden from Public)' },
                ]}
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

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="text-xs opacity-50">
            {form.title ? `Article: "${form.title}"` : 'Fill required fields (*)'}
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
              {saving ? 'Saving...' : isNew ? 'Publish Article' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
