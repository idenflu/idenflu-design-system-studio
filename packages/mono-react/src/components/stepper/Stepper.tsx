import * as React from 'react';
import { classes } from '../../shared/classes';

export interface StepperProps extends React.OlHTMLAttributes<HTMLOListElement> {
  steps: readonly React.ReactNode[];
  currentStep: number;
}

/** currentStep is zero-based. */
export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
  return <ol {...props} className={classes('stepper', className)}>{steps.map((step, index) => <li key={index} aria-current={index === currentStep ? 'step' : undefined} className={classes(index === currentStep && 'is-current', index < currentStep && 'is-complete')}><span className="step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}</ol>;
}
