import React from 'react';
import { Plus, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { calculateNights, calculateTotalPrice, formatDate, addDays } from '../../utils/utils';

export default function ReservationModal({
    formData, setFormData,
    hotelData, modalData
}) {
    const { theme, darkMode } = useTheme();
    const { rooms, guests, roomCategories } = hotelData;
    const {
        editingItem,
        showQuickGuestForm, setShowQuickGuestForm,
        quickGuestData, setQuickGuestData,
        guestSearchTerm, setGuestSearchTerm,
        showGuestDropdown, setShowGuestDropdown,
        setAlertMessage
    } = modalData;

    const filteredGuestsForSearch = guests.filter(guest => {
        const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
        return fullName.includes(guestSearchTerm.toLowerCase());
    });

    // Initialize guest search term when editing an existing reservation
    React.useEffect(() => {
        if (editingItem && editingItem.guestId && !guestSearchTerm) {
            const guest = guests.find(g => g.id === editingItem.guestId);
            if (guest) {
                setGuestSearchTerm(`${guest.firstName} ${guest.lastName}`);
            }
        }
    }, [editingItem, guests, guestSearchTerm, setGuestSearchTerm]);

    const changeNights = (delta) => {
        if (!formData.checkIn) return;
        const currentNights = calculateNights(formData.checkIn, formData.checkOut);
        const newNights = Math.max(1, currentNights + delta);
        const checkInDate = new Date(formData.checkIn);
        const newCheckOut = addDays(checkInDate, newNights);
        setFormData({ ...formData, checkOut: formatDate(newCheckOut) });
    };

    const checkRoomConflict = (roomId, checkIn, checkOut, excludeReservationId = null, excludeGroupId = null) => {
        return hotelData.reservations.find(r => {
            if (excludeReservationId && r.id === excludeReservationId) return false;
            if (excludeGroupId && r.groupId === excludeGroupId) return false;
            if (r.roomId !== roomId) return false;

            const newStart = new Date(checkIn);
            const newEnd = new Date(checkOut);
            const existingStart = new Date(r.checkIn);
            const existingEnd = new Date(r.checkOut);

            if (newEnd.getTime() === existingStart.getTime()) return false;
            if (newStart.getTime() === existingEnd.getTime()) return false;

            return newStart < existingEnd && newEnd > existingStart;
        });
    };

    return (
        <>
            <div className="relative guest-search-container">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1">
                    <label className="font-medium text-sm sm:text-base">Gość (wpisz imię i nazwisko) *</label>
                    <button
                        type="button"
                        onClick={() => {
                            setShowQuickGuestForm(true);
                            setShowGuestDropdown(false);
                            setQuickGuestData({});
                        }}
                        className={`text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 px-3 py-1.5 sm:py-1 rounded-lg ${theme.button}`}
                    >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Dodaj nowego
                    </button>
                </div>
                <input
                    type="text"
                    required
                    value={guestSearchTerm}
                    onChange={(e) => {
                        setGuestSearchTerm(e.target.value);
                        setShowGuestDropdown(true);
                        if (formData.guestId) {
                            setFormData({ ...formData, guestId: undefined });
                        }
                    }}
                    onFocus={() => setShowGuestDropdown(true)}
                    placeholder="np. Jan Kowalski"
                    className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                />

                {showGuestDropdown && guestSearchTerm && (
                    <div className={`absolute z-10 w-full mt-1 ${theme.card} border rounded-lg shadow-xl max-h-60 overflow-y-auto`}>
                        {filteredGuestsForSearch.length > 0 ? (
                            <>
                                {filteredGuestsForSearch.map(guest => (
                                    <div
                                        key={guest.id}
                                        onClick={() => {
                                            setGuestSearchTerm(`${guest.firstName} ${guest.lastName}`);
                                            setFormData({ ...formData, guestId: guest.id });
                                            setShowGuestDropdown(false);
                                        }}
                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-600/20 transition-colors border-b ${theme.textSecondary} border-gray-700/30`}
                                    >
                                        <div className="font-medium text-gray-100">{guest.firstName} {guest.lastName}</div>
                                        <div className="text-xs">{guest.email} • {guest.phone}</div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="px-4 py-3">
                                <div className="text-yellow-400 mb-2">
                                    ⚠️ Nie znaleziono gościa "{guestSearchTerm}"
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowGuestDropdown(false);
                                        setShowQuickGuestForm(true);
                                        const parts = guestSearchTerm.trim().split(' ');
                                        if (parts.length >= 2) {
                                            setQuickGuestData({
                                                firstName: parts[0],
                                                lastName: parts.slice(1).join(' ')
                                            });
                                        } else if (parts.length === 1) {
                                            setQuickGuestData({
                                                firstName: parts[0]
                                            });
                                        }
                                    }}
                                    className={`w-full px-4 py-2 rounded-lg ${theme.button} flex items-center justify-center gap-2`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Dodaj nowego gościa
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {formData.guestId && (
                    <p className="text-xs text-green-400 mt-1">✓ Gość wybrany</p>
                )}

                {showQuickGuestForm && (
                    <div className={`${theme.card} p-4 rounded-lg space-y-3 mt-3 border-2 border-blue-500/30`}>
                        <h4 className="font-medium text-sm text-blue-400">Dodaj nowego gościa</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Imię *"
                                value={quickGuestData.firstName || ''}
                                onChange={(e) => setQuickGuestData({ ...quickGuestData, firstName: e.target.value })}
                                className={`px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                            />
                            <input
                                type="text"
                                placeholder="Nazwisko *"
                                value={quickGuestData.lastName || ''}
                                onChange={(e) => setQuickGuestData({ ...quickGuestData, lastName: e.target.value })}
                                className={`px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                            />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={quickGuestData.email || ''}
                            onChange={(e) => setQuickGuestData({ ...quickGuestData, email: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                        />
                        <input
                            type="tel"
                            placeholder="Telefon"
                            value={quickGuestData.phone || ''}
                            onChange={(e) => setQuickGuestData({ ...quickGuestData, phone: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!quickGuestData.firstName || !quickGuestData.lastName) {
                                        setAlertMessage('Wypełnij przynajmniej imię i nazwisko');
                                        return;
                                    }
                                    try {
                                        const guestPayload = {
                                            firstName: quickGuestData.firstName,
                                            lastName: quickGuestData.lastName,
                                            email: quickGuestData.email || '',
                                            phone: quickGuestData.phone || ''
                                        };
                                        const savedGuest = await hotelData.addGuestAPI(guestPayload);
                                        setGuestSearchTerm(`${savedGuest.firstName} ${savedGuest.lastName}`);
                                        setFormData({ ...formData, guestId: savedGuest.id });
                                        setQuickGuestData({});
                                        setShowQuickGuestForm(false);
                                    } catch (err) {
                                        setAlertMessage('Błąd serwera. Nie udało się zapisać gościa do bazy.');
                                    }
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg ${theme.buttonSecondary} border border-gray-600/50 text-sm font-medium flex items-center justify-center gap-2`}
                            >
                                <Check className="w-4 h-4" />
                                Dodaj i wybierz
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQuickGuestForm(false);
                                    setQuickGuestData({});
                                }}
                                className={`px-4 py-2 rounded-lg ${theme.buttonSecondary} text-sm font-medium`}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                    <label className="block mb-1 font-medium text-sm sm:text-base">Zameldowanie *</label>
                    <input
                        type="date"
                        required
                        value={formData.checkIn || ''}
                        onChange={(e) => {
                            const newCheckIn = e.target.value;
                            const nights = calculateNights(newCheckIn, formData.checkOut);
                            if (nights <= 0 && formData.checkOut) {
                                const newCheckOut = addDays(new Date(newCheckIn), 1);
                                setFormData({ ...formData, checkIn: newCheckIn, checkOut: formatDate(newCheckOut) });
                            } else {
                                setFormData({ ...formData, checkIn: newCheckIn });
                            }
                        }}
                        className={`w-full px-1 sm:px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-[11px] sm:text-base`}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium text-sm sm:text-base">Wymeldowanie *</label>
                    <input
                        type="date"
                        required
                        value={formData.checkOut || ''}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                        className={`w-full px-1 sm:px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-[11px] sm:text-base`}
                    />
                </div>
            </div>

            {formData.checkIn && formData.checkOut && (
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${darkMode ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-100 to-gray-50'} border ${darkMode ? 'border-blue-500/30' : 'border-blue-400/30'} shadow-sm`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Liczba nocy:</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => changeNights(-1)}
                                disabled={calculateNights(formData.checkIn, formData.checkOut) <= 1}
                                className={`w-10 h-10 rounded-lg ${theme.buttonSecondary} flex items-center justify-center text-xl font-bold hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
                            >
                                −
                            </button>
                            <span className="text-3xl font-bold text-blue-400 min-w-[3rem] text-center">
                                {calculateNights(formData.checkIn, formData.checkOut)}
                            </span>
                            <button
                                type="button"
                                onClick={() => changeNights(1)}
                                className={`w-10 h-10 rounded-lg ${theme.buttonSecondary} flex items-center justify-center text-xl font-bold hover:opacity-80 transition-all shadow-md hover:shadow-lg`}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <p className={`text-xs ${theme.textSecondary} mt-2`}>
                        {formData.checkIn && formData.checkOut && (
                            <>
                                Od {new Date(formData.checkIn).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}{' '}do {new Date(formData.checkOut).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </>
                        )}
                    </p>
                </div>
            )}

            <div>
                <label className="block mb-1 font-medium text-sm sm:text-base">Pokoje *</label>
                {!formData.checkIn || !formData.checkOut ? (
                    <div className={`p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-1`}>
                        <p className="text-sm text-yellow-400">
                            ⚠️ Najpierw wybierz daty pobytu, aby zobaczyć dostępność pokoi
                        </p>
                    </div>
                ) : null}

                {(formData.roomIds || (formData.roomId ? [formData.roomId] : [''])).map((selectedRoomId, index) => {
                    const currentIds = formData.roomIds || (formData.roomId ? [formData.roomId] : ['']);

                    return (
                        <div key={index} className="flex gap-2 mb-2">
                            <select
                                required={index === 0}
                                value={selectedRoomId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const newIds = [...currentIds];
                                    newIds[index] = val ? parseInt(val) : '';
                                    setFormData(prev => ({ ...prev, roomIds: newIds, roomId: newIds[0] }));
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                                disabled={!formData.checkIn || !formData.checkOut}
                            >
                                <option value="">
                                    {!formData.checkIn || !formData.checkOut ? 'Wybierz najpierw daty' : 'Wybierz pokój'}
                                </option>
                                {rooms.map(room => {
                                    const isConflict = formData.checkIn && formData.checkOut
                                        ? checkRoomConflict(room.id, formData.checkIn, formData.checkOut, editingItem?.id, formData.isGroupEditSession ? editingItem?.groupId : null)
                                        : false;

                                    const isAlreadySelected = currentIds.includes(room.id) && selectedRoomId !== room.id;

                                    return (
                                        <option
                                            key={room.id}
                                            value={room.id}
                                            disabled={isConflict || isAlreadySelected}
                                            style={{
                                                backgroundColor: isConflict ? '#dc2626' : (isAlreadySelected ? '#4b5563' : '#16a34a'),
                                                color: 'white'
                                            }}
                                        >
                                            {room.number} - {room.name} {isConflict ? '❌ ZAJĘTY' : (isAlreadySelected ? '🔗 WYBRANY' : '✅ WOLNY')}
                                        </option>
                                    );
                                })}
                            </select>

                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => {
                                            const ids = prev.roomIds || [];
                                            const newIds = ids.filter((_, idx) => idx !== index);
                                            return { ...prev, roomIds: newIds, roomId: newIds[0] };
                                        });
                                    }}
                                    className={`px-3 py-2 rounded-lg ${theme.buttonDanger}`}
                                    title="Usuń pokój z tej grupy"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}

                {formData.checkIn && formData.checkOut && (
                    <button
                        type="button"
                        onClick={() => {
                            setFormData(prev => {
                                const currentIds = prev.roomIds || (prev.roomId ? [prev.roomId] : ['']);
                                return { ...prev, roomIds: [...currentIds, ''] };
                            });
                        }}
                        className={`w-full mt-1 px-4 py-2 rounded-lg ${theme.buttonSecondary} border border-dashed ${darkMode ? 'border-gray-500' : 'border-gray-400'} hover:opacity-80 transition-opacity flex items-center justify-center gap-2 text-sm`}
                    >
                        <Plus className="w-4 h-4" />
                        Dodaj kolejny pokój do rezerwacji
                    </button>
                )}

                {formData.checkIn && formData.checkOut && (
                    <p className={`text-xs ${theme.textSecondary} mt-2`}>
                        💡 Zielony = wolny, Czerwony = zajęty, Szary = wybrany do tej grupy
                    </p>
                )}
            </div>

            <div>
                <label className="block mb-1 font-medium text-sm sm:text-base">Status</label>
                <select
                    required
                    value={formData.status || 'preliminary'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                    <option value="preliminary">Wstępna</option>
                    <option value="confirmed">Potwierdzona</option>
                    <option value="paid">Opłacona</option>
                </select>
            </div>

            {formData.status === 'paid' && (
                <div>
                    <label className="block mb-1 font-medium text-sm sm:text-base">Sposób płatności</label>
                    <select
                        required
                        value={formData.payment || 'cash'}
                        onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    >
                        <option value="cash">Gotówka</option>
                        <option value="card">Karta</option>
                        <option value="transfer">Przelew</option>
                        <option value="booking">Booking.com</option>
                        <option value="invoice">Faktura</option>
                    </select>
                </div>
            )}

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="breakfast"
                    checked={formData.breakfast || false}
                    onChange={(e) => setFormData({ ...formData, breakfast: e.target.checked })}
                    className="w-5 h-5 rounded"
                />
                <label htmlFor="breakfast" className="font-medium cursor-pointer">Śniadanie</label>
            </div>

            {((formData.roomIds && formData.roomIds.length > 0 && formData.roomIds[0] !== '') || formData.roomId) && formData.checkIn && formData.checkOut && (
                <div className={`p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/30`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Łączne podsumowanie:</span>
                        <span className="text-2xl font-bold text-green-400">
                            {(() => {
                                const currentIds = formData.roomIds || (formData.roomId ? [formData.roomId] : []);
                                const validIds = currentIds.filter(id => id !== '');
                                let sum = 0;
                                validIds.forEach(id => {
                                    const room = rooms.find(r => r.id === id);
                                    if (room) {
                                        // Pobierz ceny z kategorii (jeśli przypisana), lub z pokoju jako fallback
                                        const cat = roomCategories?.find(c => c.id === room.categoryId);
                                        const effectiveRoom = cat
                                            ? { ...room, pricePerNight: cat.pricePerNight ?? room.pricePerNight, priceWithBreakfast: cat.priceWithBreakfast ?? room.priceWithBreakfast }
                                            : room;
                                        sum += calculateTotalPrice(effectiveRoom, formData.checkIn, formData.checkOut, formData.breakfast);
                                    }
                                });
                                return sum.toFixed(2);
                            })()} zł
                        </span>
                    </div>
                    <div className="text-xs space-y-1 text-gray-400">
                        <div className="flex justify-between">
                            <span>Liczba nocy:</span>
                            <span>{calculateNights(formData.checkIn, formData.checkOut)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Wybrane pokoje:</span>
                            <span>
                                {(() => {
                                    const currentIds = formData.roomIds || (formData.roomId ? [formData.roomId] : []);
                                    const validIds = currentIds.filter(id => id !== '');
                                    return validIds.map(id => rooms.find(r => r.id === id)?.number).filter(Boolean).join(', ');
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block mb-1 font-medium text-sm sm:text-base">Notatki</label>
                <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-1.5 sm:py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm sm:text-base`}
                    placeholder="Dodatkowe informacje..."
                />
            </div>
        </>
    );
}
