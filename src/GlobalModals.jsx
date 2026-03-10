import React from 'react';
import { useTheme } from './context/ThemeContext';
import AlertModal from './components/modals/AlertModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import GroupDeleteModal from './components/modals/GroupDeleteModal';
import GroupEditChoiceModal from './components/modals/GroupEditChoiceModal';
import FormModal from './components/modals/FormModal';

export default function GlobalModals({ hotelData, modalData }) {
    const { theme } = useTheme();

    const {
        showModal, modalType, closeModal, openModal,
        editingItem, formData, setFormData,
        alertMessage, setAlertMessage,
        deleteConfirm, setDeleteConfirm,
        groupEditChoice, setGroupEditChoice
    } = modalData;

    const {
        rooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI,
        isSaving, setIsSaving
    } = hotelData;

    // --- Group edit choice logic ---
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

    // --- Form submit logic ---
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
                    payment: (formData.status === 'paid' || formData.status === 'completed' || formData.payment === 'booking') ? String(formData.payment || 'unpaid') : 'unpaid',
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
                const guestPayload = {
                    firstName: String(formData.firstName || ''),
                    lastName: String(formData.lastName || ''),
                    email: String(formData.email || ''),
                    phone: String(formData.phone || ''),
                    pesel: String(formData.pesel || ''),
                    idNumber: String(formData.idNumber || '')
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

    // --- Delete button inside form modal ---
    const handleFormDelete = () => {
        if (modalType === 'reservation') {
            if (editingItem.groupId && formData.isGroupEditSession) {
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
    };

    // --- Delete confirm handlers ---
    const handleDeleteConfirm = async () => {
        try {
            if (deleteConfirm.type === 'reservation') {
                await deleteReservationAPI(deleteConfirm.id);
            } else if (deleteConfirm.type === 'bulk-reservations') {
                await deleteMultipleReservationsAPI(deleteConfirm.ids);
            } else if (deleteConfirm.type === 'guest') {
                await deleteGuestAPI(deleteConfirm.id);
            } else if (deleteConfirm.type === 'room') {
                await deleteRoomAPI(deleteConfirm.id);
            } else if (deleteConfirm.type === 'clearAll') {
                setAlertMessage('🗑️ Czyszczenie danych z poziomu bazy Supabase niedostępne stąd.');
            }
            setDeleteConfirm(null);
        } catch (err) {
            setAlertMessage('Błąd bazy danych przy usuwaniu.');
        }
    };

    const handleGroupDeleteSingle = async () => {
        try {
            await deleteReservationAPI(String(deleteConfirm.reservation.id));
            setDeleteConfirm(null);
        } catch (err) {
            setAlertMessage('Błąd przy usuwaniu pojedynczego pokoju.');
        }
    };

    const handleGroupDeleteAll = async () => {
        try {
            const ids = [deleteConfirm.reservation.id, ...deleteConfirm.siblings.map(s => s.id)];
            await deleteMultipleReservationsAPI(ids.map(String));
            setDeleteConfirm(null);
        } catch (err) {
            setAlertMessage('Błąd przy usuwaniu całej grupy.');
        }
    };

    // --- Bulk delete with group handling ---
    const handleBulkDeleteSelectedOnly = async () => {
        try {
            await deleteMultipleReservationsAPI(deleteConfirm.selectedIds.map(String));
            setDeleteConfirm(null);
        } catch (err) {
            setAlertMessage('Błąd przy usuwaniu zaznaczonych rezerwacji.');
        }
    };

    const handleBulkDeleteWithFullGroups = async () => {
        try {
            const allIds = new Set(deleteConfirm.selectedIds.map(String));
            // Dodaj brakujące elementy grup
            deleteConfirm.partialGroups.forEach(pg => {
                pg.allInGroup.forEach(r => allIds.add(String(r.id)));
            });
            await deleteMultipleReservationsAPI(Array.from(allIds));
            setDeleteConfirm(null);
        } catch (err) {
            setAlertMessage('Błąd przy usuwaniu rezerwacji z grupami.');
        }
    };

    return (
        <>
            <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />

            <DeleteConfirmModal
                deleteConfirm={deleteConfirm}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm(null)}
            />

            <GroupDeleteModal
                deleteConfirm={deleteConfirm}
                rooms={rooms}
                onDeleteSingle={handleGroupDeleteSingle}
                onDeleteGroup={handleGroupDeleteAll}
                onCancel={() => setDeleteConfirm(null)}
            />

            <GroupEditChoiceModal
                groupEditChoice={groupEditChoice}
                rooms={rooms}
                onEditSingle={() => handleGroupEditChoice('single')}
                onEditGroup={() => handleGroupEditChoice('group')}
                onCancel={() => setGroupEditChoice(null)}
            />

            {deleteConfirm && deleteConfirm.type === 'bulkWithGroups' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${theme.card} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                        <h3 className="text-xl font-bold mb-2 text-red-500">Usuwanie z rezerwacjami grupowymi</h3>
                        <p className={`${theme.textSecondary} mb-4 text-sm`}>
                            {deleteConfirm.message}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleBulkDeleteSelectedOnly}
                                className={`w-full px-4 py-3 rounded-lg ${theme.buttonSecondary} border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-colors text-left`}
                            >
                                🗑️ Usuń tylko zaznaczone ({deleteConfirm.selectedIds.length})
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkDeleteWithFullGroups}
                                className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-left shadow-lg hover:shadow-xl"
                            >
                                💣 Usuń zaznaczone + całe ich grupy
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

            <FormModal
                showModal={showModal}
                modalType={modalType}
                editingItem={editingItem}
                formData={formData}
                setFormData={setFormData}
                hotelData={hotelData}
                modalData={modalData}
                isSaving={isSaving}
                onSubmit={handleSubmit}
                onDelete={handleFormDelete}
                onClose={closeModal}
            />
        </>
    );
}
