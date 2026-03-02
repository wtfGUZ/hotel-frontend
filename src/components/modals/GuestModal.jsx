import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GuestModal({ formData, setFormData }) {
    const { theme } = useTheme();

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 font-medium">Imię</label>
                    <input
                        type="text"
                        required
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium">Nazwisko</label>
                    <input
                        type="text"
                        required
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                </div>
            </div>

            <div>
                <label className="block mb-2 font-medium">Email</label>
                <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                />
            </div>

            <div>
                <label className="block mb-2 font-medium">Telefon</label>
                <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="+48 123 456 789"
                />
            </div>
        </>
    );
}
