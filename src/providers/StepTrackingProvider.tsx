// filepath: src/providers/StepTrackingProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDatabase } from './DatabaseProvider';
import stepCounterService from '../services/stepCounter';

interface StepTrackingContextType {
  steps: number;
  isTracking: boolean;
  isAvailable: boolean;
  refreshSteps: () => Promise<void>;
}

const StepTrackingContext = createContext<StepTrackingContextType>({
  steps: 0,
  isTracking: false,
  isAvailable: false,
  refreshSteps: async () => {},
});

export function useStepTracking() {
  const context = useContext(StepTrackingContext);
  if (!context) {
    throw new Error('useStepTracking must be used within StepTrackingProvider');
  }
  return context;
}

export function StepTrackingProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabase();
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const refreshSteps = async () => {
    if (!isReady) return;
    try {
      const todaySteps = await stepCounterService.getTodaySteps();
      setSteps(todaySteps);
    } catch (e) {
      console.warn('[StepTrackingProvider] Failed to refresh steps:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!isReady) return;

      try {
        // Check if pedometer is available
        const available = await stepCounterService.isAvailable();
        if (!mounted) return;
        setIsAvailable(available);

        if (available) {
          // Subscribe to step updates
          const unsubscribe = stepCounterService.subscribe((newSteps) => {
            if (mounted) {
              setSteps(newSteps);
            }
          });

          // Start tracking
          const started = await stepCounterService.startTracking();
          if (mounted) {
            setIsTracking(started);
          }

          // Initial fetch
          await refreshSteps();

          // Cleanup on unmount
          return () => {
            unsubscribe();
            if (stepCounterService.isTrackingNow()) {
              stepCounterService.stopTracking().catch(e => console.warn('[StepTrackingProvider] Stop error:', e));
            }
          };
        }
      } catch (e) {
        console.error('[StepTrackingProvider] Init error:', e);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [isReady]);

  return (
    <StepTrackingContext.Provider value={{ steps, isTracking, isAvailable, refreshSteps }}>
      {children}
    </StepTrackingContext.Provider>
  );
}
