import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { DateField } from '../DateField';

function Harness({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <DateField
      label="Fitting date"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('DateField', () => {
  it('renders a button trigger, not a native date input', () => {
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: /fitting date/i });
    expect(trigger.tagName).toBe('BUTTON');
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  it('opens a calendar grid', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('picks a day and reports the ISO date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    const day = screen.getAllByRole('gridcell')[10];
    const label = day.getAttribute('aria-label') ?? '';
    await user.click(day);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(label).toBeTruthy();
  });

  it('shows the chosen date in a readable form', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    await user.click(screen.getAllByRole('gridcell')[10]);

    expect(screen.getByRole('button', { name: /fitting date/i })).not.toHaveTextContent('Pick a date');
  });

  it('clears the date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    await user.click(screen.getAllByRole('gridcell')[10]);
    onChange.mockClear();

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    await user.click(screen.getByRole('button', { name: /^clear$/i }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('moves the focused day with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape without choosing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /fitting date/i }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('announces an error', () => {
    render(
      <DateField
        label="Fitting date"
        value=""
        onChange={() => {}}
        error="Pick a date"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a date');
  });
});
