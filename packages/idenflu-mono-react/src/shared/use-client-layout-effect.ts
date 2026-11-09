import * as React from 'react';

export const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
