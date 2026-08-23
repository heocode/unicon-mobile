import {
  Fit,
  RiveView,
  useRive,
  useRiveFile,
  useRiveTrigger,
  useViewModelInstance,
} from '@rive-app/react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

const LAUNCH_STATE_MACHINE = 'LaunchAnimation';
const LAUNCH_VIEW_MODEL = 'LaunchAnimation';
const launchSource = require('../../../../assets/rive/launch.riv');

type Props = {
  onComplete: () => void;
  onFailure: (error: Error) => void;
  onReady: () => Promise<void> | void;
};

export function LaunchAnimation({ onComplete, onFailure, onReady }: Props) {
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const failedRef = useRef(false);
  const { riveViewRef, setHybridRef } = useRive();
  const { riveFile, error: fileError } = useRiveFile(launchSource);
  const { instance, error: instanceError } = useViewModelInstance(riveFile, {
    async: true,
    viewModelName: LAUNCH_VIEW_MODEL,
  });

  const { trigger: triggerStart, error: startError } = useRiveTrigger(
    'start',
    instance,
  );
  const { error: completeError } = useRiveTrigger('complete', instance, {
    onTrigger: () => {
      if (!mountedRef.current || !startedRef.current) return;
      onComplete();
    },
  });

  const bindingError = useMemo(
    () => fileError ?? instanceError ?? startError ?? completeError,
    [completeError, fileError, instanceError, startError],
  );

  const fail = useCallback(
    (error: Error) => {
      if (failedRef.current) return;
      failedRef.current = true;
      onFailure(error);
    },
    [onFailure],
  );

  useEffect(() => {
    if (bindingError) fail(bindingError);
  }, [bindingError, fail]);

  const triggerStartRef = useRef(triggerStart);
  const riveViewRefLatest = useRef(riveViewRef);
  const onReadyRef = useRef(onReady);
  triggerStartRef.current = triggerStart;
  riveViewRefLatest.current = riveViewRef;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (
      !riveFile ||
      !instance ||
      !riveViewRef ||
      bindingError ||
      startedRef.current
    ) {
      return;
    }

    startedRef.current = true;
    void riveViewRef
      .play()
      .then(() => Promise.resolve(onReadyRef.current()))
      .then(() => {
        if (!mountedRef.current || failedRef.current) return;
        const readyView = riveViewRefLatest.current;
        if (!readyView) throw new Error('Launch Rive view is not ready.');

        triggerStartRef.current();
        readyView.playIfNeeded();
      })
      .catch((cause) => {
        fail(
          cause instanceof Error
            ? cause
            : new Error('Launch animation failed to start.'),
        );
      });
  }, [bindingError, fail, instance, riveFile, riveViewRef]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleRuntimeError = useCallback(
    (error: { message: string }) => fail(new Error(error.message)),
    [fail],
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.container}
    >
      {riveFile && instance && !bindingError ? (
        <RiveView
          autoPlay
          dataBind={instance}
          file={riveFile}
          fit={Fit.Contain}
          hybridRef={setHybridRef}
          onError={handleRuntimeError}
          stateMachineName={LAUNCH_STATE_MACHINE}
          style={styles.rive}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  rive: {
    height: '100%',
    width: '100%',
  },
});
