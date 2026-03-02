import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function GuestsView({ hotelData, modalData }) {
    const { theme } = useTheme();
    const { guests, reservations } = hotelData;
    const { openModal, setDeleteConfirm } = modalData;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Baza Gości</h2>
                <button
                    onClick={() => openModal('guest')}
                    className={`px-4 py-3 rounded-lg ${theme.button} flex items-center justify-center gap-2 touch-manipulation`}
                >
                    <Plus className="w-5 h-5" />
                    <span>Dodaj Gościa</span>
                </button>
            </div>

            <div className="grid gap-4">
                {guests.map(guest => {
                    const guestReservations = reservations.filter(r => r.guestId === guest.id);

                    return (
                        <div key={guest.id} className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{guest.firstName} {guest.lastName}</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className={theme.textSecondary}>Email: </span>
                                            <span>{guest.email}</span>
                                        </div>
                                        <div>
                                            <span className={theme.textSecondary}>Telefon: </span>
                                            <span>{guest.phone}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={theme.textSecondary}>Liczba pobytów: </span>
                                            <span className="font-medium">{guestReservations.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal('guest', guest)}
                                        className={`p-2 rounded-lg ${theme.buttonSecondary}`}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'guest', id: guest.id })}
                                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
