import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  Input,
  Progress,
  Section,
  SectionIntro,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp } from '@/motion/variants';
import { submitLeadRequest } from '@/services/leads/leadService';
import {
  budgetLabelFromValue,
  budgetOptions,
  formCopy,
  formSteps,
  occasionLabelFromValue,
  occasionOptions,
  serviceLabelFromSlug,
  serviceOptions as seedServiceOptions,
  whatsappHref,
  type FormStepId,
} from '../data';

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

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  service?: string;
  occasion?: string;
  budget?: string;
  preferredDate?: string;
  message?: string;
  images?: string;
}

interface InspirationPreview {
  id: string;
  file: File;
  url: string;
}

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  city: '',
  service: '',
  occasion: '',
  budget: '',
  preferredDate: '',
  message: '',
};

const stepOrder: FormStepId[] = ['you', 'occasion', 'inspiration', 'review'];

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Multi-step consultation form — personal progressive disclosure + lead API.
 */
export function RequestFormSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { services } = usePublicContent();
  const serviceOptions = useMemo(
    () =>
      services.length
        ? services.map((s) => ({ value: s.slug, label: s.title }))
        : seedServiceOptions,
    [services],
  );
  const [searchParams] = useSearchParams();
  const fileInputId = useId();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<InspirationPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stepId = stepOrder[stepIndex] ?? 'you';
  const progressValue = ((stepIndex + 1) / stepOrder.length) * 100;

  useEffect(() => {
    const slug = searchParams.get('service');
    if (slug && serviceOptions.some((o) => o.value === slug)) {
      setForm((prev) => (prev.service ? prev : { ...prev, service: slug }));
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(id: FormStepId): FormErrors {
    const next: FormErrors = {};
    if (id === 'you') {
      if (!form.name.trim() || form.name.trim().length < 2) {
        next.name = 'Please enter your name';
      }
      if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
        next.phone = 'Enter a valid 10-digit phone number';
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        next.email = 'Enter a valid email address';
      }
      if (!form.city.trim() || form.city.trim().length < 2) {
        next.city = 'Enter your city';
      }
    }
    if (id === 'occasion') {
      if (!form.service) next.service = 'Select a service';
      if (!form.occasion) next.occasion = 'Select an occasion';
      if (!form.budget) next.budget = 'Select a budget range';
      if (!form.preferredDate) {
        next.preferredDate = 'Choose a preferred date';
      } else if (form.preferredDate < todayIsoDate()) {
        next.preferredDate = 'Preferred date cannot be in the past';
      }
    }
    if (id === 'inspiration') {
      if (!form.message.trim() || form.message.trim().length < 10) {
        next.message = 'Share a short note (at least 10 characters)';
      }
    }
    return next;
  }

  function goNext() {
    const nextErrors = validateStep(stepId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: 'Please check this step', tone: 'error' });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, stepOrder.length - 1));
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function onPickImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const maxBytes = formCopy.maxImageMb * 1024 * 1024;
    const remaining = formCopy.maxImages - images.length;
    if (remaining <= 0) {
      setErrors((prev) => ({
        ...prev,
        images: `You can add up to ${formCopy.maxImages} images`,
      }));
      return;
    }

    const accepted: InspirationPreview[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, images: 'Only image files are allowed' }));
        continue;
      }
      if (file.size > maxBytes) {
        setErrors((prev) => ({
          ...prev,
          images: `Each image must be under ${formCopy.maxImageMb}MB`,
        }));
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted]);
      setErrors((prev) => ({ ...prev, images: undefined }));
    }
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const reviewErrors = {
      ...validateStep('you'),
      ...validateStep('occasion'),
      ...validateStep('inspiration'),
    };
    setErrors(reviewErrors);
    if (Object.keys(reviewErrors).length > 0) {
      toast({ title: 'Please review your details', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await submitLeadRequest({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        service: form.service,
        occasion: form.occasion,
        budget: form.budget,
        preferredDate: form.preferredDate,
        message: form.message.trim(),
        inspirationFiles: images.map((i) => i.file),
      });
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setImages([]);
      setSubmitted(true);
      toast({
        title: formCopy.successTitle,
        description: formCopy.successBody,
        tone: 'success',
      });
    } catch {
      toast({
        title: 'Could not send request',
        description: 'Please try again, or reach us on WhatsApp.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Section id="request-form" tone="light" className="scroll-mt-24 py-16 md:py-24">
        <motion.div
          className="mx-auto max-w-xl text-center"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-gold">Kadamba</p>
          <h2 className="mt-4 font-heading text-3xl text-black md:text-4xl">{formCopy.successTitle}</h2>
          <p className="text-lede mt-4 text-black/75">{formCopy.successBody}</p>
          <p className="mt-8 text-sm text-black/60">{formCopy.successWhatsApp}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                window.open(
                  whatsappHref(
                    "Hi Kadamba's Designer Studio — I just sent a consultation request and would love to chat.",
                  ),
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              Open WhatsApp
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/contact')}>
              Contact page
            </Button>
          </div>
        </motion.div>
      </Section>
    );
  }

  return (
    <Section id="request-form" tone="light" className="scroll-mt-24 border-t border-black/8 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <SectionIntro tone="light" title={formCopy.title} description={formCopy.lede} />
        </motion.div>

        <div className="mt-8">
          <Progress value={progressValue} label={`Step ${stepIndex + 1} of ${stepOrder.length}`} />
          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Form steps">
            {formSteps.map((s, i) => (
              <li
                key={s.id}
                className={
                  i === stepIndex
                    ? 'text-sm font-medium text-black'
                    : i < stepIndex
                      ? 'text-sm text-black/55'
                      : 'text-sm text-black/35'
                }
              >
                <span className="font-heading text-gold">{String(i + 1).padStart(2, '0')}</span>
                <span className="ml-2">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <form className="mt-10" onSubmit={onSubmit} noValidate>
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              initial={reduced ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {stepId === 'you' ? (
                <>
                  <Input
                    label="Name"
                    name="name"
                    required
                    autoComplete="name"
                    value={form.name}
                    error={errors.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      error={errors.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      error={errors.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    name="city"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    error={errors.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </>
              ) : null}

              {stepId === 'occasion' ? (
                <>
                  <Select
                    label="Service"
                    name="service"
                    required
                    placeholder="Select a service"
                    options={serviceOptions}
                    value={form.service}
                    error={errors.service}
                    onChange={(e) => update('service', e.target.value)}
                  />
                  <Select
                    label="Occasion"
                    name="occasion"
                    required
                    placeholder="Select an occasion"
                    options={[...occasionOptions]}
                    value={form.occasion}
                    error={errors.occasion}
                    onChange={(e) => update('occasion', e.target.value)}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Preferred date"
                      name="preferredDate"
                      type="date"
                      required
                      min={todayIsoDate()}
                      value={form.preferredDate}
                      error={errors.preferredDate}
                      onChange={(e) => update('preferredDate', e.target.value)}
                    />
                    <Select
                      label="Budget"
                      name="budget"
                      required
                      placeholder="Select a range"
                      options={[...budgetOptions]}
                      value={form.budget}
                      error={errors.budget}
                      onChange={(e) => update('budget', e.target.value)}
                    />
                  </div>
                </>
              ) : null}

              {stepId === 'inspiration' ? (
                <>
                  <Textarea
                    label="Message"
                    name="message"
                    required
                    rows={5}
                    hint="Fabric ideas, silhouette notes, or event timing — whatever helps us prepare."
                    value={form.message}
                    error={errors.message}
                    onChange={(e) => update('message', e.target.value)}
                  />
                  <div>
                    <label htmlFor={fileInputId} className="text-sm font-medium text-black">
                      Inspiration images
                      <span className="ml-1 font-normal text-black/50">
                        (optional, up to {formCopy.maxImages})
                      </span>
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2 block w-full text-sm text-black/70 file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-2 file:text-sm file:font-medium file:text-black"
                      onChange={onPickImages}
                    />
                    {errors.images ? (
                      <p role="alert" className="mt-1.5 text-xs text-red-700">
                        {errors.images}
                      </p>
                    ) : null}
                    {images.length > 0 ? (
                      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {images.map((img) => (
                          <li key={img.id} className="relative overflow-hidden rounded-md">
                            <img
                              src={img.url}
                              alt=""
                              className="aspect-square w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-xs text-cream"
                              onClick={() => removeImage(img.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </>
              ) : null}

              {stepId === 'review' ? (
                <dl className="space-y-4 border-y border-black/10 py-6 text-sm text-black/80">
                  <ReviewRow label="Name" value={form.name} />
                  <ReviewRow label="Phone" value={form.phone} />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="City" value={form.city} />
                  <ReviewRow label="Service" value={serviceLabelFromSlug(form.service)} />
                  <ReviewRow label="Occasion" value={occasionLabelFromValue(form.occasion)} />
                  <ReviewRow label="Preferred date" value={form.preferredDate} />
                  <ReviewRow label="Budget" value={budgetLabelFromValue(form.budget)} />
                  <ReviewRow label="Message" value={form.message} />
                  <ReviewRow
                    label="Inspiration"
                    value={
                      images.length === 0
                        ? 'None attached'
                        : `${images.length} image${images.length === 1 ? '' : 's'}`
                    }
                  />
                </dl>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            {stepIndex > 0 ? (
              <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {stepId !== 'review' ? (
              <Button type="button" variant="primary" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" variant="primary" loading={submitting}>
                Send request
              </Button>
            )}
          </div>
        </form>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.22em] text-black/45">
          {formCopy.trustLine}
        </p>
      </div>
    </Section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="font-medium text-black">{label}</dt>
      <dd className="whitespace-pre-wrap text-black/75">{value}</dd>
    </div>
  );
}
