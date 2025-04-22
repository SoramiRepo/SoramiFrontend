import React, { useEffect, useState } from 'react';

const InstallPWAButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setShowButton(false);
    };

    if (!showButton) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
            Install Sorami
        </button>
    );
};

export default InstallPWAButton;
