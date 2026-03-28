import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui/button';
import { RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    useEffect(() => {
        if (needRefresh) {
            toast("Update Available", {
                description: "A newer version of the app is available. Please refresh to receive it.",
                action: {
                    label: "Update Now",
                    onClick: () => updateServiceWorker(true),
                },
                duration: Infinity,
            });
        }
    }, [needRefresh, updateServiceWorker]);

    if (!offlineReady && !needRefresh) return null;

    return null; // Using Sonner toast for the UI now
}

export default ReloadPrompt;
