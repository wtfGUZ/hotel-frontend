import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { addDays, formatDate, getStatusColor } from '../../utils/utils';

export default function CalendarView({ hotelData, modalData }) {
    const { theme, darkMode } = useTheme();
    const { rooms, reservations, roomStatuses, toggleRoomStatus, getRoomStatus, getGuestName } = hotelData;
    const { openModal, setFormData } = modalData;

    const [currentDate, setCurrentDate] = useState(new Date());
    const dragInfo = useRef({ isDragging: false, roomId: null, startDate: null, endDate: null });
    const [dragState, setDragState] = useState({ roomId: null, startDate: null, endDate: null });

    const contextRefs = useRef({ openModal, setFormData });
    useEffect(() => {
        contextRefs.current = { openModal, setFormData };
    });

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (dragInfo.current.isDragging) {
                const { roomId, startDate, endDate } = dragInfo.current;
                dragInfo.current.isDragging = false;
                setDragState({ roomId: null, startDate: null, endDate: null });

                if (roomId && startDate && endDate) {
                    const start = startDate <= endDate ? startDate : endDate;
                    const end = startDate <= endDate ? endDate : startDate;

                    // We calculate the checkout as the selection's end date PLUS 1 night
                    // Assuming that clicking "Jun 1" to "Jun 3" means 3 nights -> CheckOut on "Jun 4"
                    const newCheckOut = addDays(new Date(end), 1);

                    contextRefs.current.openModal('reservation', null, {
                        roomId: roomId,
                        checkIn: start,
                        checkOut: formatDate(newCheckOut)
                    });
                }
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = -1; i < 14; i++) {
            days.push(addDays(currentDate, i));
        }
        return days;
    }, [currentDate]);

    const getBreakfastCount = (date) => {
        const dateStr = formatDate(date);
        return reservations.reduce((total, r) => {
            const isInRange = dateStr > r.checkIn && dateStr <= r.checkOut;
            if (isInRange && r.breakfast === true) {
                const room = rooms.find(rm => String(rm.id) === String(r.roomId));
                return total + (room?.maxGuests || 1);
            }
            return total;
        }, 0);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Kalendarz Rezerwacji</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -7))}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.buttonSecondary} flex items-center gap-1`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Tydzień wstecz</span>
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.button}`}
                    >
                        Dzisiaj
                    </button>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 7))}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.buttonSecondary} flex items-center gap-1`}
                    >
                        <span className="hidden sm:inline">Tydzień naprzód</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => openModal('reservation')}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.button} flex items-center gap-2 touch-manipulation`}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nowa Rezerwacja</span>
                        <span className="sm:hidden">Dodaj</span>
                    </button>
                </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-xl overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}>
                            <tr>
                                <th className={`px-3 py-2 text-left font-semibold sticky left-0 z-20 text-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>Pokój</th>
                                {calendarDays.map((day, idx) => {
                                    const isToday = formatDate(day) === formatDate(new Date());
                                    const breakfastCount = getBreakfastCount(day);

                                    return (
                                        <th
                                            key={idx}
                                            className={`px-2 py-2 text-center text-xs font-medium min-w-[80px] ${isToday ? (darkMode ? 'bg-blue-600/20' : 'bg-blue-100 text-blue-800') : ''}`}
                                        >
                                            <div className="text-xs">{day.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                            <div className="text-[10px] opacity-70">{day.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</div>
                                            {breakfastCount > 0 && (
                                                <div className={`text-[10px] mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                                                    🍳 {breakfastCount}
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(room => {
                                const roomStatus = getRoomStatus(room.id);
                                const statusColors = {
                                    clean: 'bg-green-500',
                                    occupied: darkMode ? 'bg-gray-800/50 border-2 border-gray-500' : 'bg-gray-200 border-2 border-gray-400',
                                    dirty: 'bg-red-500'
                                };

                                return (
                                    <tr key={room.id} className={`border-t relative ${darkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
                                        <td className={`px-3 py-1.5 font-medium sticky left-0 z-30 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className={`flex items-center gap-1.5 pr-2`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRoomStatus(room.id);
                                                    }}
                                                    className={`w-1.5 h-12 rounded-full cursor-pointer hover:opacity-80 hover:scale-110 transition-all ${statusColors[roomStatus]} z-30`}
                                                    title={
                                                        roomStatus === 'clean' ? 'Czysty i gotowy (kliknij → Zajęty)' :
                                                            roomStatus === 'occupied' ? 'Zajęty przez gościa (kliknij → Do sprzątania)' :
                                                                'Do sprzątania (kliknij → Czysty)'
                                                    }
                                                />
                                                <div className="min-w-[80px]">
                                                    <div className={`text-xs font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{room.number}</div>
                                                    <div className={`text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} title={room.name}>{room.name}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Container for absolutely positioned reservations */}
                                        <td className="p-0 border-0 absolute left-[120px] right-0 h-full pointer-events-none z-10">
                                            {reservations
                                                .filter(r => String(r.roomId) === String(room.id))
                                                .map(r => {
                                                    const firstDayStr = formatDate(calendarDays[0]);
                                                    const lastDayStr = formatDate(calendarDays[calendarDays.length - 1]);

                                                    // Only render if reservation overlaps with visible calendar days
                                                    if (r.checkOut <= firstDayStr || r.checkIn >= lastDayStr) return null;

                                                    // Calculate precise offset and width
                                                    const totalDays = calendarDays.length;

                                                    // Find index of checkIn (can be fractional/negative)
                                                    let startIndex = calendarDays.findIndex(d => formatDate(d) === r.checkIn);
                                                    if (startIndex === -1 && r.checkIn < firstDayStr) startIndex = 0; // Starts before view

                                                    let endIndex = calendarDays.findIndex(d => formatDate(d) === r.checkOut);
                                                    if (endIndex === -1 && r.checkOut > lastDayStr) endIndex = totalDays; // Ends after view

                                                    // Left position (starts in middle of the check-in day)
                                                    const leftPercentage = (startIndex + 0.5) * (100 / totalDays);

                                                    // Width (ends in middle of checkout day)
                                                    const widthPercentage = ((endIndex + 0.5) - (startIndex + 0.5)) * (100 / totalDays);

                                                    return (
                                                        <div
                                                            key={r.id}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onMouseUp={(e) => e.stopPropagation()}
                                                            onClick={(e) => { e.stopPropagation(); openModal('reservation', r); }}
                                                            className={`absolute top-1 bottom-1 rounded flex items-center justify-center text-[10px] font-medium cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all shadow-md ${getStatusColor(r.status)} pointer-events-auto overflow-hidden`}
                                                            style={{
                                                                left: `${leftPercentage}%`,
                                                                width: `${widthPercentage}%`,
                                                                zIndex: 20
                                                            }}
                                                        >
                                                            <span className="px-2 truncate pointer-events-none text-white drop-shadow-md">
                                                                {getGuestName(r.guestId)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </td>
                                        {calendarDays.map((day, idx) => {
                                            const dateStr = formatDate(day);

                                            const allReservations = reservations.filter(r =>
                                                String(r.roomId) === String(room.id) &&
                                                dateStr >= r.checkIn &&
                                                dateStr <= r.checkOut
                                            );

                                            const checkOutReservation = allReservations.find(r => dateStr === r.checkOut);
                                            const checkInOrFullReservation = allReservations.find(r =>
                                                dateStr === r.checkIn || (dateStr > r.checkIn && dateStr < r.checkOut)
                                            );

                                            const isToday = formatDate(day) === formatDate(new Date());

                                            const hasRealConflict = allReservations.length > 2 ||
                                                (allReservations.length === 2 && (!checkOutReservation || !checkInOrFullReservation));

                                            const isSelected = dragState.roomId === room.id &&
                                                dragState.startDate &&
                                                dragState.endDate &&
                                                (
                                                    (dateStr >= dragState.startDate && dateStr <= dragState.endDate) ||
                                                    (dateStr <= dragState.startDate && dateStr >= dragState.endDate)
                                                );

                                            return (
                                                <td
                                                    key={idx}
                                                    className={`px-0.5 py-1 text-center relative ${isToday ? (darkMode ? 'bg-blue-600/10' : 'bg-blue-50') : ''} ${isSelected ? 'bg-blue-500/40 border-l-2 border-r-2 border-blue-500' : 'hover:bg-blue-500/10'} cursor-pointer transition-colors border-r ${darkMode ? 'border-gray-800/30' : 'border-gray-200'} select-none`}
                                                    onMouseDown={(e) => {
                                                        if (e.button !== 0) return; // Only left click

                                                        // Skoro e.stopPropagation() jest na wizualnych blokach (divach) rezerwacji, 
                                                        // każdy kliknięcie, które tu dociera, to kliknięcie w absolutnie pusty dzień 
                                                        // LUB w "pustą" wolną połówkę dnia przyjazdu/wyjazdu kogoś innego.
                                                        if (!hasRealConflict) {
                                                            dragInfo.current = { isDragging: true, roomId: room.id, startDate: dateStr, endDate: dateStr };
                                                            setDragState({ roomId: room.id, startDate: dateStr, endDate: dateStr });
                                                        }
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (dragInfo.current.isDragging && dragInfo.current.roomId === room.id) {
                                                            dragInfo.current.endDate = dateStr;
                                                            setDragState({ ...dragInfo.current });
                                                        }
                                                    }}
                                                >
                                                    <div className="h-10 relative"></div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
                    <span className="text-sm">Wstępna</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div>
                    <span className="text-sm">Potwierdzona</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
                    <span className="text-sm">Opłacona</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-600 border-2 border-red-500 animate-pulse"></div>
                    <span className="text-sm">⚠️ Konflikt</span>
                </div>
                <div className="h-6 w-px bg-gray-600 mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-green-500"></div>
                    <span className="text-sm">Pokój czysty</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-6 rounded-full border-2 ${darkMode ? 'bg-gray-800/50 border-gray-500' : 'bg-gray-200 border-gray-400'}`}></div>
                    <span className="text-sm">Zajęty</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-red-500"></div>
                    <span className="text-sm">Do sprzątania</span>
                </div>
                <div className="h-6 w-px bg-gray-600 mx-2"></div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30`}>
                    <span className="text-xs">ℹ️ Check-in: 2. połowa dnia | Check-out: 1. połowa dnia</span>
                </div>
            </div>
        </div >
    );
}
