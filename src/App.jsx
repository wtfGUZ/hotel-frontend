import React, { useState, Suspense, lazy } from 'react';
import Header from './components/layout/Header';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useHotelData } from './hooks/useHotelData';
import { useModals } from './hooks/useModals';

const CalendarView = lazy(() => import('./views/CalendarView/CalendarView'));
const ReservationsView = lazy(() => import('./views/ReservationsView/ReservationsView'));
const GuestsView = lazy(() => import('./views/GuestsView/GuestsView'));
const SettingsView = lazy(() => import('./views/SettingsView/SettingsView'));
const GlobalModals = lazy(() => import('./GlobalModals'));
const NotificationStack = lazy(() => import('./components/layout/NotificationStack'));

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
    <div className={`min-h-screen overflow-x-hidden w-full ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <Header currentView={currentView} setCurrentView={setCurrentView} hotelData={hotelData} />

      <main className="max-w-[98%] mx-auto px-3 py-4">
        <Suspense fallback={
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          {currentView === 'calendar' && <CalendarView hotelData={hotelData} modalData={modalData} />}
          {currentView === 'reservations' && <ReservationsView hotelData={hotelData} modalData={modalData} />}
          {currentView === 'guests' && <GuestsView hotelData={hotelData} modalData={modalData} />}
          {currentView === 'settings' && <SettingsView hotelData={hotelData} modalData={modalData} />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <GlobalModals hotelData={hotelData} modalData={modalData} />
        <NotificationStack hotelData={hotelData} />
      </Suspense>
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
