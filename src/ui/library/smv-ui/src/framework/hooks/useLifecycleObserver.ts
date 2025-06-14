"use client"
import {useEffect} from 'react';
import {FullLifecycleObserver, LifecycleRegistry} from "@/ui/library/smv-ui/src";

/**
 * Hook to observe lifecycle events
 */
export function useLifecycleObserver(
  lifecycle: LifecycleRegistry,
  observer: FullLifecycleObserver
) {
  useEffect(() => {
    lifecycle.addObserver(observer);

    return () => {
      lifecycle.removeObserver(observer);
    };
  }, [lifecycle, observer]);
}
