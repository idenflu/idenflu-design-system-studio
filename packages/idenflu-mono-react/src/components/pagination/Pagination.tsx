import * as React from 'react';
import { classes } from '../../shared/classes';

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number) => string;
}

export function Pagination({ page, pageCount, onPageChange, previousLabel = '이전', nextLabel = '다음', pageLabel = (number) => `${number}페이지`, className, 'aria-label': ariaLabel = '페이지 탐색', ...props }: PaginationProps) {
  const count = Math.max(1, Number.isFinite(pageCount) ? Math.floor(pageCount) : 1);
  const current = Math.min(count, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  const visible = Array.from(new Set([1, count, current - 1, current, current + 1].filter((number) => number >= 1 && number <= count))).sort((a, b) => a - b);
  return <nav {...props} aria-label={ariaLabel} className={classes('pagination', className)}>
    <button className="page-button" type="button" disabled={current === 1} onClick={() => onPageChange(current - 1)}>{previousLabel}</button>
    {visible.map((number, index) => <React.Fragment key={number}>
      {index > 0 && number - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}
      <button className="page-button" type="button" aria-current={number === current ? 'page' : undefined} aria-label={pageLabel(number)} onClick={() => onPageChange(number)}>{number}</button>
    </React.Fragment>)}
    <button className="page-button" type="button" disabled={current === count} onClick={() => onPageChange(current + 1)}>{nextLabel}</button>
  </nav>;
}
