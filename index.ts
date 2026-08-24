import { generateMap, formatMapAsText, formatMapAsAscii } from './src/map/index.js';

function main(): void {
  const seedArg = process.argv[2];
  const overrides = seedArg !== undefined ? { seed: Number(seedArg) } : {};
  const map = generateMap(overrides);

  console.log(formatMapAsText(map));
  console.log();
  console.log(formatMapAsAscii(map));
  console.log();
  console.log(`Reproduce with: node dist/index.js ${map.config.seed}`);
}

main();
