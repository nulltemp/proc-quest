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
import type { GameState, GameCommand, ItemType } from '../src/game/index.js';

const mapContainer = document.querySelector<HTMLDivElement>('#map-container')!;
const legend = document.querySelector<HTMLUListElement>('#legend')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const seedDisplay = document.querySelector<HTMLSpanElement>('#seed-display')!;
const regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!;
const randomBtn = document.querySelector<HTMLButtonElement>('#random-btn')!;
const banner = document.querySelector<HTMLDivElement>('#banner')!;
const statusPanel = document.querySelector<HTMLDivElement>('#status-panel')!;
const actionsPanel = document.querySelector<HTMLDivElement>('#actions-panel')!;
const logPanel = document.querySelector<HTMLUListElement>('#log-panel')!;

let map: GeneratedMap;
let gameState: GameState;

for (const type of Object.values(NODE_TYPES)) {
  const item = document.createElement('li');
  item.innerHTML = `<span class="swatch node-${type}"></span>${type}`;
  legend.appendChild(item);
}

function regenerate(seed?: number): void {
  map = generateMap(seed !== undefined ? { seed } : {});
  gameState = createInitialState(map, { seed: map.config.seed });

  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = `Reproduce with: node dist/index.js ${map.config.seed}`;

  const url = new URL(location.href);
  url.searchParams.set('seed', String(map.config.seed));
  history.replaceState(null, '', url);

  logPanel.replaceChildren();
  banner.className = '';
  banner.textContent = '';

  renderGame();
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

  renderActions();
}

function runCommand(command: GameCommand): void {
  if (gameState.status !== 'ongoing') return;
  gameState = advanceTurn(map, gameState, command);
  renderGame();
}

function renderActions(): void {
  actionsPanel.replaceChildren();
  if (gameState.status !== 'ongoing') return;

  const restBtn = document.createElement('button');
  restBtn.type = 'button';
  restBtn.textContent = 'Rest';
  restBtn.addEventListener('click', () => runCommand({ type: 'rest' }));
  actionsPanel.appendChild(restBtn);

  for (const [itemType, count] of Object.entries(gameState.factions.player.inventory)) {
    if (!count) continue;
    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.textContent = `Use ${itemType} (${count})`;
    useBtn.addEventListener('click', () =>
      runCommand({ type: 'useItem', itemType: itemType as ItemType }),
    );
    actionsPanel.appendChild(useBtn);
  }
}

regenerateBtn.addEventListener('click', () => {
  const seed = Number(seedInput.value);
  regenerate(Number.isFinite(seed) ? seed : undefined);
});

randomBtn.addEventListener('click', () => regenerate());

mapContainer.addEventListener('click', (event) => {
  if (gameState.status !== 'ongoing') return;

  const target = (event.target as Element).closest('.node');
  if (!target) return;

  const targetNodeId = Number(target.getAttribute('data-id'));
  if (!Number.isInteger(targetNodeId)) return;

  runCommand({ type: 'move', targetNodeId });
});

const initialSeedParam = new URLSearchParams(location.search).get('seed');
const initialSeed = initialSeedParam !== null ? Number(initialSeedParam) : undefined;
regenerate(Number.isFinite(initialSeed as number) ? initialSeed : undefined);
