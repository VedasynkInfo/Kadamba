import { describe, expect, it } from 'vitest';
import { orderStatusChoices, orderStatusLabel, transitionNeedsNote } from '../types';

/**
 * The console must never offer a move the API will refuse, and it must never
 * forget to ask why. Both rules are the shared machine's, read through these
 * helpers — so these tests are really about the wiring between the two.
 */
describe('orderStatusChoices', () => {
  it('offers exactly the transitions the API accepts', () => {
    expect(orderStatusChoices('enquiry').map((choice) => choice.value)).toEqual([
      'confirmed',
      'cancelled',
      'on_hold',
    ]);
    expect(orderStatusChoices('finishing').map((choice) => choice.value)).toEqual([
      'delivery',
      'trial',
      'cancelled',
      'on_hold',
    ]);
  });

  it('offers nothing for a delivered order, because the lifecycle is complete', () => {
    expect(orderStatusChoices('delivery')).toEqual([]);
  });

  it('carries a display label for every choice, not the raw value', () => {
    expect(orderStatusChoices('enquiry').map((choice) => choice.label)).toEqual([
      'Confirmed',
      'Cancelled',
      'On Hold',
    ]);
    expect(orderStatusChoices('trial')[0].label).toBe('Quality Finishing');
  });

  it('offers nothing for a status it does not recognise', () => {
    expect(orderStatusChoices('legacy_status')).toEqual([]);
  });
});

describe('orderStatusLabel', () => {
  it('prettifies a value it has no label for', () => {
    expect(orderStatusLabel('embroidery_maggam')).toBe('Maggam / Aari Work');
    expect(orderStatusLabel('some_unknown_stage')).toBe('some unknown stage');
  });
});

describe('transitionNeedsNote', () => {
  it('asks for a reason before cancelling or pausing', () => {
    expect(transitionNeedsNote('stitching', 'cancelled')).toBe(true);
    expect(transitionNeedsNote('stitching', 'on_hold')).toBe(true);
  });

  it('asks for a reason when an order is sent back through production', () => {
    // Rework: the garment was finished and is going back to a fitting.
    expect(transitionNeedsNote('finishing', 'trial')).toBe(true);
    expect(transitionNeedsNote('trial', 'stitching')).toBe(true);
  });

  it('does not interrupt a normal forward move', () => {
    expect(transitionNeedsNote('stitching', 'trial')).toBe(false);
    expect(transitionNeedsNote('embroidery_maggam', 'trial')).toBe(false);
    expect(transitionNeedsNote('finishing', 'delivery')).toBe(false);
  });

  it('does not ask on a status it cannot place in the flow', () => {
    expect(transitionNeedsNote('legacy_status', 'delivery')).toBe(false);
  });
});
