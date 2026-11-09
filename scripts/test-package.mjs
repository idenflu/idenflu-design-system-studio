import { verifyInstalledPackage } from './package-consumer.mjs';

await verifyInstalledPackage({
  reactVersion: process.argv.find(value => value.startsWith('--react='))?.slice('--react='.length),
  build: !process.argv.includes('--skip-build'),
});
