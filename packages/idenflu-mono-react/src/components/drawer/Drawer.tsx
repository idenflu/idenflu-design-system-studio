import * as React from 'react';
import { type DialogProps, Dialog, DialogHeader, DialogBody, DialogFooter } from '../dialog/Dialog';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export type DrawerProps = DialogProps & {
  /** Physical edge from which the panel opens. */
  side?: DrawerSide;
  /** Width for left/right, height for top/bottom. Numbers are pixels. */
  size?: DrawerSize | number;
};

/** Edge-aligned modal. Use divided sections to keep actions outside the scroll area. */
export function Drawer({ className = '', closeOnBackdrop = true, side = 'right', size = 'md', style, ...props }: DrawerProps) {
  const customSize = typeof size === 'number' ? { '--drawer-size': `${size}px` } : undefined;
  return <Dialog {...props} closeOnBackdrop={closeOnBackdrop} data-side={side} data-drawer-size={typeof size === 'number' ? undefined : size}
    style={{ ...customSize, ...style }} className={`demo-drawer drawer${className ? ` ${className}` : ''}`} />;
}

export const DrawerHeader = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DrawerHeader({className = '', ...props}, ref) {
  return <DialogHeader {...props} ref={ref} className={`drawer-header${className ? ` ${className}` : ''}`} />;
});

export const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function DrawerBody({className = '', ...props}, ref) {
  return <DialogBody {...props} ref={ref} className={`drawer-body${className ? ` ${className}` : ''}`} />;
});

export const DrawerFooter = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DrawerFooter({className = '', ...props}, ref) {
  return <DialogFooter {...props} ref={ref} className={`drawer-footer${className ? ` ${className}` : ''}`} />;
});
