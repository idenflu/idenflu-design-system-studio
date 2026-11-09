import type * as React from 'react';
import type { Size } from './types';

export type BaseField = { label: React.ReactNode; id?: string; name?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; size?: Size; helperText?: React.ReactNode; error?: string; className?: string; 'aria-describedby'?: string; 'aria-invalid'?: React.AriaAttributes['aria-invalid'] };
