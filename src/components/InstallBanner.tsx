import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInstall } from '../hooks/useInstall';
import { isInstallSnoozed, promptInstall, snoozeInstall } from '../utils/install';
import { InstallSteps } from './InstallSteps';

export function InstallBanner() {
  const { canPrompt, standalone, isIOS, inAppBrowser } = useInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(isInstallSnoozed);

  const installable = !standalone && (canPrompt || isIOS);

  // Wait a moment so the banner does not cover the page on first paint.
  useEffect(() => {
    if (!installable || dismissed) return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [installable, dismissed]);

  if (!installable || dismissed || !visible) return null;

  const close = () => {
    snoozeInstall();
    setDismissed(true);
  };

  return (
    <aside className="install-banner" role="dialog" aria-label="Install Mcdopay">
      <button type="button" className="btn btn--ghost btn--icon install-banner__close" onClick={close} aria-label="Close">
        <X size={18} />
      </button>
      <h2 className="install-banner__title">Install Mcdopay</h2>
      {canPrompt ? (
        <>
          <p className="install-banner__text">
            Add it to your home screen to open it faster and use it without internet.
          </p>
          <div className="install-banner__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={async () => {
                const outcome = await promptInstall();
                if (outcome !== 'accepted') close();
              }}
            >
              <Download size={16} />
              Install app
            </button>
            <button type="button" className="btn btn--ghost" onClick={close}>
              Not now
            </button>
          </div>
        </>
      ) : (
        <>
          <InstallSteps inAppBrowser={inAppBrowser} />
          <div className="install-banner__actions">
            <Link to="/settings" className="btn btn--secondary" onClick={close}>
              Open backup settings
            </Link>
            <button type="button" className="btn btn--ghost" onClick={close}>
              Got it
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
