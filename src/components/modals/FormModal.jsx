import React from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import RoomModal from './RoomModal';
import GuestModal from './GuestModal';
import ReservationModal from './ReservationModal';

export default function FormModal({ showModal, modalType, editingItem, formData, setFormData, hotelData, modalData, isSaving, onSubmit, onDelete, onClose }) {
    const { theme } = useTheme();

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className={`${theme.card} rounded-2xl p-4 sm:p-6 w-full max-w-2xl my-2 sm:my-4 shadow-2xl overflow-y-auto overflow-x-hidden scrollbar-thin`}
                style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">
                        {modalType === 'reservation' && (editingItem ? 'Edytuj Rezerwację' : 'Nowa Rezerwacja')}
                        {modalType === 'room' && (editingItem ? 'Edytuj Pokój' : 'Nowy Pokój')}
                        {modalType === 'guest' && (editingItem ? 'Edytuj Gościa' : 'Nowy Gość')}
                    </h3>
                    <button onClick={onClose} aria-label="Zamknij okno" className={`p-2 rounded-lg ${theme.buttonSecondary}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-2 sm:space-y-3">
                    {modalType === 'reservation' && <ReservationModal formData={formData} setFormData={setFormData} hotelData={hotelData} modalData={modalData} />}
                    {modalType === 'room' && <RoomModal formData={formData} setFormData={setFormData} hotelData={hotelData} editingItem={editingItem} />}
                    {modalType === 'guest' && <GuestModal formData={formData} setFormData={setFormData} />}

                    <div className="flex justify-between pt-4 gap-3 w-full">
                        {editingItem && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-3 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 font-medium transition-colors border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 w-auto"
                                title="Usuń"
                            >
                                <Trash2 className="w-5 h-5 flex-shrink-0" />
                                <span className="hidden sm:inline">Usuń</span>
                            </button>
                        )}
                        <div className="flex gap-2 sm:gap-3 flex-1 justify-end w-full">
                            <button type="button" onClick={onClose} className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-90 transition-opacity`}>
                                Anuluj
                            </button>
                            <button type="submit" disabled={isSaving} className={`flex-[2] sm:flex-[0_1_auto] px-3 sm:px-6 py-3 rounded-lg ${theme.button} font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 min-w-0`}>
                                <Check className="w-5 h-5 flex-shrink-0" />
                                <span className="truncate">{isSaving ? 'Zapisywanie...' : (editingItem ? 'Zapisz' : 'Dodaj')}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
