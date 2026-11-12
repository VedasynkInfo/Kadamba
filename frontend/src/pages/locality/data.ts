import { brand } from '@/pages/home/data';

export interface LocalityFaq {
  id: string;
  question: string;
  answer: string;
}

export interface Locality {
  slug: string;
  name: string;
  shortName: string;
  /** The line under the name on the index. */
  tagline: string;
  /** Two or three sentences, in the studio's voice. */
  intro: string[];
  /** The practical note for someone travelling in. */
  visit: string;
  /** The areas this page speaks to. */
  covers: string[];
  image: string;
  imageAlt: string;
  /** The service pages worth opening from here. */
  serviceSlugs: string[];
  faqs: LocalityFaq[];
}

/**
 * The district, page by page.
 *
 * These are not branch pages. Kadamba has one studio, in Kurnool city, and
 * every garment is cut there. What changes from Adoni to Dhone is the journey
 * the client makes, and the honest thing to put on the page is how many visits
 * a commission takes and what to bring to the first one.
 *
 * Nothing here claims a second address, a delivery promise or a timeline the
 * studio has not agreed to in person.
 */
export const LOCALITIES: Locality[] = [
  {
    slug: 'kurnool-city',
    name: 'Kurnool City',
    shortName: 'Kurnool',
    tagline: 'The room where every commission begins.',
    intro: [
      'The studio is in Kurnool city, and every garment is made here: pattern, cutting, embroidery, fitting and finishing. There is no second workshop and no work sent away.',
      'Clients from across the city come for bridal lehengas, festival sarees, blouses and alterations. The front room holds the cloth; the back room holds the tables.',
    ],
    visit:
      'Book an appointment before you come, so the fitting room and the cutter are both free. Bring the date, a budget range and any photographs you have saved.',
    covers: ['Bellary Road', 'Gandhi Nagar', 'Kothapeta', 'Budhawarpet', 'Venkataramana Colony'],
    image: '/media/photos/boutique-racks.jpg',
    imageAlt: 'Cloth studies and fittings in the Kurnool studio',
    serviceSlugs: ['bridal-wear', 'traditional-wear', 'custom-tailoring', 'boutique-styling'],
    faqs: [
      {
        id: 'where',
        question: 'Where is the studio?',
        answer:
          'The exact address, landmark and map link are on the contact page. The studio is in Kurnool city and works by appointment, Monday to Saturday.',
      },
      {
        id: 'walk-in',
        question: 'Can I walk in without an appointment?',
        answer:
          'You can, but the fitting room may be occupied. A booked appointment means the person who will actually cut your garment is free to speak with you.',
      },
      {
        id: 'not-bridal',
        question: 'Do you take blouses and alterations as well as bridal work?',
        answer:
          'Yes. Blouses, kurtis, saree finishing, alterations and custom tailoring are part of the day-to-day work, not a side service.',
      },
    ],
  },
  {
    slug: 'adoni',
    name: 'Adoni',
    shortName: 'Adoni',
    tagline: 'Clients from Adoni, measured and fitted in Kurnool.',
    intro: [
      'Adoni is one of the towns we dress most often. Most clients make two visits: one to choose the cloth and be measured, and one for the trial. A bridal commission may need a third.',
      'We can send fabric options and photographs on WhatsApp before you travel, so the first visit is for decisions rather than browsing.',
    ],
    visit:
      'Plan the first visit around your event date. If the date is close, tell us at the enquiry stage — we will say plainly whether the timeline is realistic before you travel.',
    covers: ['Adoni', 'Adoni town'],
    image: '/media/photos/saree-jodhpur.jpg',
    imageAlt: 'A saree and border study for a festive commission',
    serviceSlugs: ['bridal-wear', 'traditional-wear', 'custom-tailoring'],
    faqs: [
      {
        id: 'visits',
        question: 'How many times do I need to come to Kurnool?',
        answer:
          'A blouse or kurti is usually one visit and a collection. A bridal lehenga usually needs two or three: selection and measurement, a trial, and a final fitting or collection.',
      },
      {
        id: 'timing',
        question: 'How early should I book from Adoni?',
        answer:
          'For bridal work, six to eight weeks is comfortable. During wedding season the order book fills earlier, so ask before you set the date of the trial.',
      },
      {
        id: 'fabric-first',
        question: 'Can you show me fabrics before I travel?',
        answer:
          'Yes. Send us the occasion and your budget on WhatsApp and we will photograph the options on the table for you.',
      },
      {
        id: 'collection',
        question: 'Can someone collect the garment for me?',
        answer:
          'If you cannot come back, tell us when you book. We will agree the handover in advance rather than improvise it at the end.',
      },
    ],
  },
  {
    slug: 'nandyal',
    name: 'Nandyal',
    shortName: 'Nandyal',
    tagline: 'A wedding wardrobe planned around the journey.',
    intro: [
      'Nandyal clients usually come for a bridal or a family wedding order rather than a single blouse. That makes the first appointment the important one: we plan the whole set, the order of trials, and what can be finished together.',
      'If several garments are being made for one wedding, bring the other people who need to be measured, or their measurements taken by a tailor they trust.',
    ],
    visit:
      'Bring every date in the wedding week, not only the muhurtham. A reception outfit is finished against a different deadline from the bride’s, and the order is planned around all of them.',
    covers: ['Nandyal', 'Nandyal town'],
    image: '/media/photos/bridal-red-lehenga.jpg',
    imageAlt: 'Bridal silk with a hand-worked border',
    serviceSlugs: ['bridal-wear', 'traditional-wear', 'boutique-styling'],
    faqs: [
      {
        id: 'family',
        question: 'Can you make outfits for the whole family?',
        answer:
          'Yes. We plan a family wedding order as one schedule, with the bride’s fittings protected and the other garments slotted around them.',
      },
      {
        id: 'measurements',
        question: 'Do you need everyone to come for measurements?',
        answer:
          'The bride should be measured in person. For other family members, we can work from measurements taken by a tailor they trust, provided they are recent and include the notes we ask for.',
      },
      {
        id: 'trips',
        question: 'Can the trial and collection be combined?',
        answer:
          'Sometimes, if the garment is simple and the fit is already close. For bridal work we would rather not combine them; the trial exists to change something.',
      },
    ],
  },
  {
    slug: 'yemmiganur',
    name: 'Yemmiganur',
    shortName: 'Yemmiganur',
    tagline: 'Handloom country, and the cloth that comes with it.',
    intro: [
      'Yemmiganur has its own textile history, and clients from there often arrive with a fabric already chosen — a family saree, a length bought at a handloom sale, a border inherited from a grandmother.',
      'We are glad to work with cloth you bring. We will tell you at the first visit what it can carry: whether it will take the embroidery, whether the border needs support, whether it is better as a blouse than a lehenga.',
    ],
    visit:
      'Bring the fabric with you, not a photograph of it. A photograph cannot tell us the weight, the drape or whether the dye will behave under a hot iron.',
    covers: ['Yemmiganur', 'Yemmiganur town'],
    image: '/media/photos/fabric-ivory.jpg',
    imageAlt: 'A study of woven cloth and its border',
    serviceSlugs: ['traditional-wear', 'custom-tailoring', 'bridal-wear'],
    faqs: [
      {
        id: 'own-fabric',
        question: 'Can I bring my own fabric?',
        answer:
          'Yes. Bring the whole length, not a swatch, so we can see the border, the width and the weight before we plan the garment.',
      },
      {
        id: 'enough-cloth',
        question: 'How do I know I have enough cloth?',
        answer:
          'We measure it at the first visit. If it is short, we will tell you before cutting and suggest where a contrast panel or a narrower silhouette can work.',
      },
      {
        id: 'heirloom',
        question: 'Can you work with an old or fragile saree?',
        answer:
          'Often, yes — but it depends on the condition. We will inspect it in daylight and tell you honestly whether it can be worn, restored, or better kept as it is.',
      },
    ],
  },
  {
    slug: 'dhone',
    name: 'Dhone',
    shortName: 'Dhone',
    tagline: 'A single appointment can still be a proper one.',
    intro: [
      'Not every commission needs three visits. A blouse, a kurti or a saree finish can often be measured, made and collected with one appointment, provided the cloth and the date are settled before you come.',
      'For bridal work from Dhone, the visit count is the same as anywhere else: the garment has to be tried on a body, not approved over a photograph.',
    ],
    visit:
      'Send the occasion, the date and a rough budget on WhatsApp first. We will tell you which service fits the timeline and whether one visit is enough.',
    covers: ['Dhone', 'Dhone town'],
    image: '/media/photos/atelier-seamstress.jpg',
    imageAlt: 'A fitting in progress at the studio',
    serviceSlugs: ['custom-tailoring', 'traditional-wear', 'boutique-styling'],
    faqs: [
      {
        id: 'one-visit',
        question: 'Can everything be done in one visit?',
        answer:
          'For a blouse, a kurti or a saree finish, usually yes, if the cloth is with us and the date allows. Bridal work always needs a trial on the body.',
      },
      {
        id: 'alteration',
        question: 'Do you alter garments made elsewhere?',
        answer:
          'We do, within reason. Bring the garment and wear the undergarments you will wear with it; an alteration is a fit question, not only a stitch question.',
      },
      {
        id: 'whatsapp',
        question: 'Can the whole conversation start on WhatsApp?',
        answer:
          'Yes. Send the occasion, date and budget, and we will reply with the service that fits and the next appointment available.',
      },
    ],
  },
];

export function getLocality(slug: string | undefined): Locality | undefined {
  return LOCALITIES.find((item) => item.slug === slug);
}

export function localityPath(locality: Locality): string {
  return `/kurnool/${locality.slug}`;
}

export const localityIntro = {
  eyebrow: 'Kurnool & the district',
  title: 'One room.',
  accent: 'One district around it.',
  description: `${brand.shortName} is a single studio in Kurnool city. These pages are for the towns within reach of it — what a commission takes, and what to bring when you travel in.`,
} as const;

/** The four disciplines, named here so locality pages do not depend on a fetch. */
export const serviceLabels: Record<string, string> = {
  'bridal-wear': 'Bridal wear',
  'traditional-wear': 'Traditional wear',
  'custom-tailoring': 'Custom tailoring',
  'boutique-styling': 'Boutique styling',
};
