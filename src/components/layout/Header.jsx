import React, { useState, useEffect } from 'react';
import { Bed, Calendar, Users, Settings, Moon, Sun, Menu as MenuIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ currentView, setCurrentView, hotelData }) {
    const { darkMode, toggleDarkMode, theme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [syncCountdown, setSyncCountdown] = useState(60);
    const [showSyncTooltip, setShowSyncTooltip] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Przechowujemy referencję do aktualnej funkcji API unikając wciąż restartującego się useEffect interval
    const syncFnRef = React.useRef(hotelData?.syncAllIcalCategoriesAPI);
    useEffect(() => {
        syncFnRef.current = hotelData?.syncAllIcalCategoriesAPI;
    }, [hotelData?.syncAllIcalCategoriesAPI]);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.log('🔄 Wymuszona synchronizacja iCal...');
        if (syncFnRef.current) {
            await syncFnRef.current();
        }
        setSyncCountdown(60);
        setIsSyncing(false);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setSyncCountdown(prev => {
                if (prev <= 1) {
                    console.log('🔄 Automatyczna synchronizacja iCal...');
                    if (syncFnRef.current) {
                        syncFnRef.current().catch(console.error);
                    }
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className={`${theme.card} shadow-lg sticky top-0 z-50`}>
            <div className="max-w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 pt-[max(env(safe-area-inset-top),0.75rem)] sm:pt-[max(env(safe-area-inset-top),1rem)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img
                            src={hotelData?.logoUrl || "/vite.png"}
                            alt="Hotel Logo"
                            width="120"
                            height="48"
                            fetchpriority="high"
                            className="h-8 sm:h-12 w-auto object-contain rounded"
                            onError={(e) => {
                                // Fallback w przypadku braku pliku vite.png w folderze public
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <Bed className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 hidden" />
                        <h1 className="text-lg sm:text-2xl font-bold">
                            {currentView === 'calendar' && 'Kalendarz Rezerwacji'}
                            {currentView === 'reservations' && 'Rezerwacje'}
                            {currentView === 'guests' && 'Baza Gości'}
                            {currentView === 'settings' && 'Ustawienia'}
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        <button
                            onClick={() => setCurrentView('calendar')}
                            className={`px-4 py-2 rounded-lg transition-all ${currentView === 'calendar' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Calendar className="w-5 h-5 inline mr-2" />
                            Kalendarz
                        </button>
                        <button
                            onClick={() => setCurrentView('reservations')}
                            className={`px-4 py-2 rounded-lg transition-all ${currentView === 'reservations' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Bed className="w-5 h-5 inline mr-2" />
                            Rezerwacje
                        </button>
                        <button
                            onClick={() => setCurrentView('guests')}
                            className={`px-4 py-2 rounded-lg transition-all ${currentView === 'guests' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Users className="w-5 h-5 inline mr-2" />
                            Goście
                        </button>
                        <button
                            onClick={() => setCurrentView('settings')}
                            className={`px-4 py-2 rounded-lg transition-all ${currentView === 'settings' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Settings className="w-5 h-5 inline mr-2" />
                            Ustawienia
                        </button>
                        <div
                            className="relative"
                            onMouseEnter={() => setShowSyncTooltip(true)}
                            onMouseLeave={() => setShowSyncTooltip(false)}
                        >
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                aria-label="Wymuś synchronizację iCal"
                                className={`p-2 rounded-lg ${theme.buttonSecondary} relative flex items-center justify-center w-10 h-10 ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
                                title="Wymuś synchronizację iCal"
                            >
                                <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            {showSyncTooltip && (
                                <div className={`absolute top-full mt-2 right-0 ${theme.card} px-3 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap z-50 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    Auto-sync za: <span className="font-bold text-blue-400">{syncCountdown}s</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            aria-label="Przełącz motyw"
                            className={`p-2 rounded-lg transition-all ${theme.buttonSecondary}`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </nav>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu nawigacji"
                        className={`lg:hidden p-2 rounded-lg ${theme.buttonSecondary}`}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-3 space-y-2 pb-2">
                        <button
                            onClick={() => { setCurrentView('calendar'); setMobileMenuOpen(false); }}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center gap-3 ${currentView === 'calendar' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Kalendarz</span>
                        </button>
                        <button
                            onClick={() => { setCurrentView('reservations'); setMobileMenuOpen(false); }}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center gap-3 ${currentView === 'reservations' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Bed className="w-5 h-5" />
                            <span>Rezerwacje</span>
                        </button>
                        <button
                            onClick={() => { setCurrentView('guests'); setMobileMenuOpen(false); }}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center gap-3 ${currentView === 'guests' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Users className="w-5 h-5" />
                            <span>Goście hotelu</span>
                        </button>
                        <button
                            onClick={() => { setCurrentView('settings'); setMobileMenuOpen(false); }}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center gap-3 ${currentView === 'settings' ? theme.button : theme.buttonSecondary}`}
                        >
                            <Settings className="w-5 h-5" />
                            <span>Ustawienia</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleSync();
                            }}
                            className={`flex-[0_0_auto] flex flex-col justify-center items-center py-2 px-1 transition-colors ${isSyncing ? 'text-blue-500 opacity-70 cursor-wait' : theme.textSecondary}`}
                        >
                            <svg className={`w-5 h-5 mb-1 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-[10px]">Sync</span>
                        </button>
                        <button
                            onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left flex items-center gap-3 ${theme.buttonSecondary}`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            <span>Przełącz motyw</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
