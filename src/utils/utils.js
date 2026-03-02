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
        preliminary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        paid: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[status] || colors.preliminary;
};

export const getStatusText = (status) => {
    const texts = {
        preliminary: 'Wstępna',
        confirmed: 'Potwierdzona',
        paid: 'Opłacona'
    };
    return texts[status] || 'Nieznany';
};
