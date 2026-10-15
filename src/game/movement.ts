import type { GeneratedMap } from '../map/index.js';

export function canMoveTo(map: GeneratedMap, fromNodeId: number, toNodeId: number): boolean {
  return map.edges.some(
    (edge) =>
      (edge.from === fromNodeId && edge.to === toNodeId) ||
      (edge.from === toNodeId && edge.to === fromNodeId),
  );
}

export function getAdjacentNodeIds(map: GeneratedMap, nodeId: number): number[] {
  const adjacent = new Set<number>();
  for (const edge of map.edges) {
    if (edge.from === nodeId) adjacent.add(edge.to);
    if (edge.to === nodeId) adjacent.add(edge.from);
  }
  return [...adjacent].sort((a, b) => a - b);
}

/**
 * Fewest-moves path from `fromNodeId` to `toNodeId` (BFS over the unweighted
 * edge graph). Returns the node ids to step through, excluding the start and
 * including the destination; `[]` if already there, `undefined` if unreachable.
 */
export function getShortestPath(map: GeneratedMap, fromNodeId: number, toNodeId: number): number[] | undefined {
  if (fromNodeId === toNodeId) return [];

  const previous = new Map<number, number>([[fromNodeId, fromNodeId]]);
  const queue = [fromNodeId];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    for (const next of getAdjacentNodeIds(map, nodeId)) {
      if (previous.has(next)) continue;
      previous.set(next, nodeId);
      if (next === toNodeId) {
        const path = [next];
        for (let step = nodeId; step !== fromNodeId; step = previous.get(step)!) path.unshift(step);
        return path;
      }
      queue.push(next);
    }
  }
  return undefined;
}
