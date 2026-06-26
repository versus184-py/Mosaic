export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringParams {
  stiffness: number;
  damping: number;
  mass?: number;
}

export function createSpring(
  initialValue: number,
  { stiffness, damping, mass = 1 }: SpringParams
): SpringState {
  return { value: initialValue, velocity: 0 };
}

export function tickSpring(
  state: SpringState,
  target: number,
  { stiffness, damping, mass = 1 }: SpringParams,
  dt: number
): SpringState {
  const force = -stiffness * (state.value - target);
  const friction = -damping * state.velocity;
  const acceleration = (force + friction) / mass;
  const newVelocity = state.velocity + acceleration * dt;
  const newValue = state.value + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}
