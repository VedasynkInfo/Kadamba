import type { BannerSlide, IndexEntry, StatEntry, AccordionItem } from '@/components/site';

/**
 * The home page's copy.
 *
 * Kept in one file because the home page is written as a single argument: the
 * studio's story from a room in Kurnool to a bride in another country. Sections
 * read the shape of that argument from here rather than carrying their own
 * prose, so the voice cannot drift between them.
 */

const plate = {
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  bridalAlt: '/media/photos/bridal-steps.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  sareeAlt: '/media/photos/saree-green.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
  boutique: '/media/photos/boutique-racks.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
  fitting: '/media/photos/atelier-seamstress.jpg',
  runway: '/media/photos/gown-red.jpg',
  festive: '/media/photos/wedding-three.jpg',
  atelier: '/media/photos/atelier-sewing.jpg',
  portrait1: '/media/photos/saree-portrait-1.jpg',
  portrait2: '/media/photos/saree-portrait-2.jpg',
} as const;

export { plate };

/** The banner: the whole story, in five frames. */
export const bannerSlides: BannerSlide[] = [
  {
    id: 'b1',
    image: plate.bridal,
    alt: 'Bride in a red and gold lehenga photographed outdoors',
    kicker: 'Kurnool · Est. 2009',
    title: 'The bridal',
    accent: 'commission',
    copy:
      'A wedding lehenga is not ordered from a catalogue. It is measured on you, draped in raw silk, and brought to its last stitch by hand in our atelier.',
    href: '/services/bridal-wear',
    cta: 'Explore bridal couture',
  },
  {
    id: 'b2',
    image: plate.lehenga,
    alt: 'Bride seated in a dark embroidered lehenga',
    kicker: 'Bridal · Ceremony',
    title: 'Cut for',
    accent: 'the ceremony',
    copy:
      'The blouse that has to sit still through the homam. The dupatta that has to fall a particular way in the photographs. We plan for both.',
    href: '/portfolio',
    cta: 'See the work',
  },
  {
    id: 'b3',
    image: plate.embroidery,
    alt: 'Maggam work being embroidered by hand',
    kicker: 'The atelier · Maggam & zardozi',
    title: 'Six hands,',
    accent: 'one garment',
    copy:
      'Our karigars work in zari, gota and resham. A bridal border is not a decoration added at the end; it is drawn, planned and worked while the panels are still flat.',
    href: '/about',
    cta: 'Inside the studio',
  },
  {
    id: 'b4',
    image: plate.festive,
    alt: 'Three women in traditional Indian wedding attire',
    kicker: 'Traditional wear',
    title: 'The silk',
    accent: 'inheritance',
    copy:
      'Sarees, blouses and festive sets for the women who keep a family’s wardrobe going — cut to move in, finished to be worn for years.',
    href: '/products',
    cta: 'Browse the collections',
  },
  {
    id: 'b5',
    image: plate.boutique,
    alt: 'The Kadamba boutique, warm light and a framed arch',
    kicker: 'Local to global',
    title: 'Dressed here,',
    accent: 'worn anywhere',
    copy:
      'A bride from Kurnool, a daughter in Dubai, a wedding in Hyderabad. The fitting happens here; the celebration can happen anywhere.',
    href: '/contact',
    cta: 'Book an appointment',
  },
];

/** The opening statement, immediately under the banner. */
export const manifesto = {
  eyebrow: 'The house',
  title: 'A small atelier in Kurnool,',
  accent: 'dressing the largest days of a family’s life.',
  paragraphs: [
    'Kadamba began with a single tailoring table and a conviction that a woman in Kurnool should not have to travel to Hyderabad to be dressed as well as she deserves. Fifteen years later the table has become an atelier: pattern cutters, maggam karigars, fitters and finishers, all under one roof.',
    'What has not changed is the way we work. One appointment at a time. The person in the garment, not a size chart. A conversation honest enough to tell you when an idea will not survive the timeline — and to offer the one that will.',
  ],
  signature: 'Kadamba’s Designer Studio',
  signatureNote: 'Kurnool, Andhra Pradesh',
};

export const houseStats: StatEntry[] = [
  { id: 's1', value: '15', label: 'Years in Kurnool', note: 'A studio, not a pop-up' },
  { id: 's2', value: '2,500', label: 'Garments tailored', note: 'Each measured in person' },
  { id: 's3', value: '800', label: 'Bridal ensembles', note: 'Made for the ceremony' },
  { id: 's4', value: '95%', label: 'Clients who return', note: 'And send their daughters' },
];

