import { useAdminContent } from '../AdminContentContext';

/**
 * In-context banner / cover size guidance from Settings media presets.
 */
export function BannerSizeGuide({
  context = 'cover',
}: {
  context?: 'hero' | 'cover' | 'og' | 'gallery';
}) {
  const { settings } = useAdminContent();
  const presets = settings.media?.bannerPresets || [];

  if (!presets.length) return null;

  const preferred =
    context === 'og'
      ? presets.filter((p) => /og|share/i.test(p.label))
      : context === 'gallery'
        ? presets.filter((p) => /gallery|tile|portrait/i.test(p.label))
        : presets.filter((p) => /hero|banner|cover|lookbook/i.test(p.label));

  const list = preferred.length ? preferred : presets.slice(0, 3);

  return (
    <div className="rounded-md border border-black/10 bg-black/[0.02] px-3 py-2.5 text-xs text-black/65">
      <p className="font-medium uppercase tracking-[0.12em] text-black/45">Recommended sizes</p>
      <ul className="mt-1.5 space-y-0.5">
        {list.map((p) => (
          <li key={`${p.label}-${p.width}`}>
            {p.label}: {p.width}×{p.height}
            {p.aspect ? ` (${p.aspect})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
