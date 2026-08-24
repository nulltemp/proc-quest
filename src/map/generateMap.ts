import { createRng } from './rng.js';
import { NODE_TYPES, DEFAULT_TYPE_WEIGHTS, type NodeType, type TypeWeight } from './nodeTypes.js';

export interface Point {
  x: number;
  y: number;
}

export interface MapNode {
  id: number;
  x: number;
  y: number;
  type: NodeType;
}

export interface MapEdge {
  from: number;
  to: number;
  weight: number;
}

export interface MapConfig {
  nodeCount?: number;
  width?: number;
  height?: number;
  minDistance?: number;
  maxSampleAttemptsPerPoint?: number;
  neighborK?: number;
  seed?: number;
}

export interface ResolvedMapConfig extends Required<MapConfig> {}

export interface GeneratedMap {
  nodes: MapNode[];
  edges: MapEdge[];
  startNodeId: number;
  bossNodeId: number;
  config: ResolvedMapConfig;
}

export const DEFAULT_CONFIG: Omit<ResolvedMapConfig, 'seed'> & { seed: number | undefined } = {
  nodeCount: 20,
  width: 100,
  height: 100,
  minDistance: 12,
  maxSampleAttemptsPerPoint: 200,
  neighborK: 2,
  seed: undefined,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function edgeKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

function makeEdge(a: number, b: number, nodes: MapNode[]): MapEdge {
  return {
    from: Math.min(a, b),
    to: Math.max(a, b),
    weight: round2(dist(nodes[a], nodes[b])),
  };
}

function samplePoints(
  rng: () => number,
  {
    nodeCount,
    width,
    height,
    minDistance,
    maxSampleAttemptsPerPoint,
  }: Pick<ResolvedMapConfig, 'nodeCount' | 'width' | 'height' | 'minDistance' | 'maxSampleAttemptsPerPoint'>,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < nodeCount; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxSampleAttemptsPerPoint && !placed; attempt++) {
      const candidate: Point = { x: rng() * width, y: rng() * height };
      if (points.every((p) => dist(p, candidate) >= minDistance)) {
        points.push(candidate);
        placed = true;
      }
    }
    if (!placed) points.push({ x: rng() * width, y: rng() * height });
  }
  return points;
}

function computeMST(nodes: MapNode[]): MapEdge[] {
  const n = nodes.length;
  const inTree = new Array<boolean>(n).fill(false);
  const minDist = new Array<number>(n).fill(Infinity);
  const nearest = new Array<number>(n).fill(-1);
  minDist[0] = 0;
  const edges: MapEdge[] = [];

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (u === -1 || minDist[i] < minDist[u])) u = i;
    }
    inTree[u] = true;
    if (nearest[u] !== -1) edges.push(makeEdge(nearest[u], u, nodes));

    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = dist(nodes[u], nodes[v]);
      if (d < minDist[v]) {
        minDist[v] = d;
        nearest[v] = u;
      }
    }
  }

  return edges;
}

function addProximityEdges(nodes: MapNode[], existingEdges: MapEdge[], k: number): MapEdge[] {
  const seen = new Set(existingEdges.map((e) => edgeKey(e.from, e.to)));
  const newEdges: MapEdge[] = [];

  for (const node of nodes) {
    const nearestK = nodes
      .filter((o) => o.id !== node.id)
      .map((o) => ({ id: o.id, d: dist(node, o) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);

    for (const { id: otherId, d } of nearestK) {
      const key = edgeKey(node.id, otherId);
      if (!seen.has(key)) {
        seen.add(key);
        newEdges.push({ from: Math.min(node.id, otherId), to: Math.max(node.id, otherId), weight: round2(d) });
      }
    }
  }

  return newEdges;
}

function buildAdjacency(nodeCount: number, edges: MapEdge[]): number[][] {
  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const { from, to } of edges) {
    adjacency[from].push(to);
    adjacency[to].push(from);
  }
  return adjacency;
}

function bfsFarthest(startId: number, adjacency: number[][]): number {
  const d = new Array<number>(adjacency.length).fill(-1);
  d[startId] = 0;
  const queue: number[] = [startId];
  let farthestId = startId;

  while (queue.length) {
    const u = queue.shift() as number;
    if (d[u] > d[farthestId]) farthestId = u;
    for (const v of adjacency[u]) {
      if (d[v] === -1) {
        d[v] = d[u] + 1;
        queue.push(v);
      }
    }
  }

  return farthestId;
}

function assignStartAndBoss(nodes: MapNode[], edges: MapEdge[]): { startNodeId: number; bossNodeId: number } {
  const adjacency = buildAdjacency(nodes.length, edges);
  const a = bfsFarthest(0, adjacency);
  const b = bfsFarthest(a, adjacency);
  return { startNodeId: a, bossNodeId: b };
}

function weightedPick(rng: () => number, weights: TypeWeight[]): NodeType {
  const r = rng();
  let cumulative = 0;
  for (const { type, weight } of weights) {
    cumulative += weight;
    if (r < cumulative) return type;
  }
  return weights[weights.length - 1].type;
}

function assignNodeTypes(
  nodes: MapNode[],
  rng: () => number,
  {
    startNodeId,
    bossNodeId,
    weights = DEFAULT_TYPE_WEIGHTS,
  }: { startNodeId: number; bossNodeId: number; weights?: TypeWeight[] },
): MapNode[] {
  for (const node of nodes) {
    if (node.id === startNodeId) node.type = NODE_TYPES.START;
    else if (node.id === bossNodeId) node.type = NODE_TYPES.BOSS;
    else node.type = weightedPick(rng, weights);
  }
  return nodes;
}

export function generateMap(options: MapConfig = {}): GeneratedMap {
  const config: ResolvedMapConfig = { ...DEFAULT_CONFIG, ...options } as ResolvedMapConfig;
  if (config.nodeCount < 2) throw new Error('nodeCount must be >= 2');
  if (config.seed === undefined) config.seed = Math.floor(Math.random() * 2 ** 31);

  const rng = createRng(config.seed);

  const points = samplePoints(rng, config);
  const nodes: MapNode[] = points.map((p, id) => ({ id, x: round2(p.x), y: round2(p.y), type: NODE_TYPES.NORMAL }));

  const mstEdges = computeMST(nodes);
  const edges = [...mstEdges, ...addProximityEdges(nodes, mstEdges, config.neighborK)];

  const { startNodeId, bossNodeId } = assignStartAndBoss(nodes, edges);
  assignNodeTypes(nodes, rng, { startNodeId, bossNodeId });

  return { nodes, edges, startNodeId, bossNodeId, config };
}
