import * as React from 'react';

export interface NovaSpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: number;
  appearance?: 'orbit' | 'mark';
  variant?: 'brand' | 'neutral' | 'inverse';
  label?: string;
  speed?: number;
}

/** Animated NOVA Studio mark, using the original icon.svg geometry and palette. */
export function NovaSpinner({ size = 48, appearance = 'orbit', variant = 'brand', label = '로딩 중', speed, className = '', style, ...props }: NovaSpinnerProps) {
  const dimension = Number.isFinite(size) && size > 0 ? size : 48;
  const duration = speed !== undefined && Number.isFinite(speed) && speed > 0 ? `${speed}ms` : undefined;
  return <span role="status" aria-label={label} {...props}
    className={`nova-spinner nova-spinner--${appearance} nova-spinner--${variant} ${className}`}
    style={{'--nova-spinner-size':`${dimension}px`, '--spinner-duration':duration, ...style} as React.CSSProperties}>
    <svg viewBox="0 0 108 108" fill="none" aria-hidden="true" focusable="false">
      {appearance === 'orbit' && <>
        <circle className="nova-spinner__track" cx="54" cy="54" r="50" />
        <g className="nova-spinner__orbit"><circle cx="54" cy="54" r="50" strokeDasharray="56 258.16" strokeLinecap="round" /></g>
      </>}
      <g transform={appearance === 'orbit' ? 'translate(20.52 20.52) scale(0.62)' : undefined}>
        <g transform="translate(11.5 6)">
          <path className="nova-spinner__facet nova-spinner__facet--left" d="M0 10.6667L21.25 0V85.3333L0 96V10.6667Z" fill="#6393E1" />
          <path className="nova-spinner__facet nova-spinner__facet--diagonal" d="M0 10.6667L21.25 0L85 85.3333L63.75 96L0 10.6667Z" fill="#266EE1" />
          <path className="nova-spinner__facet nova-spinner__facet--right" d="M63.75 10.6667L85 0V85.3333L63.75 96V10.6667Z" fill="#0F54BB" />
        </g>
      </g>
    </svg>
  </span>;
}
