import { generateMap, sizedMapConfig, NODE_TYPES } from '../src/map/index.js';
import type { GeneratedMap } from '../src/map/index.js';
import { renderMapToSvg } from './render.js';
import {
  startSession,
  applyCommand,
  replayTurns,
  serializeSave,
  parseSave,
  getAdjacentNodeIds,
  formatGameStatus,
  formatMoveOptions,
  formatTurnEvents,
} from '../src/game/index.js';
import type { GameState, GameCommand, GameSession, ItemType } from '../src/game/index.js';
import { resolveLocale, getMessages, type Locale } from '../src/i18n/index.js';

const LANG_STORAGE_KEY = 'proc-quest-lang';
const SAVE_STORAGE_KEY = 'proc-quest-save';

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
const continueBtn = document.querySelector<HTMLButtonElement>('#continue-btn')!;
const importBtn = document.querySelector<HTMLButtonElement>('#import-btn')!;
const importInput = document.querySelector<HTMLInputElement>('#import-input')!;
const startError = document.querySelector<HTMLParagraphElement>('#start-error')!;
const exportBtn = document.querySelector<HTMLButtonElement>('#export-btn')!;
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
const actionsPanel = document.querySelector<HTMLDivElement>('#actions-panel')!;
const logPanel = document.querySelector<HTMLUListElement>('#log-panel')!;
const nodeInfo = document.querySelector<HTMLDivElement>('#node-info')!;

let map: GeneratedMap;
let session: GameSession;
// The autosaved session from localStorage, offered via the start screen's
// Continue button; only kept while that game is still ongoing.
let savedSession: GameSession | undefined;
let nodeCount = 20;
let selectedNodeId: number | undefined;
// pointerType of the most recent pointerdown on the map, so a click can tell
// touch/pen taps apart from mouse clicks (click events don't reliably carry it).
let lastPointerType = 'mouse';
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
  importBtn.textContent = t.web.importSaveButton;
  exportBtn.textContent = t.web.exportSaveButton;
  updateContinueButton();
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

function readSavedSession(): GameSession | undefined {
  try {
    const json = localStorage.getItem(SAVE_STORAGE_KEY);
    const saved = json !== null ? parseSave(json) : undefined;
    return saved?.state.status === 'ongoing' ? saved : undefined;
  } catch {
    // unreadable storage or an incompatible/corrupt save: just don't offer Continue
    return undefined;
  }
}

function persistSession(): void {
  savedSession = session.state.status === 'ongoing' ? session : undefined;
  try {
    if (savedSession) localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(session));
    else localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore storage failures (e.g. private browsing, quota)
  }
}

function updateContinueButton(): void {
  continueBtn.hidden = savedSession === undefined;
  if (savedSession) {
    continueBtn.textContent = getMessages(locale).web.continueButton(
      savedSession.state.turnNumber,
      savedSession.map.config.seed,
    );
  }
}

function regenerate(seed?: number): void {
  map = generateMap({ ...sizedMapConfig(nodeCount), ...(seed !== undefined ? { seed } : {}) });
  session = startSession(map, { seed: map.config.seed });
  persistSession();
  showSession();
}

// Shared by new games and loaded saves: syncs the seed controls/URL to the
// current session and resets the per-game UI (log, banner, selection).
function showSession(): void {
  const t = getMessages(locale);
  seedInput.value = String(map.config.seed);
  seedDisplay.textContent = t.cli.reproduce(map.config.seed);

  const url = new URL(location.href);
  url.searchParams.set('seed', String(map.config.seed));
  url.searchParams.set('size', String(nodeCount));
  history.replaceState(null, '', url);

  logPanel.replaceChildren();
  selectedNodeId = undefined;
  banner.className = '';
  banner.textContent = '';

  renderGame();
}

function loadSession(loaded: GameSession): void {
  session = loaded;
  map = loaded.map;
  nodeCount = map.nodes.length;
  persistSession();
  showSession();

  // Rebuild the full turn log by replaying the recorded commands; if the turn
  // rules changed since the save was made the replay diverges, so fall back
  // to a single "resumed" line rather than showing a log that didn't happen.
  const states = replayTurns(map, loaded.initialState, loaded.commands);
  const replayMatches = JSON.stringify(states.at(-1) ?? loaded.initialState) === JSON.stringify(loaded.state);
  if (replayMatches) {
    for (const state of states) appendTurnLog(state);
  } else {
    const entry = document.createElement('li');
    entry.textContent = getMessages(locale).web.resumedLog(loaded.state.turnNumber);
    logPanel.appendChild(entry);
  }

  startScreen.hidden = true;
  gameScreen.hidden = false;
}

