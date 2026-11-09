export type DataGridToolbarItem = 'search' | 'selection' | 'columnFilters' | 'density' | 'columns' | 'export' | 'resetFilters' | 'actions';

const defaultToolbarOrder: readonly DataGridToolbarItem[] = ['search', 'selection', 'columnFilters', 'density', 'columns', 'export', 'resetFilters', 'actions'];

/** Keep every toolbar group once, appending unspecified groups in default order. */
export function resolveDataGridToolbarOrder(order?: readonly DataGridToolbarItem[]): DataGridToolbarItem[] {
  const seen = new Set<DataGridToolbarItem>();
  const resolved: DataGridToolbarItem[] = [];
  for (const item of [...(order ?? []), ...defaultToolbarOrder]) {
    if (!defaultToolbarOrder.includes(item) || seen.has(item)) continue;
    seen.add(item);
    resolved.push(item);
  }
  return resolved;
}
