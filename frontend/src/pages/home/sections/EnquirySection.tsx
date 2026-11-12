import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DateField, Input, Select, Textarea, useToast } from '@/components/ui';
import { Reveal } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
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
 * — enough to start a conversation, with the studio's own phone number beside
 * it for anyone who would rather simply call.
 */
export function EnquirySection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, whatsappHref } = usePublicContent();
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
    <section id="enquire" className="house-section bg-surface-sunken">
      <div className="house-container grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="eyebrow">Begin</p>
            <h2 className="display-lg mt-6 text-ink">
              Tell us <span className="display-accent">the occasion.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-ink/62">
              A few lines is enough. We will call, book the fitting, and tell you honestly what will
              and will not work in the time you have.
            </p>

            <dl className="mt-10 space-y-5 border-t border-ink/12 pt-8">
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-ink/65">
                  The studio
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink/70">
                  {settings.addressLines?.length
                    ? settings.addressLines.join(', ')
                    : `${settings.locality || 'Kurnool'}, ${settings.state || 'Andhra Pradesh'}`}
                </dd>
              </div>
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-ink/65">
                  Telephone
                </dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${settings.phoneTel}`}
                    className="font-heading text-xl text-ink transition-colors hover:text-brand-strong"
                  >
                    {settings.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-ink/65">
                  Prefer to write?
                </dt>
                <dd className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <a
                    href={`mailto:${settings.email}`}
                    className="link-sweep text-ink/75 hover:text-brand-strong"
                  >
                    {settings.email}
                  </a>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-sweep text-ink/75 hover:text-brand-strong"
                  >
                    WhatsApp
                  </a>
                </dd>
              </div>
            </dl>

            <p className="mt-8 text-[0.58rem] uppercase tracking-[0.22em] text-ink/65">
              By appointment &middot; Monday to Saturday
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <form onSubmit={onSubmit} noValidate className="well grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <div className="sm:col-span-2">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-brand-strong">
                Consultation request
              </p>
              <p className="mt-2 text-sm text-ink/70">
                We reply within one working day, during studio hours.
              </p>
            </div>

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
                No deposit is taken until you have seen the estimate.
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
