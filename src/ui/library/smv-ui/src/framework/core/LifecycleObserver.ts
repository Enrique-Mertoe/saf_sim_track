import {LifecycleEvent, LifecycleState} from "./LifecycleState";

/**
 * Base interface for lifecycle observers
 */
export interface LifecycleObserver {
  onStateChanged?(state: LifecycleState, event: LifecycleEvent): void;
}

/**
 * Full lifecycle observer with individual event methods
 */
export interface FullLifecycleObserver extends LifecycleObserver {
  onCreate?(): void;
  onStart?(): void;
  onResume?(): void;
  onPause?(): void;
  onStop?(): void;
  onDestroy?(): void;
}

/**
 * Event-specific observer
 */
export interface LifecycleEventObserver extends LifecycleObserver {
  onStateChanged(state: LifecycleState, event: LifecycleEvent): void;
}
