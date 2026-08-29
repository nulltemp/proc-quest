import type { GeneratedMap } from '../src/map/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const NODE_RADIUS: Record<string, number> = {
  start: 3,
  boss: 3,
  battle: 2,
  event: 2,
  normal: 1.5,
  treasure: 2,
};

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

export interface MapHighlights {
  currentNodeId?: number;
  reachableNodeIds?: number[];
}

export function renderMapToSvg(map: GeneratedMap, highlights: MapHighlights = {}): SVGSVGElement {
  const { nodes, edges, config } = map;
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const reachable = new Set(highlights.reachableNodeIds ?? []);

  const toSvgX = (x: number) => x;
  const toSvgY = (y: number) => config.height - y;

  const svg = svgEl('svg');
  svg.setAttribute('viewBox', `0 0 ${config.width} ${config.height}`);
  svg.setAttribute('class', 'map-svg');

  const edgesGroup = svgEl('g');
  edgesGroup.setAttribute('class', 'edges');
  for (const edge of edges) {
    const from = nodesById.get(edge.from);
    const to = nodesById.get(edge.to);
    if (!from || !to) continue;

    const line = svgEl('line');
    line.setAttribute('class', 'edge');
    line.setAttribute('x1', String(toSvgX(from.x)));
    line.setAttribute('y1', String(toSvgY(from.y)));
    line.setAttribute('x2', String(toSvgX(to.x)));
    line.setAttribute('y2', String(toSvgY(to.y)));

    const title = svgEl('title');
    title.textContent = `weight ${edge.weight.toFixed(2)}`;
    line.appendChild(title);

    edgesGroup.appendChild(line);
  }
  svg.appendChild(edgesGroup);

  const nodesGroup = svgEl('g');
  nodesGroup.setAttribute('class', 'nodes');
  const ordinary = nodes.filter((n) => n.type !== 'start' && n.type !== 'boss');
  const special = nodes.filter((n) => n.type === 'start' || n.type === 'boss');

  for (const node of [...ordinary, ...special]) {
    const cx = toSvgX(node.x);
    const cy = toSvgY(node.y);
    const radius = NODE_RADIUS[node.type] ?? NODE_RADIUS.normal;

    if (node.type === 'start' || node.type === 'boss') {
      const halo = svgEl('circle');
      halo.setAttribute('class', `halo halo-${node.type}`);
      halo.setAttribute('cx', String(cx));
      halo.setAttribute('cy', String(cy));
      halo.setAttribute('r', String(radius + 1.5));
      nodesGroup.appendChild(halo);
    }

    const circle = svgEl('circle');
    const classes = ['node', `node-${node.type}`];
    if (node.id === highlights.currentNodeId) classes.push('node-current');
    else if (reachable.has(node.id)) classes.push('node-reachable');
    circle.setAttribute('class', classes.join(' '));
    circle.setAttribute('data-id', String(node.id));
    circle.setAttribute('data-type', node.type);
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(radius));

    const title = svgEl('title');
    title.textContent = `#${node.id} ${node.type} (${node.x.toFixed(2)}, ${node.y.toFixed(2)})`;
    circle.appendChild(title);

    nodesGroup.appendChild(circle);
  }
  svg.appendChild(nodesGroup);

  return svg;
}
