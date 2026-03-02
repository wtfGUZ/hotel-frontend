import React from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import RoomModal from './components/modals/RoomModal';
import GuestModal from './components/modals/GuestModal';
import ReservationModal from './components/modals/ReservationModal';
import { getStatusText } from './utils/utils';

export default function GlobalModals({ hotelData, modalData }) {
    const { theme, darkMode } = useTheme();

    const {
        showModal, modalType, closeModal,
        editingItem, formData, setFormData,
        alertMessage, setAlertMessage,
        deleteConfirm, setDeleteConfirm
    } = modalData;

    const {
        rooms, setRooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, setGuests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI
    } = hotelData;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'reservation') {
                if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
                    setAlertMessage('Data wymeldowania musi być późniejsza niż data zameldowania');
                    return;
                }
                const currentRoomIds = formData.roomIds || (formData.roomId ? [formData.roomId] : []);
                const validRoomIds = currentRoomIds.filter(id => id !== '');

                if (!formData.guestId || validRoomIds.length === 0 || !formData.checkIn || !formData.checkOut) {
                    setAlertMessage('Wypełnij wszystkie wymagane pola (w tym wybór pokoju)');
                    return;
                }

                const checkRoomConflict = (roomId, checkIn, checkOut, excludeReservationId = null) => {
                    return reservations.find(r => {
                        if (excludeReservationId && r.id === excludeReservationId) return false;
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

                for (const rId of validRoomIds) {
                    const conflict = checkRoomConflict(rId, formData.checkIn, formData.checkOut, editingItem?.id);
                    if (conflict) {
                        const conflictRoom = rooms.find(r => r.id === rId);
                        const conflictGuest = guests.find(g => g.id === conflict.guestId);
                        setAlertMessage(
                            `❌ KONFLIKT REZERWACJI!\n\nPokój ${conflictRoom?.number} jest już zarezerwowany w tym terminie:\n\nGość: ${conflictGuest ? `${conflictGuest.firstName} ${conflictGuest.lastName}` : 'Nieznany'}\nData: ${new Date(conflict.checkIn).toLocaleDateString('pl-PL')} - ${new Date(conflict.checkOut).toLocaleDateString('pl-PL')}\nStatus: ${getStatusText(conflict.status)}\n\nWybierz inny pokój lub zmień daty.`
                        );
                        return;
                    }
                }

                const payload = {
                    guestId: String(formData.guestId),
                    roomId: parseInt(validRoomIds[0]),
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    status: String(formData.status || 'preliminary'),
                    payment: String(formData.payment || 'unpaid'),
                    breakfast: Boolean(formData.breakfast),
                    notes: formData.notes ? String(formData.notes) : ''
                };

                if (editingItem) {
                    await updateReservationAPI(String(editingItem.id), payload);
                } else {
                    for (const rId of validRoomIds) {
                        await addReservationAPI({ ...payload, roomId: parseInt(rId) });
                    }
                }
            } else if (modalType === 'room') {
                if (!formData.number || !formData.name || !formData.maxGuests) {
                    setAlertMessage('Wypełnij wszystkie wymagane pola'); return;
                }
                const roomPayload = {
                    number: String(formData.number),
                    name: String(formData.name),
                    maxGuests: parseInt(formData.maxGuests) || 1,
                    pricePerNight: parseFloat(formData.pricePerNight) || 0,
                    priceWithBreakfast: parseFloat(formData.priceWithBreakfast) || parseFloat(formData.pricePerNight) || 0,
                    status: String(formData.status || 'clean')
                };
                if (editingItem) {
                    await updateRoomAPI(editingItem.id, roomPayload);
                } else {
                    await addRoomAPI(roomPayload);
                }
            } else if (modalType === 'guest') {
                if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
                    setAlertMessage('Wypełnij wszystkie wymagane pola'); return;
                }
                const guestPayload = {
                    firstName: String(formData.firstName),
                    lastName: String(formData.lastName),
                    email: String(formData.email || ''),
                    phone: String(formData.phone || '')
                };
                if (editingItem) {
                    await updateGuestAPI(String(editingItem.id), guestPayload);
                } else {
                    await addGuestAPI(guestPayload);
                }
            }
            closeModal();
        } catch (error) {
            console.error(error);
            setAlertMessage('Wystąpił błąd komunikacji z bazą danych (serwerem). Zobacz konsolę po więcej szczegółów.');
        }
    };

    return (
        <>
            {alertMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-4 text-yellow-500">Uwaga</h3>
                        <p className={`${theme.textSecondary} mb-6 whitespace-pre-line`}>{alertMessage}</p>
                        <button onClick={() => setAlertMessage(null)} className={`w-full px-6 py-3 rounded-lg ${theme.button} font-medium transition-opacity hover:opacity-80`}>OK</button>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-4">Potwierdzenie usunięcia</h3>
                        <p className={`${theme.textSecondary} mb-6`}>
                            {deleteConfirm.message || `Czy na pewno chcesz usunąć ${deleteConfirm.type === 'reservation' ? 'tę rezerwację' : deleteConfirm.type === 'room' ? 'ten pokój' : 'tego gościa'}?`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    try {
                                        if (deleteConfirm.type === 'reservation') {
                                            await deleteReservationAPI(deleteConfirm.id);
                                        }
                                        else if (deleteConfirm.type === 'guest') {
                                            await deleteGuestAPI(deleteConfirm.id);
                                        }
                                        else if (deleteConfirm.type === 'room') {
                                            await deleteRoomAPI(deleteConfirm.id);
                                        }
                                        else if (deleteConfirm.type === 'clearAll') {
                                            setAlertMessage('🗑️ Czyszczenie danycyh z poziomu bazy Supabase niedostępne stąd.');
                                        }
                                        setDeleteConfirm(null);
                                    } catch (err) {
                                        setAlertMessage('Błąd bazy danych przy usuwaniu.');
                                    }
                                }}
                                className="flex-1 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                            >
                                {deleteConfirm.type === 'clearAll' ? 'Tak, wyczyść wszystko' : 'Usuń'}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className={`flex-1 px-6 py-3 rounded-lg ${theme.buttonSecondary} font-medium transition-opacity hover:opacity-80`}>
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                    <div className={`${theme.card} rounded-2xl p-4 sm:p-6 w-full max-w-2xl my-8 shadow-2xl overflow-y-auto scrollbar-thin`}
                        style={{ maxHeight: 'calc(100vh - 4rem)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold">
                                {modalType === 'reservation' && (editingItem ? 'Edytuj Rezerwację' : 'Nowa Rezerwacja')}
                                {modalType === 'room' && (editingItem ? 'Edytuj Pokój' : 'Nowy Pokój')}
                                {modalType === 'guest' && (editingItem ? 'Edytuj Gościa' : 'Nowy Gość')}
                            </h3>
                            <button onClick={closeModal} className={`p-2 rounded-lg ${theme.buttonSecondary}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {modalType === 'reservation' && <ReservationModal formData={formData} setFormData={setFormData} hotelData={hotelData} modalData={modalData} />}
                            {modalType === 'room' && <RoomModal formData={formData} setFormData={setFormData} />}
                            {modalType === 'guest' && <GuestModal formData={formData} setFormData={setFormData} />}

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className={`flex-1 px-6 py-3 rounded-lg ${theme.button} font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                                    <Check className="w-5 h-5" />
                                    {editingItem ? 'Zapisz zmiany' : 'Dodaj'}
                                </button>
                                <button type="button" onClick={closeModal} className={`px-6 py-3 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-90 transition-opacity`}>
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
