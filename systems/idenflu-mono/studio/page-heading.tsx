import * as React from 'react';

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** The page or section heading. */
  title: React.ReactNode;
  /** Supporting content below the heading. */
  description?: React.ReactNode;
  /** Optional context above the heading, such as a product area or identifier. */
  eyebrow?: React.ReactNode;
  /** Actions stay after the heading content in DOM and keyboard order. */
  actions?: React.ReactNode;
  /** Heading semantics only; all levels retain the same page-header appearance. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** ID of the heading element, distinct from the header's native id. */
  titleId?: string;
}

/** Example project-owned page heading used by Studio layouts. */
export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(function PageHeader({
  title, description, eyebrow, actions, headingLevel = 1, titleId, className = '',
  'aria-label': ariaLabel, 'aria-labelledby': labelledBy, ...props
}, ref) {
  const generated = React.useId();
  const headingId = titleId || `page-header-${generated}`;
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const hasContent = (content: React.ReactNode) => content != null && typeof content !== 'boolean' && content !== '';
  return <header {...props} ref={ref} className={`page-header${className ? ` ${className}` : ''}`}
    aria-label={ariaLabel} aria-labelledby={labelledBy ?? (ariaLabel == null ? headingId : undefined)}>
    <div className="page-header-content">
      {hasContent(eyebrow) && <div className="page-header-eyebrow">{eyebrow}</div>}
      <Heading id={headingId} className="page-header-title">{title}</Heading>
      {hasContent(description) && <div className="page-header-description">{description}</div>}
    </div>
    {hasContent(actions) && <div className="page-header-actions">{actions}</div>}
  </header>;
});
