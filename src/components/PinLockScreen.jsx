import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function PinLockScreen({ verifyPinAPI, onUnlock }) {
    const { theme } = useTheme();
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (!pinInput) return;
        setIsVerifying(true);
        setPinError('');
        try {
            const success = await verifyPinAPI(pinInput);
            if (success) {
                onUnlock();
            } else {
                setPinError('Nieprawidłowy kod PIN.');
            }
        } catch (err) {
            setPinError('Wystąpił błąd komunikacji z serwerem.');
        } finally {
            setIsVerifying(false);
            setPinInput('');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className={`${theme.card} rounded-2xl shadow-xl w-full max-w-sm p-8 text-center border-t-4 border-blue-500`}>
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-500">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Panel Zablokowany</h2>
                <p className={`text-sm ${theme.textSecondary} mb-6`}>Wprowadź kod PIN (domyślnie: 1234), aby uzyskać dostęp do ustawień systemu.</p>

                <form onSubmit={handlePinSubmit} className="space-y-4">
                    <input
                        type="password"
                        inputMode="numeric"
                        autoFocus
                        placeholder="****"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className={`w-full text-center tracking-[1em] font-bold text-xl px-4 py-3 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                    {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
                    <button
                        type="submit"
                        disabled={isVerifying || !pinInput}
                        className={`w-full py-3 rounded-lg font-medium transition-opacity ${theme.button} disabled:opacity-50 flex justify-center items-center gap-2`}
                    >
                        {isVerifying ? 'Weryfikacja...' : 'Odblokuj Ustawienia'}
                    </button>
                </form>
            </div>
        </div>
    );
}
