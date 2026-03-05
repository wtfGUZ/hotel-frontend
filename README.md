# 🏨 Hotel Manager — Frontend

Interfejs zarządzania rezerwacjami hotelowymi — React SPA z responsywnym kalendarzem i integracją Booking.com przez iCal.

## Technologie

| Warstwa | Technologia |
|---|---|
| Framework | React 19 (Vite 7) |
| Styling | Tailwind CSS 4 |
| Ikony | Lucide React |
| Hosting | Vercel |

## Uruchomienie lokalne

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom serwer deweloperski
npm run dev

# 3. Build produkcyjny
npm run build
```

## Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `VITE_API_URL` | URL backendu (domyślnie: Render) |
| `VITE_API_SECRET` | Bearer token do API (opcjonalny) |

## Struktura projektu

```
src/
├── App.jsx                    # Router + lazy loading widoków
├── GlobalModals.jsx           # Orchestrator modali
├── main.jsx                   # Entry point
├── components/
│   ├── layout/
│   │   ├── Header.jsx         # Nawigacja + logo
│   │   └── Sidebar.jsx        # Menu boczne
│   ├── modals/
│   │   ├── AlertModal.jsx     # Komunikaty
│   │   ├── DeleteConfirmModal.jsx
│   │   ├── FormModal.jsx      # Otoczka formularza
│   │   ├── GroupDeleteModal.jsx
│   │   ├── GroupEditChoiceModal.jsx
│   │   ├── GuestModal.jsx     # Formularz gościa
│   │   ├── ReservationModal.jsx # Formularz rezerwacji
│   │   └── RoomModal.jsx      # Formularz pokoju
│   └── PinLockScreen.jsx      # Ekran PIN
├── context/
│   └── ThemeContext.jsx        # Dark/Light mode
├── hooks/
│   ├── useHotelData.js        # API + stan danych
│   └── useModals.js           # Stan modali
├── utils/
│   └── utils.js               # Helpers (daty, kolory, statusy)
└── views/
    ├── CalendarView/           # Kalendarz rezerwacji
    ├── GuestsView/             # Lista gości
    ├── ReservationsView/       # Lista rezerwacji
    └── SettingsView/           # Ustawienia hotelu
```

## Funkcjonalności

- 📅 **Kalendarz rezerwacji** — widok siatki z drag-free UI
- 🔄 **Synchronizacja iCal** — import/eksport Booking.com
- 👥 **Rezerwacje grupowe** — wiele pokoi na jednego gościa
- 🌓 **Dark/Light mode** — z persystencją w localStorage
- 📱 **Mobile-first** — pełny responsive design
- 🔐 **PIN lock** — zabezpieczenie dostępu bcryptem
- ⚡ **Code splitting** — lazy loading widoków + Vite manualChunks

## Statusy rezerwacji

| Status | Kolor | Opis |
|---|---|---|
| Wstępna | 🟡 Żółty | Niezatwierdzona |
| Potwierdzona | 🔵 Niebieski | Zatwierdzona |
| Opłacona | 🟢 Zielony | Zapłacona |
| Zakończona | ⚪ Szary | Completed |
