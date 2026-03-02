import React, { useState } from 'react';
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

  React.useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = hotelData.logoUrl || '/vite.png';
  }, [hotelData.logoUrl]);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`}>
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
