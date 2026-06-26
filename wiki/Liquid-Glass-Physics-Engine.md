# Liquid-Glass Physics Engine

Mosaic's **Liquid-Glass** system is a custom physics-based glass rendering engine built with SVG filters and canvas-based displacement maps. It creates realistic refractive glass effects entirely in the browser, without WebGL or external libraries.

---

## Architecture Overview

```
src/liquid-glass/
├── types.ts              # SurfaceProfile, LensParams, DisplacementMap, etc.
├── refraction.ts         # Surface height profiles, Snell's law displacement
├── displacement.ts       # Canvas-based displacement map generation
├── specular.ts           # Specular highlight map generation
├── filter.ts             # SVG feDisplacementMap filter chain builder
├── renderer.ts           # Lens resource lifecycle management
├── spring.ts             # Physics spring system (for FluidSlider/TactileSwitch)
└── capture.tsx           # Grid background capture utilities
```

The engine works in three stages:

```
Displacement Map    →    SVG Filter Chain    →    Refracted Render
(canvas-based)           (feDisplacementMap)      (lens effect)
```

---

## Stage 1: Surface Profiles

A **surface profile** defines the shape of the glass lens. The profile is a mathematical function that returns a height value (0-1) for any (x, y) coordinate on the lens surface.

### Profile Functions

Each profile is defined in `refraction.ts`:

```typescript
type SurfaceProfile = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';
```

#### Convex Squircle (Default)

The default profile. A smooth rounded convex shape that approximates a real glass lens.

```
Height(x, y) = (1 - (x^4 + y^4))^(1/4)
```

Where x and y are normalized to [-1, 1] within the lens bounds. This produces a smooth, gradual curve from the center (highest) to the edges (lowest), with rounded corners instead of sharp circular edges.

#### Convex Circle

A spherical convex lens profile:

```
Height(x, y) = sqrt(max(0, 1 - x^2 - y^2))
```

This produces a perfect spherical bulge. More "magnifying glass" than "rounded rectangle."

#### Concave

An inward-curving lens (opposite of convex):

```
Height(x, y) = 1 - sqrt(max(0, 1 - x^2 - y^2))
```

Creates a fisheye/minification effect.

#### Lip

A raised ring around the edge:

```
Height(x, y) = edge_rim - center_dip
```

Creates a raised border effect, like a watch crystal.

### Derivatives

Each profile also has a corresponding **derivative function** used for ray displacement calculations. The derivative gives the slope of the surface at any point, which determines how much light rays are bent:

```typescript
type SurfaceDerivative = (x: number, y: number) => { dx: number; dy: number };
```

---

## Stage 2: Snell's Law Ray Displacement

The refraction engine simulates how light bends when passing through the glass surface using **Snell's law**:

```
n₁ × sin(θ₁) = n₂ × sin(θ₂)
```

Where:
- `n₁` = refractive index of medium 1 (air: ~1.0)
- `n₂` = refractive index of medium 2 (glass: ~1.5)
- `θ₁` = angle of incidence
- `θ₂` = angle of refraction

### Implementation

In `refraction.ts`, the `getRayDisplacement()` function calculates how much each pixel should shift based on the surface slope at that point:

```typescript
function getRayDisplacement(
  x: number,           // Normalized x coordinate [-1, 1]
  y: number,           // Normalized y coordinate [-1, 1]
  profile: SurfaceProfile,
  params: {
    refractiveIndex: number;  // Default: 1.5
    thickness: number;        // Glass thickness factor
  }
): { dx: number; dy: number }
```

The displacement is proportional to:
1. The surface slope at the given point (from the derivative)
2. The refractive index ratio (air-to-glass)
3. The glass thickness parameter

Higher thickness = more pronounced refraction. Higher refractive index = more bending.

---

## Stage 3: Displacement Map Generation

The displacement map is a **canvas** that stores the computed displacement values as pixel data. Each pixel's RGBA values encode the x and y displacement amounts.

### Map Structure

```
┌─────────────────────────────┐
│  Canvas (displacement map)   │
│                              │
│  R channel: X displacement   │
│  G channel: Y displacement   │
│  B channel: unused (0)       │
│  A channel: unused (255)     │
│                              │
│  Resolution: lens W x H      │
└─────────────────────────────┘
```

