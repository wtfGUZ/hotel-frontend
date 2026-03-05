import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GroupEditChoiceModal({ groupEditChoice, rooms, onEditSingle, onEditGroup, onCancel }) {
    const { theme } = useTheme();

    if (!groupEditChoice) return null;

    const allRooms = [groupEditChoice.reservation, ...groupEditChoice.siblings].map(r => {
        const room = rooms.find(rm => rm.id === r.roomId);
        return room ? room.number : r.roomId;
    }).join(', ');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                <h3 className="text-xl font-bold mb-2">Rezerwacja grupowa</h3>
                <p className={`${theme.textSecondary} mb-4 text-sm`}>
                    Ta rezerwacja jest częścią grupy ({groupEditChoice.siblings.length + 1} pokoje: {allRooms}).
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onEditSingle}
                        className={`w-full px-4 py-3 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-80 transition-opacity text-left`}
                    >
                        ✏️ Edytuj tylko ten pokój
                    </button>
                    <button
                        onClick={onEditGroup}
                        className={`w-full px-4 py-3 rounded-lg ${theme.button} font-medium hover:opacity-80 transition-opacity text-left`}
                    >
                        📋 Edytuj całą grupę ({groupEditChoice.siblings.length + 1} pokoje)
                    </button>
                    <button
                        onClick={onCancel}
                        className={`w-full px-4 py-2 rounded-lg text-sm ${theme.textSecondary} hover:opacity-80 transition-opacity`}
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
