const gridSize = 40;

export function createGridBackground(width: number, height: number): HTMLDivElement {
  const div = document.createElement("div");
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.background = "var(--bg)";
  div.style.backgroundImage = `radial-gradient(circle, var(--grid-color) 1px, transparent 1px)`;
  div.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  return div;
}

export function createGridBackgroundNode(width: number, _height: number): React.ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--bg)",
        backgroundImage: `radial-gradient(circle, var(--grid-color) 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}

export function captureParentBackground(el: HTMLElement): React.ReactElement | null {
  const parent = el.parentElement;
  if (!parent) return null;

  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(parent);

  return (
    <div
      style={{
        width: rect.width,
        height: rect.height,
        background: style.background !== "none" ? style.background : "var(--bg)",
        backgroundSize: style.backgroundSize || `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
