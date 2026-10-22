import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Reveal } from '@/components/site';
import { plate, reach } from '../content';

/**
 * Local to global.
 *
 * The centrepiece of the page's argument. Kurnool is drawn as a fixed point and
 * the cities the studio dresses as arcs leading away from it — a drawing of
 * reach, not a map, and labelled as such. The point is not that the studio is
 * everywhere; it is that the fitting happens in one room and the wedding can
 * happen anywhere.
 */
export function ReachSection() {
  const home = reach.find((city) => city.local) ?? reach[0];
  const elsewhere = reach.filter((city) => !city.local);

  return (
    <section className="house-section relative overflow-hidden bg-surface">
      <div className="house-container grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow">Local to global</p>
            <h2 className="display-lg mt-6 text-ink">
              A studio in Kurnool. <span className="display-accent">A guest list that travels.</span>
            </h2>
            <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-ink/62">
              Most of our brides are from here, or their mothers were. Some are flying in for a
              fitting and flying out with the lehenga. The measurements are taken in this room; the
              wedding can be anywhere in the world.
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/52">
              For overseas commissions we plan two fittings around the trip home, and keep the
              studio reachable between them through the client portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link to="/contact" className="link-arrow inline-flex text-brand-strong">
                Plan a fitting from abroad
              </Link>
              <Link to="/kurnool" className="link-arrow inline-flex text-brand-strong">
                Kurnool &amp; the district
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="mt-10 lg:hidden">
            <ul className="border-t border-ink/12">
              {reach.map((city) => (
                <li
                  key={city.id}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/12 py-3.5"
                >
                  <span className="font-heading text-lg text-ink">{city.city}</span>
                  <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/45">
                    {city.region}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="relative">
          <Reveal>
            <div className="relative aspect-[5/4] w-full overflow-hidden border border-ink/12 bg-[linear-gradient(160deg,#fdfaf3,#f3ecdf)] sm:aspect-[16/11]">
              <div
                className="absolute inset-0 opacity-[0.5]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(23,20,15,0.16) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
                aria-hidden
              />

              <svg
                viewBox="0 0 1000 520"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label="Kurnool connected to Hyderabad, Bengaluru, Chennai, Dubai, Singapore, London and Toronto"
              >
                <defs>
                  <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#a8801c" stopOpacity="0.75" />
                    <stop offset="1" stopColor="#a8801c" stopOpacity="0.15" />
                  </linearGradient>
                </defs>

                {[0, 1, 2].map((ring) => (
                  <circle
                    key={ring}
                    cx="150"
                    cy="350"
                    r={150 + ring * 120}
                    fill="none"
                    stroke="#17140f"
                    strokeOpacity="0.06"
                    strokeDasharray="3 9"
                  />
                ))}

                {[
                  { x: 330, y: 300 },
                  { x: 300, y: 405 },
                  { x: 390, y: 470 },
                  { x: 430, y: 165 },
                  { x: 600, y: 470 },
                  { x: 690, y: 120 },
                  { x: 870, y: 70 },
                ].map((point, index) => (
                  <path
                    key={index}
                    d={`M150 350 Q ${(150 + point.x) / 2} ${Math.min(350, point.y) - 70} ${point.x} ${point.y}`}
                    fill="none"
                    stroke="url(#arc)"
                    strokeWidth="1"
                  />
                ))}

                <circle cx="150" cy="350" r="26" fill="#a8801c" fillOpacity="0.1" />
                <circle cx="150" cy="350" r="6" fill="#a8801c" />
                <text
                  x="150"
                  y="392"
                  textAnchor="middle"
                  className="fill-[#17140f]"
                  style={{ fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase' }}
                >
                  Kurnool
                </text>
                <text
                  x="150"
                  y="412"
                  textAnchor="middle"
                  className="fill-[#17140f]"
                  style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.5 }}
                >
                  THE ATELIER
                </text>

                {elsewhere.map((city, index) => {
                  const coords = [
                    { x: 330, y: 300 },
                    { x: 300, y: 405 },
                    { x: 390, y: 470 },
                    { x: 430, y: 165 },
                    { x: 600, y: 470 },
                    { x: 690, y: 120 },
                    { x: 870, y: 70 },
                  ][index];
                  if (!coords) return null;
                  const anchor = coords.x > 780 ? 'end' : 'middle';
                  return (
                    <g key={city.id}>
                      <circle cx={coords.x} cy={coords.y} r="4" fill="#4a121c" fillOpacity="0.8" />
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="10"
                        fill="none"
                        stroke="#4a121c"
                        strokeOpacity="0.25"
                      />
                      <text
                        x={coords.x}
                        y={coords.y - 14}
                        textAnchor={anchor}
                        className="fill-[#17140f]"
                        style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                      >
                        {city.city}
                      </text>
                      <text
                        x={coords.x}
                        y={coords.y + 22}
                        textAnchor={anchor}
                        className="fill-[#17140f]"
                        style={{ fontSize: 9, letterSpacing: '0.14em', opacity: 0.42 }}
                      >
                        {city.note}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <p className="absolute bottom-4 right-5 text-[0.52rem] uppercase tracking-[0.24em] text-ink/35">
                A drawing of reach &middot; not to scale
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mt-4 flex items-center justify-between gap-4">
            <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/40">
              {home.city} &middot; {home.region}
            </p>
            <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/40">
              {elsewhere.length} cities &middot; five countries
            </p>
          </Reveal>
        </div>
      </div>

      <div className="house-container mt-16 hidden lg:block">
        <Reveal className="flex items-center gap-8">
          <div className="plate plate-frame plate-frame-dark aspect-[16/6] w-2/5 shrink-0 overflow-hidden">
            <OptimizedImage
              src={plate.bridalAlt}
              alt="A bridal ensemble packed for a wedding abroad"
              sizes="40vw"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="max-w-md font-heading text-2xl italic leading-snug text-ink/80">
            &ldquo;The lehenga travelled to Dubai in a cabin bag. The fitting had happened in
            Kurnool, eight weeks before.&rdquo;
          </p>
        </Reveal>
      </div>
    </section>
  );
}
