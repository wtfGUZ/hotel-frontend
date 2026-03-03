import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://hotel-backend-t1xo.onrender.com/api';

export const useHotelData = () => {
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [logoUrl, setLogoUrl] = useState('/vite.png');

    // 1. Inicjalne ładowanie z zewnętrznego serwera
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRooms, resGuests, resReservations, resSettings] = await Promise.all([
                    fetch(`${API_URL}/rooms`),
                    fetch(`${API_URL}/guests`),
                    fetch(`${API_URL}/reservations`),
                    fetch(`${API_URL}/settings/hotelLogo`)
                ]);

                const dbRooms = await resRooms.json();
                const dbGuests = await resGuests.json();
                const dbReservations = await resReservations.json();
                const dbLogo = await resSettings.json();

                if (dbRooms.length > 0) setRooms(dbRooms);
                if (dbGuests.length > 0) setGuests(dbGuests);
                if (dbReservations.length > 0) setReservations(dbReservations);
                if (dbLogo && dbLogo.value) setLogoUrl(JSON.parse(dbLogo.value));
            } catch (error) {
                console.error('Błąd pobierania danych z serwera:', error);
                alert("Nie udało się połączyć z bazą danych (serwerem). Upewnij się, że backend jest uruchomiony.");
            }
        };

        fetchData();
    }, []);

    // 2. Automatyczny zapis Logo do bazy (upsert)
    useEffect(() => {
        // Pomijamy domyślną wartość jeśli to pierwszy render
        if (!logoUrl) return;

        fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'hotelLogo', value: JSON.stringify(logoUrl) })
        }).catch(err => console.error("Logo update error:", err));
    }, [logoUrl]);

    const handleRes = async (res) => {
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Błąd serwera (kod: ${res.status})`);
        }
        return res.status === 204 ? null : await res.json();
    };

    // Interfejs do modyfikacji Pokoi (Dodaj, Edytuj, Usuń)
    const addRoomAPI = async (data) => {
        try {
            const res = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const newRoom = await handleRes(res);
            setRooms(prev => [...prev, newRoom]);
            return newRoom;
        } catch (error) { console.error(error); throw error; }
    };

    const updateRoomAPI = async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/rooms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const updated = await handleRes(res);
            setRooms(prev => prev.map(r => r.id === id ? updated : r));
            return updated;
        } catch (error) { console.error(error); throw error; }
    };

    const deleteRoomAPI = async (id) => {
        try {
            const res = await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' });
            await handleRes(res);
            setRooms(prev => prev.filter(r => r.id !== id));
        } catch (error) { console.error(error); throw error; }
    };

    // Interfejs do modyfikacji Rezerwacji (Dodaj, Edytuj, Usuń)
    const addReservationAPI = async (data) => {
        try {
            const res = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const newResv = await handleRes(res);
            setReservations(prev => [...prev, newResv]);
            return newResv;
        } catch (error) { console.error(error); throw error; }
    };

    const updateReservationAPI = async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/reservations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const updated = await handleRes(res);
            setReservations(prev => prev.map(r => r.id === id ? updated : r));
            return updated;
        } catch (error) { console.error(error); throw error; }
    };

    const deleteReservationAPI = async (id) => {
        try {
            const res = await fetch(`${API_URL}/reservations/${id}`, { method: 'DELETE' });
            await handleRes(res);
            setReservations(prev => prev.filter(r => r.id !== id));
        } catch (error) { console.error(error); throw error; }
    };

    const deleteMultipleReservationsAPI = async (ids) => {
        try {
            const res = await fetch(`${API_URL}/reservations/bulk/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            await handleRes(res);
            setReservations(prev => prev.filter(r => !ids.includes(r.id)));
        } catch (error) { console.error(error); throw error; }
    };


    // Interfejs do modyfikacji Gości (Dodaj, Edytuj, Usuń)
    const addGuestAPI = async (data) => {
        try {
            const res = await fetch(`${API_URL}/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const newGuest = await handleRes(res);
            setGuests(prev => [...prev, newGuest]);
            return newGuest;
        } catch (error) { console.error(error); throw error; }
    };

    const updateGuestAPI = async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/guests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const updated = await handleRes(res);
            setGuests(prev => prev.map(g => g.id === id ? updated : g));
            return updated;
        } catch (error) { console.error(error); throw error; }
    };

    const deleteGuestAPI = async (id) => {
        try {
            const res = await fetch(`${API_URL}/guests/${id}`, { method: 'DELETE' });
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
            const res = await fetch(`${API_URL}/rooms/${roomId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
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

    return {
        rooms, setRooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, setGuests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI,
        logoUrl, setLogoUrl,
        getRoomStatus,
        toggleRoomStatus,
        getGuestName
    };
};
