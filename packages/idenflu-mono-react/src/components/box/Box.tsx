import * as React from 'react';

const stylePropNames = [
  'boxSizing',
  'display',
  'width', 'minWidth', 'maxWidth',
  'height', 'minHeight', 'maxHeight',
  'margin', 'marginBlock', 'marginInline',
  'padding', 'paddingBlock', 'paddingInline',
  'gap', 'rowGap', 'columnGap',
  'alignItems', 'alignSelf', 'justifyContent', 'justifyItems', 'justifySelf',
  'flex', 'flexBasis', 'flexDirection', 'flexGrow', 'flexShrink', 'flexWrap',
  'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow',
  'backgroundColor', 'color', 'border', 'borderRadius',
  'overflow', 'overflowX', 'overflowY',
] as const satisfies readonly (keyof React.CSSProperties)[];

const spacingAliases = {
  pt: 'paddingTop',
  pb: 'paddingBottom',
  pr: 'paddingRight',
  pl: 'paddingLeft',
  mt: 'marginTop',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mr: 'marginRight',
} as const satisfies Record<string, keyof React.CSSProperties>;

type SpacingAlias = keyof typeof spacingAliases;
type BoxStyleProps = Pick<React.CSSProperties, (typeof stylePropNames)[number]> & {
  [Alias in SpacingAlias]?: React.CSSProperties[(typeof spacingAliases)[Alias]];
};
type BoxTag = keyof HTMLElementTagNameMap & keyof React.JSX.IntrinsicElements;

export type BoxProps<Tag extends BoxTag = 'div'> =
  BoxStyleProps &
  Omit<React.ComponentPropsWithRef<Tag>, keyof BoxStyleProps> &
  (Tag extends 'div' ? { as?: Tag } : { as: Tag });

/**
 * A container that applies CSS props as inline styles and defaults to a div.
 * Explicit style entries take precedence over the corresponding CSS props.
 */
export const Box = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & BoxStyleProps & { as?: BoxTag }>(
  function Box({ as: Tag = 'div', style, ...domProps }, ref) {
    const boxStyle: React.CSSProperties = {};
    for (const name of stylePropNames) {
      if (name in domProps) {
        Object.assign(boxStyle, { [name]: domProps[name] });
        delete domProps[name];
      }
    }
    for (const alias of Object.keys(spacingAliases) as SpacingAlias[]) {
      if (alias in domProps) {
        boxStyle[spacingAliases[alias]] = domProps[alias];
        delete domProps[alias];
      }
    }
    return React.createElement(Tag, { ...domProps, ref, style: { ...boxStyle, ...style } });
  },
) as {
  <Tag extends BoxTag>(props: BoxProps<Tag> & { as: Tag }): React.ReactElement | null;
  (props: BoxProps): React.ReactElement | null;
};
