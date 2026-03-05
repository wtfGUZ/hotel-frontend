import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function DeleteConfirmModal({ deleteConfirm, onConfirm, onCancel }) {
    const { theme } = useTheme();

    if (!deleteConfirm || deleteConfirm.type === 'groupReservation') return null;

    const typeLabels = {
        reservation: 'tę rezerwację',
        room: 'ten pokój',
        guest: 'tego gościa',
        'bulk-reservations': 'wybrane rezerwacje'
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                <h3 className="text-xl font-bold mb-4">Potwierdzenie usunięcia</h3>

                {deleteConfirm.type === 'guest' && deleteConfirm.hasReservations ? (
                    <div className="text-red-500 font-bold mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-sm">
                        ⚠️ UWAGA: Ten gość posiada przypisane rezerwacje. Usunięcie go spowoduje GŁĘBOKIE usunięcie wszystkich powiązanych z nim rezerwacji z kalendarza i bazy!
                    </div>
                ) : null}

                <p className={`${theme.textSecondary} mb-6`}>
                    {deleteConfirm.message || `Czy na pewno chcesz usunąć ${typeLabels[deleteConfirm.type] || 'ten element'}?`}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 rounded-lg ${theme.buttonDanger}`}
                    >
                        {deleteConfirm.type === 'clearAll' ? 'Tak, wyczyść wszystko' : 'Usuń'}
                    </button>
                    <button onClick={onCancel} className={`flex-1 px-6 py-3 rounded-lg ${theme.buttonSecondary} font-medium transition-opacity hover:opacity-80`}>
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
