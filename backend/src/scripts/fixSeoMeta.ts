/**
 * Normalise public SEO copy to the lengths search results actually display.
 *
 * Titles: a short absolute `metaTitle` (the page component already switches to
 * `titleAbsolute` when it is present) so the brand suffix cannot push a long
 * editorial headline past ~70 characters.
 *
 * Descriptions: one readable sentence set, clamped at a word boundary to
 * 70–158 characters. Empty/very short excerpts are expanded with a studio
 * sentence; the source excerpt is never discarded when it already fits.
 */
const TITLE_OVERRIDES: Record<string, string> = {
  'choosing-bridal-lehenga-kurnool': 'Choosing a bridal lehenga in Kurnool',
  'how-many-trials-a-bridal-lehenga-needs': 'How many trials a bridal lehenga needs',
  'festive-wear-for-ugadi-and-vinayaka-chavithi': 'Ugadi & Vinayaka Chavithi festive wear',
  'what-to-wear-to-a-haldi-ceremony-in-kurnool': 'What to wear to a haldi in Kurnool',
  'blouse-fit-problems-and-their-fixes': 'Six blouse fit problems, and fixes',
  'keeping-wedding-clothes-clean-during-the-season': 'Keeping wedding clothes clean',
  'choosing-a-bridal-saree-for-a-kurnool-wedding': 'Choosing a bridal saree in Kurnool',
  'saree-drape-for-long-hair': 'How to drape a saree with long hair',
  'what-to-pack-for-a-wedding-season-in-kurnool': 'What to pack for a Kurnool wedding',
  'fifteen-years-of-kurnool-weddings': 'Fifteen years of Kurnool weddings',
  'what-we-learn-from-hundreds-of-trials': 'What hundreds of trials teach us',
  'engagement-outfit-in-kurnool': 'Engagement outfit ideas for Kurnool',
  'how-a-pattern-is-graded': 'How a pattern is graded',
  'why-a-bridal-blouse-is-fitted-high-at-the-back': 'Why a bridal blouse sits high at the back',
  'booking-a-bridal-lehenga-early-in-kurnool': 'Booking a bridal lehenga early',
  'regional-handloom-styles-explained': 'Regional handloom styles explained',
  'bridal-jewellery-for-a-kurnool-wedding': 'Bridal jewellery for a Kurnool wedding',
  'the-cost-of-a-dupatta-you-will-not-wear-again': 'The cost of a unworn dupatta',
  'dressing-for-a-reception-after-a-wedding-day': 'Dressing for a post-wedding reception',
  'alterations-for-trousers-and-suits': 'Alterations for trousers and suits',
  'sleeve-length-decisions': 'Choosing a sleeve length',
};

const clampWords = (value: string, max: number) => {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const boundary = cut.lastIndexOf(' ');
  return `${cut.slice(0, boundary > 0 ? boundary : max).replace(/[,.;:!?\s]+$/, '')}…`;
};

const descriptionFor = (primary: string | undefined, fallback: string) => {
  const base = (primary || fallback).replace(/\s+/g, ' ').trim();
  if (base.length >= 70) return clampWords(base, 158);
  const extra =
    ' Read the studio notes from Kadamba’s Designer Studio in Kurnool before your fitting.';
  return clampWords(`${base}${base.endsWith('.') ? '' : '.'}${extra}`, 158);
};

async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  const { Blog } = await import('../models/Blog');
  const { ProductType } = await import('../models/ProductType');
  await connectDB();

  let blogsUpdated = 0;
  const blogs = await Blog.find({});
  for (const blog of blogs) {
    const title = TITLE_OVERRIDES[blog.slug] || blog.title;
    const metaTitle = clampWords(title, 45);
    const metaDescription = descriptionFor(blog.metaDescription || blog.excerpt, blog.title);
    if (blog.metaTitle !== metaTitle || blog.metaDescription !== metaDescription) {
      blog.metaTitle = metaTitle;
      blog.metaDescription = metaDescription;
      await blog.save();
      blogsUpdated += 1;
    }
  }

  let productsUpdated = 0;
  const products = await ProductType.find({ active: true });
  for (const product of products) {
    const metaTitle = clampWords(product.name, 45);
    const metaDescription = descriptionFor(
      product.seo?.metaDescription || product.description,
      `${product.name} made to measure in Kurnool.`,
    );
    const nextSeo = {
      ...(product.seo ?? {}),
      metaTitle,
      metaDescription,
    };
    if (
      product.seo?.metaTitle !== metaTitle ||
      product.seo?.metaDescription !== metaDescription
    ) {
      product.seo = nextSeo;
      await product.save();
      productsUpdated += 1;
    }
  }

  console.log(`Updated SEO copy for ${blogsUpdated} blog(s) and ${productsUpdated} product(s).`);
  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
