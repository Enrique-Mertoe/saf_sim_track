"use client"
import {useEffect, useRef, useState} from 'react';
import {LifecycleEvent, LifecycleRegistry} from '../types';
import {useTabVisibility} from "@/ui/library/smv-ui/src/framework/utility/TabVisibility";
// import { LifecycleRegistry } from '../core/Lifecycle';
// import { LifecycleEvent } from '../core/LifecycleState';

/**
 * Main hook for lifecycle management in React components
 */
export function useLifecycle() {
    const lifecycleRef = useRef<LifecycleRegistry>(null);
    const [started, setInitial] = useState(false);
    const [paused, setPaused] = useState(false);
    if (!lifecycleRef.current) {
        lifecycleRef.current = new LifecycleRegistry();
    }

    const lifecycle = lifecycleRef.current;
    const tabState = useTabVisibility();
    useEffect(() => {
        if (!started) {
            setInitial(true)
            return
        }
        if (tabState.isVisible && tabState.isActive) {
            if (paused) {

                setPaused(false)
                lifecycle.handleLifecycleEvent(LifecycleEvent.ON_RESUME);
            }
        } else if (tabState.isVisible && !tabState.isActive) {
            // Tab is visible but not active - start but don't resume
            if (!paused) {
                setPaused(true)
                lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
            }
        } else {
            // Tab is hidden - pause and stop
            if (!paused) {
                setPaused(true)
                setInitial(false)
                lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
                lifecycle.handleLifecycleEvent(LifecycleEvent.ON_STOP);
            }
        }
    }, [tabState.isVisible, tabState.isActive, lifecycle]);
    useEffect(() => {
        // Component mounted - trigger CREATE and START
        lifecycle.handleLifecycleEvent(LifecycleEvent.ON_CREATE);
        lifecycle.handleLifecycleEvent(LifecycleEvent.ON_START);
        lifecycle.handleLifecycleEvent(LifecycleEvent.ON_RESUME);

        return () => {
            // Component unmounting - trigger PAUSE, STOP, DESTROY
            lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
            lifecycle.handleLifecycleEvent(LifecycleEvent.ON_STOP);
            lifecycle.handleLifecycleEvent(LifecycleEvent.ON_DESTROY);
        };
    }, [lifecycle]);

    return lifecycle;
}
