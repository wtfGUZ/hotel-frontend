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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <h3 className="text-xl font-bold mb-2">{guest.firstName} {guest.lastName}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm w-full">
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

                                <div className="flex sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button
                                        onClick={() => openModal('guest', guest)}
                                        className={`flex-1 sm:flex-none p-3 sm:p-2 rounded-lg flex justify-center items-center ${theme.buttonSecondary}`}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'guest', id: guest.id, hasReservations: guestReservations.length > 0 })}
                                        className={`flex-1 sm:flex-none p-3 sm:p-2 rounded-lg flex justify-center items-center ${theme.buttonDanger}`}
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
