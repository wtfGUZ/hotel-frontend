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

            <div>
                <label className="block mb-2 font-medium">Cena za noc (zł)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerNight || ''}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="0.00"
                />
            </div>

            <div>
                <label className="block mb-2 font-medium">Cena za noc ze śniadaniem (zł)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceWithBreakfast || ''}
                    onChange={(e) => setFormData({ ...formData, priceWithBreakfast: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="0.00"
                />
            </div>
        </>
    );
}
