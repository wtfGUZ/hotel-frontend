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
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100'
    } : {
        bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
        card: 'bg-white/80 backdrop-blur-sm border border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        input: 'bg-gray-50 border-gray-300 text-gray-900',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
