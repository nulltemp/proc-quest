import type { GeneratedMap } from './generateMap.js';
import type { NodeType } from './nodeTypes.js';
import { DEFAULT_LOCALE, getMessages, type Locale } from '../i18n/index.js';

const NODE_MARKERS: Record<NodeType, string> = {
  start: 'S',
  boss: 'B',
  battle: '!',
  event: '?',
  normal: 'o',
  treasure: '$',
};

export function formatMapAsText(map: GeneratedMap, locale: Locale = DEFAULT_LOCALE): string {
  const { nodes, edges, startNodeId, bossNodeId, config } = map;
  const t = getMessages(locale);
  const lines: string[] = [];

  lines.push(t.map.seed(config.seed));
  lines.push(t.map.nodesHeader(nodes.length));
  for (const node of nodes) {
    const idLabel = String(node.id).padStart(2, ' ');
    lines.push(`  [${idLabel}] (${node.x.toFixed(2)}, ${node.y.toFixed(2)}) ${t.nodeType[node.type]}`);
  }

  lines.push(t.map.edgesHeader(edges.length));
  for (const edge of edges) {
    lines.push(`  ${edge.from} -- ${edge.to}  (weight ${edge.weight.toFixed(2)})`);
  }

  lines.push(t.map.startBoss(startNodeId, bossNodeId));

  return lines.join('\n');
}

export function formatMapAsAscii(map: GeneratedMap, { cols = 60, rows = 24 }: { cols?: number; rows?: number } = {}): string {
  const { nodes, config } = map;
  const grid: string[][] = Array.from({ length: rows }, () => new Array(cols).fill('.'));

  const toCol = (x: number) => Math.min(cols - 1, Math.max(0, Math.floor((x / config.width) * (cols - 1))));
  const toRow = (y: number) => rows - 1 - Math.min(rows - 1, Math.max(0, Math.floor((y / config.height) * (rows - 1))));

  const ordinary = nodes.filter((n) => n.type !== 'start' && n.type !== 'boss');
  const special = nodes.filter((n) => n.type === 'start' || n.type === 'boss');

  for (const node of [...ordinary, ...special]) {
    const col = toCol(node.x);
    const row = toRow(node.y);
    grid[row][col] = NODE_MARKERS[node.type] || 'o';
  }

  return grid.map((row) => row.join('')).join('\n');
}
