import { TabStrip } from '@/components/ui/TabStrip';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Input, Select, Textarea } from '@/components/ui';
import type { PortfolioCategory, PortfolioProject } from '@/pages/portfolio/data';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { SlugField } from '../components/SlugField';
import { TagsInput } from '../components/TagsInput';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { PORTFOLIO_CATEGORIES } from './types';

interface PortfolioModalFormProps {
  open: boolean;
  onClose: () => void;
  isNew: boolean;
  form: PortfolioProject;
  setForm: React.Dispatch<React.SetStateAction<PortfolioProject>>;
  slugAuto: boolean;
  setSlugAuto: (auto: boolean) => void;
  seoAuto: SeoAutoFlags;
  setSeoAuto: React.Dispatch<React.SetStateAction<SeoAutoFlags>>;
  storyText: string;
  setStoryText: (text: string) => void;
  onTitleChange: (title: string) => void;
  onRegenerateSeo: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function PortfolioModalForm({
  open,
  onClose,
  isNew,
  form,
  setForm,
  slugAuto,
  setSlugAuto,
  seoAuto: _seoAuto,
  setSeoAuto,
  storyText,
  setStoryText,
  onTitleChange,
  onRegenerateSeo,
  onSave,
  saving,
}: PortfolioModalFormProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'story' | 'seo'>('info');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-spring-in flex flex-col max-h-[90vh] bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">
              {isNew ? 'Create New Portfolio Exhibit' : 'Edit Portfolio Exhibit'}
            </h2>
            <p className="text-xs opacity-60 mt-0.5">
              {isNew ? 'Showcase atelier bespoke bridal and client transformations' : 'Update project photography, client stories, and SEO'}
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

        {/* Tabs */}
        <TabStrip
          items={[
            { id: 'info', label: 'Media & Details', icon: 'image' },
            { id: 'story', label: 'Story & Tags', icon: 'couture' },
            { id: 'seo', label: 'SEO & Search Snippets', icon: 'seo' },
          ]}
          value={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          layoutId="modal-tab-portfolio"
          className="px-6 gap-4"
          itemClassName="pb-2.5 pt-2"
        />

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'info' ? (
            <>
              <Input
                label="Project Title *"
                required
                placeholder="e.g. Traditional Kanjeevaram Bridal Ensemble"
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
              />

              <SlugField
                collection="portfolio"
                value={form.slug}
                excludeId={isNew ? undefined : form.id}
                autoManaged={slugAuto}
                titleForAuto={form.title}
                onChange={(slug, opts) => {
                  if (opts?.locked) setSlugAuto(false);
                  setForm((f) => ({ ...f, slug }));
                }}
              />

              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Category *"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as PortfolioCategory }))
                  }
                  options={PORTFOLIO_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />

                <Input
                  label="Year"
                  placeholder="2025"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />

                <Input
                  label="Location"
                  placeholder="Kurnool"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>

              <Textarea
                label="Executive Summary *"
                required
                rows={2}
                placeholder="Short luxury synopsis for cards and previews"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />

              <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
                <MediaUpload
                  label="Cover Image *"
                  required
                  folder="portfolio"
                  enableCrop
                  cropAspect={4 / 5}
                  value={form.coverImage || ''}
                  onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                  hint="Primary preview image (800×1000 portrait)"
                />
                <BannerSizeGuide context="cover" />
              </div>

              <MediaUpload
                label="Banner Image"
                folder="portfolio"
                enableCrop
                cropAspect={16 / 9}
                value={form.bannerImage || ''}
                onChange={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
                hint="Landscape hero image for detailed exhibit page"
              />
            </>
          ) : activeTab === 'story' ? (
            <>
              <Textarea
                label="Couture Story & Craft Details"
                rows={6}
                placeholder="Tell the client's wedding story, embroidery techniques, and fabric selection (paragraphs separated by blank line)"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />

              <TagsInput
                label="Tags & Attributes"
                labels={form.tags || []}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                placeholder="e.g. Bridal, Zardosi, Silk, Handloom"
              />

              <Input
                label="Call To Action Button Label"
                placeholder="Request similar look"
                value={form.ctaLabel || ''}
                onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
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
          className="flex items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <div className="text-xs opacity-50">
            {form.title ? `Project: "${form.title}"` : 'Fill required fields (*)'}
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
              {saving ? 'Saving...' : isNew ? 'Publish Exhibit' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
