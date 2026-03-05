import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://hotel-backend-t1xo.onrender.com/api';
const API_SECRET = import.meta.env.VITE_API_SECRET || '';

export const useHotelData = () => {
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [logoUrl, setLogoUrl] = useState('/vite.png');
    const [roomCategories, setRoomCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoInitialized, setLogoInitialized] = useState(false);

    // Wewnętrzny wrapper na fetch
    const apiFetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(API_SECRET ? { 'Authorization': `Bearer ${API_SECRET}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        return response;
    };

    const handleRes = async (res) => {
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Błąd serwera (kod: ${res.status})`);
        }
        return res.status === 204 ? null : await res.json();
    };


    // 1. Inicjalne ładowanie z zewnętrznego serwera
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRooms, resGuests, resReservations, resSettings, resCategories] = await Promise.all([
                    apiFetch('/rooms'),
                    apiFetch('/guests'),
                    apiFetch('/reservations'),
                    apiFetch('/settings/hotelLogo'),
                    apiFetch('/settings/room_categories')
                ]);

                const dbRooms = await resRooms.json();
                const dbGuests = await resGuests.json();
                const dbReservations = await resReservations.json();
                const dbLogo = await resSettings.json();
                const dbCategories = await resCategories.json();

                setRooms(dbRooms);
                setGuests(dbGuests);
                setReservations(dbReservations);
                if (dbLogo && dbLogo.value) setLogoUrl(JSON.parse(dbLogo.value));
                if (dbCategories && dbCategories.value) setRoomCategories(JSON.parse(dbCategories.value));
            } catch (error) {
                console.error('Błąd pobierania danych z serwera:', error);
                console.warn("Nie udało się połączyć z bazą danych (serwerem). Upewnij się, że backend jest uruchomiony.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const syncAllIcalCategoriesAPI = async () => {
        try {
            const syncPromises = [];

            // Sync per-room iCal URLs (każdy pokój ma swój własny URL Booking.com)
            if (rooms && rooms.length > 0) {
                rooms.forEach(room => {
                    const url = room.icalUrl?.trim();
                    if (url) {
                        syncPromises.push(
                            apiFetch('/ical/sync', {
                                method: 'POST',
                                body: JSON.stringify({ url, roomId: room.id })
                            }).catch(err => console.error(`Błąd sync iCal dla pokoju ${room.number}:`, err))
                        );
                    }
                });
            }

            if (syncPromises.length > 0) {
                await Promise.all(syncPromises);
                const resReservations = await apiFetch('/reservations');
                const dbReservations = await resReservations.json();
                setReservations(dbReservations);
            }
            return true;
        } catch (err) {
            console.error("Błąd w procesie synchronizacji iCal:", err);
            return false;
        }
    };

    // 2. Automatyczny zapis Logo do bazy (upsert) — pomiń pierwszy render (dane z serwera)
    useEffect(() => {
        if (!logoUrl) return;
        if (!logoInitialized) {
            setLogoInitialized(true);
            return;
        }

        apiFetch('/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'hotelLogo', value: JSON.stringify(logoUrl) })
        }).catch(err => console.error("Logo update error:", err));
    }, [logoUrl]);


    // Interfejs do modyfikacji Pokoi (Dodaj, Edytuj, Usuń)
    const addRoomAPI = async (data) => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/rooms', { method: 'POST', body: JSON.stringify(data) });
            const newRoom = await handleRes(res);
            setRooms(prev => [...prev, newRoom]);
            return newRoom;
        } catch (error) { console.error(error); throw error; }
        finally { setIsSaving(false); }
    };

    const updateRoomAPI = async (id, data) => {
        try {
            const res = await apiFetch(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const updated = await handleRes(res);
            setRooms(prev => prev.map(r => r.id === id ? updated : r));
            return updated;
        } catch (error) { console.error(error); throw error; }
    };

    const deleteRoomAPI = async (id) => {
        try {
            const res = await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
            await handleRes(res);
            setRooms(prev => prev.filter(r => r.id !== id));
        } catch (error) { console.error(error); throw error; }
    };

    // Interfejs do modyfikacji Rezerwacji (Dodaj, Edytuj, Usuń)
    const addReservationAPI = async (data) => {
        try {
            const res = await apiFetch('/reservations', { method: 'POST', body: JSON.stringify(data) });
            const newResv = await handleRes(res);
            setReservations(prev => [...prev, newResv]);
            return newResv;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateReservationAPI = async (id, data) => {
        try {
            const res = await apiFetch(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const updated = await handleRes(res);
            setReservations(prev => prev.map(r => r.id === id ? updated : r));
            return updated;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const acknowledgeReservationAPI = async (id) => {
        try {
            const res = await apiFetch(`/reservations/${id}/acknowledge`, { method: 'PUT' });
            const updated = await handleRes(res);
            setReservations(prev => prev.map(r => r.id === id ? { ...r, isNewIcal: false } : r));
            return updated;
        } catch (error) {
            console.error("Nie udało się potwierdzić rezerwacji:", error);
            throw error;
        }
    };

    const deleteReservationAPI = async (id) => {
        try {
            const res = await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
            await handleRes(res);
            setReservations(prev => prev.filter(r => r.id !== id));
        } catch (error) { console.error(error); throw error; }
    };

    const deleteMultipleReservationsAPI = async (ids) => {
        try {
            const res = await apiFetch('/reservations/bulk/delete', { method: 'DELETE', body: JSON.stringify({ ids }) });
            await handleRes(res);
            setReservations(prev => prev.filter(r => !ids.includes(r.id)));
        } catch (error) { console.error(error); throw error; }
    };



    const saveRoomCategoriesAPI = async (categories) => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/settings', { method: 'POST', body: JSON.stringify({ key: 'room_categories', value: JSON.stringify(categories) }) });
            await handleRes(res);
            setRoomCategories(categories);
        } catch (error) { console.error(error); throw error; }
        finally { setIsSaving(false); }
    };

    // Interfejs do modyfikacji Gości (Dodaj, Edytuj, Usuń)
    const addGuestAPI = async (data) => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/guests', { method: 'POST', body: JSON.stringify(data) });
            const newGuest = await handleRes(res);
            setGuests(prev => [...prev, newGuest]);
            return newGuest;
        } catch (error) { console.error(error); throw error; }
        finally { setIsSaving(false); }
    };

    const updateGuestAPI = async (id, data) => {
        try {
            const res = await apiFetch(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const updated = await handleRes(res);
            setGuests(prev => prev.map(g => g.id === id ? updated : g));
            return updated;
        } catch (error) { console.error(error); throw error; }
    };

    const deleteGuestAPI = async (id) => {
        try {
            const res = await apiFetch(`/guests/${id}`, { method: 'DELETE' });
            await handleRes(res);
            setGuests(prev => prev.filter(g => g.id !== id));
        } catch (error) { console.error(error); throw error; }
    };

    // Pomocnicze funkcje dla widoków (czytane ze stanu React)
    const getRoomStatus = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.status : 'clean';
    };

    const toggleRoomStatus = async (roomId) => {
        const currentStatus = getRoomStatus(roomId);
        let newStatus = currentStatus === 'clean' ? 'occupied' : currentStatus === 'occupied' ? 'dirty' : 'clean';

        try {
            // Zmiana w bazie
            const res = await apiFetch(`/rooms/${roomId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            await handleRes(res);

            // Zmiana w UI
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error(error);
        }
    };

    const getGuestName = (guestId) => {
        const guest = guests.find(g => String(g.id) === String(guestId));
        return guest ? `${guest.firstName} ${guest.lastName}` : 'Nieznany';
    };

    // Obsługa zabezpieczeń PIN
    const verifyPinAPI = async (pin) => {
        try {
            const res = await apiFetch('/settings/verify-pin', {
                method: 'POST',
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            return data.success === true;
        } catch (error) { console.error(error); throw error; }
    };

    const changePinAPI = async (oldPin, newPin) => {
        try {
            const res = await apiFetch('/settings/pin', { method: 'PUT', body: JSON.stringify({ oldPin, newPin }) });
            const data = await res.json();
            if (data.success) {
                return { success: true };
            }
            return { success: false, message: data.message || 'Failed to change PIN.' };
        } catch (error) { console.error(error); throw error; }
    };

    return {
        rooms, setRooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, setGuests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI, acknowledgeReservationAPI,
        logoUrl, setLogoUrl,
        roomCategories, setRoomCategories, saveRoomCategoriesAPI, syncAllIcalCategoriesAPI,
        verifyPinAPI, changePinAPI,
        getRoomStatus,
        toggleRoomStatus,
        getGuestName,
        isLoading,
        isSaving,
        setIsSaving
    };
};
