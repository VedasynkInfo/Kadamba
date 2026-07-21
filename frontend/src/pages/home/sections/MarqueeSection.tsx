import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { marqueeItems, type MarqueeItem } from '../data';
import { ImageLightbox } from './ImageLightbox';

/**
 * Infinite artwork marquee — pauses on hover, opens preview on click.
 */
export function MarqueeSection() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [preview, setPreview] = useState<MarqueeItem | null>(null);

  useEffect(() => {
    if (reduced || !trackRef.current) return;

    const track = trackRef.current;
    const half = track.scrollWidth / 2;

    tweenRef.current = gsap.to(track, {
      x: -half,
      duration: 40,
      ease: 'none',
      repeat: -1,
    });

    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, [reduced]);

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();

  const loop = [...marqueeItems, ...marqueeItems];

  return (
    <Section tone="light" contained={false} className="overflow-hidden py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionIntro
          title="Studio moments"
          description="A continuous ribbon of fabrics, finishes, and bridal detail — pause to look closer."
        />
      </div>

      <div
        className="mt-10"
        onMouseEnter={reduced ? undefined : pause}
        onMouseLeave={reduced ? undefined : resume}
        onFocusCapture={reduced ? undefined : pause}
        onBlurCapture={reduced ? undefined : resume}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4 will-change-transform"
          aria-label="Scrolling artwork strip"
        >
          {loop.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              className="group relative h-44 w-64 shrink-0 overflow-hidden sm:h-52 sm:w-80"
              onClick={() => setPreview(item)}
              aria-label={`Preview ${item.title}`}
            >
              <OptimizedImage
                src={item.image}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                width={640}
                height={416}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 font-heading text-sm text-cream opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ImageLightbox
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title ?? ''}
        image={preview?.image ?? ''}
        alt={preview?.alt ?? ''}
      />
    </Section>
  );
}
