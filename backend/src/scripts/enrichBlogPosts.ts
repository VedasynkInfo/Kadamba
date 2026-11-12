import fs from 'node:fs';
import path from 'node:path';

/**
 * Extend the ten shortest journal posts with studio-specific paragraphs.
 *
 * The content audit found ten posts under ~150 words. These additions are
 * written for the specific topic (not shared boilerplate), take each post over
 * the threshold, and are applied to both the live collection and the seed file
 * so a reseed keeps the same copy.
 */
const EXTRAS: Record<string, string[]> = {
  'reading-fabric-for-traditional-wear': [
    'For Kurnool summers, we often steer clients toward breathable silks, cotton-silk blends and lighter georgettes for day functions. For an evening reception, a tissue or brocade can carry more structure without feeling heavy. The trick is to match the fabric to the function rather than to a photograph.',
    'Bring a swatch to the consultation if you have one. We hold it against your skin tone in daylight, check how it falls over the hip, and tell you honestly whether it can carry the embroidery you want. A beautiful cloth that cannot hold the work is not a bargain.',
  ],
  'inside-the-kurnool-atelier': [
    'A normal day here moves between the cutting table and the fitting room. Morning light is best for colour matching; afternoons are for trials and hand-finishing. Nothing is rushed past the point where it can still be corrected.',
    'We keep the studio deliberately small so the person who measures you is also the person who answers when you call. That continuity is why a first fitting usually feels like a continuation of the conversation rather than a new appointment.',
  ],
  'embroidery-weight-and-comfort': [
    'A useful rule is to distribute weight instead of piling it in one place. A heavily worked border can be balanced by a lighter yoke; a dense sleeve can be offset by a clean back. We also check how the piece behaves when seated, because that is where most discomfort shows up.',
    'If the ceremony runs from morning to night, ask for a second, lighter look or a change of drape. Comfort is not a compromise on craft; it is part of the design brief.',
  ],
  'bridal-fitting-timeline': [
    'Wedding-season calendars in Kurnool fill quickly, so the first appointment should happen before the fabric is bought. That gives us time to test a muslin, correct the shoulder and waist, and schedule embroidery without paying rush charges.',
    'Keep the final trial at least ten days before the wedding. It leaves room for a hem change, a blouse adjustment, or a finishing detail that only becomes visible when the full look is worn together.',
  ],
  'pairing-jewellery-with-traditional-wear': [
    'Start with the neckline. A high collar or closed neck usually wants earrings and a maang tikka rather than a heavy necklace; a deep neckline can carry a broader piece. The goal is balance, not a display of everything at once.',
    'Bring the jewellery you plan to wear to the fitting. Metal and stone colours change how a fabric reads, and a blouse that looks right on its own can feel busy once the necklace is on.',
  ],
  'festive-saree-blouse-trends': [
    'This season we are seeing quieter blouses paired with louder sarees: a plain silk blouse with a contrast border, or a lightly embroidered sleeve against a richly worked pallu. It keeps the look festive without competing for attention.',
    'Necklines are also moving toward soft curves and square shapes that frame the jewellery. If you are unsure, choose a blouse that can be worn with two different drapes; that flexibility is worth more than a trend that lasts one season.',
  ],
  'choosing-bridal-lehenga-kurnool': [
    'Begin with the venue and the time of day. An outdoor muhurtham asks for lighter fabrics and less dense work; an indoor evening reception can carry a deeper colour and heavier embroidery. The lehenga should suit the room as well as the wearer.',
    'We recommend trying at least three silhouettes before deciding on a shape. A-line, fish-cut and straight cuts sit differently on the same body, and the right one is usually the one you can walk, sit and turn in without thinking about it.',
  ],
  'why-custom-tailoring-still-matters': [
    'Ready-made sizing is built around an average that few bodies match. Custom tailoring adjusts the shoulder, bust, waist and hem to one person, which is why a simple garment can look more expensive than a complicated one that does not fit.',
    'It also lets you choose the fabric and finishing. You are not paying for a label or a trend cycle; you are paying for cloth that suits the climate and a fit that survives more than one season.',
  ],
  'matching-a-saree-border-to-the-blouse': [
    'A border is a frame. If the saree has a wide, heavily worked border, keep the blouse comparatively quiet; if the border is narrow, the blouse can carry more detail. The two should feel related rather than identical.',
    'Bring the saree to the consultation if possible. Photographs can mislead on scale and sheen, and the blouse colour that looks right in a photo may read differently in daylight.',
  ],
  'festive-colours-for-the-whole-season': [
    'A practical festive wardrobe starts with two base colours and two accents. A deep green or maroon base can carry gold, while a cream or ivory base can take almost any accent. That small palette makes mixing pieces across functions much easier.',
    'Think about the photographs, too. Very pale pastels can disappear under warm indoor lighting, while jewel tones hold their shape. We test fabric against the light in the studio before committing to a colour.',
  ],
};

async function updateDatabase() {
  const { connectDB, disconnectDB } = await import('../config/database');
  const { Blog } = await import('../models/Blog');
  await connectDB();

  let updated = 0;
  for (const [slug, paragraphs] of Object.entries(EXTRAS)) {
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      console.warn(`Missing blog ${slug}`);
      continue;
    }
    const current = Array.isArray(blog.content) ? blog.content : [];
    if (current.includes(paragraphs[0])) continue;
    blog.content = [...current, ...paragraphs];
    blog.readMinutes = Math.max(blog.readMinutes ?? 0, 6);
    await blog.save();
    updated += 1;
  }

  console.log(`Updated ${updated} journal post${updated === 1 ? '' : 's'} in MongoDB.`);
  await disconnectDB();
}

function updateSeedFile() {
  const file = path.resolve(process.cwd(), 'src', 'seed', 'cmsContent.ts');
  let source = fs.readFileSync(file, 'utf8');
  let patched = 0;

  for (const [slug, paragraphs] of Object.entries(EXTRAS)) {
    const pattern = new RegExp(
      `(slug: '${slug}',[\\s\\S]*?content: \\[)([\\s\\S]*?)(\\n    \\],)`,
      'm',
    );
    if (!pattern.test(source)) {
      console.warn(`Seed block not found for ${slug}`);
      continue;
    }
    source = source.replace(pattern, (_match, head, body, tail) => {
      if (body.includes(paragraphs[0])) return `${head}${body}${tail}`;
      const added = paragraphs.map((paragraph) => `      ${JSON.stringify(paragraph)},`).join('\n');
      patched += 1;
      return `${head}${body}\n${added}${tail}`;
    });
  }

  fs.writeFileSync(file, source);
  console.log(`Updated ${patched} seed block${patched === 1 ? '' : 's'}.`);
}

async function main() {
  await updateDatabase();
  updateSeedFile();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
