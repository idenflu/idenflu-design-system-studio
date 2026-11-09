import * as React from 'react';

export function Slides({ slides, label = '슬라이드', initialIndex = 0 }: { slides: React.ReactNode[]; label?: string; initialIndex?: number }) {
  const [index, setIndex] = React.useState(initialIndex);
  const safe = Math.max(0, Math.min(index, slides.length - 1));
  if (!slides.length) return null;
  return <section className="slide-example" aria-label={label} aria-roledescription="슬라이드 모음"><div className="slide-index" aria-live="polite">{safe + 1} / {slides.length}</div><div className="slide-content">{slides[safe]}</div><div className="slide-actions"><button type="button" className="button button--outline button-inline" disabled={safe === 0} onClick={() => setIndex(safe - 1)}>이전</button><button type="button" className="button button--outline button-inline" disabled={safe === slides.length - 1} onClick={() => setIndex(safe + 1)}>다음</button></div></section>;
}
