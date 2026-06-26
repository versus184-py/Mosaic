export function calculateRadialPosition(
  parentPosition: { x: number; y: number },
  childIndex: number,
  totalChildren: number,
  depth: number
): { x: number; y: number } {
  const baseAngle = (Math.PI * 2) / Math.max(totalChildren, 1);
  const angle = baseAngle * childIndex - Math.PI / 2;
  const distance = 250 + depth * 30;

  return {
    x: parentPosition.x + Math.cos(angle) * distance,
    y: parentPosition.y + Math.sin(angle) * distance,
  };
}

export function layoutTree(
  nodes: { id: string; position: { x: number; y: number }; data?: { nodeType?: string } }[],
  edges: { source: string; target: string }[]
): Map<string, { x: number; y: number }> {
  const targets = new Set(edges.map((e) => e.target));
  const root = nodes.find((n) => !targets.has(n.id)) || nodes[0];
  if (!root) return new Map();

  const childMap = new Map<string, string[]>();
  for (const edge of edges) {
    if (!childMap.has(edge.source)) childMap.set(edge.source, []);
    childMap.get(edge.source)!.push(edge.target);
  }

  const positions = new Map<string, { x: number; y: number }>();
  positions.set(root.id, { x: 0, y: 0 });

  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: root.id, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const children = childMap.get(id) || [];
    const parentPos = positions.get(id)!;
    for (let i = 0; i < children.length; i++) {
      const pos = calculateRadialPosition(parentPos, i, children.length, depth + 1);
      positions.set(children[i], pos);
      queue.push({ id: children[i], depth: depth + 1 });
    }
  }

  return positions;
}

export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}


