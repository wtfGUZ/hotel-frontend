import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor, getStatusText } from '../../utils/utils';

export default function ReservationsView({ hotelData, modalData }) {
    const { theme } = useTheme();
    const { rooms, guests, reservations } = hotelData;
    const { openModal, setDeleteConfirm, setGroupEditChoice } = modalData;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);

    const filteredReservations = reservations.filter(r => {
        const guest = guests.find(g => String(g.id) === String(r.guestId));
        const room = rooms.find(rm => String(rm.id) === String(r.roomId));
        const matchesSearch = !searchTerm ||
            (guest && `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (room && room.number.includes(searchTerm));
        const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div>
            {/* TOOLBAR */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 sm:mb-6 bg-transparent">

                {/* LEFT SIDE: Search & Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    {/* Search Input (Fixed shorter width on large screens) */}
                    <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj po nazwisku/pokoju..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none transition-shadow`}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none shrink-0 transition-shadow`}
                    >
                        <option value="all">Wszystkie statusy</option>
                        <option value="preliminary">Wstępna</option>
                        <option value="confirmed">Potwierdzona</option>
                        <option value="paid">Opłacona</option>
                        <option value="completed">Zakończona</option>
                    </select>

                    <div className="text-sm text-gray-400 hidden lg:block whitespace-nowrap ml-2">
                        Znaleziono: {filteredReservations.length}
                    </div>
                </div>

                {/* RIGHT SIDE: Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button
                        onClick={() => {
                            if (selectedIds.length === filteredReservations.length && filteredReservations.length > 0) {
                                setSelectedIds([]);
                            } else {
                                setSelectedIds(filteredReservations.map(r => r.id));
                            }
                        }}
                        className={`px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium ${theme.buttonSecondary} transition-opacity hover:opacity-80 shrink-0`}
                    >
                        {selectedIds.length === filteredReservations.length && filteredReservations.length > 0 ? 'Odznacz' : 'Zaznacz wszystkie'}
                    </button>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setDeleteConfirm({
                                type: 'bulk-reservations',
                                ids: selectedIds,
                                message: `Czy na pewno chcesz usunąć zaznaczone rezerwacje (${selectedIds.length} szt.)?`
                            })}
                            className={`px-3 py-2 sm:py-2.5 rounded-lg text-sm ${theme.buttonDanger} flex items-center gap-1.5 shrink-0 hover:bg-red-600 transition-colors`}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Usuń</span> ({selectedIds.length})
                        </button>
                    )}

                    <button
                        onClick={() => openModal('reservation')}
                        className={`px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium ${theme.button} flex items-center gap-2 shrink-0 touch-manipulation hover:opacity-90 transition-opacity whitespace-nowrap`}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nowa Rezerwacja</span>
                    </button>
                </div>
            </div>

            <div className="grid gap-5 sm:gap-6">
                {filteredReservations.map(reservation => {
                    const guest = guests.find(g => String(g.id) === String(reservation.guestId));
                    const room = rooms.find(r => String(r.id) === String(reservation.roomId));

                    return (
                        <div
                            key={reservation.id}
                            onClick={() => {
                                if (selectedIds.includes(reservation.id)) {
                                    setSelectedIds(prev => prev.filter(id => id !== reservation.id));
                                } else {
                                    setSelectedIds(prev => [...prev, reservation.id]);
                                }
                            }}
                            className={`${theme.card} rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${selectedIds.includes(reservation.id) ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''}`}
                        >

                            {/* TOP ROW: Name + Actions */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <h3 className="text-lg sm:text-xl font-bold leading-snug truncate">
                                            {reservation.payment === 'booking' || reservation.isNewIcal ? '🅱️ ' : (reservation.groupId ? '👥 ' : '')}
                                            {guest ? `${guest.firstName} ${guest.lastName}` : 'Nieznany'}
                                        </h3>
                                        <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                                            {getStatusText(reservation.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions – top-right always */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (reservation.groupId) {
                                                const siblings = reservations.filter(s => s.groupId === reservation.groupId && s.id !== reservation.id);
                                                if (siblings.length > 0) {
                                                    setGroupEditChoice({ reservation, siblings });
                                                    return;
                                                }
                                            }
                                            openModal('reservation', reservation);
                                        }}
                                        className={`p-2 rounded-lg ${theme.buttonSecondary} hover:opacity-80 transition-opacity`}
                                        title="Edytuj"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm({ type: 'reservation', id: reservation.id });
                                        }}
                                        className={`p-2 rounded-lg ${theme.buttonDanger}`}
                                        title="Usuń"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* DETAILS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs ${theme.textSecondary}`}>Pokój</span>
                                    <span className="font-medium">{room ? `${room.number} – ${room.name}` : 'Nieznany'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs ${theme.textSecondary}`}>Pobyt</span>
                                    <span className="font-medium">
                                        {new Date(reservation.checkIn).toLocaleDateString('pl-PL')} – {new Date(reservation.checkOut).toLocaleDateString('pl-PL')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs ${theme.textSecondary}`}>Płatność</span>
                                    <span className="font-medium">
                                        {reservation.status !== 'paid' ? 'Brak (nieopłacona)' :
                                            reservation.payment === 'card' ? 'Karta' :
                                                reservation.payment === 'cash' ? 'Gotówka' :
                                                    reservation.payment === 'transfer' ? 'Przelew' :
                                                        reservation.payment === 'invoice' ? 'Faktura' :
                                                            reservation.payment === 'booking' ? 'Booking.com' : 'Brak'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs ${theme.textSecondary}`}>Śniadanie</span>
                                    <span className="font-medium">{reservation.breakfast ? 'Tak' : 'Nie'}</span>
                                </div>
                            </div>

                            {reservation.notes && (
                                <div className="mt-4 text-sm">
                                    <span className={theme.textSecondary}>Notatki: </span>
                                    <span>{reservation.notes}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