### Generation Process

In `displacement.ts`:

1. Create a canvas of the lens dimensions
2. For each pixel (x, y):
   a. Normalize coordinates to [-1, 1]
   b. Compute surface height from the profile function
   c. Compute surface slope (derivative) at that point
   d. Apply Snell's law to get ray displacement
   e. Encode displacement as R/G values (mapped to 0-255)
3. Apply optional **interactive warp** overlay for touch displacement

The displacement map is generated once per lens and cached. It's regenerated only when the lens dimensions or profile change.

### Interactive Displacement

When `interactive={true}`, the lens responds to touch/pointer input:

1. On pointer down/move, the pointer position is captured
2. A local warp is applied to the displacement map at that position
3. The warp simulates pressing on a physical gel/fluid surface
4. On pointer up, the warp gradually relaxes back to the base profile (spring animation)

---

## Stage 4: SVG Filter Chain

The displacement map is applied via an SVG `<feDisplacementMap>` filter. The filter chain is built in `filter.ts`.

### Filter Structure

```xml
<filter id="glass-lens-filter">
  <!-- 1. Displacement (refraction) -->
  <feDisplacementMap
    in="SourceGraphic"
    in2="displacement-map"
    scale="50"
    xChannelSelector="R"
    yChannelSelector="G"
  />
  
  <!-- 2. Touch warp overlay (interactive mode) -->
  <feDisplacementMap
    in="displaced"
    in2="touch-warp-map"
    scale="30"
    xChannelSelector="R"
    yChannelSelector="G"
  />
  
  <!-- 3. Specular blend (glass shine) -->
  <feBlend
    mode="screen"
    in="warped"
    in2="specular-map"
  />
</filter>
```

### Filter Components

| Component | SVG Element | Purpose |
|-----------|-------------|---------|
| Displacement | `feDisplacementMap` | Main refraction effect using the displacement map |
| Touch warp | `feDisplacementMap` | Interactive press effect overlay |
| Specular blend | `feBlend` | Blends specular highlights for glass shine |

### Glass Variants

#### Regular Glass
- Frosted tint layer (semi-transparent background)
- Specular highlights (shine gradient)
- Subtle edge glow
- Backdrop blur via CSS `backdrop-filter: blur(60px)`
- Tailwind glass color variables applied

#### Clear Glass
- No tinting (transparent)
- Specular highlights only
- Used for special UI elements like the DragLens overlay
- CSS `backdrop-filter` is more subtle

---

## Stage 5: Specular Map

The specular map (generated in `specular.ts`) creates realistic light reflections on the glass surface.

### Calculation

```typescript
function generateSpecularMap(
  width: number,
  height: number,
  lightDirection: { x: number; y: number; z: number },
  surfaceProfile: SurfaceProfile
): HTMLCanvasElement
```

1. For each pixel, compute the surface normal from the profile derivative
2. Calculate the reflection vector from the light direction and surface normal
3. Compute specular intensity using the Blinn-Phong reflection model
4. Map intensity to a gradient (white = strong reflection, transparent = no reflection)

The light direction defaults to top-left (simulating natural overhead lighting), but can be customized per-lens.

---

## Spring Physics System

The `spring.ts` module provides a simple physics spring system used by `FluidSlider` and `TactileSwitch`.

```typescript
interface SpringParams {
  stiffness: number;     // Spring stiffness (default: 180)
  damping: number;       // Damping factor (default: 15)
  mass: number;          // Mass of the object (default: 1)
}

function createSpring(params: SpringParams): Spring;
function tickSpring(spring: Spring, target: number): number;
```

### How It Works

The spring simulation uses a simple **mass-spring-damper** model:

```
Force = -stiffness × (position - target) - damping × velocity
acceleration = Force / mass
velocity += acceleration × dt
position += velocity × dt
```

Despite its simplicity, this produces smooth, natural-feeling animations that respond to user input with realistic momentum.

### Spring Parameter Tuning Guide

