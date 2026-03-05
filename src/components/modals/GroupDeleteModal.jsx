import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GroupDeleteModal({ deleteConfirm, rooms, onDeleteSingle, onDeleteGroup, onCancel }) {
    const { theme } = useTheme();

    if (!deleteConfirm || deleteConfirm.type !== 'groupReservation') return null;

    const allRooms = [deleteConfirm.reservation, ...deleteConfirm.siblings].map(r => {
        const room = rooms.find(rm => rm.id === r.roomId);
        return room ? room.number : r.roomId;
    }).join(', ');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                <h3 className="text-xl font-bold mb-2 text-red-500">Usuwanie rezerwacji grupowej</h3>
                <p className={`${theme.textSecondary} mb-4 text-sm`}>
                    Ta rezerwacja jest częścią grupy ({deleteConfirm.siblings.length + 1} pokoje: {allRooms}).
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onDeleteSingle}
                        className={`w-full px-4 py-3 rounded-lg ${theme.buttonSecondary} border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-colors text-left`}
                    >
                        🗑️ Usuń tylko ten pokój
                    </button>
                    <button
                        type="button"
                        onClick={onDeleteGroup}
                        className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-left shadow-lg hover:shadow-xl"
                    >
                        💣 Usuń całą grupę ({deleteConfirm.siblings.length + 1} pokoje)
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`w-full px-4 py-2 mt-2 rounded-lg text-sm ${theme.textSecondary} hover:opacity-80 transition-opacity`}
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
