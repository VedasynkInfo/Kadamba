import { Icon } from '@/components/icons';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Input } from '@/components/ui';
import type { ProductGalleryImage } from '@/services/products/productService';
import { cn } from '@/utils/cn';
import { MediaUpload } from '../components/MediaUpload';
import { nextGalleryId } from './types';

interface GalleryEditorProps {
  images: ProductGalleryImage[];
  cover: string;
  onChange: (images: ProductGalleryImage[], cover?: string) => void;
}

/**
 * Multi-image product gallery with an explicit cover.
 *
 * `image` stays the cover URL, so the storefront cards and social cards have one
 * unambiguous image even while the detail page explores the whole gallery.
 */
export function GalleryEditor({ images, cover, onChange }: GalleryEditorProps) {
  const resolvedCover = cover || images[0]?.url || '';

  function add(url: string) {
    if (!url.trim()) return;
    onChange(
      [...images, { id: nextGalleryId(images), url: url.trim(), alt: '' }],
      resolvedCover || url.trim(),
    );
  }

  function patch(id: string, updates: Partial<ProductGalleryImage>) {
    const next = images.map((image) => (image.id === id ? { ...image, ...updates } : image));
    const current = images.find((image) => image.id === id);
    const nextCover =
      current && resolvedCover === current.url && updates.url !== undefined
        ? updates.url
        : undefined;
    onChange(next, nextCover);
  }

  function remove(id: string) {
    const next = images.filter((image) => image.id !== id);
    const removed = images.find((image) => image.id === id);
    const nextCover =
      removed && resolvedCover === removed.url ? (next[0]?.url ?? '') : resolvedCover;
    onChange(next, nextCover);
  }

  function move(id: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <MediaUpload
        label="Add a product photograph"
        value=""
        onChange={add}
        folder="products"
        enableCrop={false}
        hint="Upload a new image or choose one from the media library. Add alt text after adding."
      />

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-8 text-center">
          <Icon name="images" size={26} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No gallery images yet</p>
          <p className="mt-1 text-xs opacity-70">
            Upload at least one image. The first usable image becomes the cover until you choose
            another.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => {
            const isCover = image.url === resolvedCover;
            return (
              <div
                key={image.id}
                className={cn(
                  'overflow-hidden rounded-xl border bg-surface-raised',
                  isCover ? 'border-gold/70 ring-1 ring-gold/30' : 'border-line',
                )}
              >
                <div className="relative aspect-[4/3] bg-surface-sunken">
                  <OptimizedImage
                    src={image.url}
                    alt={image.alt || 'Product photograph'}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 640px) 100vw, 320px"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-espresso/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {isCover ? 'Cover' : `Image ${index + 1}`}
                  </span>
                </div>

                <div className="space-y-2 p-3">
                  <Input
                    label="Alt text"
                    value={image.alt}
                    onChange={(event) => patch(image.id, { alt: event.target.value })}
                    placeholder="Embroidered bridal lehenga, full view"
                    maxLength={250}
                  />
                  <Input
                    label="Image URL"
                    value={image.url}
                    onChange={(event) => patch(image.id, { url: event.target.value })}
                    placeholder="/uploads/products/lehenga.jpg"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onChange(images, image.url)}
                      disabled={isCover}
                    >
                      <Icon name="cover" size={14} />
                      {isCover ? 'Cover image' : 'Set cover'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => move(image.id, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${image.alt || `image ${index + 1}`} earlier`}
                    >
                      <Icon name="sortAsc" size={14} />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => move(image.id, 1)}
                      disabled={index === images.length - 1}
                      aria-label={`Move ${image.alt || `image ${index + 1}`} later`}
                    >
                      <Icon name="sortDesc" size={14} />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      className="ml-auto"
                      onClick={() => remove(image.id)}
                    >
                      <Icon name="delete" size={14} />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs opacity-65">
        Alt text describes the photograph for screen readers and search engines. The cover image is
        also used on catalogue cards, featured collections, and social previews.
      </p>
    </div>
  );
}
