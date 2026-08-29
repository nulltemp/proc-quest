import type { GeneratedMap } from './generateMap.js';
import type { NodeType } from './nodeTypes.js';

const NODE_MARKERS: Record<NodeType, string> = {
  start: 'S',
  boss: 'B',
  battle: '!',
  event: '?',
  normal: 'o',
  treasure: '$',
};

export function formatMapAsText(map: GeneratedMap): string {
  const { nodes, edges, startNodeId, bossNodeId, config } = map;
  const lines: string[] = [];

  lines.push(`Seed: ${config.seed}`);
  lines.push(`Nodes (${nodes.length}):`);
  for (const node of nodes) {
    const idLabel = String(node.id).padStart(2, ' ');
    lines.push(`  [${idLabel}] (${node.x.toFixed(2)}, ${node.y.toFixed(2)}) ${node.type}`);
  }

  lines.push(`Edges (${edges.length}):`);
  for (const edge of edges) {
    lines.push(`  ${edge.from} -- ${edge.to}  (weight ${edge.weight.toFixed(2)})`);
  }

  lines.push(`Start: node ${startNodeId}   Boss: node ${bossNodeId}`);

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
