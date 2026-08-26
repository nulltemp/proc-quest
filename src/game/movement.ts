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
