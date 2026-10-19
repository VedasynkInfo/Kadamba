import { glyphs, type IconProps } from './glyphs';

export function Icon({ name, size = 16, strokeWidth = 1.75, ...rest }: IconProps) {
  const Glyph = glyphs[name];
  const labelled = Boolean(rest['aria-label']);
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      {...rest}
    />
  );
}
