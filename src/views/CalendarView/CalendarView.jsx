import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { addDays, formatDate, getStatusColor } from '../../utils/utils';

export default function CalendarView({ hotelData, modalData }) {
    const { theme, darkMode } = useTheme();
    const { rooms, reservations, guests, roomCategories, roomStatuses, toggleRoomStatus, getRoomStatus, getGuestName, isLoading } = hotelData;
    const { openModal, setFormData, setGroupEditChoice, setDeleteConfirm } = modalData;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [jumpStep] = useState(1); // Domyślnie 1 dzień na każdym urządzeniu
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState(new Set());
    const dragInfo = useRef({ isDragging: false, roomId: null, startDate: null, endDate: null });
    const [dragState, setDragState] = useState({ roomId: null, startDate: null, endDate: null });

    const contextRefs = useRef({ openModal, setFormData });
    useEffect(() => {
        contextRefs.current = { openModal, setFormData };
    }, [openModal, setFormData]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (dragInfo.current.isDragging) {
                const { roomId, startDate, endDate } = dragInfo.current;
                dragInfo.current.isDragging = false;
                setDragState({ roomId: null, startDate: null, endDate: null });

                if (roomId && startDate && endDate) {
                    const start = startDate <= endDate ? startDate : endDate;
                    const end = startDate <= endDate ? endDate : startDate;

                    let finalCheckOutDate;
                    if (start === end) {
                        // Pojedyncze kliknięcie (1 komórka) -> domyślnie 1 noc (wyjazd następnego dnia)
                        finalCheckOutDate = addDays(new Date(end), 1);
                    } else {
                        // Przeciągnięcie myszką na kilka dni (start < end) -> 
                        // Start to wybrany przyjazd, End to wybrany wyjazd (brak dodatkowej doby)
                        finalCheckOutDate = new Date(end);
                    }

                    contextRefs.current.openModal('reservation', null, {
                        roomId: roomId,
                        checkIn: start,
                        checkOut: formatDate(finalCheckOutDate)
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

    // OPTYMALIZACJA 1: Grupujemy rezerwacje per pokój raz przy każdej zmianie `reservations`
    const reservationsByRoom = useMemo(() => {
        const map = {};
        (reservations || []).forEach(r => {
            const roomIdStr = String(r.roomId);
            if (!map[roomIdStr]) map[roomIdStr] = [];
            map[roomIdStr].push(r);
        });
        return map;
    }, [reservations]);

    // OPTYMALIZACJA 2: Przeliczamy śniadania dla widocznych dni w siatce (zamiast w locie na komórkę `th`)
    const breakfastCountsByDate = useMemo(() => {
        const counts = {};
        (calendarDays || []).forEach(day => {
            const dateStr = formatDate(day);
            counts[dateStr] = (reservations || []).reduce((total, r) => {
                const isInRange = dateStr > r.checkIn && dateStr <= r.checkOut;
                if (isInRange && r.breakfast === true) {
                    const room = (rooms || []).find(rm => String(rm.id) === String(r.roomId));
                    return total + (room?.maxGuests || 1);
                }
                return total;
            }, 0);
        });
        return counts;
    }, [reservations, calendarDays, rooms]);


    // --- Skeleton Loader ---
    if (isLoading) {
        const skeletonRows = 8;
        const skeletonCols = 15;
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-4">
                <div></div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -jumpStep))}
                        className={`px-1 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme.buttonSecondary} flex flex-1 sm:flex-none justify-center items-center gap-1 min-w-[3rem] text-xs sm:text-sm`}
                        title={`Cofnij o ${jumpStep} dni`}
                        aria-label={`Cofnij o ${jumpStep} dni`}
                    >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Wstecz ({jumpStep}d)</span>
                    </button>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme.button} flex-1 sm:flex-none justify-center items-center text-xs sm:text-sm`}
                        title="Zawsze powrót do dzisiejszego dnia"
                    >
                        <span className="sm:hidden">Dzisiaj</span>
                        <span className="hidden sm:inline">Dzisiaj</span>
                    </button>

                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, jumpStep))}
                        className={`px-1 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme.buttonSecondary} flex flex-1 sm:flex-none justify-center items-center gap-1 min-w-[3rem] text-xs sm:text-sm`}
                        title={`Naprzód o ${jumpStep} dni`}
                        aria-label={`Naprzód o ${jumpStep} dni`}
                    >
                        <span className="hidden sm:inline">Naprzód ({jumpStep}d)</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className="flex w-full sm:w-auto gap-1 sm:gap-2 mt-1 sm:mt-0">
                        {isDeleteMode && selectedForDelete.size > 0 ? (
                            <button
                                onClick={() => {
                                    // Zbierz zaznaczone rezerwacje
                                    const selectedIds = Array.from(selectedForDelete);
                                    const selectedReservations = reservations.filter(r => selectedIds.includes(r.id));

                                    // Sprawdź czy wśród zaznaczonych są rezerwacje grupowe
                                    const groupIds = new Set();
                                    const partialGroups = [];
                                    selectedReservations.forEach(r => {
                                        if (r.groupId) groupIds.add(r.groupId);
                                    });

                                    // Dla każdej grupy sprawdź, czy zaznaczono WSZYSTKIE elementy grupy
                                    let hasPartialGroup = false;
                                    groupIds.forEach(gId => {
                                        const allInGroup = reservations.filter(r => r.groupId === gId);
                                        const selectedInGroup = selectedReservations.filter(r => r.groupId === gId);
                                        if (selectedInGroup.length < allInGroup.length) {
                                            hasPartialGroup = true;
                                            partialGroups.push({ groupId: gId, allInGroup, selectedInGroup });
                                        }
                                    });

                                    if (hasPartialGroup) {
                                        // Pokaż modal z pytaniem o grupy
                                        const firstPartial = partialGroups[0];
                                        setDeleteConfirm({
                                            type: 'bulkWithGroups',
                                            selectedIds,
                                            partialGroups,
                                            message: `Zaznaczono ${selectedIds.length} rezerwacji. Wśród nich są rezerwacje grupowe, z których zaznaczono tylko część. Czy chcesz usunąć tylko zaznaczone czy całe grupy?`
                                        });
                                    } else {
                                        // Wszystkie zaznaczone — zwykłe bulk delete
                                        setDeleteConfirm({
                                            type: 'bulk-reservations',
                                            ids: selectedIds.map(String)
                                        });
                                    }
                                    setIsDeleteMode(false);
                                    setSelectedForDelete(new Set());
                                }}
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-1 touch-manipulation transition-colors animate-pulse text-xs sm:text-sm"
                                title={`Usuń ${selectedForDelete.size} zaznaczonych rezerwacji`}
                            >
                                <Trash2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">Usuń zaznaczone ({selectedForDelete.size})</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (isDeleteMode) {
                                        // Wyjdź z trybu usuwania (anuluj)
                                        setIsDeleteMode(false);
                                        setSelectedForDelete(new Set());
                                    } else {
                                        setIsDeleteMode(true);
                                        setSelectedForDelete(new Set());
                                    }
                                }}
                                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${isDeleteMode ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : theme.buttonSecondary} flex items-center justify-center gap-1 touch-manipulation transition-colors text-xs sm:text-sm`}
                                title="Tryb usuwania rezerwacji z kalendarza"
                            >
                                <Trash2 className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{isDeleteMode ? 'Anuluj' : 'Usuwaj'}</span>
                                <span className="sm:hidden truncate">{isDeleteMode ? 'Anuluj' : 'Usuwaj'}</span>
                            </button>
                        )}

                        <button
                            onClick={() => openModal('reservation')}
                            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme.button} flex items-center justify-center gap-1 touch-manipulation text-xs sm:text-sm`}
                        >
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Nowa Rezerwacja</span>
                            <span className="sm:hidden truncate">Dodaj</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-lg overflow-hidden border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} `}>
                <div className="overflow-x-auto relative">
                    <table className="w-full min-w-[390px] sm:min-w-[640px]">
                        <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}>
                            <tr>
                                <th className={`px-1 py-1 sm:px-2 sm:py-1.5 text-left font-semibold sticky left-0 z-20 text-[9px] sm:text-[11px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} w-[45px] sm:w-[60px] min-w-[45px] sm:min-w-[60px]`}>Pokój</th>
                                {calendarDays.map((day, idx) => {
                                    const dateStr = formatDate(day);
                                    const isToday = dateStr === formatDate(new Date());
                                    const breakfastCount = breakfastCountsByDate[dateStr] || 0;

                                    return (
                                        <th
                                            key={idx}
                                            className={`px-0.5 py-0.5 sm:px-1 sm:py-1 text-center text-[9px] sm:text-[11px] font-medium min-w-[45px] sm:min-w-[70px] ${isToday ? (darkMode ? 'bg-blue-600/20' : 'bg-blue-100 text-blue-800') : ''}`}
                                        >
                                            <div className="text-[9px] sm:text-[11px] leading-tight">{day.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                            <div className="text-[8px] sm:text-[9px] opacity-70 leading-tight">{day.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</div>
                                            {breakfastCount > 0 && (
                                                <div className={`text-[8px] mt-0.5 inline-flex items-center gap-0.5 px-1 py-0 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
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
                                    <tr key={room.id} className={`border-t ${darkMode ? 'border-gray-600/50' : 'border-gray-200'}`}>
                                        <td className={`px-1 sm:px-2 py-1 sm:py-1.5 font-medium sticky left-0 z-30 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} w-[45px] sm:w-[60px] max-w-[45px] sm:max-w-none`}>
                                            <div className={`flex items-center justify-start gap-0.5 sm:gap-1 pl-0.5 sm:pl-1`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRoomStatus(room.id);
                                                    }}
                                                    className={`w-1 h-6 sm:w-1.5 sm:h-10 flex-shrink-0 rounded-full cursor-pointer hover:opacity-80 hover:scale-110 transition-all ${statusColors[roomStatus]} z-30`}
                                                    title={
                                                        roomStatus === 'clean' ? 'Czysty i gotowy (kliknij → Zajęty)' :
                                                            roomStatus === 'occupied' ? 'Zajęty przez gościa (kliknij → Do sprzątania)' :
                                                                'Do sprzątania (kliknij → Czysty)'
                                                    }
                                                />
                                                <div className="w-full overflow-hidden flex flex-col justify-center">
                                                    <div className={`text-[10px] sm:text-xs font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} truncate leading-none`}>{room.number}</div>
                                                    <div className={`text-[8px] sm:text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-none mt-0.5`} title={roomCategories?.find(c => c.id === room.categoryId)?.name || room.name}>
                                                        {roomCategories?.find(c => c.id === room.categoryId)?.name || room.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>


                                        {calendarDays.map((day, idx) => {
                                            const dateStr = formatDate(day);

                                            const isToday = dateStr === formatDate(new Date());
                                            const roomReservations = reservationsByRoom[String(room.id)] || [];

                                            // Rezerwacje nachodzące na dany dzień
                                            const allReservations = roomReservations.filter(r =>
                                                dateStr >= r.checkIn && dateStr < r.checkOut
                                            );

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
                                                    className={`p-0 text-center relative ${isToday ? (darkMode ? 'bg-blue-600/10' : 'bg-blue-50') : ''} ${isSelected ? 'bg-blue-500/60 border-l-2 border-r-2 border-blue-500' : 'hover:bg-blue-500/10'} cursor-pointer transition-colors border-r ${darkMode ? 'border-gray-600/40' : 'border-gray-200'} select-none`}
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
                                                    <div className="h-8 sm:h-10 relative">
                                                        {roomReservations.filter(r => {
                                                            const firstVisibleDate = formatDate(calendarDays[0]);
                                                            const lastVisibleDate = formatDate(calendarDays[calendarDays.length - 1]);

                                                            if (r.checkOut < firstVisibleDate) return false;
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

                                                            // Timezone-safe day difference (no browser-dependent Date parsing)
                                                            const daysBetween = (a, b) => {
                                                                const [ya, ma, da] = a.split('-').map(Number);
                                                                const [yb, mb, db] = b.split('-').map(Number);
                                                                return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
                                                            };

                                                            let endOffset = 0;
                                                            if (r.checkOut <= lastVisibleDate) {
                                                                const daysDiff = daysBetween(dateStr, r.checkOut);
                                                                endOffset = daysDiff + 0.5;
                                                            } else {
                                                                endOffset = calendarDays.length - idx;
                                                            }

                                                            const widthInCells = endOffset - startOffset;

                                                            // Calculate actual total duration (in days) to pick font size
                                                            const durationDays = daysBetween(r.checkIn, r.checkOut);
                                                            const textSizeClass =
                                                                durationDays <= 1 ? 'text-[9px] px-0.5' :
                                                                    durationDays === 2 ? 'text-[10px] px-1' :
                                                                        'text-xs sm:text-sm px-2';

                                                            const isCutLeft = startOffset === 0;
                                                            const isCutRight = endOffset === calendarDays.length - idx;
                                                            let roundedClass = 'rounded-md';
                                                            if (isCutLeft && isCutRight) roundedClass = 'rounded-none';
                                                            else if (isCutLeft) roundedClass = 'rounded-r-md';
                                                            else if (isCutRight) roundedClass = 'rounded-l-md';

                                                            const tooltipGuest = guests.find(g => g.id === r.guestId);
                                                            const tooltipPhone = tooltipGuest?.phone ? `\nTelefon: ${tooltipGuest.phone}` : '';
                                                            const tooltipNotes = r.notes ? `\nNotatki: ${r.notes}` : '';
                                                            const tooltipTitle = `${r.payment === 'booking' || r.isNewIcal ? '🅱️ ' : (r.groupId ? '👥 ' : '')}${getGuestName(r.guestId)}\nŚniadanie: ${r.breakfast ? 'Tak' : 'Nie'}${tooltipPhone}${tooltipNotes}`;

                                                            return (
                                                                <div
                                                                    key={r.id}
                                                                    title={tooltipTitle}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    onMouseUp={(e) => e.stopPropagation()}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isDeleteMode) {
                                                                            // Tryb zaznaczania — toggle selekcji
                                                                            setSelectedForDelete(prev => {
                                                                                const next = new Set(prev);
                                                                                if (next.has(r.id)) {
                                                                                    next.delete(r.id);
                                                                                } else {
                                                                                    next.add(r.id);
                                                                                }
                                                                                return next;
                                                                            });
                                                                            return;
                                                                        }

                                                                        if (r.groupId) {
                                                                            const siblings = reservations.filter(s => s.groupId === r.groupId && s.id !== r.id);
                                                                            if (siblings.length > 0) {
                                                                                setGroupEditChoice({ reservation: r, siblings });
                                                                                return;
                                                                            }
                                                                        }
                                                                        openModal('reservation', r);
                                                                    }}
                                                                    className={`absolute top-0.5 bottom-0.5 ${roundedClass} flex items-center cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all ${getStatusColor(r.status, startOffset === 0)} pointer-events-auto overflow-hidden ${isDeleteMode && selectedForDelete.has(r.id) ? 'ring-2 ring-red-500 ring-offset-1 brightness-90' : ''} ${isDeleteMode ? 'cursor-crosshair' : ''}`}
                                                                    style={{
                                                                        left: `calc(${startOffset * 100}%)`,
                                                                        width: `calc(${widthInCells * 100}% - 2px)`,
                                                                        zIndex: 20
                                                                    }}
                                                                >
                                                                    {isDeleteMode && selectedForDelete.has(r.id) && (
                                                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold z-30 shadow">✓</span>
                                                                    )}
                                                                    <span className={`overflow-hidden whitespace-nowrap pointer-events-none font-semibold drop-shadow-md pl-1 ${textSizeClass}`}>
                                                                        {r.payment === 'booking' || r.isNewIcal ? '🅱️ ' : (r.groupId ? '👥 ' : '')}{getGuestName(r.guestId)}
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

            <div className="mt-2 sm:mt-4 flex gap-2 sm:gap-4 items-center flex-wrap pt-2 border-t border-gray-600/20">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-yellow-500 border-l border-amber-300"></div>
                    <span className="text-[10px] sm:text-xs">Wstępna</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-indigo-500 border-l border-blue-300"></div>
                    <span className="text-[10px] sm:text-xs">Potwierdzona</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-green-500 border-l border-emerald-300"></div>
                    <span className="text-[10px] sm:text-xs">Opłacona</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-gray-400 to-gray-500 border-l border-gray-300"></div>
                    <span className="text-[10px] sm:text-xs">Zakończona</span>
                </div>
                <div className="h-4 w-px bg-gray-600 mx-1"></div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-4 rounded-full bg-green-500"></div>
                    <span className="text-[10px] sm:text-xs">Pokój czysty</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-4 rounded-full border ${darkMode ? 'bg-gray-800/50 border-gray-500' : 'bg-gray-200 border-gray-400'}`}></div>
                    <span className="text-[10px] sm:text-xs">Zajęty</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-4 rounded-full bg-red-500"></div>
                    <span className="text-[10px] sm:text-xs">Do sprzątania</span>
                </div>
            </div>
        </div >
    );
}
