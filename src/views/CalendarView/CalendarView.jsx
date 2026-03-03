import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { addDays, formatDate, getStatusColor } from '../../utils/utils';

export default function CalendarView({ hotelData, modalData }) {
    const { theme, darkMode } = useTheme();
    const { rooms, reservations, roomStatuses, toggleRoomStatus, getRoomStatus, getGuestName, isLoading } = hotelData;
    const { openModal, setFormData } = modalData;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [jumpStep, setJumpStep] = useState(7); // Domyślnie 7, zostanie nadpisane przez useEffect
    const dragInfo = useRef({ isDragging: false, roomId: null, startDate: null, endDate: null });
    const [dragState, setDragState] = useState({ roomId: null, startDate: null, endDate: null });

    // Obliczanie docelowego "skoku" w dniach na podstawie szerokości okna
    useEffect(() => {
        const updateJumpStep = () => {
            if (window.innerWidth < 640) {
                setJumpStep(1); // Telefon: widać ~1 dzień na raz (zależy od scrolla, ale 1-3 to dobra wartość na przewijanie dotykiem)
            } else if (window.innerWidth < 1024) {
                setJumpStep(3); // Tablet: ~3 dni
            } else {
                setJumpStep(7); // Desktop: cały tydzień
            }
        };

        // Oblicz przy montowaniu komponentu
        updateJumpStep();

        // Dodaj nasłuchiwacz zmiany rozmiaru okna
        window.addEventListener('resize', updateJumpStep);
        return () => window.removeEventListener('resize', updateJumpStep);
    }, []);

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

    // --- Skeleton Loader ---
    if (isLoading) {
        const skeletonRows = 8;
        const skeletonCols = 6;
        return (
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div className={`h-8 w-48 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-10 w-20 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
                <div className={`${theme.card} rounded-xl shadow-xl overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[390px] sm:min-w-[640px]">
                            <thead>
                                <tr>
                                    <th className={`w-[50px] sm:w-20 px-2 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <div className={`h-4 w-10 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                    </th>
                                    {Array.from({ length: skeletonCols }).map((_, i) => (
                                        <th key={i} className={`px-2 py-3 min-w-[50px] sm:min-w-[80px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                            <div className={`h-3 w-8 rounded animate-pulse mx-auto mb-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                            <div className={`h-3 w-6 rounded animate-pulse mx-auto ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                                    <tr key={rowIdx} className={`border-t ${darkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
                                        <td className={`px-2 py-2 sticky left-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className={`h-4 w-10 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                        </td>
                                        {Array.from({ length: skeletonCols }).map((_, colIdx) => (
                                            <td key={colIdx} className="px-1 py-2">
                                                {colIdx === 1 ? (
                                                    <div className={`h-8 rounded-md animate-pulse ${darkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}
                                                        style={{ width: `${200 + (rowIdx % 3) * 50}%`, marginLeft: '50%' }}
                                                    />
                                                ) : colIdx === 3 && rowIdx % 2 === 0 ? (
                                                    <div className={`h-8 rounded-md animate-pulse ${darkMode ? 'bg-yellow-900/40' : 'bg-yellow-100'}`}
                                                        style={{ width: '150%' }}
                                                    />
                                                ) : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className={`mt-4 flex items-center justify-center gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Łączenie z serwerem... (pierwsze ładowanie może potrwać chwilę)</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div></div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -jumpStep))}
                        className={`px-2 sm:px-4 py-2 rounded-lg ${theme.buttonSecondary} flex flex-1 sm:flex-none justify-center items-center gap-1 min-w-[3rem]`}
                        title={`Cofnij o ${jumpStep} dni`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Wstecz ({jumpStep}d)</span>
                    </button>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.button} flex-1 sm:flex-none justify-center items-center text-xs sm:text-base`}
                        title="Zawsze powrót do dzisiejszego dnia"
                    >
                        <span className="sm:hidden">Wróć do dzisiaj</span>
                        <span className="hidden sm:inline">Wróć do dzisiaj</span>
                    </button>

                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, jumpStep))}
                        className={`px-2 sm:px-4 py-2 rounded-lg ${theme.buttonSecondary} flex flex-1 sm:flex-none justify-center items-center gap-1 min-w-[3rem]`}
                        title={`Naprzód o ${jumpStep} dni`}
                    >
                        <span className="hidden sm:inline">Naprzód ({jumpStep}d)</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => openModal('reservation')}
                        className={`px-3 sm:px-4 py-2 rounded-lg ${theme.button} flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto mt-2 sm:mt-0`}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nowa Rezerwacja</span>
                        <span className="sm:hidden">Dodaj Rezerwację</span>
                    </button>
                </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-xl overflow-hidden`}>
                <div className="overflow-x-auto relative">
                    <table className="w-full min-w-[390px] sm:min-w-[640px]">
                        <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}>
                            <tr>
                                <th className={`px-1 sm:px-2 py-2 text-left font-semibold sticky left-0 z-20 text-[10px] sm:text-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} w-[50px] sm:w-auto min-w-[50px] sm:min-w-[auto]`}>Pokój</th>
                                {calendarDays.map((day, idx) => {
                                    const isToday = formatDate(day) === formatDate(new Date());
                                    const breakfastCount = getBreakfastCount(day);

                                    return (
                                        <th
                                            key={idx}
                                            className={`px-1 py-1 sm:px-2 sm:py-2 text-center text-[10px] sm:text-xs font-medium min-w-[50px] sm:min-w-[80px] ${isToday ? (darkMode ? 'bg-blue-600/20' : 'bg-blue-100 text-blue-800') : ''}`}
                                        >
                                            <div className="text-[10px] sm:text-xs">{day.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                            <div className="text-[9px] sm:text-[10px] opacity-70">{day.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</div>
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
                                    <tr key={room.id} className={`border-t ${darkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
                                        <td className={`px-0.5 sm:px-3 py-1 sm:py-1.5 font-medium sticky left-0 z-30 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} w-[50px] sm:w-auto max-w-[50px] sm:max-w-none`}>
                                            <div className={`flex items-center justify-start gap-0.5 sm:gap-1.5 sm:pr-2`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRoomStatus(room.id);
                                                    }}
                                                    className={`w-1 h-6 sm:w-1.5 sm:h-12 flex-shrink-0 rounded-full cursor-pointer hover:opacity-80 hover:scale-110 transition-all ${statusColors[roomStatus]} z-30`}
                                                    title={
                                                        roomStatus === 'clean' ? 'Czysty i gotowy (kliknij → Zajęty)' :
                                                            roomStatus === 'occupied' ? 'Zajęty przez gościa (kliknij → Do sprzątania)' :
                                                                'Do sprzątania (kliknij → Czysty)'
                                                    }
                                                />
                                                <div className="w-full overflow-hidden flex flex-col justify-center">
                                                    <div className={`text-[10px] sm:text-xs font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} truncate leading-tight`}>{room.number}</div>
                                                    <div className={`text-[8px] sm:text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-none`} title={room.name}>{room.name}</div>
                                                </div>
                                            </div>
                                        </td>


                                        {calendarDays.map((day, idx) => {
                                            const dateStr = formatDate(day);

                                            const allReservations = reservations.filter(r =>
                                                String(r.roomId) === String(room.id) &&
                                                dateStr >= r.checkIn &&
                                                dateStr < r.checkOut
                                            );

                                            const isToday = formatDate(day) === formatDate(new Date());

                                            // A true conflict only happens when 2+ reservations overlap on the same day
                                            const hasRealConflict = allReservations.length > 1;

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
                                                    className={`px-0.5 py-1 text-center relative ${isToday ? (darkMode ? 'bg-blue-600/10' : 'bg-blue-50') : ''} ${isSelected ? 'bg-blue-500/60 border-l-2 border-r-2 border-blue-500' : 'hover:bg-blue-500/10'} cursor-pointer transition-colors border-r ${darkMode ? 'border-gray-800/30' : 'border-gray-200'} select-none`}
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
                                                    <div className="h-10 relative">
                                                        {reservations.filter(r => {
                                                            if (String(r.roomId) !== String(room.id)) return false;

                                                            const firstVisibleDate = formatDate(calendarDays[0]);
                                                            const lastVisibleDate = formatDate(calendarDays[calendarDays.length - 1]);

                                                            if (r.checkOut <= firstVisibleDate) return false;
                                                            if (r.checkIn >= lastVisibleDate) return false;

                                                            const isFirstVisibleCell = idx === 0;

                                                            if (r.checkIn === dateStr) return true;
                                                            if (r.checkIn < firstVisibleDate && isFirstVisibleCell) return true;

                                                            return false;
                                                        }).map(r => {
                                                            const firstVisibleDate = formatDate(calendarDays[0]);
                                                            const lastVisibleDate = formatDate(calendarDays[calendarDays.length - 1]);

                                                            let startOffset = 0;
                                                            if (r.checkIn >= firstVisibleDate) {
                                                                startOffset = 0.5;
                                                            } else {
                                                                startOffset = 0;
                                                            }

                                                            let endOffset = 0;
                                                            if (r.checkOut <= lastVisibleDate) {
                                                                // Calculate offset using date arithmetic (more robust than findIndex)
                                                                const checkOutDate = new Date(r.checkOut + 'T00:00:00');
                                                                const cellDate = new Date(dateStr + 'T00:00:00');
                                                                const daysDiff = Math.round((checkOutDate - cellDate) / (1000 * 60 * 60 * 24));
                                                                endOffset = daysDiff + 0.5;
                                                            } else {
                                                                endOffset = calendarDays.length - idx;
                                                            }

                                                            const widthInCells = endOffset - startOffset;

                                                            // Calculate actual total duration (in days) to pick font size
                                                            const durationDays = Math.round(
                                                                (new Date(r.checkOut) - new Date(r.checkIn)) / (1000 * 60 * 60 * 24)
                                                            );
                                                            const textSizeClass =
                                                                durationDays <= 1 ? 'text-[9px] px-0.5' :
                                                                    durationDays === 2 ? 'text-[10px] px-1' :
                                                                        'text-xs sm:text-sm px-2';

                                                            return (
                                                                <div
                                                                    key={r.id}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    onMouseUp={(e) => e.stopPropagation()}
                                                                    onClick={(e) => { e.stopPropagation(); openModal('reservation', r); }}
                                                                    className={`absolute top-0 bottom-0 rounded flex items-center justify-center cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all shadow-md border ${getStatusColor(r.status)} pointer-events-auto overflow-hidden`}
                                                                    style={{
                                                                        left: `calc(${startOffset * 100}%)`,
                                                                        width: `calc(${widthInCells * 100}% - 2px)`,
                                                                        zIndex: 20
                                                                    }}
                                                                >
                                                                    <span className={`truncate pointer-events-none font-bold drop-shadow-sm ${textSizeClass}`}>
                                                                        {getGuestName(r.guestId)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
                    <div className="w-4 h-4 rounded bg-yellow-600 border border-yellow-700"></div>
                    <span className="text-sm">Wstępna</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-600 border border-blue-700"></div>
                    <span className="text-sm">Potwierdzona</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-600 border border-green-700"></div>
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
