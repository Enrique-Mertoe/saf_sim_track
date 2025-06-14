import {Lifecycle} from './Lifecycle';

/**
 * Interface for components that have a lifecycle
 */
export interface LifecycleOwner {
  getLifecycle(): Lifecycle;
}

/**
 * Check if an object implements LifecycleOwner
 */
export function isLifecycleOwner(obj: any): obj is LifecycleOwner {
  return obj && typeof obj.getLifecycle === 'function';
}
