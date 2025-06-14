/**
 * Lifecycle states matching Android's Activity lifecycle
 */
export enum LifecycleState {
  INITIALIZED = 'INITIALIZED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  RESUMED = 'RESUMED',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  DESTROYED = 'DESTROYED'
}

/**
 * Lifecycle events that trigger state changes
 */
export enum LifecycleEvent {
  ON_CREATE = 'ON_CREATE',
  ON_START = 'ON_START',
  ON_RESUME = 'ON_RESUME',
  ON_PAUSE = 'ON_PAUSE',
  ON_STOP = 'ON_STOP',
  ON_DESTROY = 'ON_DESTROY'
}

/**
 * Check if current state is at least the target state
 */
export function isAtLeast(current: LifecycleState, target: LifecycleState): boolean {
  const states = Object.values(LifecycleState);
  const currentIndex = states.indexOf(current);
  const targetIndex = states.indexOf(target);
  return currentIndex >= targetIndex;
}
