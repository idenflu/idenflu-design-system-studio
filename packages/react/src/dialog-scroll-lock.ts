type ScrollLock = { count: number; restore: () => void; restorePosition: () => void };
const locks = new WeakMap<Document, ScrollLock>();

function preserveStyles(element: HTMLElement, properties: readonly string[]) {
  const values = properties.map(property => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)] as const);
  return () => {
    properties.forEach(property => element.style.removeProperty(property));
    values.forEach(([property, value, priority]) => { if (value) element.style.setProperty(property, value, priority); });
  };
}

/** Share a document lock across modal instances and restore only the styles we own. */
export function lockDialogScroll(document: Document) {
  let lock = locks.get(document);
  if (!lock) {
    const root = document.documentElement;
    const body = document.body;
    const win = document.defaultView;
    const x = win?.scrollX ?? 0, y = win?.scrollY ?? 0;
    const restorePosition = () => {
      if (win && (win.scrollX !== x || win.scrollY !== y)) win.scrollTo({left:x, top:y, behavior:'instant'});
    };
    const scrollbarWidth = Math.max(0, (win?.innerWidth ?? root.clientWidth) - root.clientWidth);
    const computed = win?.getComputedStyle(root);
    const overflow = ['overflow', 'overflow-x', 'overflow-y'];
    const restoreRoot = preserveStyles(root, [...overflow, 'scrollbar-gutter', 'padding-inline-end']);
    const restoreBody = body ? preserveStyles(body, overflow) : () => {};

    // Reserve an existing scrollbar's space, without adding a gutter to short pages.
    if (scrollbarWidth && !computed?.getPropertyValue('scrollbar-gutter').includes('stable')) {
      const padding = computed?.getPropertyValue('padding-inline-end') || '0px';
      root.style.setProperty('scrollbar-gutter', 'stable', 'important');
      if (root.style.getPropertyValue('scrollbar-gutter') !== 'stable') {
        root.style.setProperty('padding-inline-end', `calc(${padding} + ${scrollbarWidth}px)`, 'important');
      }
    }
    root.style.setProperty('overflow', 'hidden', 'important');
    body?.style.setProperty('overflow', 'hidden', 'important');
    lock = { count: 0, restore: () => { restoreRoot(); restoreBody(); restorePosition(); }, restorePosition };
    locks.set(document, lock);
  }
  lock.count++;
  const current = lock;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (--current.count === 0) {
      current.restore();
      locks.delete(document);
    }
  };
  return {release, restorePosition:current.restorePosition};
}
