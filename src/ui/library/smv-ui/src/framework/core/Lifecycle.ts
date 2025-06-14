import {LifecycleEvent, LifecycleState} from './LifecycleState';
import {FullLifecycleObserver, LifecycleObserver} from './LifecycleObserver';

/**
 * Main lifecycle class that manages state and observers
 */
export abstract class Lifecycle {
  abstract getCurrentState(): LifecycleState;
  abstract addObserver(observer: LifecycleObserver): void;
  abstract removeObserver(observer: LifecycleObserver): void;
}

/**
 * Registry implementation of Lifecycle
 */
export class LifecycleRegistry extends Lifecycle {
  private state: LifecycleState = LifecycleState.INITIALIZED;
  private observers: Set<LifecycleObserver> = new Set();

  getCurrentState(): LifecycleState {
    return this.state;
  }

  addObserver(observer: LifecycleObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: LifecycleObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Mark the current state and notify observers
   */
  markState(state: LifecycleState): void {
    this.setCurrentState(state);
  }

  /**
   * Handle lifecycle event and transition to appropriate state
   */
  handleLifecycleEvent(event: LifecycleEvent): void {
    const newState = this.getStateAfter(event);
    this.setCurrentState(newState);
    this.notifyObservers(newState, event);
  }

  private setCurrentState(state: LifecycleState): void {
    this.state = state;
  }

  private notifyObservers(state: LifecycleState, event: LifecycleEvent): void {
    this.observers.forEach(observer => {
      // Notify general state change
      if (observer.onStateChanged) {
        observer.onStateChanged(state, event);
      }

      // Notify specific lifecycle methods
      const fullObserver = observer as FullLifecycleObserver;
      switch (event) {
        case LifecycleEvent.ON_CREATE:
          fullObserver.onCreate?.();
          break;
        case LifecycleEvent.ON_START:
          fullObserver.onStart?.();
          break;
        case LifecycleEvent.ON_RESUME:
          fullObserver.onResume?.();
          break;
        case LifecycleEvent.ON_PAUSE:
          fullObserver.onPause?.();
          break;
        case LifecycleEvent.ON_STOP:
          fullObserver.onStop?.();
          break;
        case LifecycleEvent.ON_DESTROY:
          fullObserver.onDestroy?.();
          break;
      }
    });
  }

  private getStateAfter(event: LifecycleEvent): LifecycleState {
    switch (event) {
      case LifecycleEvent.ON_CREATE:
        return LifecycleState.CREATED;
      case LifecycleEvent.ON_START:
        return LifecycleState.STARTED;
      case LifecycleEvent.ON_RESUME:
        return LifecycleState.RESUMED;
      case LifecycleEvent.ON_PAUSE:
        return LifecycleState.PAUSED;
      case LifecycleEvent.ON_STOP:
        return LifecycleState.STOPPED;
      case LifecycleEvent.ON_DESTROY:
        return LifecycleState.DESTROYED;
      default:
        return this.state;
    }
  }
}