/** The four things the house actually does. */
export const signatureEntries: IndexEntry[] = [
  {
    id: 'sig-bridal',
    title: 'Bridal couture',
    description:
      'Lehenga, blouse and dupatta designed as one piece, with maggam and zardozi worked by hand in the studio.',
    meta: ['Lehenga', 'Blouse', 'Dupatta', '8–16 weeks'],
    href: '/services/bridal-wear',
    image: plate.bridal,
  },
  {
    id: 'sig-traditional',
    title: 'Traditional wear',
    description:
      'Sarees, blouses, anarkalis and festive sets — the everyday inheritance, cut for the way you actually sit, stand and celebrate.',
    meta: ['Saree', 'Anarkali', 'Festive', '3–6 weeks'],
    href: '/services/traditional-wear',
    image: plate.saree,
  },
  {
    id: 'sig-tailoring',
    title: 'Bespoke tailoring',
    description:
      'Blouses, kurtas, trousers and alterations with a proper pattern, two fittings and a finish you can turn inside out.',
    meta: ['Blouse', 'Kurta', 'Alterations', '1–3 weeks'],
    href: '/services/custom-tailoring',
    image: plate.stitching,
  },
  {
    id: 'sig-boutique',
    title: 'Boutique styling',
    description:
      'Fabric selection, colour work and accessory advice for the whole occasion — including the people standing beside you.',
    meta: ['Fabric', 'Colour', 'Jewellery', 'By appointment'],
    href: '/services/boutique-styling',
    image: plate.jewelry,
  },
];

/** The making, from the first measurement to the last thread. */
export const makingSteps = [
  {
    id: 'm1',
    step: 'I',
    title: 'The conversation',
    description:
      'Ninety minutes, no obligation. The occasion, the family, the photographs you have saved, and the number you would like to stay near. We tell you what the calendar allows before you commit to anything.',
    note: 'In the studio or by video call',
  },
  {
    id: 'm2',
    step: 'II',
    title: 'The drawing',
    description:
      'A silhouette is drawn for your measurements, not adapted from a size. Fabric is chosen against your skin in daylight. The embroidery plan is sketched full-size on paper before a needle moves.',
    note: 'You approve the sketch and the cloth',
  },
  {
    id: 'm3',
    step: 'III',
    title: 'The making',
    description:
      'Pattern, canvas, panels, then the karigars. You are sent progress at each stage through the client portal, so a six-week commission does not mean six weeks of silence.',
    note: 'Progress photographs, as it happens',
  },
  {
    id: 'm4',
    step: 'IV',
    title: 'The fitting',
    description:
      'Two trials, in the garment, with the blouse and the jewellery. We correct the fall, the armhole, the neckline and the hem until nothing needs to be thought about on the day.',
    note: 'Alterations included',
  },
];

/** The cloth library. */
export const clothNotes = [
  {
    id: 'c1',
    name: 'Kanchipuram silk',
    origin: 'Tamil Nadu',
    use: 'Bridal & heirloom sarees',
    description: 'Weight, body and a border that can hold real zari. The cloth a wedding is built on.',
  },
  {
    id: 'c2',
    name: 'Raw silk',
    origin: 'Bhagalpur',
    use: 'Lehenga & structured blouses',
    description: 'Holds a pleat, takes a canvas, and softens into the shape of the wearer over the years.',
  },
  {
    id: 'c3',
    name: 'Chanderi & organza',
    origin: 'Madhya Pradesh',
    use: 'Dupattas & evening layers',
    description: 'Sheer enough to float, crisp enough to stay where it is pinned. For the second look.',
  },
  {
    id: 'c4',
    name: 'Mangalgiri cotton',
    origin: 'Andhra Pradesh',
    use: 'Everyday & office wear',
    description: 'Cool, honest handloom from our own state — the blouse you will wear fifty times.',
  },
];

/** The bridal commission, in three movements. */
export const bridalNotes = [
  {
    id: 'br1',
    label: 'The lehenga',
    text: 'Panels cut on the grain, a canvas waistband that will not roll, and a flare calculated to the centimetre for the height of the wearer.',
  },
  {
    id: 'br2',
    label: 'The blouse',
    text: 'The piece that decides the silhouette. Lined, boned where it needs to be, and fitted over three trials rather than guessed from a measurement sheet.',
  },
  {
    id: 'br3',
    label: 'The dupatta',
    text: 'Weighted at the border so it falls and stays, with the pallu placed for the camera as well as the ceremony.',
  },
];

/** Where the work travels. The local-to-global centrepiece. */
export const reach = [
  { id: 'r1', city: 'Kurnool', region: 'Andhra Pradesh', note: 'The atelier', local: true },
  { id: 'r2', city: 'Hyderabad', region: 'Telangana', note: 'Bridal commissions', local: false },
  { id: 'r3', city: 'Bengaluru', region: 'Karnataka', note: 'Festive & tailoring', local: false },
  { id: 'r4', city: 'Chennai', region: 'Tamil Nadu', note: 'Silk & heirloom work', local: false },
  { id: 'r5', city: 'Dubai', region: 'UAE', note: 'NRI brides', local: false },
  { id: 'r6', city: 'London', region: 'United Kingdom', note: 'Destination weddings', local: false },
  { id: 'r7', city: 'Toronto', region: 'Canada', note: 'Family orders', local: false },
  { id: 'r8', city: 'Singapore', region: 'Singapore', note: 'Ceremony wear', local: false },
];

