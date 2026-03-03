import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('hotelDarkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('hotelDarkMode', JSON.stringify(darkMode));
        // Wymuś kolor tła na głównym body HTML, żeby iOS Safari (i inne przeglądarki mobilne) 
        // dziedziczyły prawidłowy, CIEMNY lub JASNY kolor "pod" całą stroną, zapobiegając białym paskom u góry/dołu
        if (darkMode) {
            document.body.classList.remove('bg-gray-50');
            document.body.classList.add('bg-gray-900');
        } else {
            document.body.classList.remove('bg-gray-900');
            document.body.classList.add('bg-gray-50');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const theme = darkMode ? {
        bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
        card: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50',
        text: 'text-gray-100',
        textSecondary: 'text-gray-400',
        input: 'bg-gray-700/50 border-gray-600 text-gray-100',
        button: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all font-medium',
        buttonSecondary: 'bg-gray-500/10 text-gray-300 border border-gray-500/30 hover:bg-gray-500/20 transition-all font-medium',
        buttonDanger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all font-medium'
    } : {
        bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
        card: 'bg-white/80 backdrop-blur-sm border border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        input: 'bg-gray-50 border-gray-300 text-gray-900',
        button: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all font-medium',
        buttonSecondary: 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100 transition-all font-medium',
        buttonDanger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all font-medium'
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
