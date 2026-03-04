import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Check } from 'lucide-react';

export default function NotificationStack({ hotelData }) {
    const { theme, darkMode } = useTheme();
    const { reservations, acknowledgeReservationAPI, rooms, roomCategories } = hotelData;

    // Filter unacknowledged ical reservations
    const newReservations = reservations.filter(r => r.isNewIcal === true);

    if (!newReservations || newReservations.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2 md:p-0">
            {newReservations.map(res => {
                const room = rooms.find(r => String(r.id) === String(res.roomId));
                const categoryName = roomCategories?.find(c => c.id === room?.categoryId)?.name || room?.name || 'Nieznany pokój';
                const checkInDate = new Date(res.checkIn).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                const checkOutDate = new Date(res.checkOut).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

                return (
                    <div
                        key={res.id}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border-l-4 border-blue-500 transform transition-all duration-300 translate-y-0 opacity-100 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                    >
                        <div className={`p-2 rounded-full shrink-0 ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm mb-1 truncate">Nowa rezerwacja z iCal</h4>
                            <p className="text-xs opacity-80 truncate mb-0.5">
                                Pokój {room?.number} ({categoryName})
                            </p>
                            <p className="text-xs font-semibold opacity-90 mb-2">
                                {checkInDate} - {checkOutDate}
                            </p>
                            <button
                                onClick={() => acknowledgeReservationAPI(res.id)}
                                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${theme.button}`}
                            >
                                <Check className="w-4 h-4" />
                                Potwierdź odczytanie
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
