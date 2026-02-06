import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed or dismissed
    const isDismissed = localStorage.getItem('installPromptDismissed');
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

    // If app was uninstalled, clear the dismissed flag
    if (!isInstalled && isDismissed) {
      localStorage.removeItem('installPromptDismissed');
    }

    if (isDismissed && isInstalled) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.setItem('installPromptDismissed', 'true');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show on desktop or if no prompt available
  if (!isMobile || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed mb-10 bottom-[50%] left-4 right-4 z-[60] animate-fade-in">
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl shadow-2xl p-4 border border-white/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="bg-white/20 rounded-full p-2.5 shrink-0">
            <Download className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">Install DRIVE Ghana</h3>
            <p className="text-xs text-primary-foreground/90 mb-3">
              Get quick access and work offline. Install our app for the best experience.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Install Now
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
