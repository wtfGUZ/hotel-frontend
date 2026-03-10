import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Check, Clock, User } from 'lucide-react';

export default function NotificationStack({ hotelData }) {
    const { theme, darkMode } = useTheme();
    const { reservations, acknowledgeReservationAPI, rooms, roomCategories, getGuestName } = hotelData;
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Obliczaj czas naprzód co 60 sekund
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (createdAtString) => {
        if (!createdAtString) return 'przed chwilą';
        const diffMs = now.getTime() - new Date(createdAtString).getTime();
        if (diffMs < 60000) return 'przed chwilą';
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min temu`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} godz temu`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} dni temu`;
    };

    // Filter unacknowledged ical reservations and moved reservations
    const newReservations = reservations.filter(r => r.isNewIcal === true);
    const movedReservations = reservations.filter(r => r.isMovedIcal === true);

    if (newReservations.length === 0 && movedReservations.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2 md:p-0">
            {newReservations.map(res => {
                const room = rooms.find(r => String(r.id) === String(res.roomId));
                const categoryName = roomCategories?.find(c => c.id === room?.categoryId)?.name || room?.name || 'Nieznany pokój';
                const checkInDate = new Date(res.checkIn).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                const checkOutDate = new Date(res.checkOut).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                const guestName = getGuestName(res.guestId);
                const timeAgo = getTimeAgo(res.createdAt);

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
                            <p className="text-xs opacity-80 truncate mb-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" /> {guestName}
                            </p>
                            <p className="text-xs opacity-80 truncate mb-0.5">
                                Pokój {room?.number} ({categoryName})
                            </p>
                            <p className={`text-xs font-semibold mb-1.5 pb-1.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                {checkInDate} - {checkOutDate}
                            </p>
                            <p className="text-[10px] opacity-60 flex items-center gap-1 mb-2">
                                <Clock className="w-3 h-3" /> {timeAgo}
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

            {movedReservations.map(res => {
                const room = rooms.find(r => String(r.id) === String(res.roomId));
                const categoryName = roomCategories?.find(c => c.id === room?.categoryId)?.name || room?.name || 'Nieznany pokój';
                const guestName = getGuestName(res.guestId);
                const timeAgo = getTimeAgo(res.createdAt); // Lepsze by było modifiedAt, ale createdAt nie szkodzi

                return (
                    <div
                        key={`moved-${res.id}`}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border-l-4 border-amber-500 transform transition-all duration-300 translate-y-0 opacity-100 ${darkMode ? 'bg-amber-900/40 border-amber-600' : 'bg-white'}`}
                    >
                        <div className={`p-2 rounded-full shrink-0 ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                            <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm mb-1 truncate text-amber-600 dark:text-amber-400">Rezerwacja przeniesiona</h4>
                            <p className="text-xs opacity-80 mb-0.5 whitespace-normal">
                                Z powodu nadpisywania z Bookingu, pokój gościa: <br />
                                <strong>{guestName}</strong> został automatycznie zmieniony.
                            </p>
                            <p className="text-xs opacity-80 truncate mb-1.5 pb-1.5 border-b border-amber-500/20">
                                Nowy pokój: <strong>{room?.number} ({categoryName})</strong>
                            </p>
                            <button
                                onClick={() => acknowledgeReservationAPI(res.id)}
                                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600`}
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
