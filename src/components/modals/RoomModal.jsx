import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RoomModal({ formData, setFormData, hotelData, editingItem }) {
    const { theme } = useTheme();
    const { roomCategories } = hotelData || {};

    const exportUrl = editingItem
        ? `${API_URL.replace('/api', '')}/api/ical/export/room/${editingItem.id}/calendar.ics`
        : null;

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
                <label className="block mb-2 font-medium">Kategoria</label>
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
            </div>

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

            {/* Ceny z kategorii */}
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
                        </div>
                    );
                }
                return null;
            })()}

            {/* iCal import z Booking.com */}
            <div>
                <label className="block mb-1 font-medium text-sm">URL kalendarza iCal (Booking.com)</label>
                <input
                    type="url"
                    value={formData.icalUrl || ''}
                    onChange={(e) => setFormData({ ...formData, icalUrl: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                    placeholder="https://ical.booking.com/v1/export/t/..."
                />
                <p className="text-xs text-gray-500 mt-1">Link iCal z Booking.com dla tego konkretnego pokoju. Sync co 60 s.</p>
            </div>

            {/* iCal export do Booking.com */}
            {exportUrl && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/25">
                    <p className="text-xs font-semibold text-green-400 mb-1">📤 Link eksportu dla Booking.com</p>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={exportUrl}
                            className={`flex-1 px-2 py-1.5 rounded text-xs ${theme.input} border`}
                        />
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(exportUrl)}
                            className={`px-3 py-1 rounded text-xs ${theme.button} whitespace-nowrap`}
                        >Kopiuj</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Wklej ten link w Booking.com → Synchronizuj kalendarze → Eksportuj.</p>
                </div>
            )}
        </>
    );
}
