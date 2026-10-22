import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Select } from '../Select';
import { Select as BarrelSelect } from '../index';

const OPTIONS = [
  { value: 'bridal', label: 'Bridal Wear' },
  { value: 'traditional', label: 'Traditional Wear' },
  { value: 'tailoring', label: 'Custom Tailoring', disabled: true },
];

function Harness({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <Select
      label="Service"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('Select', () => {
  it('is the same component the barrel exports', () => {
    expect(BarrelSelect).toBe(Select);
  });

  it('renders a button trigger, not a native select', () => {
    render(<Harness />);

    const trigger = screen.getByRole('combobox', { name: /service/i });
    expect(trigger.tagName).toBe('BUTTON');
    // There is no native <select> anywhere in the component.
    expect(document.querySelector('select')).toBeNull();
  });

  it('shows the placeholder until something is chosen', () => {
    render(<Harness />);
    expect(screen.getByRole('combobox', { name: /service/i })).toHaveTextContent('Select…');
  });

  it('opens the listbox and marks the options', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: /service/i }));

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Bridal Wear' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('chooses an option and reports the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: /service/i }));
    await user.click(screen.getByRole('option', { name: 'Traditional Wear' }));

    expect(onChange).toHaveBeenCalledWith('traditional');
    expect(screen.getByRole('combobox', { name: /service/i })).toHaveTextContent('Traditional Wear');
  });

  it('closes the listbox after a choice', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: /service/i }));
    await user.click(screen.getByRole('option', { name: 'Bridal Wear' }));

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('moves the active option with the arrow keys and picks it with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const trigger = screen.getByRole('combobox', { name: /service/i });
    await user.click(trigger);
    // Opening highlights the first option; one step down is the second.
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('traditional');
  });

  it('closes on Escape without choosing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: /service/i }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('will not choose a disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: /service/i }));
    await user.click(screen.getByRole('option', { name: 'Custom Tailoring' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the trigger as expanded only while the list is open', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole('combobox', { name: /service/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('associates the label with the trigger', () => {
    render(<Harness />);
    expect(screen.getByLabelText(/service/i)).toBe(
      screen.getByRole('combobox', { name: /service/i }),
    );
  });

  it('announces an error', () => {
    render(
      <Select
        label="Service"
        options={OPTIONS}
        value=""
        onChange={() => {}}
        error="Pick a service"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a service');
  });
});
