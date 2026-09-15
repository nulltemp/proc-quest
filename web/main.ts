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

const appTitle = document.querySelector<HTMLHeadingElement>('#app-title')!;
const seedLabel = document.querySelector<HTMLLabelElement>('#seed-label')!;
const mapContainer = document.querySelector<HTMLDivElement>('#map-container')!;
const legend = document.querySelector<HTMLUListElement>('#legend')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const seedDisplay = document.querySelector<HTMLSpanElement>('#seed-display')!;
const regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!;
const randomBtn = document.querySelector<HTMLButtonElement>('#random-btn')!;
const langLabel = document.querySelector<HTMLLabelElement>('#lang-label')!;
const langSelect = document.querySelector<HTMLSelectElement>('#lang-select')!;
const logHeading = document.querySelector<HTMLHeadingElement>('#log-heading')!;
const banner = document.querySelector<HTMLDivElement>('#banner')!;
const statusPanel = document.querySelector<HTMLDivElement>('#status-panel')!;
const logPanel = document.querySelector<HTMLUListElement>('#log-panel')!;

let map: GeneratedMap;
let gameState: GameState;
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

function applyStaticLabels(): void {
  const t = getMessages(locale);
  appTitle.textContent = t.web.title;
  document.title = t.web.title;
  seedLabel.textContent = t.web.seedLabel;
  regenerateBtn.textContent = t.web.regenerate;
  randomBtn.textContent = t.web.randomSeed;
  langLabel.textContent = t.web.langLabel;
  logHeading.textContent = t.web.log;
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
  map = generateMap(seed !== undefined ? { seed } : {});
  gameState = createInitialState(map, { seed: map.config.seed });

  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = t.cli.reproduce(map.config.seed);

  const url = new URL(location.href);
  url.searchParams.set('seed', String(map.config.seed));
  history.replaceState(null, '', url);

  logPanel.replaceChildren();
  banner.className = '';
  banner.textContent = '';

  renderGame();
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

langSelect.addEventListener('change', () => {
  locale = resolveLocale(langSelect.value);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
  applyStaticLabels();
  renderLegend();
  renderGame();
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

const initialSeedParam = new URLSearchParams(location.search).get('seed');
const initialSeed = initialSeedParam !== null ? Number(initialSeedParam) : undefined;
regenerate(Number.isFinite(initialSeed as number) ? initialSeed : undefined);
