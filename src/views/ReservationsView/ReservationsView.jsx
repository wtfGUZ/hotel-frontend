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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div></div>
                <button
                    onClick={() => openModal('reservation')}
                    className={`px-4 py-3 rounded-lg ${theme.button} flex items-center justify-center gap-2 touch-manipulation`}
                >
                    <Plus className="w-5 h-5" />
                    <span>Nowa Rezerwacja</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Szukaj po nazwisku lub numerze pokoju..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                    <option value="all">Wszystkie statusy</option>
                    <option value="preliminary">Wstępna</option>
                    <option value="confirmed">Potwierdzona</option>
                    <option value="paid">Opłacona</option>
                    <option value="completed">Zakończona</option>
                </select>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (selectedIds.length === filteredReservations.length && filteredReservations.length > 0) {
                                setSelectedIds([]);
                            } else {
                                setSelectedIds(filteredReservations.map(r => r.id));
                            }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.buttonSecondary} transition-opacity hover:opacity-80`}
                    >
                        {selectedIds.length === filteredReservations.length && filteredReservations.length > 0 ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setDeleteConfirm({
                                type: 'bulk-reservations',
                                ids: selectedIds,
                                message: `Czy na pewno chcesz usunąć zaznaczone rezerwacje (${selectedIds.length} szt.)?`
                            })}
                            className={`px-4 py-2 rounded-lg ${theme.buttonDanger} flex items-center gap-2`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Usuń zaznaczone ({selectedIds.length})
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-400 hidden sm:block">
                    Znaleziono: {filteredReservations.length}
                </div>
            </div>

            <div className="grid gap-5 sm:gap-6">
                {filteredReservations.map(reservation => {
                    const guest = guests.find(g => String(g.id) === String(reservation.guestId));
                    const room = rooms.find(r => String(r.id) === String(reservation.roomId));

                    return (
                        <div key={reservation.id} className={`${theme.card} rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all ${selectedIds.includes(reservation.id) ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''}`}>

                            {/* TOP ROW: Name + Buttons & Checkbox */}
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
                                    {/* Unified checkbox */}
                                    <div className="relative flex items-center justify-center w-8 h-8 shrink-0 mr-1 sm:mr-2">
                                        <input
                                            type="checkbox"
                                            className={`peer appearance-none w-6 h-6 border-2 rounded shadow-sm cursor-pointer transition-all ${theme.darkMode ? 'border-gray-500 bg-gray-800' : 'border-gray-300 bg-white'} checked:bg-blue-600 checked:border-blue-600 hover:border-blue-500`}
                                            checked={selectedIds.includes(reservation.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(prev => [...prev, reservation.id]);
                                                } else {
                                                    setSelectedIds(prev => prev.filter(id => id !== reservation.id));
                                                }
                                            }}
                                        />
                                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
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
                                        onClick={() => setDeleteConfirm({ type: 'reservation', id: reservation.id })}
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
