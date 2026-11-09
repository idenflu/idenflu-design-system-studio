import { verifyInstalledPackage } from './package-consumer.mjs';

const version = process.argv.find(value => value.startsWith('--react='))?.slice('--react='.length);
if (!version) throw new Error('사용법: node scripts/test-react-compat.mjs --react=18.3.1');
// The CI matrix builds once, then validates each peer version against a real
// npm-packed installation, including types, CSS assets and SSR/hydration.
await verifyInstalledPackage({ reactVersion: version });
