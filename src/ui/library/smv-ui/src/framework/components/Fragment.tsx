import React, {ReactNode} from 'react';
import {useLifecycle} from '../hooks/useLifecycle';
import {LifecycleRegistry} from '../core/Lifecycle';

interface FragmentProps {
  children: ReactNode;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

/**
 * Fragment component - represents a reusable UI component with lifecycle
 */
export const Fragment: React.FC<FragmentProps> = ({
  children,
  className,
  tag: Tag = 'div'
}) => {
  const lifecycle = useLifecycle();

  return (
    <Tag className={`smv-fragment ${className || ''}`}>
      {children}
    </Tag>
  );
};

/**
 * Hook specifically for fragments
 */
export function useFragment(): LifecycleRegistry {
  return useLifecycle();
}
