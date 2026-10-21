import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SplitText } from '../SplitText';
import { openWithSharedElement } from '@/utils/viewTransition';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => motionPreference.reduced,
}));

describe('SplitText', () => {
  beforeEach(() => {
    motionPreference.reduced = false;
  });

  it('renders readable, selectable copy when motion is reduced', () => {
    motionPreference.reduced = true;
    render(<SplitText text="Made to measure" />);
    expect(screen.getByText('Made to measure')).toBeTruthy();
  });

  it('keeps the sentence as its text content while splitting characters', () => {
    const { container } = render(<SplitText text="Made to measure" />);
    expect(container.textContent?.replace(/\u00a0/g, ' ')).toBe('Made to measure');
  });
});

describe('openWithSharedElement', () => {
  it('falls back to the state update when View Transitions are unavailable', () => {
    const update = vi.fn();
    const element = document.createElement('button');
    openWithSharedElement(element, update);
    expect(update).toHaveBeenCalledOnce();
    expect(element.style.viewTransitionName).toBe('');
  });
});
