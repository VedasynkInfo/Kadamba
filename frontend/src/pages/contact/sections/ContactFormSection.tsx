import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Section, SectionIntro, Textarea, useToast } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp } from '@/motion/variants';
import { submitContactMessage } from '@/services/contact/contactService';
import { contactFormCopy } from '../data';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

/**
 * Contact form — open split layout with validation and API submit.
 */
export function ContactFormSection() {
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Please enter your name';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address';
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      next.phone = 'Enter a valid 10-digit phone number';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      next.message = 'Tell us a little more (at least 10 characters)';
    }
    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: 'Please check the form', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm(emptyForm);
      toast({
        title: contactFormCopy.successTitle,
        description: contactFormCopy.successBody,
        tone: 'success',
      });
    } catch {
      toast({
        title: 'Could not send message',
        description: 'Please try again, or reach us on WhatsApp.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section id="contact-form" tone="light" className="scroll-mt-24 border-t border-black/8 py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <motion.div
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-40px' }}
          variants={reduced ? undefined : fadeUp}
        >
          <SectionIntro title={contactFormCopy.title} description={contactFormCopy.lede} />
        </motion.div>

        <motion.div
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-40px' }}
          variants={reduced ? undefined : fadeUp}
        >
          {submitted ? (
            <div className="border-t border-gold/40 pt-6">
              <p className="font-heading text-2xl text-black">{contactFormCopy.successTitle}</p>
              <p className="text-lede mt-3 text-black/70">{contactFormCopy.successBody}</p>
              <Button
                variant="ghost"
                className="mt-6"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <Input
                label="Name"
                name="name"
                autoComplete="name"
                required
                value={form.name}
                error={errors.name}
                onChange={(e) => update('name', e.target.value)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => update('email', e.target.value)}
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
              <Textarea
                label="Message"
                name="message"
                required
                rows={5}
                value={form.message}
                error={errors.message}
                hint="Occasion, preferred look, or questions about fittings"
                onChange={(e) => update('message', e.target.value)}
              />
              <Button type="submit" variant="luxury" size="lg" loading={submitting}>
                Send message
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </Section>
  );
}
