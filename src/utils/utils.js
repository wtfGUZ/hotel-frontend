export const formatDate = (date) => {
    // Prevent UTC shift for late night local times
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

export const calculateTotalPrice = (room, checkIn, checkOut, hasBreakfast) => {
    if (!room || !checkIn || !checkOut) return 0;

    const nights = calculateNights(checkIn, checkOut);
    const pricePerNight = hasBreakfast ? (room.priceWithBreakfast || room.pricePerNight) : room.pricePerNight;

    return nights * pricePerNight;
};

export const getStatusColor = (status) => {
    const colors = {
        preliminary: 'bg-gradient-to-r from-amber-500/80 to-yellow-500/70 text-white border-l-[3px] border-amber-300 backdrop-blur-sm shadow-lg shadow-amber-500/20',
        confirmed: 'bg-gradient-to-r from-blue-500/80 to-indigo-500/70 text-white border-l-[3px] border-blue-300 backdrop-blur-sm shadow-lg shadow-blue-500/20',
        paid: 'bg-gradient-to-r from-emerald-500/80 to-green-500/70 text-white border-l-[3px] border-emerald-300 backdrop-blur-sm shadow-lg shadow-emerald-500/20',
        completed: 'bg-gradient-to-r from-gray-500/80 to-gray-400/70 text-white border-l-[3px] border-gray-300 backdrop-blur-sm shadow-lg shadow-gray-500/20'
    };
    return colors[status] || colors.preliminary;
};

export const getStatusText = (status) => {
    const texts = {
        preliminary: 'Wstępna',
        confirmed: 'Potwierdzona',
        paid: 'Opłacona',
        completed: 'Zakończona'
    };
    return texts[status] || 'Nieznany';
};
