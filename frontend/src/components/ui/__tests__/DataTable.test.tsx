import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from '@/components/ui';

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
  amount: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'amount', header: 'Amount', sortable: true },
];

const rows: Row[] = [
  { id: 'a', name: 'Beta', amount: 2 },
  { id: 'b', name: 'Alpha', amount: 3 },
  { id: 'c', name: 'Gamma', amount: 1 },
];

const firstBodyRow = () => screen.getAllByRole('row')[1].textContent;

function SelectionHarness() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.id}
      selectedKeys={selected}
      onSelectionChange={setSelected}
      selectAllLabel="Select all rows"
    />
  );
}

describe('DataTable', () => {
  it('sorts on click and flips direction on the second click', () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.id} />);

    const nameHeader = screen.getByRole('columnheader', { name: /^name$/i });
    const nameButton = within(nameHeader).getByRole('button');

    expect(firstBodyRow()).toContain('Beta');

    fireEvent.click(nameButton);
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(firstBodyRow()).toContain('Alpha');

    fireEvent.click(nameButton);
    expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
    expect(firstBodyRow()).toContain('Gamma');
  });

  it('selects every visible row from the header checkbox, and reports indeterminate', () => {
    render(<SelectionHarness />);

    const header = screen.getByLabelText('Select all rows') as HTMLInputElement;
    const rowBoxes = () => screen.getAllByLabelText('Select row') as HTMLInputElement[];

    fireEvent.click(header);
    expect(header.checked).toBe(true);
    expect(rowBoxes().every((box) => box.checked)).toBe(true);
    expect(header.indeterminate).toBe(false);

    fireEvent.click(rowBoxes()[0]);
    expect(header.checked).toBe(false);
    expect(header.indeterminate).toBe(true);

    fireEvent.click(header);
    expect(header.checked).toBe(true);
    expect(rowBoxes().every((box) => box.checked)).toBe(true);
  });

  it('exposes sortable headers as buttons and row selection as native inputs', () => {
    render(<SelectionHarness />);

    const nameHeader = screen.getByRole('columnheader', { name: /^name$/i });
    expect(within(nameHeader).getByRole('button')).toBeTruthy();
    expect(screen.getAllByLabelText('Select row')[0].tagName).toBe('INPUT');
  });

  it('shows the empty state when there are no rows', () => {
    render(
      <DataTable columns={columns} data={[]} rowKey={(row) => row.id} emptyMessage="Nothing here" />,
    );

    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('shows skeleton rows while loading instead of data', () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} rowKey={(row) => row.id} loading />,
    );

    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(screen.queryByText('Beta')).toBeNull();
  });

  it('offers bulk actions while rows are selected, and clears the selection', () => {
    const onBulk = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        selectedKeys={['a']}
        onSelectionChange={onSelectionChange}
        bulkActions={[{ label: 'Export CSV', onClick: onBulk }]}
      />,
    );

    expect(screen.getByRole('region', { name: 'Bulk actions' }).textContent).toContain(
      '1 selected',
    );

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(onBulk).toHaveBeenCalledWith(['a']);

    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('keeps the bulk bar out of the way when nothing is selected', () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.id} />);

    expect(screen.queryByRole('region', { name: 'Bulk actions' })).toBeNull();
  });
});
