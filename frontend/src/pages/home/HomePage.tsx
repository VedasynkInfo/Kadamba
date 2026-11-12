import { JsonLd, PageMeta, localBusinessJsonLd, staticPageMeta } from '@/seo';
import { CtaBand, HeroBanner, ImageReveal } from '@/components/site';
import {
  AtelierSection,
  BridalSection,
  ClothSection,
  CollectionsSection,
  EnquirySection,
  FaqSection,
  GalleryRailSection,
  JournalSection,
  LetterSection,
  LocalSeoSection,
  MakingSection,
  MarqueeBand,
  PortalSection,
  PrinciplesSection,
  ReachSection,
  RecordSection,
  SignatureSection,
} from './sections';
import { bannerSlides, plate } from './content';

/**
 * The home page: eighteen sections, in the order a visit should read them.
 *
 *  1.  The banner          — the bridal commission, in five frames
 *  2.  The letter          — who is speaking, and the record underneath
 *  3.  The index           — the four disciplines of the house
 *  4.  The vocabulary      — the craft, as a band of words
 *  5.  The collections     — the range, as plates
 *  6.  The atelier         — the hands behind the cloth
 *  7.  The making          — four movements, one commission
 *  8.  The cloth           — what the house is willing to cut
 *  9.  The bridal panel    — the reason most people arrive
 * 10.  The work            — a rail of photographs from the floor
 * 11.  The promises        — four operating rules
 * 12.  Local to global     — Kurnool, and the cities it dresses
 * 13.  The record          — the figures, and one client's sentence
 * 14.  The journal         — the studio's long-form voice
 * 15.  After the order     — aftercare and the client portal
 * 16.  The questions       — the honest answers
 * 17.  The enquiry         — the short form
 * 18.  The invitation      — one last door
 *
 * The arc is deliberate: the work, then the people, then the reach, then the
 * invitation. A visitor who reads all eighteen knows exactly what would happen
 * if they called.
 */
export default function HomePage() {
  return (
    <>
      <PageMeta {...staticPageMeta.home} />
      <JsonLd data={localBusinessJsonLd()} />

      <HeroBanner slides={bannerSlides} />
      <LetterSection />
      <SignatureSection />
      <MarqueeBand />
      <CollectionsSection />
      <AtelierSection />
      <MakingSection />
      <ClothSection />
      <BridalSection />
      <GalleryRailSection />
      <PrinciplesSection />
      <ReachSection />
      <RecordSection />
      <JournalSection />
      <PortalSection />
      <LocalSeoSection />
      <FaqSection />
      <EnquirySection />
      <ImageReveal
        image={plate.bridalAlt}
        alt="Bridal silk in the Kadamba fitting room"
        eyebrow="The commission"
        title="Every garment leaves the studio"
        accent="with a name on it."
        copy="Measured, cut, and finished for one person — and for the photographs that will still be looked at in twenty years."
      />
      <CtaBand
        eyebrow="The next celebration"
        title="Every wedding begins"
        accent="with a conversation."
        copy="Bring the date, the photographs, and the people who will be standing beside you. The studio will take it from there — one appointment at a time."
        image={plate.bridalAlt}
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
