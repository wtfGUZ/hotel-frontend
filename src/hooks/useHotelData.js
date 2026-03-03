import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://hotel-backend-t1xo.onrender.com/api';

export const useHotelData = () => {
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [logoUrl, setLogoUrl] = useState('/vite.png');
    const [isLoading, setIsLoading] = useState(true);

    // Wewnętrzny wrapper na fetch dodający token JWT i reagujący na utratę sesji
    const apiFetch = async (endpoint, options = {}) => {
        const token = localStorage.getItem('jwt_token');

        // Niektóre endpointy są publiczne
        const isPublic = endpoint === '/settings/verify-pin' || endpoint === '/settings/hotelLogo';

        if (!token && !isPublic) {
            throw new Error('Brak tokenu - wymagane logowanie');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if ((response.status === 401 || response.status === 403) && !isPublic) {
            const wasLoggedIn = !!sessionStorage.getItem('adminPin');

            // Token wygasł lub jest nieprawidłowy, wymuś wylogowanie
            localStorage.removeItem('jwt_token');
            sessionStorage.removeItem('adminPin'); // wylogowanie z UI

            if (wasLoggedIn) {
                window.location.reload(); // Przeładuj tylko jeśli użytkownik myślał, że jest zalogowany
            }
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }

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
                // Do pobrania ustawień nie potrzeba tokenu, ale apiFetch to obsłuży
                const [resRooms, resGuests, resReservations, resSettings] = await Promise.all([
                    apiFetch('/rooms'),
                    apiFetch('/guests'),
                    apiFetch('/reservations'),
                    apiFetch('/settings/hotelLogo')
                ]);

                // Jeśli apiFetch wyrzuci błąd (np. 401), spadnie do catch i zatrzyma ładowanie
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
                // Nie używamy alertu przy błędzie 401 z apiFetch, bo on już przeładował stronę
                if (error.message !== 'Sesja wygasła. Zaloguj się ponownie.') {
                    console.warn("Nie udało się połączyć z bazą danych (serwerem). Upewnij się, że backend jest uruchomiony.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        // Jeżeli nie jesteśmy zalogowani poprzez token, pobieranie chronionych zasobów i tak zwróci błąd,
        // jednak w tym setupie UI pyta o PIN zanim renderuje kalendarz, więc fetchData ma szansę zadziałać.
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
        try {
            const res = await apiFetch('/rooms', { method: 'POST', body: JSON.stringify(data) });
            const newRoom = await handleRes(res);
            setRooms(prev => [...prev, newRoom]);
            return newRoom;
        } catch (error) { console.error(error); throw error; }
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
            // Jeśli wystąpił konflikt 409, pokażemy to we froncie
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
        try {
            const res = await apiFetch('/guests', { method: 'POST', body: JSON.stringify(data) });
            const newGuest = await handleRes(res);
            setGuests(prev => [...prev, newGuest]);
            return newGuest;
        } catch (error) { console.error(error); throw error; }
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

    // Obsługa zabezpieczeń PIN & JWT Token
    const verifyPinAPI = async (pin) => {
        try {
            const res = await fetch(`${API_URL}/settings/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await handleRes(res);
            if (data.success && data.token) {
                // Konfigurujemy JWT przy sukcesie logowania PINem
                localStorage.setItem('jwt_token', data.token);
                return true;
            }
            return false;
        } catch (error) { console.error(error); throw error; }
    };

    const changePinAPI = async (oldPin, newPin) => {
        try {
            const res = await apiFetch('/settings/pin', { method: 'PUT', body: JSON.stringify({ oldPin, newPin }) });
            const result = await handleRes(res);
            if (result.success) {
                // Po zmianie pinu wymuśmy wylogowanie z UI by zalogować się nowym pinem
                localStorage.removeItem('jwt_token');
                sessionStorage.removeItem('adminPin');
                window.location.reload();
            }
            return result;
        } catch (error) { console.error(error); throw error; }
    };

    return {
        rooms, setRooms, addRoomAPI, updateRoomAPI, deleteRoomAPI,
        guests, setGuests, addGuestAPI, updateGuestAPI, deleteGuestAPI,
        reservations, setReservations, addReservationAPI, updateReservationAPI, deleteReservationAPI, deleteMultipleReservationsAPI, syncIcalAPI,
        logoUrl, setLogoUrl,
        verifyPinAPI, changePinAPI,
        getRoomStatus,
        toggleRoomStatus,
        getGuestName,
        isLoading
    };
};
