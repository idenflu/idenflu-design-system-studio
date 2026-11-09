import * as React from 'react';
import { classes } from '../../shared/classes';

/** Canonical SVG filenames and the original public aliases. Filled variants use the -fill suffix. */
export type IconName =
  | 'add' | 'archive' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'arrow-up'
  | 'attachment' | 'ban' | 'ban-fill' | 'bell' | 'bell-fill' | 'bookmark'
  | 'bookmark-fill' | 'briefcase' | 'briefcase-fill' | 'calendar' | 'calendar-fill' | 'camera'
  | 'camera-fill' | 'caret' | 'cart' | 'cart-fill' | 'chart-bar' | 'chart-line'
  | 'chat' | 'chat-fill' | 'check' | 'check-circle' | 'check-circle-fill' | 'circle-dashed'
  | 'circle-dot' | 'clock' | 'clock-fill' | 'close' | 'columns' | 'copy'
  | 'credit-card' | 'credit-card-fill' | 'crown' | 'dashboard' | 'dashboard-fill' | 'download'
  | 'drag-handle' | 'edit' | 'email' | 'error-circle' | 'error-circle-fill' | 'external-link'
  | 'eye' | 'eye-off' | 'eye-slash' | 'file' | 'file-fill' | 'file-text'
  | 'filter' | 'filter-clear' | 'folder' | 'folder-fill' | 'folder-open' | 'globe'
  | 'grid' | 'grid-fill' | 'heart' | 'heart-fill' | 'help-circle' | 'help-circle-fill'
  | 'hierarchy' | 'home' | 'home-fill' | 'id-card' | 'image' | 'image-fill'
  | 'info' | 'info-fill' | 'key' | 'keyboard-arrow-down' | 'keyboard-arrow-left' | 'keyboard-arrow-right'
  | 'keyboard-arrow-up' | 'link' | 'list' | 'location' | 'location-fill' | 'lock'
  | 'lock-fill' | 'login' | 'logout' | 'mail' | 'mail-fill' | 'maximize'
  | 'menu' | 'microsoft-excel' | 'minimize' | 'minus-circle' | 'moon' | 'more-horizontal'
  | 'more-vertical' | 'pause-circle' | 'person' | 'person-fill' | 'pin' | 'pin-off'
  | 'play' | 'play-fill' | 'plus' | 'printer' | 'receipt' | 'receipt-fill'
  | 'redo' | 'refresh' | 'remove' | 'save' | 'search' | 'send'
  | 'send-fill' | 'settings' | 'share' | 'shield' | 'shield-alert' | 'shield-check'
  | 'shield-check-fill' | 'shield-off' | 'sliders' | 'sort' | 'sort-ascending' | 'sort-descending'
  | 'star' | 'star-fill' | 'sun' | 'tag' | 'tag-fill' | 'trash'
  | 'trash-2' | 'undo' | 'unlock' | 'upload' | 'user-check' | 'user-lock'
  | 'user-minus' | 'user-plus' | 'user-settings' | 'users' | 'users-fill' | 'visibility'
  | 'visibility-fill' | 'warning' | 'warning-fill';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> { name: IconName }

export function Icon({ name, className, ...props }: IconProps) { return <span {...props} aria-hidden="true" className={classes('ui-icon', `icon-${name}`, className)} />; }
