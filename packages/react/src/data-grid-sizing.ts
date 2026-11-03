/** Internal column sizing shared by the table, sticky offsets and resize controls. */
interface SizedColumn {
  id: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
}

const positiveInteger = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;

export function getDataGridColumnWidthBounds(column: SizedColumn) {
  const min = positiveInteger(column.minWidth, 96);
  return {min, max: Math.max(min, positiveInteger(column.maxWidth, 600))};
}

export function resolveDataGridColumnWidths(
  columns: readonly SizedColumn[], availableWidth?: number,
  overrides: Readonly<Record<string, number>> = {}, reservedWidth = 0,
): number[] {
  const available = availableWidth !== undefined && Number.isFinite(availableWidth) && availableWidth > 0
    ? Math.max(0, Math.floor(availableWidth - Math.max(0, Number.isFinite(reservedWidth) ? reservedWidth : 0))) : undefined;
  const bounds = columns.map(getDataGridColumnWidthBounds);
  const flex: number[] = [];
  const percentages: number[] = [];
  const result = columns.map((column, index) => {
    const {min, max} = bounds[index];
    const clamp = (value: number) => Math.max(min, Math.min(max, Math.round(value)));
    const override = overrides[column.id];
    if (typeof override === 'number' && Number.isFinite(override)) return clamp(override);
    if (available !== undefined && Number.isFinite(column.flex) && column.flex! > 0) {
      flex.push(index);
      return 0;
    }
    const value = typeof column.width === 'string' ? column.width.trim() : column.width;
    if (typeof value === 'number' && Number.isFinite(value)) return clamp(value);
    if (typeof value === 'string' && /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)?$/.test(value)) {
      const number = Number.parseFloat(value);
      if (Number.isFinite(number) && (!value.endsWith('%') || available !== undefined)) {
        if (value.endsWith('%')) {
          percentages.push(index);
          return Math.max(min, Math.min(max, available! * number / 100));
        }
        return clamp(number);
      }
    }
    return clamp(160);
  });
  // Round percentage columns as a group: 50% + 50% of 701px must total 701px.
  const percentageOrder = [...percentages].sort((a, b) => (result[b] % 1) - (result[a] % 1));
  let percentageRemainder = Math.round(percentages.reduce((sum, index) => sum + result[index], 0))
    - percentages.reduce((sum, index) => sum + Math.floor(result[index]), 0);
  for (const index of percentages) result[index] = Math.floor(result[index]);
  for (const index of percentageOrder) if (percentageRemainder > 0 && result[index] < bounds[index].max) {
    result[index] += 1;
    percentageRemainder -= 1;
  }
  if (!flex.length || available === undefined) return result;

  const minTotal = flex.reduce((sum, index) => sum + bounds[index].min, 0);
  const maxTotal = flex.reduce((sum, index) => sum + bounds[index].max, 0);
  const target = Math.max(minTotal, Math.min(maxTotal, available - result.reduce((sum, value) => sum + value, 0)));
  let remaining = target;
  let pending = flex;
  // Freeze only the constraints that prevent the current allocation from fitting.
  // Freezing both lower and upper violations at once can over-allocate the viewport.
  while (pending.length) {
    const maxWeight = Math.max(...pending.map(index => columns[index].flex!));
    const weights = pending.map(index => columns[index].flex! / maxWeight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const shares = pending.map((index, offset) => {
      const ideal = remaining * weights[offset] / totalWeight;
      return {index, ideal, value: Math.max(bounds[index].min, Math.min(bounds[index].max, ideal))};
    });
    const clampedTotal = shares.reduce((sum, share) => sum + share.value, 0);
    const constrained = shares.filter(share => clampedTotal > remaining
      ? share.ideal < bounds[share.index].min : share.ideal > bounds[share.index].max);
    if (!constrained.length) {
      for (const share of shares) result[share.index] = share.value;
      break;
    }
    const frozen = new Set(constrained.map(share => share.index));
    for (const share of constrained) {
      result[share.index] = share.value;
      remaining -= share.value;
    }
    pending = pending.filter(index => !frozen.has(index));
  }

  // Preserve the total in whole CSS pixels so fractional flex shares never create
  // a one-pixel horizontal scrollbar in an otherwise fitting table.
  const remainderOrder = [...flex].sort((a, b) => (result[b] % 1) - (result[a] % 1));
  let remainder = target - flex.reduce((sum, index) => sum + Math.floor(result[index]), 0);
  for (const index of flex) result[index] = Math.floor(result[index]);
  for (const index of remainderOrder) if (remainder > 0 && result[index] < bounds[index].max) {
    result[index] += 1;
    remainder -= 1;
  }
  return result;
}
