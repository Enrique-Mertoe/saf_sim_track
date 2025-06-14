import {LifecycleEvent, LifecycleState} from '../core/LifecycleState';

export interface LifecycleCallbacks {
  onCreate?: () => void;
  onStart?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onDestroy?: () => void;
}

export interface LifecycleConfig {
  autoStart?: boolean;
  logging?: boolean;
  strictMode?: boolean;
}

export type LifecycleEventCallback = (state: LifecycleState, event: LifecycleEvent) => void;