| Application | Stiffness | Damping | Mass | Behavior |
|-------------|-----------|---------|------|----------|
| FluidSlider (idle) | 180 | 15 | 1 | Gentle settling |
| FluidSlider (dragging) | 300 | 20 | 1 | Responsive tracking |
| TactileSwitch | 250 | 18 | 1 | Satisfying snap |
| Interactive lens warp | 120 | 10 | 1 | Fluid deformation |

The stiffness/damping ratio determines the spring's behavior:
- **Underdamped** (stiffness high relative to damping): Oscillates before settling (bouncy)
- **Critically damped** (stiffness proportional to damping): Fastest settling without oscillation
- **Overdamped** (damping high relative to stiffness): Slow settling, no oscillation

Mosaic's springs are tuned to be slightly underdamped — fast enough to feel responsive, with just enough overshoot to feel natural.

### Usage in FluidSlider

```typescript
// Idle state — gentle, natural feel
const idleSpring = createSpring({ stiffness: 180, damping: 15 });

// During drag — tight, responsive tracking
const dragSpring = createSpring({ stiffness: 300, damping: 20 });

// Rendering loop (simplified)
function renderSlider() {
  const currentValue = tickSpring(spring, targetValue);
  const knobPosition = mapValueToPosition(currentValue);
  
  // Apply to DOM
  knobElement.style.transform = `translateX(${knobPosition}px)`;
  
  if (Math.abs(currentValue - targetValue) > 0.001) {
    requestAnimationFrame(renderSlider);
  }
}
```

When the user starts dragging, the spring stiffness increases for more responsive tracking. When released, the lower stiffness creates a gentle settling motion with a slight overshoot (underdamped behavior).

### Usage in TactileSwitch

Same spring system, used to animate the switch knob between the ON and OFF positions. The knob overshoots slightly and settles, mimicking a physical toggle switch.

---

## Lens Resource Lifecycle

The `renderer.ts` module manages the lifecycle of lens resources:

```
createLens(params)
  ├── Generate displacement map
  ├── Generate specular map
  ├── Build SVG filter chain
  ├── Insert filter into DOM (SVG defs)
  └── Return lens handle

updateLens(handle, params)
  ├── Regenerate displacement map (if size/shape changed)
  ├── Regenerate specular map
  ├── Update filter chain
  └── Return updated handle

destroyLens(handle)
  ├── Remove filter from DOM
  ├── Release canvas resources
  └── Clear cached data
```

Resources are reference-counted to prevent memory leaks when multiple lenses share the same configuration.

---

## Performance Considerations

| Operation | Cost | Caching |
|-----------|------|---------|
| Displacement map generation | Medium (canvas pixel iteration) | Cached per unique size/profile |
| Specular map generation | Medium | Cached per unique size/profile/light |
| SVG filter application | Low (GPU-accelerated via browser) | Built into browser rendering |
| Interactive warp calculation | Low (single pixel per pointer event) | No caching needed |
| Spring physics tick | Negligible | No caching needed |

### Optimization Tips

- **Use `lens={false}` on GlassCard** when the full refraction effect isn't needed (standard CSS glass is much faster)
- **Avoid resizing lenses frequently** — displacement map regeneration is the most expensive operation
- **Limit interactive lenses** — each interactive lens adds pointer event overhead
- **The DragLens is intentionally small** (120x120) to minimize the performance impact of real-time displacement

---

## Glass UI Component Summary

| Component | Glass Engine Features |
|-----------|----------------------|
| `GlassCard` | Standard CSS glass + optional Lens mode |
| `Lens` | Full SVG displacement + specular pipeline |
| `DragLens` | Interactive displacement + pointer tracking |
| `FluidSlider` | Spring physics for knob animation |
| `TactileSwitch` | Spring physics for toggle animation |
| `SegmentControl` | Lens-based active segment highlight |
| `GlassEffectContainer` | Shared backdrop context for grouped glass |

---

## Next Steps

- [[Component API Reference]] — Glass component props and usage
- [[Keyboard Shortcuts and UI Reference]] — UI elements documentation
- [[Theme System]] (inline in UI Reference) — Theme CSS custom properties
