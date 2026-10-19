import { Share } from 'lucide-react';

interface InstallStepsProps {
  inAppBrowser: boolean;
}

/** iPhone has no install button, so spell out the steps. */
export function InstallSteps({ inAppBrowser }: InstallStepsProps) {
  return (
    <>
      {inAppBrowser && (
        <p className="install-note">
          You are in an in-app browser. Open this page in Safari first, because other apps cannot add it to your
          Home Screen.
        </p>
      )}
      <ol className="install-steps">
        <li>
          Tap the <Share size={14} className="install-steps__icon" aria-label="Share" /> Share button in Safari.
        </li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong>. Mcdopay now opens like an app and works offline.</li>
      </ol>
      <p className="install-note">
        The Home Screen app keeps its own data, so it starts empty. Download a backup from Settings first, then
        restore it inside the new app.
      </p>
    </>
  );
}
