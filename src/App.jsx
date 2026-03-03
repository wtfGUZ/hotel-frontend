import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import Header from './components/layout/Header';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useHotelData } from './hooks/useHotelData';
import { useModals } from './hooks/useModals';
import CalendarView from './views/CalendarView/CalendarView';
import ReservationsView from './views/ReservationsView/ReservationsView';
import GuestsView from './views/GuestsView/GuestsView';
import SettingsView from './views/SettingsView/SettingsView';
import GlobalModals from './GlobalModals';

function AppContent() {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState('calendar');

  const hotelData = useHotelData();
  const modalData = useModals();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  React.useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = hotelData.logoUrl || '/vite.png';
  }, [hotelData.logoUrl]);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput) return;
    setIsVerifying(true);
    setPinError('');
    try {
      const success = await hotelData.verifyPinAPI(pinInput);
      if (!success) {
        setPinError('Nieprawidłowy kod PIN.');
      }
    } catch (err) {
      setPinError('Wystąpił błąd komunikacji z serwerem.');
    } finally {
      setIsVerifying(false);
      setPinInput('');
    }
  };

  if (!hotelData.isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center w-full ${theme.bg} ${theme.text} transition-colors duration-300`}>
        <div className={`${theme.card} rounded-2xl shadow-xl w-full max-w-sm p-8 text-center border-t-4 border-blue-500`}>
          <div className={`w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-500`}>
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Panel Zablokowany</h2>
          <p className={`text-sm ${theme.textSecondary} mb-6`}>Wprowadź kod PIN, aby uzyskać dostęp do systemu.</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="****"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className={`w-full text-center tracking-[1em] font-bold text-xl px-4 py-3 rounded-lg ${theme.input} border focus:ring-2 focus:ring-blue-500 outline-none`}
            />
            {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
            <button
              type="submit"
              disabled={isVerifying || !pinInput}
              className={`w-full py-3 rounded-lg font-medium transition-opacity ${theme.button} disabled:opacity-50 flex justify-center items-center gap-2`}
            >
              {isVerifying ? 'Weryfikacja...' : 'Odblokuj'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden w-full ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <Header currentView={currentView} setCurrentView={setCurrentView} logoUrl={hotelData.logoUrl} />

      <main className="max-w-[98%] mx-auto px-3 py-4">
        {currentView === 'calendar' && <CalendarView hotelData={hotelData} modalData={modalData} />}
        {currentView === 'reservations' && <ReservationsView hotelData={hotelData} modalData={modalData} />}
        {currentView === 'guests' && <GuestsView hotelData={hotelData} modalData={modalData} />}
        {currentView === 'settings' && <SettingsView hotelData={hotelData} modalData={modalData} />}
      </main>

      <GlobalModals hotelData={hotelData} modalData={modalData} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
