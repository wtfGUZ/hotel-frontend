import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function AlertModal({ message, onClose }) {
    const { theme } = useTheme();

    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                <h3 className="text-xl font-bold mb-4 text-yellow-500">Uwaga</h3>
                <p className={`${theme.textSecondary} mb-6 whitespace-pre-line`}>{message}</p>
                <button onClick={onClose} className={`w-full px-6 py-3 rounded-lg ${theme.button} font-medium transition-opacity hover:opacity-80`}>OK</button>
            </div>
        </div>
    );
}
