import { useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  Heading,
  Input,
  Modal,
  Pagination,
  Progress,
  RadioGroup,
  Section,
  Select,
  Spinner,
  useToast,
} from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';

/**
 * Living documentation for the Phase 2 design system.
 */
export default function DesignSystemPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [service, setService] = useState('interior');

  return (
    <>
      <PageMeta {...staticPageMeta.designSystem} />
      <Section className="pb-8 pt-10">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Design System' },
          ]}
        />
        <Heading as={1} animated className="mt-4">
          Design System
        </Heading>
        <p className="mt-3 max-w-2xl text-black/70">
          Luxury black, gold, and cream tokens with reusable UI primitives for
          Kadamba&apos;s Designer Studio — Kurnool boutique for women&apos;s traditional
          and bridal wear.
        </p>
      </Section>

      <Section className="pt-0">
        <Heading as={2} className="mb-6">
          Buttons
        </Heading>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary" className="!border-black/25 !text-black hover:!border-gold">
            Secondary
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="luxury">Luxury</Button>
          <Button loading>Loading</Button>
          <Button
            variant="primary"
            onClick={() =>
              toast({
                title: 'Toast ready',
                description: 'Notification system is wired.',
                tone: 'success',
              })
            }
          >
            Show toast
          </Button>
          <Button variant="luxury" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
        </div>
      </Section>

      <Section tone="dark">
        <Heading as={2} accent className="mb-6">
          Cards
        </Heading>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="service" media={<span className="text-2xl" aria-hidden>◆</span>}>
            <CardTitle>Service</CardTitle>
            <CardDescription>Icon-led service card for offerings.</CardDescription>
          </Card>
          <Card variant="pricing" featured>
            <CardTitle className="text-gold">Signature</CardTitle>
            <p className="mt-4 font-heading text-3xl text-cream">₹1,49,000</p>
            <CardDescription className="text-cream/70">Full-home design package.</CardDescription>
          </Card>
          <Card
            variant="image"
            media={
              <div className="flex h-full items-center justify-center bg-elevated text-gold/40">
                Artwork
              </div>
            }
          >
            <CardTitle className="text-cream">Image overlay</CardTitle>
            <CardDescription className="text-cream/70">Hover lift on media cards.</CardDescription>
          </Card>
        </div>
      </Section>

      <Section>
        <Heading as={2} className="mb-6">
          Forms
        </Heading>
        <div className="grid max-w-xl gap-4">
          <Input label="Full name" name="name" placeholder="Your name" required />
          <Select
            label="Service"
            name="service"
            placeholder="Select a service"
            options={[
              { value: 'interior', label: 'Interior Design' },
              { value: 'branding', label: 'Branding' },
              { value: 'styling', label: 'Styling' },
            ]}
          />
          <Checkbox label="Send me project updates" name="updates" />
          <RadioGroup
            name="tier"
            label="Project tier"
            value={service}
            onChange={setService}
            options={[
              { value: 'interior', label: 'Interior' },
              { value: 'branding', label: 'Branding' },
              { value: 'styling', label: 'Styling' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <Heading as={2} className="mb-6">
          Feedback
        </Heading>
        <div className="flex flex-wrap items-center gap-8">
          <Spinner label="Loading content" />
          <div className="w-64">
            <Progress value={64} label="Upload" />
          </div>
          <Pagination page={page} totalPages={5} onPageChange={setPage} />
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Luxury modal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast({ title: 'Confirmed', tone: 'info' });
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        Backdrop blur, Escape to close, and focus restore are built in.
      </Modal>
    </>
  );
}
