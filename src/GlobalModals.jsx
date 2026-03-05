import React from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import RoomModal from './components/modals/RoomModal';
import GuestModal from './components/modals/GuestModal';
import ReservationModal from './components/modals/ReservationModal';
import { getStatusText } from './utils/utils';

export default function GlobalModals({ hotelData, modalData }) {
    const { theme, darkMode } = useTheme();

    const {
        showModal, modalType, closeModal, openModal,
        editingItem, formData, setFormData,
        alertMessage, setAlertMessage,
        deleteConfirm, setDeleteConfirm,
        groupEditChoice, setGroupEditChoice
    } = modalData;

    const {
        rooms, setRooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, setGuests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI,
        isSaving, setIsSaving
    } = hotelData;

    const openReservationSmart = (reservation) => {
        if (reservation.groupId) {
            const groupSiblings = reservations.filter(r => r.groupId === reservation.groupId && r.id !== reservation.id);
            if (groupSiblings.length > 0) {
                setGroupEditChoice({ reservation, siblings: groupSiblings });
                return;
            }
        }
        openModal('reservation', reservation);
    };

    const handleGroupEditChoice = (mode) => {
        const { reservation, siblings } = groupEditChoice;
        if (mode === 'single') {
            openModal('reservation', reservation);
        } else {
            const allGroupRoomIds = [reservation.roomId, ...siblings.map(s => s.roomId)];
            openModal('reservation', reservation);
            setTimeout(() => {
                setFormData(prev => ({ ...prev, roomIds: allGroupRoomIds, roomId: allGroupRoomIds[0], isGroupEditSession: true }));
            }, 0);
        }
        setGroupEditChoice(null);
    };

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
                const uniqueRoomIds = [...new Set(validRoomIds)];

                if (uniqueRoomIds.length !== validRoomIds.length) {
                    setAlertMessage('Nie możesz wybrać tego samego pokoju wielokrotnie.');
                    return;
                }

                if (!formData.guestId || validRoomIds.length === 0 || !formData.checkIn || !formData.checkOut) {
                    setAlertMessage('Wypełnij wszystkie wymagane pola (w tym wybór pokoju)');
                    return;
                }


                const payload = {
                    guestId: String(formData.guestId),
                    roomId: parseInt(validRoomIds[0]),
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    status: String(formData.status || 'preliminary'),
                    payment: formData.status === 'paid' ? String(formData.payment || 'cash') : 'unpaid',
                    breakfast: Boolean(formData.breakfast),
                    notes: formData.notes ? String(formData.notes) : ''
                };

                setIsSaving(true);
                try {
                    if (editingItem) {
                        if (formData.isGroupEditSession && editingItem.groupId) {
                            const gId = editingItem.groupId;
                            const oldSiblings = reservations.filter(r => r.groupId === gId && r.id !== editingItem.id);
                            if (oldSiblings.length > 0) {
                                await deleteMultipleReservationsAPI(oldSiblings.map(s => String(s.id)));
                            }
                            await updateReservationAPI(String(editingItem.id), { ...payload, roomId: parseInt(validRoomIds[0]), groupId: gId });
                            for (let i = 1; i < validRoomIds.length; i++) {
                                await addReservationAPI({ ...payload, roomId: parseInt(validRoomIds[i]), groupId: gId });
                            }
                        } else {
                            await updateReservationAPI(String(editingItem.id), { ...payload, roomId: parseInt(validRoomIds[0]) });
                            if (validRoomIds.length > 1) {
                                const gId = editingItem.groupId || `grp-${Date.now()}`;
                                await updateReservationAPI(String(editingItem.id), { ...payload, roomId: parseInt(validRoomIds[0]), groupId: gId });
                                for (let i = 1; i < validRoomIds.length; i++) {
                                    await addReservationAPI({ ...payload, roomId: parseInt(validRoomIds[i]), groupId: gId });
                                }
                            }
                        }
                    } else {
                        const groupId = validRoomIds.length > 1 ? `grp-${Date.now()}` : null;
                        for (const rId of validRoomIds) {
                            await addReservationAPI({ ...payload, roomId: parseInt(rId), groupId });
                        }
                    }
                } catch (err) {
                    setAlertMessage(err.message || 'Wystąpił nieoczekiwany błąd podczas zapisywania.');
                } finally {
                    setIsSaving(false);
                }
            } else if (modalType === 'room') {
                if (!formData.number || !formData.maxGuests) {
                    setAlertMessage('Wypełnij wszystkie wymagane pola'); return;
                }
                const selectedCat = hotelData.roomCategories?.find(c => c.id === formData.categoryId);
                // Ceny są pobierane z kategorii (jeśli przypisana), nie z formularza pokoju
                const pricePerNight = selectedCat?.pricePerNight != null ? parseFloat(selectedCat.pricePerNight) : 0;
                const priceWithBreakfast = selectedCat?.priceWithBreakfast != null ? parseFloat(selectedCat.priceWithBreakfast) : pricePerNight;
                const roomPayload = {
                    number: String(formData.number),
                    name: String(selectedCat ? selectedCat.name : (formData.name || `Pokój ${formData.number}`)),
                    categoryId: formData.categoryId ? String(formData.categoryId) : null,
                    icalUrl: formData.icalUrl ? String(formData.icalUrl) : null,
                    maxGuests: parseInt(formData.maxGuests) || 1,
                    pricePerNight,
                    priceWithBreakfast,
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

            {deleteConfirm && deleteConfirm.type !== 'groupReservation' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-4">Potwierdzenie usunięcia</h3>

                        {deleteConfirm.type === 'guest' && deleteConfirm.hasReservations ? (
                            <div className="text-red-500 font-bold mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-sm">
                                ⚠️ UWAGA: Ten gość posiada przypisane rezerwacje. Usunięcie go spowoduje GŁĘBOKIE usunięcie wszystkich powiązanych z nim rezerwacji z kalendarza i bazy!
                            </div>
                        ) : null}

                        <p className={`${theme.textSecondary} mb-6`}>
                            {deleteConfirm.message || `Czy na pewno chcesz usunąć ${deleteConfirm.type === 'reservation' ? 'tę rezerwację' : deleteConfirm.type === 'room' ? 'ten pokój' : deleteConfirm.type === 'bulk-reservations' ? 'wybrane rezerwacje' : 'tego gościa'}?`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    try {
                                        if (deleteConfirm.type === 'reservation') {
                                            await deleteReservationAPI(deleteConfirm.id);
                                        }
                                        else if (deleteConfirm.type === 'bulk-reservations') {
                                            await deleteMultipleReservationsAPI(deleteConfirm.ids);
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
                                className={`flex-1 px-6 py-3 rounded-lg ${theme.buttonDanger}`}
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

            {deleteConfirm && deleteConfirm.type === 'groupReservation' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-2 text-red-500">Usuwanie rezerwacji grupowej</h3>
                        <p className={`${theme.textSecondary} mb-4 text-sm`}>
                            Ta rezerwacja jest częścią grupy ({deleteConfirm.siblings.length + 1} pokoje:
                            {' '}{[deleteConfirm.reservation, ...deleteConfirm.siblings].map(r => {
                                const room = rooms.find(rm => rm.id === r.roomId);
                                return room ? room.number : r.roomId;
                            }).join(', ')}).
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await deleteReservationAPI(String(deleteConfirm.reservation.id));
                                        setDeleteConfirm(null);
                                    } catch (err) {
                                        setAlertMessage('Błąd przy usuwaniu pojedynczego pokoju.');
                                    }
                                }}
                                className={`w-full px-4 py-3 rounded-lg ${theme.buttonSecondary} border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-colors text-left`}
                            >
                                🗑️ Usuń tylko ten pokój
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const ids = [deleteConfirm.reservation.id, ...deleteConfirm.siblings.map(s => s.id)];
                                        await deleteMultipleReservationsAPI(ids.map(String));
                                        setDeleteConfirm(null);
                                    } catch (err) {
                                        setAlertMessage('Błąd przy usuwaniu całej grupy.');
                                    }
                                }}
                                className={`w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-left shadow-lg hover:shadow-xl`}
                            >
                                💣 Usuń całą grupę ({deleteConfirm.siblings.length + 1} pokoje)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className={`w-full px-4 py-2 mt-2 rounded-lg text-sm ${theme.textSecondary} hover:opacity-80 transition-opacity`}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {groupEditChoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-2">Rezerwacja grupowa</h3>
                        <p className={`${theme.textSecondary} mb-4 text-sm`}>
                            Ta rezerwacja jest częścią grupy ({groupEditChoice.siblings.length + 1} pokoje:
                            {' '}{[groupEditChoice.reservation, ...groupEditChoice.siblings].map(r => {
                                const room = rooms.find(rm => rm.id === r.roomId);
                                return room ? room.number : r.roomId;
                            }).join(', ')}).
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleGroupEditChoice('single')}
                                className={`w-full px-4 py-3 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-80 transition-opacity text-left`}
                            >
                                ✏️ Edytuj tylko ten pokój
                            </button>
                            <button
                                onClick={() => handleGroupEditChoice('group')}
                                className={`w-full px-4 py-3 rounded-lg ${theme.button} font-medium hover:opacity-80 transition-opacity text-left`}
                            >
                                📋 Edytuj całą grupę ({groupEditChoice.siblings.length + 1} pokoje)
                            </button>
                            <button
                                onClick={() => setGroupEditChoice(null)}
                                className={`w-full px-4 py-2 rounded-lg text-sm ${theme.textSecondary} hover:opacity-80 transition-opacity`}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                    <div className={`${theme.card} rounded-2xl p-4 sm:p-6 w-full max-w-2xl my-2 sm:my-4 shadow-2xl overflow-y-auto overflow-x-hidden scrollbar-thin`}
                        style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold">
                                {modalType === 'reservation' && (editingItem ? 'Edytuj Rezerwację' : 'Nowa Rezerwacja')}
                                {modalType === 'room' && (editingItem ? 'Edytuj Pokój' : 'Nowy Pokój')}
                                {modalType === 'guest' && (editingItem ? 'Edytuj Gościa' : 'Nowy Gość')}
                            </h3>
                            <button onClick={closeModal} aria-label="Zamknij okno" className={`p-2 rounded-lg ${theme.buttonSecondary}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                            {modalType === 'reservation' && <ReservationModal formData={formData} setFormData={setFormData} hotelData={hotelData} modalData={modalData} />}
                            {modalType === 'room' && <RoomModal formData={formData} setFormData={setFormData} hotelData={hotelData} editingItem={editingItem} />}
                            {modalType === 'guest' && <GuestModal formData={formData} setFormData={setFormData} />}

                            <div className="flex justify-between pt-4 gap-3 w-full">
                                {editingItem && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (modalType === 'reservation') {
                                                if (editingItem.groupId && formData.isGroupEditSession) {
                                                    // If we are editing the group, delete the whole group directly!
                                                    const siblings = reservations.filter(s => s.groupId === editingItem.groupId && s.id !== editingItem.id);
                                                    closeModal();
                                                    setDeleteConfirm({ type: 'groupReservation', reservation: editingItem, siblings });
                                                } else if (editingItem.groupId) {
                                                    const siblings = reservations.filter(s => s.groupId === editingItem.groupId && s.id !== editingItem.id);
                                                    closeModal();
                                                    if (siblings.length > 0) {
                                                        setDeleteConfirm({ type: 'groupReservation', reservation: editingItem, siblings });
                                                    } else {
                                                        setDeleteConfirm({ type: 'reservation', id: editingItem.id });
                                                    }
                                                } else {
                                                    closeModal();
                                                    setDeleteConfirm({ type: 'reservation', id: editingItem.id });
                                                }
                                            } else {
                                                closeModal();
                                                setDeleteConfirm({ type: modalType, id: editingItem.id, hasReservations: modalType === 'guest' ? hotelData.reservations.some(r => r.guestId === editingItem.id) : false });
                                            }
                                        }}
                                        className={`px-3 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 font-medium transition-colors border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 w-auto`}
                                        title="Usuń"
                                    >
                                        <Trash2 className="w-5 h-5 flex-shrink-0" />
                                        <span className="hidden sm:inline">Usuń</span>
                                    </button>
                                )}
                                <div className="flex gap-2 sm:gap-3 flex-1 justify-end w-full">
                                    <button type="button" onClick={closeModal} className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 rounded-lg ${theme.buttonSecondary} font-medium hover:opacity-90 transition-opacity`}>
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
            )}
        </>
    );
}