/** The principles. Not features — the way the house works. */
export const principles = [
  {
    id: 'pr1',
    title: 'One appointment at a time',
    description:
      'The studio does not run a queue. When you are here, the table, the mirror and the fitter are yours.',
  },
  {
    id: 'pr2',
    title: 'Measured on the person',
    description:
      'No measurement is taken over the phone, and no garment is cut from a standard size. This is the whole difference.',
  },
  {
    id: 'pr3',
    title: 'A date we can keep',
    description:
      'We would rather decline a commission than promise a wedding date we cannot hold. The calendar is checked before the deposit.',
  },
  {
    id: 'pr4',
    title: 'Finished inside as well as out',
    description:
      'French seams, bound edges, a lining that does not twist. The inside of a Kadamba garment is meant to be looked at.',
  },
];

/** Frequent questions, answered plainly. */
export const homeFaqs: AccordionItem[] = [
  {
    id: 'f1',
    question: 'How far in advance should a bridal lehenga be commissioned?',
    answer:
      'Eight to sixteen weeks is comfortable for hand-worked bridal. If the wedding is sooner, tell us the date first — we will say honestly whether the work can be done properly, and if it cannot, we will suggest a simpler commission that can.',
  },
  {
    id: 'f2',
    question: 'I live outside Kurnool. Can the work still be made for me?',
    answer:
      'Yes. The first consultation can happen by video call, and measurements can be taken by a tailor near you to our sheet. We ask for at least one fitting in Kurnool where possible; for overseas brides we plan the trials around the trip home.',
  },
  {
    id: 'f3',
    question: 'Do you make blouses and alterations, or only full outfits?',
    answer:
      'Both. A saree blouse with a proper pattern and two fittings is one of the most useful things the studio does. Alterations on Kadamba garments are included; on outside garments we quote after seeing the piece.',
  },
  {
    id: 'f4',
    question: 'What does a commission cost?',
    answer:
      'A bridal ensemble typically begins around ₹28,000 and is driven by fabric and the density of hand-work; everyday tailoring begins around ₹1,200. You receive a written estimate after the first consultation, before any deposit.',
  },
  {
    id: 'f5',
    question: 'How do I follow the progress of my order?',
    answer:
      'Every confirmed commission receives a reference ID and access to the client portal, where you can see the stage, the fitting dates, the invoices and the studio’s notes — and message the team directly.',
  },
  {
    id: 'f6',
    question: 'Where can I buy a bridal lehenga in Kurnool?',
    answer:
      'Kadamba’s Designer Studio is a bridal boutique in Kurnool city, near Gulp in Sreenivas Nagar. We do not sell ready-made stock: a bridal lehenga is designed, cut and hand-finished for your measurements, usually over two or three fittings. Book a consultation before you buy fabric so the silhouette and timeline can be planned together.',
  },
  {
    id: 'f7',
    question: 'Do you stitch blouses from customer fabric?',
    answer:
      'Yes. Bring your own saree, fabric length or inherited piece and the studio will check whether it can carry the neckline, lining and finishing you want. We take fresh measurements, cut a personal pattern and include fittings so the blouse sits properly at the armhole and back.',
  },
  {
    id: 'f8',
    question: 'Do you offer saree fall and pico in Kurnool?',
    answer:
      'Yes. Fall and pico are available for silk, cotton and blended sarees, along with blouse stitching and alterations. If the saree is new, bring it with the blouse fabric; if it is an heirloom, tell us before any cutting so we can preserve the border and pallu.',
  },
  {
    id: 'f9',
    question: 'How much does bridal blouse stitching cost in Kurnool?',
    answer:
      'Most blouses sit between ₹1,800 and ₹8,500 depending on the neckline, lining, embroidery and finish; bridal lehengas begin around ₹18,000. These are indicative ranges, not a quotation. The studio gives a written estimate after the consultation and before any deposit.',
  },
  {
    id: 'f10',
    question: 'Can I book a consultation online?',
    answer:
      'Yes. Use the consultation form or WhatsApp the studio. The first appointment can happen in Kurnool or by video call; for outstation brides we plan measurements and trials around the trip home.',
  },
];

/** The aftercare promise, shown beside the portal note. */
export const aftercare = [
  'Two fittings included on every tailored garment',
  'Alterations on Kadamba pieces at no charge for six months',
  'Pressing and final check before the garment leaves the studio',
  'A care card with every bridal ensemble — storage, cleaning, and what to avoid',
];
