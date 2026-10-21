/**
 * The pages worth showing, with a gap marker where numbers were skipped.
 *
 * A long list of page buttons is a wall, not a control. The current page and
 * its neighbours are enough to move by one; the ends are there to move far.
 */
export function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  visible.forEach((value, index) => {
    const previous = visible[index - 1];
    if (index > 0 && value - previous > 1) result.push('gap');
    result.push(value);
  });
  return result;
}
