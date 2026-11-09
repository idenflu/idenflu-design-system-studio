import * as React from 'react';

export function useFormReset(ref: React.RefObject<HTMLElement | null>, reset: () => void) {
  const latest = React.useRef(reset);
  latest.current = reset;
  React.useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    let active = true;
    const handler = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) latest.current(); }); };
    form.addEventListener('reset', handler);
    return () => { active = false; form.removeEventListener('reset', handler); };
  }, [ref]);
}
