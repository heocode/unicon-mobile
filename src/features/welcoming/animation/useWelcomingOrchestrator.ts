import { useCallback, useEffect, useRef, useState } from 'react';

import {
  WelcomingIllustrationCancelledError,
  type WelcomingIllustrationHandle,
} from './WelcomingIllustrationAdapter';
import type { WelcomingIndex } from '../types/welcoming.types';

export type WelcomingTransitionPhase = 'idle' | 'exiting' | 'entering';

type HandleWaiter = {
  resolve: (handle: WelcomingIllustrationHandle) => void;
  reject: (error: Error) => void;
};

export function useWelcomingOrchestrator(reducedMotion: boolean) {
  const [illustrationIndex, setIllustrationIndex] =
    useState<WelcomingIndex>(0);
  const [phase, setPhase] = useState<WelcomingTransitionPhase>('idle');
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const reducedMotionRef = useRef(reducedMotion);
  const desiredIndexRef = useRef<WelcomingIndex>(0);
  const mountedIndexRef = useRef<WelcomingIndex>(0);
  const settledIndexRef = useRef<WelcomingIndex | null>(null);
  const generationRef = useRef(0);
  const errorRef = useRef<Error | null>(null);
  const runnerRef = useRef<Promise<void> | null>(null);
  const handlesRef = useRef(
    new Map<WelcomingIndex, WelcomingIllustrationHandle>(),
  );
  const waitersRef = useRef(new Map<WelcomingIndex, HandleWaiter[]>());

  const waitForHandle = useCallback((index: WelcomingIndex) => {
    const existing = handlesRef.current.get(index);
    if (existing) return Promise.resolve(existing);

    return new Promise<WelcomingIllustrationHandle>((resolve, reject) => {
      const waiters = waitersRef.current.get(index) ?? [];
      waiters.push({ resolve, reject });
      waitersRef.current.set(index, waiters);
    });
  }, []);

  const registerIllustration = useCallback(
    (index: WelcomingIndex, handle: WelcomingIllustrationHandle | null) => {
      if (!handle) {
        handlesRef.current.delete(index);
        return;
      }

      handlesRef.current.set(index, handle);
      const waiters = waitersRef.current.get(index);
      if (waiters) {
        waitersRef.current.delete(index);
        waiters.forEach((waiter) => waiter.resolve(handle));
      }
    },
    [],
  );

  const assertGeneration = useCallback((generation: number) => {
    if (!mountedRef.current || generation !== generationRef.current) {
      throw new WelcomingIllustrationCancelledError(
        'Welcoming transition was superseded.',
      );
    }
  }, []);

  const runTransitions = useCallback(async () => {
    const generation = ++generationRef.current;

    try {
      if (settledIndexRef.current === null) {
        setPhase('entering');
        const initial = await waitForHandle(mountedIndexRef.current);
        assertGeneration(generation);
        await initial.show();
        assertGeneration(generation);
        settledIndexRef.current = mountedIndexRef.current;
      }

      while (
        mountedRef.current &&
        settledIndexRef.current !== desiredIndexRef.current
      ) {
        const currentIndex = mountedIndexRef.current;
        const current = await waitForHandle(currentIndex);
        assertGeneration(generation);

        setPhase('exiting');
        await current.hide();
        assertGeneration(generation);

        const nextIndex: WelcomingIndex = desiredIndexRef.current;
        if (nextIndex !== currentIndex) {
          mountedIndexRef.current = nextIndex;
          setIllustrationIndex(nextIndex);
        }

        const next = await waitForHandle(nextIndex);
        assertGeneration(generation);

        setPhase('entering');
        await next.show();
        assertGeneration(generation);
        settledIndexRef.current = nextIndex;
      }

      setPhase('idle');
    } catch (cause) {
      if (cause instanceof WelcomingIllustrationCancelledError) return;

      const transitionError =
        cause instanceof Error
          ? cause
          : new Error('Welcoming illustration transition failed.');
      errorRef.current = transitionError;
      setError(transitionError);
      setPhase('idle');
    } finally {
      runnerRef.current = null;

      if (
        mountedRef.current &&
        !reducedMotionRef.current &&
        !errorRef.current &&
        settledIndexRef.current !== desiredIndexRef.current
      ) {
        runnerRef.current = runTransitions();
      }
    }
  }, [assertGeneration, waitForHandle]);

  const ensureRunner = useCallback(() => {
    if (reducedMotionRef.current || runnerRef.current || errorRef.current) return;
    runnerRef.current = runTransitions();
  }, [runTransitions]);

  const requestTransition = useCallback(
    (targetIndex: WelcomingIndex) => {
      desiredIndexRef.current = targetIndex;

      if (reducedMotionRef.current) {
        mountedIndexRef.current = targetIndex;
        settledIndexRef.current = targetIndex;
        setIllustrationIndex(targetIndex);
        return;
      }

      ensureRunner();
    },
    [ensureRunner],
  );

  const handleIllustrationFailure = useCallback((failure: Error) => {
    generationRef.current += 1;
    errorRef.current = failure;
    setError(failure);
    setPhase('idle');
  }, []);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;

    if (reducedMotion) {
      generationRef.current += 1;
      const target = desiredIndexRef.current;
      mountedIndexRef.current = target;
      settledIndexRef.current = target;
      setIllustrationIndex(target);
      setPhase('idle');
    } else {
      settledIndexRef.current = null;
      ensureRunner();
    }
  }, [ensureRunner, reducedMotion]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      const cancellation = new WelcomingIllustrationCancelledError();
      waitersRef.current.forEach((waiters) => {
        waiters.forEach((waiter) => waiter.reject(cancellation));
      });
      waitersRef.current.clear();
    };
  }, []);

  return {
    error,
    illustrationIndex,
    phase,
    registerIllustration,
    requestTransition,
    handleIllustrationFailure,
  };
}
