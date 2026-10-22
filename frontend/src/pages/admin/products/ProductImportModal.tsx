import { useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Alert, Button, Modal } from '@/components/ui';
import type { ProductImportResult, ProductImportRow } from '@/services/products/productService';
import { PRODUCT_CSV_TEMPLATE, parseProductCsv } from './productCsv';

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ProductImportRow[]) => Promise<ProductImportResult>;
  onImported: () => void;
}

export function ProductImportModal({
  open,
  onClose,
  onImport,
  onImported,
}: ProductImportModalProps) {
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return parseProductCsv(text);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'CSV could not be parsed' };
    }
  }, [text]);

  const parseResult = parsed && 'error' in parsed ? null : parsed;
  const liveError = parseError ?? (parsed && 'error' in parsed ? parsed.error : null);
  const headers = parseResult?.headers ?? [];
  const missingHeaders = ['code', 'name'].filter((header) => !headers.includes(header));
  const invalidRows =
    parseResult?.rows.filter((row) => !row.values.code?.trim() || !row.values.name?.trim()) ?? [];

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    setParseError(null);
    try {
      const content = await file.text();
      setText(content);
      try {
        parseProductCsv(content);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'CSV could not be parsed');
      }
    } catch {
      setParseError('The file could not be read.');
    }
  }

  async function runImport() {
    if (!parseResult || missingHeaders.length > 0) return;
    setImporting(true);
    setResult(null);
    try {
      const rows: ProductImportRow[] = parseResult.rows.map((row) => ({
        ...row.values,
        row: row.row,
      }));
      const imported = await onImport(rows);
      setResult(imported);
      if (imported.created + imported.updated > 0) onImported();
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'The import failed.');
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setText('');
    setFilename('');
    setResult(null);
    setParseError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import products from CSV"
      description="Rows are validated one by one. Valid rows are saved even when another row fails."
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="admin"
            size="sm"
            onClick={() => void runImport()}
            loading={importing}
            disabled={!parseResult || missingHeaders.length > 0 || parseResult.rows.length === 0}
          >
            <Icon name="upload" size={14} />
            Import {parseResult?.rows.length ?? 0} row
            {parseResult?.rows.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-line p-4">
          <label className="block text-sm font-medium" htmlFor="product-csv-file">
            Choose a CSV file
          </label>
          <input
            id="product-csv-file"
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full text-sm"
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
          {filename ? (
            <p className="mt-1 text-xs opacity-65">
              {filename}
              {parseResult
                ? ` - ${parseResult.rows.length} data row${parseResult.rows.length === 1 ? '' : 's'}`
                : ''}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilename('product-import-template.csv');
                setText(PRODUCT_CSV_TEMPLATE);
                setParseError(null);
                setResult(null);
              }}
            >
              <Icon name="file" size={14} />
              Load template
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="product-csv-paste">
            Or paste CSV
          </label>
          <textarea
            id="product-csv-paste"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult(null);
              setParseError(null);
            }}
            rows={7}
            className="mt-1 w-full rounded-lg border border-line bg-surface-field px-3 py-2 font-mono text-xs text-ink-raised focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30"
            placeholder="code,name,category,..."
          />
        </div>

        {liveError ? <Alert tone="error">{liveError}</Alert> : null}
        {parseResult && missingHeaders.length > 0 ? (
          <Alert tone="error" title="Required columns are missing">
            Add {missingHeaders.join(' and ')} to the header row. Download the template to see every
            supported column.
          </Alert>
        ) : null}
        {parseResult && invalidRows.length > 0 ? (
          <Alert tone="warning" title="Some rows need attention">
            {invalidRows.length} row{invalidRows.length === 1 ? '' : 's'} have no code or name. They
            will be reported by row number and skipped; the rest will still import.
          </Alert>
        ) : null}

        {parseResult && parseResult.rows.length > 0 ? (
          <div className="max-h-52 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-sunken text-[10px] uppercase tracking-wide">
                <tr>
                  <th className="px-2 py-2">Row</th>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Template</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {parseResult.rows.slice(0, 100).map((row) => (
                  <tr key={`${row.row}-${row.values.code}`}>
                    <td className="px-2 py-1.5 opacity-70">{row.row}</td>
                    <td className="px-2 py-1.5 font-mono">{row.values.code || '-'}</td>
                    <td className="px-2 py-1.5">{row.values.name || '-'}</td>
                    <td className="px-2 py-1.5">{row.values.category || '-'}</td>
                    <td className="px-2 py-1.5">{row.values.template || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-2">
            <Alert
              tone={result.failed.length > 0 ? 'warning' : 'success'}
              title={`Imported ${result.created + result.updated} of ${result.total} rows`}
            >
              {result.created} created, {result.updated} updated, {result.failed.length} failed.
            </Alert>
            {result.failed.length > 0 ? (
              <div className="max-h-40 overflow-auto rounded-lg border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-[10px] uppercase tracking-wide">
                    <tr>
                      <th className="px-2 py-2">Row</th>
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {result.failed.map((issue) => (
                      <tr key={`${issue.row}-${issue.code ?? ''}`}>
                        <td className="px-2 py-1.5 opacity-70">{issue.row}</td>
                        <td className="px-2 py-1.5 font-mono">{issue.code || '-'}</td>
                        <td className="px-2 py-1.5 text-danger">{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs opacity-70">
          Supported columns include code, name, category, template, slug, descriptions, price range,
          lead time, tags, featured, active, sort order, image, gallery JSON, variants JSON and SEO
          JSON. Existing codes are updated; new codes are created.
        </p>
      </div>
    </Modal>
  );
}