function exportSave(): void {
  const blob = new Blob([serializeSave(session)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `proc-quest-${map.config.seed}-turn${session.state.turnNumber}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importSave(file: File): Promise<void> {
  try {
    loadSession(parseSave(await file.text()));
    startError.textContent = '';
  } catch (error) {
    startError.textContent = getMessages(locale).web.importFailed(error instanceof Error ? error.message : String(error));
  }
}

function startGame(): void {
  nodeCount = Number(startSizeInput.value);
  const seedValue = Number(startSeedInput.value);
  regenerate(startSeedInput.value !== '' && Number.isFinite(seedValue) ? seedValue : undefined);

  startScreen.hidden = true;
  gameScreen.hidden = false;
}

function backToStartScreen(): void {
  updateContinueButton();
  startError.textContent = '';
  gameScreen.hidden = true;
  startScreen.hidden = false;
}

function renderGame(): void {
  const t = getMessages(locale);
  const reachableNodeIds = session.state.status === 'ongoing'
    ? getAdjacentNodeIds(map, session.state.currentNodeId)
    : [];

  mapContainer.replaceChildren(
    renderMapToSvg(map, { currentNodeId: session.state.currentNodeId, reachableNodeIds, clearedNodeIds: session.state.clearedNodeIds }, locale),
  );

  statusPanel.textContent = session.state.status === 'ongoing'
    ? `${formatGameStatus(map, session.state, locale)}\n${t.game.moveTo(formatMoveOptions(map, session.state.currentNodeId, locale))}`
    : formatGameStatus(map, session.state, locale);

  if (session.state.status === 'won') {
    banner.className = 'visible banner-won';
    banner.textContent = t.cli.victory;
  } else if (session.state.status === 'lost') {
    banner.className = 'visible banner-lost';
    banner.textContent = t.cli.gameOver;
  }

  renderActions();
  renderNodeInfo();
}

// Touch devices have no hover, so the SVG <title> tooltips never show; the
// last tapped node's info is surfaced in a panel instead.
function renderNodeInfo(): void {
  const t = getMessages(locale);
  const node = selectedNodeId !== undefined ? map.nodes.find((n) => n.id === selectedNodeId) : undefined;
  if (!node) {
    nodeInfo.textContent = '';
    return;
  }
  const adjacent = getAdjacentNodeIds(map, session.state.currentNodeId).includes(node.id);
  const lines = [t.web.nodeInfo(node.id, t.nodeType[node.type])];
  if (session.state.status === 'ongoing' && node.id !== session.state.currentNodeId && !adjacent) {
    lines.push(t.web.notAdjacentHint);
  }
  nodeInfo.textContent = lines.join('\n');
}

function runCommand(command: GameCommand): void {
  if (session.state.status !== 'ongoing') return;
  session = applyCommand(session, command);
  persistSession();
  appendTurnLog(session.state);
  renderGame();
}

// Called once per advanced turn rather than from renderGame(), so re-rendering
// (e.g. on a language change) doesn't append the last turn's events again.
function appendTurnLog(state: GameState): void {
  const t = getMessages(locale);
  const entry = document.createElement('li');
  entry.textContent = `${t.web.turnLog(state.turnNumber)}\n${formatTurnEvents(state.lastTurnEvents, locale)}`;
  logPanel.appendChild(entry);
  logPanel.scrollTop = logPanel.scrollHeight;
}

function renderActions(): void {
  const t = getMessages(locale);
  actionsPanel.replaceChildren();
  if (session.state.status !== 'ongoing') return;

  const restBtn = document.createElement('button');
  restBtn.type = 'button';
  restBtn.textContent = t.web.restAction;
  restBtn.addEventListener('click', () => runCommand({ type: 'rest' }));
  actionsPanel.appendChild(restBtn);

  for (const [itemType, count] of Object.entries(session.state.factions.player.inventory)) {
    if (!count) continue;
    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.textContent = t.web.useItemAction(t.itemType[itemType as ItemType], count);
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

newGameBtn.addEventListener('click', () => backToStartScreen());

startSizeInput.addEventListener('input', () => updateStartSizeDisplay());

startBtn.addEventListener('click', () => startGame());

continueBtn.addEventListener('click', () => {
  if (savedSession) loadSession(savedSession);
});

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (file) void importSave(file);
});

exportBtn.addEventListener('click', () => exportSave());

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

mapContainer.addEventListener('pointerdown', (event) => {
  lastPointerType = event.pointerType || 'mouse';
});

// Rendered nodes are only a few px wide on a phone, so a tap resolves to the
// nearest node within half the generator's min spacing (non-overlapping for
// normally sampled points) rather than requiring a hit on the circle itself.
function findNodeAt(clientX: number, clientY: number): number | undefined {
  const svg = mapContainer.querySelector<SVGSVGElement>('svg');
  const ctm = svg?.getScreenCTM();
  if (!svg || !ctm) return undefined;
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  const x = pt.x;
  const y = map.config.height - pt.y;
  const maxDist = map.config.minDistance / 2;
  let best: number | undefined;
  let bestDist = Infinity;
  for (const node of map.nodes) {
    const d = Math.hypot(node.x - x, node.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = node.id;
    }
  }
  return bestDist <= maxDist ? best : undefined;
}

mapContainer.addEventListener('click', (event) => {
  if (session.state.status !== 'ongoing') return;

  const target = (event.target as Element).closest('.node');
  const directId = target ? Number(target.getAttribute('data-id')) : NaN;
  const targetNodeId = Number.isInteger(directId) ? directId : findNodeAt(event.clientX, event.clientY);
  if (targetNodeId === undefined) return;

  selectedNodeId = targetNodeId;

  // On touch, a tap on a non-adjacent node only selects it (showing its info)
  // instead of spending a turn on a blocked move — fat-finger protection.
  // Mouse clicks keep the engine-validated behavior.
  const isTouch = lastPointerType !== 'mouse';
  if (isTouch && !getAdjacentNodeIds(map, session.state.currentNodeId).includes(targetNodeId)) {
    renderNodeInfo();
    return;
  }

  runCommand({ type: 'move', targetNodeId });
});

savedSession = readSavedSession();
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
