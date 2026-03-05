import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function RoomModal({ formData, setFormData, hotelData }) {
    const { theme } = useTheme();
    const { roomCategories } = hotelData || {};

    return (
        <>
            <div>
                <label className="block mb-2 font-medium">Numer pokoju</label>
                <input
                    type="text"
                    required
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="np. 101"
                />
            </div>

            <div>
                <label className="block mb-2 font-medium">Kategoria (dla Booking.com iCal)</label>
                <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                    <option value="">Brak (ręczne zarządzanie)</option>
                    {(roomCategories || []).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Jeśli wybierzesz kategorię, rezerwacje z jej linku iCal będą mogły automatycznie przydzielić ten pokój, o ile jest wolny.</p>
            </div>

            {/* Pole Nazwa pokoju usunięte - teraz używamy tylko Kategorii */}

            <div>
                <label className="block mb-2 font-medium">Maksymalna liczba gości</label>
                <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.maxGuests || ''}
                    onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                />
            </div>

            {(() => {
                const selectedCat = (roomCategories || []).find(c => c.id === formData.categoryId);
                if (selectedCat) {
                    return (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/25">
                            <p className="text-xs font-semibold text-blue-400 mb-1">💰 Ceny z kategorii „{selectedCat.name}"</p>
                            <div className="flex gap-4 text-sm">
                                <span>Bez śniadania: <strong>{selectedCat.pricePerNight ?? '—'} zł</strong></span>
                                <span>Ze śniadaniem: <strong>{selectedCat.priceWithBreakfast ?? '—'} zł</strong></span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Zmień ceny w sekcji Ustawienia → Kategorie pokoi.</p>
                        </div>
                    );
                }
                return (
                    <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                        <p className="text-xs text-gray-500">Brak przypisanej kategorii — ceny można ustawić po przypisaniu kategorii w Ustawieniach.</p>
                    </div>
                );
            })()}
        </>
    );
}
