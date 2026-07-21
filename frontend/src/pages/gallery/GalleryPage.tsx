import { PageMeta, staticPageMeta } from '@/seo';
import {
  GalleryCtaSection,
  GalleryHeroSection,
  GalleryMasonrySection,
} from './sections';

/**
 * Phase 6 Gallery — editorial lookbook banner, masonry filters, lightbox + video.
 */
export default function GalleryPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.gallery} />
      <GalleryHeroSection />
      <GalleryMasonrySection />
      <GalleryCtaSection />
    </>
  );
}
