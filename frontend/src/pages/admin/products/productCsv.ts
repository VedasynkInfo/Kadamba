import type { ProductType } from '@/services/products/productService';

/**
 * The editable spreadsheet shape for the product catalogue.
 *
 * JSON columns (`gallery`, `variants`, `seo`) keep the export lossless without
 * inventing a second schema for nested data. Everything else is a flat field a
 * merchandiser can edit safely in Excel or Sheets.
 */
export const PRODUCT_CSV_HEADERS = [
  'code',
  'name',
  'category',
  'template',
  'slug',
  'publicDescription',
  'description',
  'priceRange',
  'leadTimeDays',
  'leadTimeNote',
  'tags',
  'featured',
  'active',
  'sortOrder',
  'image',
  'gallery',
  'variants',
  'seo',
] as const;

export const PRODUCT_CSV_TEMPLATE = `${PRODUCT_CSV_HEADERS.join(',')}\nBR-LH,Bridal Lehenga Set,BRIDAL,BR-LH,,Hand-embroidered bridal lehenga,,45,45 days,"bridal,handwork",true,true,0,,,,,\n`;

export function csvField(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function productsToCsv(products: ProductType[]): string {
  const rows = products.map((product) => {
    const template = product.measurementTemplate;
    return [
      product.code,
      product.name,
      product.categoryId?.code ?? '',
      template?.code ?? '',
      product.slug ?? '',
      product.publicDescription ?? '',
      product.description ?? '',
      product.indicativePriceRange ?? '',
      product.leadTimeDays ?? '',
      product.leadTimeNote ?? '',
      (product.tags ?? []).join(';'),
      product.featured ? 'true' : 'false',
      product.active ? 'true' : 'false',
      product.sortOrder ?? 0,
      product.image ?? '',
      (product.gallery ?? []).length ? JSON.stringify(product.gallery) : '',
      (product.variants ?? []).length ? JSON.stringify(product.variants) : '',
      product.seo && Object.values(product.seo).some(Boolean) ? JSON.stringify(product.seo) : '',
    ];
  });

  return [PRODUCT_CSV_HEADERS.join(','), ...rows.map((row) => row.map(csvField).join(','))].join(
    '\n',
  );
}

export function downloadProductCsv(products: ProductType[], filename = 'kadamba-products.csv') {
  const blob = new Blob([productsToCsv(products)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface ParsedCsvRow {
  /** Spreadsheet row number, header excluded. */
  row: number;
  values: Record<string, string>;
}

interface ParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  blankRows: number;
}

const HEADER_ALIASES: Record<string, string> = {
  code: 'code',
  sku: 'code',
  name: 'name',
  title: 'name',
  category: 'category',
  categorycode: 'category',
  categoryid: 'categoryId',
  template: 'template',
  templatecode: 'template',
  fit: 'template',
  measurementtemplate: 'template',
  measurementtemplatecode: 'template',
  measurementtemplateid: 'template',
  slug: 'slug',
  url: 'slug',
  publicdescription: 'publicDescription',
  description: 'description',
  pricerange: 'priceRange',
  indicativepricerange: 'priceRange',
  leadtimedays: 'leadTimeDays',
  leadtime: 'leadTimeDays',
  leadtimenote: 'leadTimeNote',
  tags: 'tags',
  featured: 'featured',
  active: 'active',
  published: 'active',
  sortorder: 'sortOrder',
  order: 'sortOrder',
  image: 'image',
  cover: 'image',
  gallery: 'gallery',
  variants: 'variants',
  seo: 'seo',
};

function normalizeHeader(header: string): string {
  const key = header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return HEADER_ALIASES[key] ?? header.replace(/^\uFEFF/, '').trim();
}

/**
 * A small RFC 4180 parser: quoted commas, doubled quotes and newlines inside a
 * note all survive. Spreadsheet exports are not line-based, so splitting on
 * `\n` would corrupt any product whose public description has a paragraph.
 */
export function parseProductCsv(text: string): ParseResult {
  const source = text.replace(/^\uFEFF/, '');
  const matrix: Array<{ values: string[]; line: number }> = [];

  let field = '';
  let values: string[] = [];
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  let sawAnyCharacter = false;

  const pushField = () => {
    values.push(field);
    field = '';
  };

  const pushRow = () => {
    pushField();
    const hasContent = values.some((value) => value.trim() !== '');
    if (hasContent) matrix.push({ values, line: rowLine });
    values = [];
    rowLine = line;
    sawAnyCharacter = false;
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else if (char === '\r' && source[i + 1] === '\n') {
        // Normalise quoted CRLF to the same LF a browser textarea submits.
      } else {
        field += char;
        if (char === '\n') line += 1;
      }
      continue;
    }

    if (char === '"' && field === '') {
      inQuotes = true;
      sawAnyCharacter = true;
    } else if (char === ',') {
      pushField();
      sawAnyCharacter = true;
    } else if (char === '\n') {
      pushRow();
      line += 1;
      rowLine = line;
    } else if (char === '\r') {
      // CRLF is handled by the following \n; a lone CR is still a row break.
      if (source[i + 1] !== '\n') {
        pushRow();
        line += 1;
        rowLine = line;
      }
    } else {
      field += char;
      sawAnyCharacter = true;
    }
  }

  if (inQuotes) {
    throw new Error('The CSV has an unterminated quoted field.');
  }
  if (sawAnyCharacter || field !== '' || values.length > 0) {
    pushRow();
  }

  const [headerRow, ...dataRows] = matrix;
  if (!headerRow) {
    return { headers: [], rows: [], blankRows: 0 };
  }

  const headers = headerRow.values.map(normalizeHeader);
  const rows = dataRows.map(({ values: cells, line: sourceLine }) => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      values[header] = (cells[index] ?? '').trim();
    });
    return { row: sourceLine, values };
  });

  return {
    headers,
    rows,
    blankRows: Math.max(0, matrix.length - 1 - rows.length),
  };
}
