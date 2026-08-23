import {
  Fit,
  RiveView,
  useRive,
  useRiveFile,
  useRiveTrigger,
  useViewModelInstance,
} from '@rive-app/react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';

import {
  WELCOMING_STATE_MACHINE,
  WELCOMING_VIEW_MODEL,
} from '../config/welcomingSlides';

export type WelcomingIllustrationHandle = {
  show(): Promise<void>;
  hide(): Promise<void>;
};

type OperationKind = 'show' | 'hide';

type PendingOperation = {
  id: number;
  kind: OperationKind;
  resolve: () => void;
  reject: (error: Error) => void;
};

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
  settled: boolean;
};

type Props = {
  source: number;
  accessibilityLabel: string;
  onFailure?: (error: Error) => void;
};

export class WelcomingIllustrationCancelledError extends Error {
  constructor(message = 'Welcoming illustration operation was cancelled.') {
    super(message);
    this.name = 'WelcomingIllustrationCancelledError';
  }
}

function createDeferred(): Deferred {
  let resolvePromise!: () => void;
  let rejectPromise!: (error: Error) => void;

  const deferred: Deferred = {
    promise: new Promise<void>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    }),
    resolve: () => undefined,
    reject: () => undefined,
    settled: false,
  };

  deferred.resolve = () => {
    if (deferred.settled) return;
    deferred.settled = true;
    resolvePromise();
  };
  deferred.reject = (error) => {
    if (deferred.settled) return;
    deferred.settled = true;
    rejectPromise(error);
  };

  return deferred;
}

export const WelcomingIllustrationAdapter = forwardRef<
  WelcomingIllustrationHandle,
  Props
>(function WelcomingIllustrationAdapter(
  { accessibilityLabel, onFailure, source },
  forwardedRef,
) {
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);
  const pendingOperationRef = useRef<PendingOperation | null>(null);
  const readinessRef = useRef(createDeferred());
  const failureRef = useRef<Error | null>(null);
  const { riveViewRef, setHybridRef } = useRive();

  const { riveFile, error: fileError } = useRiveFile(source);
  const { instance, error: instanceError } = useViewModelInstance(riveFile, {
    async: true,
    viewModelName: WELCOMING_VIEW_MODEL,
  });

  const completeOperation = useCallback((kind: OperationKind) => {
    const operation = pendingOperationRef.current;
    if (!operation || operation.kind !== kind) return;

    pendingOperationRef.current = null;
    operation.resolve();
  }, []);

  const { trigger: triggerShow, error: showError } = useRiveTrigger(
    'show',
    instance,
  );
  const { trigger: triggerHide, error: hideError } = useRiveTrigger(
    'hide',
    instance,
  );
  const riveViewRefLatest = useRef(riveViewRef);
  const triggerShowRef = useRef(triggerShow);
  const triggerHideRef = useRef(triggerHide);

  riveViewRefLatest.current = riveViewRef;
  triggerShowRef.current = triggerShow;
  triggerHideRef.current = triggerHide;

  const { error: enterCompleteError } = useRiveTrigger(
    'enterComplete',
    instance,
    { onTrigger: () => completeOperation('show') },
  );
  const { error: exitCompleteError } = useRiveTrigger(
    'exitComplete',
    instance,
    { onTrigger: () => completeOperation('hide') },
  );

  const bindingError = useMemo(
    () =>
      fileError ??
      instanceError ??
      showError ??
      hideError ??
      enterCompleteError ??
      exitCompleteError,
    [
      enterCompleteError,
      exitCompleteError,
      fileError,
      hideError,
      instanceError,
      showError,
    ],
  );

  const fail = useCallback(
    (error: Error) => {
      if (failureRef.current) return;
      failureRef.current = error;
      readinessRef.current.reject(error);

      const operation = pendingOperationRef.current;
      pendingOperationRef.current = null;
      operation?.reject(error);
      onFailure?.(error);
    },
    [onFailure],
  );

  useEffect(() => {
    if (bindingError) fail(bindingError);
  }, [bindingError, fail]);

  useEffect(() => {
    if (riveFile && instance && riveViewRef && !bindingError) {
      readinessRef.current.resolve();
    }
  }, [bindingError, instance, riveFile, riveViewRef]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      const error = new WelcomingIllustrationCancelledError();
      readinessRef.current.reject(error);
      pendingOperationRef.current?.reject(error);
      pendingOperationRef.current = null;
    };
  }, []);

  const runOperation = useCallback(
    async (kind: OperationKind) => {
      await readinessRef.current.promise;

      if (!mountedRef.current) {
        throw new WelcomingIllustrationCancelledError();
      }
      if (failureRef.current) throw failureRef.current;
      const readyRiveView = riveViewRefLatest.current;
      if (!readyRiveView) {
        throw new Error('Rive view is not ready.');
      }
      if (pendingOperationRef.current) {
        throw new Error('A welcoming illustration operation is already active.');
      }

      return new Promise<void>((resolve, reject) => {
        const operation: PendingOperation = {
          id: ++operationIdRef.current,
          kind,
          resolve,
          reject,
        };
        pendingOperationRef.current = operation;

        try {
          if (kind === 'show') triggerShowRef.current();
          else triggerHideRef.current();
          readyRiveView.playIfNeeded();
        } catch (cause) {
          if (pendingOperationRef.current?.id === operation.id) {
            pendingOperationRef.current = null;
          }
          const error =
            cause instanceof Error ? cause : new Error('Rive trigger failed.');
          reject(error);
          fail(error);
        }
      });
    },
    [fail],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      show: () => runOperation('show'),
      hide: () => runOperation('hide'),
    }),
    [runOperation],
  );

  const handleRuntimeError = useCallback(
    (error: { message: string }) => {
      fail(new Error(error.message));
    },
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
          accessibilityLabel={accessibilityLabel}
          autoPlay
          dataBind={instance}
          file={riveFile}
          fit={Fit.Contain}
          hybridRef={setHybridRef}
          onError={handleRuntimeError}
          stateMachineName={WELCOMING_STATE_MACHINE}
          style={styles.rive}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  rive: {
    width: '100%',
    height: '100%',
  },
});
