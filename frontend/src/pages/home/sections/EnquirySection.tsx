import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DateField, Input, Section, SectionIntro, Select, Textarea, useToast } from '@/components/ui';
import { submitLeadRequest } from '@/services/leads/leadService';
import { budgetOptions, occasionOptions } from '@/pages/request-service/data';

interface FormState {
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  occasion: string;
  budget: string;
  preferredDate: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const empty: FormState = {
  name: '',
  phone: '',
  email: '',
  city: 'Kurnool',
  service: '',
  occasion: '',
  budget: '',
  preferredDate: '',
  message: '',
};

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** A short enquiry form for the home page. */
function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = 'Please tell us your name';
  if (!/^\+?[\d\s-]{8,16}$/.test(form.phone.trim())) errors.phone = 'A phone number we can reach you on';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'An email address, please';
  if (!form.service) errors.service = 'What would you like made?';
  if (!form.occasion) errors.occasion = 'Tell us the occasion';
  if (!form.preferredDate) errors.preferredDate = 'A preferred date helps us plan';
  if (form.message.trim().length < 10) errors.message = 'A sentence or two about the occasion';
  return errors;
}

/**
 * Book a fitting, from the home page.
 *
 * The full consultation form lives on its own page; this is the short version
 * — enough to start a conversation, with a link to the full request for anyone
 * who wants to attach photographs.
 */
export function EnquirySection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const created = await submitLeadRequest({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim() || 'Kurnool',
        service: form.service,
        occasion: form.occasion,
        budget: form.budget,
        preferredDate: form.preferredDate,
        message: form.message.trim(),
      });
      toast({
        tone: 'success',
        title: 'Request received',
        description: `We will call you on ${form.phone.trim()}. Your reference is ${created.referenceId ?? created.id}.`,
      });
      setForm(empty);
      navigate('/portal/activate');
    } catch (error) {
      toast({
        tone: 'error',
        title: 'The request did not go through',
        description: error instanceof Error ? error.message : 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <SectionIntro
            eyebrow="Begin"
            title="Tell us the occasion"
            description="A few lines is enough to start. We will call, we will book the fitting, and we will tell you honestly what will and will not work in the time you have."
          />
          <p className="mt-8 text-sm leading-relaxed text-ink/65">
            Prefer to see the work first?{' '}
            <a href="/portfolio" className="link-sweep font-semibold text-brand-strong">
              Look through the portfolio
            </a>
            , or send the full request with your photographs.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Your name"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(event) => patch({ phone: event.target.value })}
            error={errors.phone}
            autoComplete="tel"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            label="City"
            value={form.city}
            onChange={(event) => patch({ city: event.target.value })}
            error={errors.city}
            autoComplete="address-level2"
          />
          <Select
            label="What would you like made?"
            value={form.service}
            onChange={(value) => patch({ service: value })}
            error={errors.service}
            placeholder="Choose a service"
            options={[
              { value: 'bridal-lehenga', label: 'Bridal lehenga' },
              { value: 'bridal-blouse', label: 'Bridal blouse' },
              { value: 'saree-blouse', label: 'Saree blouse' },
              { value: 'custom-tailoring', label: 'Custom tailoring' },
              { value: 'festive-wear', label: 'Festive wear' },
            ]}
          />
          <Select
            label="Occasion"
            value={form.occasion}
            onChange={(value) => patch({ occasion: value })}
            error={errors.occasion}
            placeholder="Choose an occasion"
            options={occasionOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <Select
            label="Budget"
            value={form.budget}
            onChange={(value) => patch({ budget: value })}
            error={errors.budget}
            placeholder="A ballpark is fine"
            options={budgetOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <DateField
            label="Preferred date"
            value={form.preferredDate}
            onChange={(value) => patch({ preferredDate: value })}
            error={errors.preferredDate}
            min={todayIsoDate()}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="About the occasion"
              value={form.message}
              onChange={(event) => patch({ message: event.target.value })}
              error={errors.message}
              rows={4}
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <Button type="submit" variant="primary" size="lg" loading={submitting}>
              Send the request
            </Button>
            <p className="text-xs text-ink/70">
              We reply within one working day, during studio hours.
            </p>
          </div>
        </form>
      </div>
    </Section>
  );
}
