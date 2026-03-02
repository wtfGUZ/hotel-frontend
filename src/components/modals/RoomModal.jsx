import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function RoomModal({ formData, setFormData }) {
    const { theme } = useTheme();

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
                <label className="block mb-2 font-medium">Nazwa pokoju</label>
                <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="np. Pokój Standard"
                />
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
