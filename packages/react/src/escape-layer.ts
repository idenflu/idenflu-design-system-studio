import * as React from 'react';

const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
type Layer = { element: HTMLElement; dismiss: () => void };
type Layers = { entries: Layer[]; handle: (event: KeyboardEvent) => void };
const documents = new WeakMap<Document, Layers>();

/** One Escape handler per document keeps nested and independently opened layers in order. */
function register(layer: Layer) {
  const document = layer.element.ownerDocument;
  let layers = documents.get(document);
  if (!layers) {
    const entries: Layer[] = [];
    const handle = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      const top = [...entries].reverse().find(entry => entry.element.isConnected && !entry.element.closest('[hidden], [inert], dialog:not([open])'));
      if (!top) return;
      event.preventDefault();
      event.stopPropagation();
      top.dismiss();
    };
    layers = { entries, handle };
    documents.set(document, layers);
    document.addEventListener('keydown', handle);
  }
  // Child layout effects run before parents when both mount open. Preserve nesting
  // without changing the opening order of unrelated layers.
  const children = layers.entries.filter(entry => layer.element.contains(entry.element));
  children.forEach(child => layers.entries.splice(layers.entries.indexOf(child), 1));
  layers.entries.push(layer, ...children);
  return () => {
    const index = layers.entries.indexOf(layer);
    if (index >= 0) layers.entries.splice(index, 1);
    if (!layers.entries.length) {
      document.removeEventListener('keydown', layers.handle);
      documents.delete(document);
    }
  };
}

export function useEscapeLayer(open: boolean, ref: React.RefObject<HTMLElement | null>, dismiss: () => void) {
  const latest = React.useRef(dismiss);
  latest.current = dismiss;
  useClientLayoutEffect(() => {
    if (!open || !ref.current) return;
    return register({ element: ref.current, dismiss: () => latest.current() });
  }, [open, ref]);
  return () => {
    const element = ref.current;
    const entries = element && documents.get(element.ownerDocument)?.entries;
    return Boolean(element && entries?.[entries.length - 1]?.element === element);
  };
}
