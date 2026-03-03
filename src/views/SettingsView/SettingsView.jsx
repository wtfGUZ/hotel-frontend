import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, KeyRound } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsView({ hotelData, modalData }) {
    const { theme, darkMode, toggleDarkMode } = useTheme();
    const { rooms, setRooms, guests, setGuests, reservations, setReservations, logoUrl, setLogoUrl, syncIcalAPI, verifyPinAPI, changePinAPI } = hotelData;
    const { openModal, setDeleteConfirm, setAlertMessage } = modalData;

    const [icalUrl, setIcalUrl] = useState('');
    const [icalStatus, setIcalStatus] = useState('');

    // Security States
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // PIN change states
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinChangeMsg, setPinChangeMsg] = useState({ text: '', type: '' });

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (!pinInput) return;
        setIsVerifying(true);
        setPinError('');
        try {
            const success = await verifyPinAPI(pinInput);
            if (success) {
                setIsUnlocked(true);
            } else {
                setPinError('Nieprawidłowy kod PIN.');
            }
        } catch (err) {
            setPinError('Wystąpił błąd komunikacji z serwerem.');
        } finally {
            setIsVerifying(false);
            setPinInput('');
        }
    };

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
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className={`${theme.card} rounded-2xl shadow-xl w-full max-w-sm p-8 text-center border-t-4 border-blue-500`}>
                    <div className={`w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-500`}>
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Panel Zablokowany</h2>
                    <p className={`text-sm ${theme.textSecondary} mb-6`}>Wprowadź kod PIN (domyślnie: 1234), aby uzyskać dostęp do ustawień systemu.</p>

                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            inputMode="numeric"
                            autoFocus
                            placeholder="****"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            className={`w-full text-center tracking-[1em] font-bold text-xl px-4 py-3 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                        />
                        {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
                        <button
                            type="submit"
                            disabled={isVerifying || !pinInput}
                            className={`w-full py-3 rounded-lg font-medium transition-opacity ${theme.button} disabled:opacity-50 flex justify-center items-center gap-2`}
                        >
                            {isVerifying ? 'Weryfikacja...' : 'Odblokuj Ustawienia'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const testIcalConnection = async () => {
        if (!icalUrl) {
            setAlertMessage('Wpisz URL iCal z Booking.com');
            return;
        }
        setIcalStatus('⏳ Pobieranie i synchronizowanie...');

        try {
            const result = await syncIcalAPI(icalUrl);
            setIcalStatus(`✅ Sukces! Zaimportowano: ${result.importedCount}, Pominiętych duplikatów: ${result.skippedCount}, Brak dostępnych pokoi: ${result.conflictCount}`);
        } catch (err) {
            console.error(err);
            setIcalStatus(`❌ Błąd: ${err.message || 'Nie udało się zsynchronizować kalendarza'}`);
        }
    };

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
                            <div key={room.id} className={`${theme.input} rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                                <div>
                                    <div className="font-medium text-lg sm:text-base">{room.number} - {room.name}</div>
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
                        ))}
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

                <div className={`${theme.card} rounded-xl p-6 shadow-lg`}>
                    <h3 className="text-xl font-bold mb-4">Integracja Booking.com</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 font-medium">Booking.com iCal URL</label>
                            <input
                                type="text"
                                placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=..."
                                value={icalUrl}
                                onChange={(e) => setIcalUrl(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                            />
                            <p className={`text-sm ${theme.textSecondary} mt-1`}>Wklej link iCal z Booking.com do automatycznej synchronizacji</p>

                            {icalStatus && (
                                <div className={`mt-2 p-3 rounded-lg ${theme.input} text-sm`}>
                                    {icalStatus}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={testIcalConnection}
                                    className={`w-full sm:w-auto sm:flex-1 px-4 py-3 sm:py-2 rounded-lg ${theme.button} font-medium hover:opacity-90 transition-opacity flex justify-center items-center`}
                                >
                                    🔄 Testuj i Importuj
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIcalUrl(''); setIcalStatus(''); }}
                                    className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-90 transition-opacity flex justify-center items-center`}
                                >
                                    Wyczyść
                                </button>
                            </div>

                            <div className={`mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30`}>
                                <p className="text-sm font-medium text-blue-400 mb-2">💡 Testowy URL do sprawdzenia:</p>
                                <div className="space-y-2">
                                    <div>
                                        <code className="text-xs break-all block mb-1">https://www.officeholidays.com/ics/poland</code>
                                        <button
                                            type="button"
                                            onClick={() => setIcalUrl('https://www.officeholidays.com/ics/poland')}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Użyj tego URL
                                        </button>
                                    </div>
                                </div>

                                <div className={`mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30`}>
                                    <p className="text-xs text-yellow-400">
                                        ⚠️ <strong>Uwaga:</strong> Pobieranie iCal bezpośrednio z przeglądarki jest ograniczone przez politykę CORS.
                                        W wersji desktopowej (Electron) ta funkcja działa lepiej, ale niektóre serwery mogą nadal blokować żądania.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
        </div>
    );
}
