import { generateMap, NODE_TYPES } from '../src/map/index.js';
import { renderMapToSvg } from './render.js';

const mapContainer = document.querySelector<HTMLDivElement>('#map-container')!;
const legend = document.querySelector<HTMLUListElement>('#legend')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const seedDisplay = document.querySelector<HTMLSpanElement>('#seed-display')!;
const regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!;
const randomBtn = document.querySelector<HTMLButtonElement>('#random-btn')!;

for (const type of Object.values(NODE_TYPES)) {
  const item = document.createElement('li');
  item.innerHTML = `<span class="swatch node-${type}"></span>${type}`;
  legend.appendChild(item);
}

function regenerate(seed?: number): void {
  const map = generateMap(seed !== undefined ? { seed } : {});

  mapContainer.replaceChildren(renderMapToSvg(map));
  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = `Reproduce with: node dist/index.js ${map.config.seed}`;

  const url = new URL(location.href);
  url.searchParams.set('seed', String(map.config.seed));
  history.replaceState(null, '', url);
}

regenerateBtn.addEventListener('click', () => {
  const seed = Number(seedInput.value);
  regenerate(Number.isFinite(seed) ? seed : undefined);
});

randomBtn.addEventListener('click', () => regenerate());

const initialSeedParam = new URLSearchParams(location.search).get('seed');
const initialSeed = initialSeedParam !== null ? Number(initialSeedParam) : undefined;
regenerate(Number.isFinite(initialSeed as number) ? initialSeed : undefined);
