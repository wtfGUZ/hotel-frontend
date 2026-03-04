import React, { useState } from 'react';
import { Plus, Edit2, Trash2, KeyRound } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import PinLockScreen from '../../components/PinLockScreen';

export default function SettingsView({ hotelData, modalData }) {
    const { theme, darkMode, toggleDarkMode } = useTheme();
    const { rooms, setRooms, guests, setGuests, reservations, setReservations, logoUrl, setLogoUrl, syncIcalCategoryAPI, roomCategories, setRoomCategories, saveRoomCategoriesAPI, verifyPinAPI, changePinAPI } = hotelData;
    const { openModal, setDeleteConfirm, setAlertMessage } = modalData;

    const [syncStatuses, setSyncStatuses] = useState({});

    const handleCategoryIcalSave = async (categoryId, url) => {
        if (!url || url.trim() === '') {
            setSyncStatuses(prev => ({ ...prev, [categoryId]: 'Wpisz URL przed zapisaniem' }));
            return;
        }
        setSyncStatuses(prev => ({ ...prev, [categoryId]: 'Zapisywanie w bazie...' }));
        try {
            await saveRoomCategoriesAPI(roomCategories);
            setSyncStatuses(prev => ({ ...prev, [categoryId]: `✅ Zapisano link trwale.` }));
            setTimeout(() => setSyncStatuses(prev => ({ ...prev, [categoryId]: '' })), 4000);
        } catch (err) {
            setSyncStatuses(prev => ({ ...prev, [categoryId]: `❌ Błąd zapisu: ${err.message}` }));
        }
    };

    // Security States
    const [isUnlocked, setIsUnlocked] = useState(false);

    // PIN change states
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinChangeMsg, setPinChangeMsg] = useState({ text: '', type: '' });

    const handleChangePin = async (e) => {
        e.preventDefault();
        if (newPin.length < 4) {
            setPinChangeMsg({ text: 'Nowy PIN musi mieć co najmniej 4 cyfry', type: 'error' });
            return;
        }
        try {
            const data = await changePinAPI(oldPin, newPin);
            if (data.success) {
                setPinChangeMsg({ text: 'Kod PIN został pomyślnie zmieniony.', type: 'success' });
                setOldPin('');
                setNewPin('');
                setTimeout(() => setPinChangeMsg({ text: '', type: '' }), 3000);
            } else {
                setPinChangeMsg({ text: data.error || 'Błąd podczas zmiany PINu', type: 'error' });
            }
        } catch (err) {
            setPinChangeMsg({ text: 'Błąd po stronie serwera.', type: 'error' });
        }
    };

    if (!isUnlocked) {
        return <PinLockScreen verifyPinAPI={verifyPinAPI} onUnlock={() => setIsUnlocked(true)} />;
    }

    return (
        <div>

            <div className="space-y-6">
                <div className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                    <h3 className="text-xl font-bold mb-4">Zarządzanie danymi</h3>
                    <div className="space-y-4">
                        <div>
                            <p className={`text-sm ${theme.textSecondary} mb-3`}>
                                Wszystkie dane są automatycznie zapisywane lokalnie. Możesz również eksportować i importować dane.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const data = { rooms, guests, reservations, exportDate: new Date().toISOString() };
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `hotel-backup-${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        setAlertMessage('✅ Dane wyeksportowane!');
                                    }}
                                    className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg ${theme.button} font-medium flex justify-center items-center gap-2`}
                                >
                                    📥 Eksportuj dane
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.json';
                                        input.onchange = (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    try {
                                                        const data = JSON.parse(event.target.result);
                                                        if (data.rooms) setRooms(data.rooms);
                                                        if (data.guests) setGuests(data.guests);
                                                        if (data.reservations) setReservations(data.reservations);
                                                        setAlertMessage('✅ Dane zaimportowane!');
                                                    } catch (error) {
                                                        setAlertMessage('❌ Błąd podczas importu danych');
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                    className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg ${theme.buttonSecondary} font-medium flex justify-center items-center gap-2`}
                                >
                                    📤 Importuj dane
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteConfirm({
                                            type: 'clearAll',
                                            id: null,
                                            message: 'Czy na pewno chcesz wyczyścić WSZYSTKIE dane? Ta operacja jest nieodwracalna!'
                                        });
                                    }}
                                    className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg ${theme.buttonDanger} flex justify-center items-center gap-2`}
                                >
                                    🗑️ Wyczyść wszystko
                                </button>
                            </div>
                            <p className={`text-xs ${theme.textSecondary} mt-3`}>
                                💡 Eksportuj dane regularnie jako backup
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                    <h3 className="text-xl font-bold mb-4">Pokoje</h3>
                    <button
                        onClick={() => openModal('room')}
                        className={`px-4 py-2 rounded-lg ${theme.button} flex items-center gap-2 mb-4`}
                    >
                        <Plus className="w-5 h-5" />
                        Dodaj Pokój
                    </button>

                    <div className="space-y-3">
                        {rooms.map(room => (
                            <div key={room.id} className={`${theme.input} rounded-lg p-4 flex flex-col gap-3`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="font-medium text-lg sm:text-base">{room.number} - {roomCategories?.find(c => c.id === room.categoryId)?.name || room.name}</div>
                                        <div className={`text-sm ${theme.textSecondary}`}>Max {room.maxGuests} osoby</div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => openModal('room', room)}
                                            className={`flex-1 sm:flex-none p-3 sm:p-2 rounded-lg flex justify-center items-center ${theme.buttonSecondary}`}
                                        >
                                            <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm({ type: 'room', id: room.id })}
                                            className={`flex-1 sm:flex-none p-3 sm:p-2 rounded-lg flex justify-center items-center ${theme.buttonDanger}`}
                                        >
                                            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Kategorie Pokoi (dla iCal)</h3>
                        <button
                            onClick={() => {
                                const newCat = { id: Date.now().toString(), name: 'Nowa Kategoria', icalUrl: '' };
                                const updated = [...(roomCategories || []), newCat];
                                saveRoomCategoriesAPI(updated);
                            }}
                            className={`px-3 py-1.5 rounded-lg ${theme.button} text-sm flex items-center gap-2`}
                        >
                            <Plus className="w-4 h-4" />
                            Dodaj
                        </button>
                    </div>
                    <p className={`text-sm ${theme.textSecondary} mb-4`}>
                        Utwórz kategorie (np. "Jednoosobowy", "Dwuosobowy") i dodaj do nich linki iCal z Booking.com. Pokoje przypiszesz do kategorii w edycji pokoju.
                    </p>
                    <div className="space-y-3">
                        {(roomCategories || []).map(cat => (
                            <div key={cat.id} className={`${theme.input} rounded-lg p-4 flex flex-col gap-3 border-l-4 border-blue-500`}>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        className={`flex-1 px-3 py-2 font-medium rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none ${theme.input}`}
                                        value={cat.name}
                                        onChange={(e) => {
                                            const updated = roomCategories.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c);
                                            setRoomCategories(updated);
                                        }}
                                        onBlur={() => saveRoomCategoriesAPI(roomCategories)}
                                        placeholder="Nazwa kategorii"
                                    />
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Usunąć tę kategorię?')) {
                                                const updated = roomCategories.filter(c => c.id !== cat.id);
                                                saveRoomCategoriesAPI(updated);
                                            }
                                        }}
                                        className={`p-2 rounded-lg flex justify-center items-center ${theme.buttonDanger}`}
                                    >
                                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                                <div className="mt-2 border-t border-gray-700/30 pt-3">
                                    <label className="block text-xs font-semibold mb-1 text-gray-400">URL kalendarza iCal (Booking.com)</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none ${theme.input}`}
                                            placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=..."
                                            value={cat.icalUrl}
                                            onChange={(e) => {
                                                const updated = roomCategories.map(c => c.id === cat.id ? { ...c, icalUrl: e.target.value } : c);
                                                setRoomCategories(updated);
                                            }}
                                            onBlur={() => saveRoomCategoriesAPI(roomCategories)}
                                        />
                                        <button
                                            onClick={() => handleCategoryIcalSave(cat.id, cat.icalUrl)}
                                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-opacity hover:opacity-90 flex justify-center items-center ${theme.button}`}
                                        >
                                            Zapisz link
                                        </button>
                                    </div>
                                    {syncStatuses[cat.id] && (
                                        <p className="mt-2 text-sm font-medium animate-pulse">{syncStatuses[cat.id]}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!roomCategories || roomCategories.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">Brak dodanych kategorii.</p>
                        )}
                    </div>
                </div>

                <div className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                    <h3 className="text-xl font-bold mb-4">Wygląd i Branding</h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4 border-gray-700/30">
                            <div>
                                <h4 className="font-medium text-lg">Tryb ciemny</h4>
                                <p className={`text-sm ${theme.textSecondary}`}>Przełącz jasny/ciemny motyw aplikacji</p>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div>
                            <h4 className="font-medium text-lg mb-2">Logo Aplikacji (Custom Logo / Favicon)</h4>
                            <p className={`text-sm ${theme.textSecondary} mb-4`}>
                                Wgraj plik graficzny (PNG, JPG, SVG), aby zastąpić domyślne logo Hotel Managera swoim własnym!
                                Zmienione zostanie logo na pasku w lewym górnym rogu oraz miniatura zakładki w przeglądarce.
                            </p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className={`w-32 h-32 flex-shrink-0 rounded-xl flex items-center justify-center p-2 border-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                    <img
                                        src={logoUrl || '/vite.png'}
                                        alt="Current Logo"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div className="hidden text-center text-xs text-gray-500">Brak Logo</div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/png, image/jpeg, image/svg+xml, image/webp';
                                            input.onchange = (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const base64String = event.target.result;
                                                        setLogoUrl(base64String);
                                                        setAlertMessage('✅ Nowe logo zostało wgrane pomyślnie!');
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                        className={`px-4 py-2 rounded-lg ${theme.button} font-medium flex items-center gap-2`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Wgraj nowy plik...
                                    </button>

                                    {logoUrl && logoUrl !== '/vite.png' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLogoUrl('/vite.png');
                                                setAlertMessage('✅ Przywrócono domyślne logo.');
                                            }}
                                            className={`px-4 py-2 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20 font-medium transition-colors`}
                                        >
                                            🗑️ Usuń customowe logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Removed Global Booking.com section since it is now per-room */}

                {/* Zabezpieczenia */}
                <div className={`${theme.card} rounded-xl p-6 shadow-lg border-t-2 border-red-500/50`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold">Zabezpieczenia i Dostęp</h3>
                    </div>

                    <p className={`text-sm ${theme.textSecondary} mb-6`}>
                        Zmień 4-cyfrowy kod PIN wymagany do odblokowania panelu Ustawień. Domyślny PIN to 1234.
                    </p>

                    <form onSubmit={handleChangePin} className="max-w-md space-y-4">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Obecny PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-red-500 outline-none`}
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium text-sm">Nowy PIN (min. 4 cyfry)</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-red-500 outline-none`}
                            />
                        </div>

                        {pinChangeMsg.text && (
                            <p className={`text-sm ${pinChangeMsg.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                {pinChangeMsg.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!oldPin || newPin.length < 4}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'} disabled:opacity-50 hover:bg-red-500 flex items-center gap-2`}
                        >
                            Zmień PIN
                        </button>
                    </form>
                </div>
            </div>
        </div >
    );
}
