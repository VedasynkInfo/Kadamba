import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { channelsIntro } from '../data';

/**
 * Direct contact channels — typography row, settings-driven.
 */
export function ContactChannelsSection() {
  const reduced = usePrefersReducedMotion();
  const { settings, whatsappHref } = usePublicContent();

  const channels = [
    {
      id: 'visit',
      label: 'Visit',
      value: settings.addressLines.filter(Boolean).slice(1).join(' · ') || settings.location,
      href: settings.mapLink || '#',
      external: true,
    },
    {
      id: 'call',
      label: 'Call',
      value: settings.phoneDisplay,
      href: `tel:${settings.phoneTel}`,
      external: false,
    },
    {
      id: 'email',
      label: 'Email',
      value: settings.email,
      href: `mailto:${settings.email}`,
      external: false,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: 'Chat with the studio',
      href: whatsappHref(),
      external: true,
    },
  ] as const;

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro title={channelsIntro.title} description={channelsIntro.lede} />

      <motion.ul
        className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '-40px' }}
      >
        {channels.map((channel) => (
          <motion.li key={channel.id} variants={reduced ? undefined : fadeUp}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-black/45">
              {channel.label}
            </p>
            <a
              href={channel.href}
              {...(channel.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="mt-3 block font-heading text-xl text-black transition-colors hover:text-black/70 md:text-2xl"
            >
              {channel.value}
            </a>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-14 border-t border-black/10 pt-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-black/45">
          Boutique hours
        </p>
        <ul className="mt-4 space-y-2">
          {settings.hours.map((row) => (
            <li
              key={row.day}
              className="flex max-w-md flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-black/75"
            >
              <span>{row.day}</span>
              <span className="font-medium text-black">{row.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
