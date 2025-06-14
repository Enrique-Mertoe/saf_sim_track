import React from 'react';
import {ComponentActivity, useActivityLifecycle, useLifecycleObserver} from '../framework';

const BasicActivityExample: React.FC = () => {
  const lifecycle = useActivityLifecycle();

  useLifecycleObserver(lifecycle, {
    onCreate: () => console.log('Activity created!'),
    onStart: () => console.log('Activity started!'),
    onResume: () => console.log('Activity resumed!'),
    onPause: () => console.log('Activity paused!'),
    onStop: () => console.log('Activity stopped!'),
    onDestroy: () => console.log('Activity destroyed!'),
  });

  return (
    <div>
      <h1>Basic Activity Example</h1>
      <p>Check the console to see lifecycle events!</p>
      <p>Current state: {lifecycle.getCurrentState()}</p>
    </div>
  );
};

export const BasicActivityPage: React.FC = () => {
  return (
    <ComponentActivity>
      <BasicActivityExample />
    </ComponentActivity>
  );
};
