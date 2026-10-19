import { useEffect, useState, useSyncExternalStore } from 'react';
import { detectEnvironment, getInstallState, subscribeInstall } from '../utils/install';

export function useInstall() {
  const state = useSyncExternalStore(subscribeInstall, getInstallState, getInstallState);
  const [env] = useState(detectEnvironment);
  return {
    canPrompt: state.canPrompt,
    standalone: env.standalone || state.installed,
    isIOS: env.isIOS,
    inAppBrowser: env.inAppBrowser,
  };
}

/** True once the app files are saved on the device and it can open without internet. */
export function useOfflineReady() {
  const [ready, setReady] = useState(
    () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller),
  );
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    navigator.serviceWorker.ready.then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return ready;
}
