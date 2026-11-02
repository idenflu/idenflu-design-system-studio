import * as React from 'react';

interface ChipAppearance {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  rounded?: boolean;
}
export interface InteractiveChipProps extends ChipAppearance, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  interactive?: true;
}
export interface StaticChipProps extends ChipAppearance, Omit<React.HTMLAttributes<HTMLSpanElement>, 'onClick' | 'onClickCapture' | 'tabIndex' | 'aria-pressed'> {
  interactive: false;
  density?: 'comfortable' | 'compact';
  onClick?: never;
  onClickCapture?: never;
  tabIndex?: never;
  'aria-pressed'?: never;
}
export type ChipProps = InteractiveChipProps | StaticChipProps;
interface ChipComponent {
  (props: StaticChipProps & React.RefAttributes<HTMLSpanElement>): React.ReactElement | null;
  (props: InteractiveChipProps & React.RefAttributes<HTMLButtonElement>): React.ReactElement | null;
  displayName?: string;
}

export const Chip = React.forwardRef<HTMLButtonElement | HTMLSpanElement, ChipProps>(function Chip(props, ref) {
  const { variant = 'neutral', rounded = false, className } = props;
  const classes = ['chip', variant !== 'neutral' && `chip--colored chip--${variant}`, rounded && 'chip--rounded', props.interactive === false && 'chip--static', props.interactive === false && props.density === 'compact' && 'chip--compact', className].filter(Boolean).join(' ');
  if (props.interactive === false) {
    const { interactive, density, size, variant, rounded, className, onClick, onClickCapture, tabIndex, 'aria-pressed': pressed, ...attributes } = props;
    return <span {...attributes} ref={ref as React.ForwardedRef<HTMLSpanElement>} data-size={size} className={classes} />;
  } else {
    const { interactive, size, variant, rounded, className, type = 'button', ...attributes } = props;
    return <button {...attributes} ref={ref as React.ForwardedRef<HTMLButtonElement>} type={type} data-size={size} className={classes} />;
  }
}) as ChipComponent;
