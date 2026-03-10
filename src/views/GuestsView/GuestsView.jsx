import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function GuestsView({ hotelData, modalData }) {
    const { theme } = useTheme();
    const { guests, reservations } = hotelData;
    const { openModal, setDeleteConfirm } = modalData;

    const [searchTerm, setSearchTerm] = useState('');

    const filteredGuests = guests.filter(g => {
        const term = searchTerm.toLowerCase();
        return `${g.firstName} ${g.lastName}`.toLowerCase().includes(term) ||
            (g.email && g.email.toLowerCase().includes(term)) ||
            (g.phone && g.phone.includes(term)) ||
            (g.pesel && g.pesel.toLowerCase().includes(term)) ||
            (g.idNumber && g.idNumber.toLowerCase().includes(term));
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="relative w-full sm:w-72">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`} />
                    <input
                        type="text"
                        placeholder="Szukaj gościa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm sm:text-base`}
                    />
                </div>
                <button
                    onClick={() => openModal('guest')}
                    className={`px-4 py-3 rounded-lg ${theme.button} flex items-center justify-center gap-2 touch-manipulation`}
                >
                    <Plus className="w-5 h-5" />
                    <span>Dodaj Gościa</span>
                </button>
            </div>

            <div className="grid gap-4">
                {filteredGuests.length > 0 ? filteredGuests.map(guest => {
                    const guestReservations = reservations.filter(r => r.guestId === guest.id);

                    return (
                        <div key={guest.id} className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <h3 className="text-xl font-bold mb-2">{guest.firstName} {guest.lastName}</h3>
                                    <div className="flex flex-col gap-2 text-sm w-full">
                                        <div>
                                            <span className={theme.textSecondary}>Email: </span>
                                            <span>{guest.email || <span className="text-gray-500 italic">Brak</span>}</span>
                                        </div>
                                        <div>
                                            <span className={theme.textSecondary}>Telefon: </span>
                                            <span>{guest.phone || <span className="text-gray-500 italic">Brak</span>}</span>
                                        </div>
                                        <div>
                                            <span className={theme.textSecondary}>PESEL: </span>
                                            <span>{guest.pesel || <span className="text-gray-500 italic">Brak</span>}</span>
                                        </div>
                                        <div>
                                            <span className={theme.textSecondary}>Nr dokumentu: </span>
                                            <span>{guest.idNumber || <span className="text-gray-500 italic">Brak</span>}</span>
                                        </div>
                                        <div>
                                            <span className={theme.textSecondary}>🛏️ Liczba pobytów: </span>
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
                }) : (
                    <div className={`${theme.card} p-8 text-center rounded-xl text-gray-500`}>
                        Brak gości pasujących do wyszukiwania.
                    </div>
                )}
            </div>
        </div>
    );
}
