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
import { resolveLocale, getMessages, type Locale } from '../src/i18n/index.js';

const LANG_STORAGE_KEY = 'proc-quest-lang';

const langLabel = document.querySelector<HTMLLabelElement>('#lang-label')!;
const langSelect = document.querySelector<HTMLSelectElement>('#lang-select')!;

const startScreen = document.querySelector<HTMLElement>('#start-screen')!;
const gameScreen = document.querySelector<HTMLElement>('#game-screen')!;
const startTitle = document.querySelector<HTMLHeadingElement>('#start-title')!;
const startSubtitle = document.querySelector<HTMLParagraphElement>('#start-subtitle')!;
const startSizeFieldLabel = document.querySelector<HTMLLabelElement>('#start-size-field-label')!;
const startSizeInput = document.querySelector<HTMLInputElement>('#start-size-input')!;
const startSeedFieldLabel = document.querySelector<HTMLLabelElement>('#start-seed-field-label')!;
const startSeedInput = document.querySelector<HTMLInputElement>('#start-seed-input')!;
const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!;
const newGameBtn = document.querySelector<HTMLButtonElement>('#new-game-btn')!;

const appTitle = document.querySelector<HTMLHeadingElement>('#app-title')!;
const seedLabel = document.querySelector<HTMLLabelElement>('#seed-label')!;
const mapContainer = document.querySelector<HTMLDivElement>('#map-container')!;
const legend = document.querySelector<HTMLUListElement>('#legend')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const seedDisplay = document.querySelector<HTMLSpanElement>('#seed-display')!;
const regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!;
const randomBtn = document.querySelector<HTMLButtonElement>('#random-btn')!;
const logHeading = document.querySelector<HTMLHeadingElement>('#log-heading')!;
const banner = document.querySelector<HTMLDivElement>('#banner')!;
const statusPanel = document.querySelector<HTMLDivElement>('#status-panel')!;
const logPanel = document.querySelector<HTMLUListElement>('#log-panel')!;

let map: GeneratedMap;
let gameState: GameState;
let nodeCount = 20;
let locale: Locale = resolveLocale(
  (() => {
    try {
      return localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      return null;
    }
  })() ?? navigator.language,
);

langSelect.value = locale;

// Default map config uses nodeCount 20 in a 100x100 area; scale width/height
// with sqrt(nodeCount) so node density (and therefore min-spacing feasibility)
// stays roughly constant as the player picks a larger or smaller map.
function sizeLabelFor(count: number): string {
  const t = getMessages(locale);
  if (count < 20) return t.web.sizeSmall;
  if (count < 45) return t.web.sizeMedium;
  return t.web.sizeLarge;
}

function updateStartSizeDisplay(): void {
  const t = getMessages(locale);
  const count = Number(startSizeInput.value);
  startSizeFieldLabel.textContent = t.web.mapSizeLabel(count, sizeLabelFor(count));
}

function applyStaticLabels(): void {
  const t = getMessages(locale);
  document.title = t.web.title;
  langLabel.textContent = t.web.langLabel;
  startTitle.textContent = t.web.startTitle;
  startSubtitle.textContent = t.web.startSubtitle;
  startSeedFieldLabel.textContent = t.web.seedOptionalLabel;
  startSeedInput.placeholder = t.web.seedPlaceholder;
  startBtn.textContent = t.web.startButton;
  newGameBtn.textContent = t.web.newGameButton;
  appTitle.textContent = t.web.title;
  seedLabel.textContent = t.web.seedLabel;
  regenerateBtn.textContent = t.web.regenerate;
  randomBtn.textContent = t.web.randomSeed;
  logHeading.textContent = t.web.log;
  updateStartSizeDisplay();
}

function renderLegend(): void {
  const t = getMessages(locale);
  legend.replaceChildren();
  for (const type of Object.values(NODE_TYPES)) {
    const item = document.createElement('li');
    item.innerHTML = `<span class="swatch node-${type}"></span>${t.nodeType[type]}`;
    legend.appendChild(item);
  }
}

function regenerate(seed?: number): void {
  const t = getMessages(locale);
  const side = Math.round(100 * Math.sqrt(nodeCount / 20));
  map = generateMap({ nodeCount, width: side, height: side, ...(seed !== undefined ? { seed } : {}) });
  gameState = createInitialState(map, { seed: map.config.seed });

  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = t.cli.reproduce(map.config.seed);

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
  const t = getMessages(locale);
  const reachableNodeIds = gameState.status === 'ongoing'
    ? getAdjacentNodeIds(map, gameState.currentNodeId)
    : [];

  mapContainer.replaceChildren(
    renderMapToSvg(map, { currentNodeId: gameState.currentNodeId, reachableNodeIds }, locale),
  );

  statusPanel.textContent = gameState.status === 'ongoing'
    ? `${formatGameStatus(map, gameState, locale)}\n${t.game.moveTo(formatMoveOptions(map, gameState.currentNodeId, locale))}`
    : formatGameStatus(map, gameState, locale);

  if (gameState.turnNumber > 0) {
    const entry = document.createElement('li');
    entry.textContent = `${t.web.turnLog(gameState.turnNumber)}\n${formatTurnEvents(gameState.lastTurnEvents, locale)}`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  if (gameState.status === 'won') {
    banner.className = 'visible banner-won';
    banner.textContent = t.cli.victory;
  } else if (gameState.status === 'lost') {
    banner.className = 'visible banner-lost';
    banner.textContent = t.cli.gameOver;
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

langSelect.addEventListener('change', () => {
  locale = resolveLocale(langSelect.value);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
  applyStaticLabels();
  renderLegend();
  if (!gameScreen.hidden) renderGame();
});

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

applyStaticLabels();
renderLegend();

const initialParams = new URLSearchParams(location.search);
const initialSeedParam = initialParams.get('seed');
const initialSizeParam = initialParams.get('size');

if (initialSeedParam !== null) startSeedInput.value = initialSeedParam;
if (initialSizeParam !== null && Number.isFinite(Number(initialSizeParam))) {
  startSizeInput.value = initialSizeParam;
}
updateStartSizeDisplay();
