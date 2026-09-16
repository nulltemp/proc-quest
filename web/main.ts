import { generateMap, NODE_TYPES } from '../src/map/index.js';
import type { GeneratedMap } from '../src/map/index.js';
import { renderMapToSvg } from './render.js';
import {
  createInitialState,
  advanceTurn,
  getAdjacentNodeIds,
  formatGameStatus,
  formatMoveOptions,
  formatTurnEvents,
} from '../src/game/index.js';
import type { GameState, GameCommand } from '../src/game/index.js';

const startScreen = document.querySelector<HTMLElement>('#start-screen')!;
const gameScreen = document.querySelector<HTMLElement>('#game-screen')!;
const startSizeInput = document.querySelector<HTMLInputElement>('#start-size-input')!;
const startSizeValue = document.querySelector<HTMLSpanElement>('#start-size-value')!;
const startSizeLabel = document.querySelector<HTMLSpanElement>('#start-size-label')!;
const startSeedInput = document.querySelector<HTMLInputElement>('#start-seed-input')!;
const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!;
const newGameBtn = document.querySelector<HTMLButtonElement>('#new-game-btn')!;

const mapContainer = document.querySelector<HTMLDivElement>('#map-container')!;
const legend = document.querySelector<HTMLUListElement>('#legend')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const seedDisplay = document.querySelector<HTMLSpanElement>('#seed-display')!;
const regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!;
const randomBtn = document.querySelector<HTMLButtonElement>('#random-btn')!;
const banner = document.querySelector<HTMLDivElement>('#banner')!;
const statusPanel = document.querySelector<HTMLDivElement>('#status-panel')!;
const logPanel = document.querySelector<HTMLUListElement>('#log-panel')!;

let map: GeneratedMap;
let gameState: GameState;
let nodeCount = 20;

for (const type of Object.values(NODE_TYPES)) {
  const item = document.createElement('li');
  item.innerHTML = `<span class="swatch node-${type}"></span>${type}`;
  legend.appendChild(item);
}

// Default map config uses nodeCount 20 in a 100x100 area; scale width/height
// with sqrt(nodeCount) so node density (and therefore min-spacing feasibility)
// stays roughly constant as the player picks a larger or smaller map.
function sizeLabelFor(count: number): string {
  if (count < 20) return 'Small';
  if (count < 45) return 'Medium';
  return 'Large';
}

function updateStartSizeDisplay(): void {
  const count = Number(startSizeInput.value);
  startSizeValue.textContent = String(count);
  startSizeLabel.textContent = sizeLabelFor(count);
}

function regenerate(seed?: number): void {
  const side = Math.round(100 * Math.sqrt(nodeCount / 20));
  map = generateMap({ nodeCount, width: side, height: side, ...(seed !== undefined ? { seed } : {}) });
  gameState = createInitialState(map, { seed: map.config.seed });

  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = `Reproduce with: node dist/index.js ${map.config.seed}`;

  const url = new URL(location.href);
  url.searchParams.set('seed', String(map.config.seed));
  url.searchParams.set('size', String(nodeCount));
  history.replaceState(null, '', url);

  logPanel.replaceChildren();
  banner.className = '';
  banner.textContent = '';

  renderGame();
}

function startGame(): void {
  nodeCount = Number(startSizeInput.value);
  const seedValue = Number(startSeedInput.value);
  regenerate(startSeedInput.value !== '' && Number.isFinite(seedValue) ? seedValue : undefined);

  startScreen.hidden = true;
  gameScreen.hidden = false;
}

function backToStartScreen(): void {
  gameScreen.hidden = true;
  startScreen.hidden = false;
}

function renderGame(): void {
  const reachableNodeIds = gameState.status === 'ongoing'
    ? getAdjacentNodeIds(map, gameState.currentNodeId)
    : [];

  mapContainer.replaceChildren(
    renderMapToSvg(map, { currentNodeId: gameState.currentNodeId, reachableNodeIds }),
  );

  statusPanel.textContent = gameState.status === 'ongoing'
    ? `${formatGameStatus(map, gameState)}\nMove to: ${formatMoveOptions(map, gameState.currentNodeId)}`
    : formatGameStatus(map, gameState);

  if (gameState.turnNumber > 0) {
    const entry = document.createElement('li');
    entry.textContent = `Turn ${gameState.turnNumber}:\n${formatTurnEvents(gameState.lastTurnEvents)}`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  if (gameState.status === 'won') {
    banner.className = 'visible banner-won';
    banner.textContent = 'You defeated the enemy boss! Victory!';
  } else if (gameState.status === 'lost') {
    banner.className = 'visible banner-lost';
    banner.textContent = 'Your faction has been depleted. Game over.';
  }
}

regenerateBtn.addEventListener('click', () => {
  const seed = Number(seedInput.value);
  regenerate(Number.isFinite(seed) ? seed : undefined);
});

randomBtn.addEventListener('click', () => regenerate());

newGameBtn.addEventListener('click', () => backToStartScreen());

startSizeInput.addEventListener('input', () => updateStartSizeDisplay());

startBtn.addEventListener('click', () => startGame());

mapContainer.addEventListener('click', (event) => {
  if (gameState.status !== 'ongoing') return;

  const target = (event.target as Element).closest('.node');
  if (!target) return;

  const targetNodeId = Number(target.getAttribute('data-id'));
  if (!Number.isInteger(targetNodeId)) return;

  const command: GameCommand = { type: 'move', targetNodeId };
  gameState = advanceTurn(map, gameState, command);
  renderGame();
});

const initialParams = new URLSearchParams(location.search);
const initialSeedParam = initialParams.get('seed');
const initialSizeParam = initialParams.get('size');

if (initialSeedParam !== null) startSeedInput.value = initialSeedParam;
if (initialSizeParam !== null && Number.isFinite(Number(initialSizeParam))) {
  startSizeInput.value = initialSizeParam;
}
updateStartSizeDisplay();
