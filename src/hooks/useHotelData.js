import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://hotel-backend-t1xo.onrender.com/api';

export const useHotelData = () => {
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [logoUrl, setLogoUrl] = useState('/vite.png');
    const [roomIcalUrls, setRoomIcalUrls] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Wewnętrzny wrapper na fetch
    const apiFetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
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
                const [resRooms, resGuests, resReservations, resSettings, resRoomIcals] = await Promise.all([
                    apiFetch('/rooms'),
                    apiFetch('/guests'),
                    apiFetch('/reservations'),
                    apiFetch('/settings/hotelLogo'),
                    apiFetch('/settings/room_icals')
                ]);

                const dbRooms = await resRooms.json();
                const dbGuests = await resGuests.json();
                const dbReservations = await resReservations.json();
                const dbLogo = await resSettings.json();
                const dbRoomIcals = await resRoomIcals.json();

                if (dbRooms.length > 0) setRooms(dbRooms);
                if (dbGuests.length > 0) setGuests(dbGuests);
                if (dbReservations.length > 0) setReservations(dbReservations);
                if (dbLogo && dbLogo.value) setLogoUrl(JSON.parse(dbLogo.value));
                if (dbRoomIcals && dbRoomIcals.value) setRoomIcalUrls(JSON.parse(dbRoomIcals.value));
            } catch (error) {
                console.error('Błąd pobierania danych z serwera:', error);
                console.warn("Nie udało się połączyć z bazą danych (serwerem). Upewnij się, że backend jest uruchomiony.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // 2. Automatyczny zapis Logo do bazy (upsert)
    useEffect(() => {
        if (!logoUrl) return;

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

    const syncIcalAPI = async (url) => {
        try {
            const res = await apiFetch('/ical/sync', { method: 'POST', body: JSON.stringify({ url }) });
            const result = await handleRes(res);

            // Reload reservations after syncing
            const resReservations = await apiFetch('/reservations');
            const dbReservations = await resReservations.json();
            setReservations(dbReservations);

            return result;
        } catch (error) { console.error(error); throw error; }
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
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI, syncIcalAPI,
        logoUrl, setLogoUrl,
        roomIcalUrls, setRoomIcalUrls, saveRoomIcalAPI,
        verifyPinAPI, changePinAPI,
        getRoomStatus,
        toggleRoomStatus,
        getGuestName,
        isLoading,
        isSaving,
        setIsSaving
    };
};
