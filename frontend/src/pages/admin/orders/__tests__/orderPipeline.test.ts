import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_TRANSITIONS, ORDER_PRODUCTION_FLOW } from '@/shared/enums';
import { canMoveOrder, transitionNeedsNote } from '../types';

describe('the order pipeline', () => {
  it('lets an order move along the flow', () => {
    expect(canMoveOrder('enquiry', 'confirmed')).toBe(true);
    expect(canMoveOrder('measurements', 'cutting')).toBe(true);
    expect(canMoveOrder('finishing', 'delivery')).toBe(true);
  });

  it('refuses a move the machine does not allow', () => {
    expect(canMoveOrder('enquiry', 'cutting')).toBe(false);
    expect(canMoveOrder('delivery', 'stitching')).toBe(false);
    expect(canMoveOrder('delivery', 'confirmed')).toBe(false);
  });

  it('always allows a pause and a cancellation', () => {
    // A delivered order is finished: its lifecycle is complete, and the shared
    // machine gives it no moves at all.
    for (const status of ORDER_PRODUCTION_FLOW.filter((s) => s !== 'delivery')) {
      expect(canMoveOrder(status, 'on_hold')).toBe(true);
      expect(canMoveOrder(status, 'cancelled')).toBe(true);
    }
  });

  it('agrees with the shared machine for every status', () => {
    for (const [from, targets] of Object.entries(ORDER_STATUS_TRANSITIONS)) {
      for (const to of targets) {
        expect(canMoveOrder(from, to)).toBe(true);
      }
    }
  });

  it('asks for a reason when it cancels, pauses, or sends work back', () => {
    expect(transitionNeedsNote('stitching', 'cancelled')).toBe(true);
    expect(transitionNeedsNote('stitching', 'on_hold')).toBe(true);
    // Backwards along the flow is rework, and rework deserves a reason.
    expect(transitionNeedsNote('finishing', 'trial')).toBe(true);
    expect(transitionNeedsNote('stitching', 'cutting')).toBe(true);
  });

  it('does not ask for a reason when work moves forward', () => {
    expect(transitionNeedsNote('enquiry', 'confirmed')).toBe(false);
    expect(transitionNeedsNote('cutting', 'stitching')).toBe(false);
    expect(transitionNeedsNote('finishing', 'delivery')).toBe(false);
  });
});
