import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Lock, TrendingUp, Users, Home, TrendingDown, DollarSign } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import PinLockScreen from '../../components/PinLockScreen';

export default function StatisticsView({ hotelData }) {
    const { theme, darkMode } = useTheme();
    const { reservations, verifyPinAPI, rooms, roomCategories } = hotelData;

    // PIN Protection State
    const [isPinVerified, setIsPinVerified] = useState(false);

    // --- Statistics Calculations ---
    const stats = useMemo(() => {
        if (!reservations || !rooms) return null;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        let activeThisMonth = 0;
        let revenueThisMonth = 0; // Założenie: liczmy z surowych rezerwacji jeśli opłacone, lub wszystkie jako "potencjał"

        // Przygotowanie Danych dla Wykresu 30 dni wprzód (Obłożenie)
        const next30Days = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(now.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];

            // Ile pokoi jest zajętych tego dnia?
            const occupiedRooms = reservations.filter(r => {
                return (r.checkIn <= dateStr && r.checkOut > dateStr);
            }).length;

            next30Days.push({
                date: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
                oblozenie: occupiedRooms
            });
        }

        // Popularność Kategorii Pokoi (Pie Chart)
        const categoryPopularity = {};
        reservations.forEach(r => {
            const room = rooms.find(rm => String(rm.id) === String(r.roomId));
            if (room) {
                const catName = roomCategories?.find(c => c.id === room.categoryId)?.name || 'Inne';
                categoryPopularity[catName] = (categoryPopularity[catName] || 0) + 1;
            }

            // Statystyki miesięczne
            const checkInDate = new Date(r.checkIn);
            if (checkInDate >= startOfMonth && checkInDate <= endOfMonth) {
                activeThisMonth++;
                // Jako że nie mamy dokładnego pola Price w bazie per rezerwacja zapisanej bezpośrednio, 
                // przyjmijmy estymację doliczeń, lub wyliczymy tylko ilość gości na ten miesiąc
            }
        });

        const categoryData = Object.keys(categoryPopularity).map(key => ({
            name: key,
            value: categoryPopularity[key]
        }));

        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        return {
            next30Days,
            categoryData,
            COLORS,
            activeThisMonth,
            totalRooms: rooms.length
        };
    }, [reservations, rooms, roomCategories]);


    // --- Render PIN Screen ---
    if (!isPinVerified) {
        return <PinLockScreen verifyPinAPI={verifyPinAPI} onUnlock={() => setIsPinVerified(true)} />;
    }

    // --- Render Analytics Dashboard ---
    if (!stats) return null;

    return (
        <div className={`p-4 md:p-8 ${theme.bg} min-h-[90vh] rounded-xl`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 border-gray-200 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                        Dashboard i Statystyki
                    </h2>
                    <p className="text-sm opacity-60 mt-1">Podgląd kluczowych wskaźników operacyjnych hotelu na podstawie rezerwacji.</p>
                </div>
                <button
                    onClick={() => setIsPinVerified(false)}
                    className="mt-4 md:mt-0 px-4 py-2 text-sm rounded-lg flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 font-medium transition-colors"
                >
                    <Lock className="w-4 h-4" />
                    Zablokuj Panel
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-100 shadow-sm'} flex items-center gap-4`}>
                    <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500">
                        <Home className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm opacity-60 font-medium">Baza Pokoi</p>
                        <h4 className="text-3xl font-bold">{stats.totalRooms}</h4>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-emerald-100 shadow-sm'} flex items-center gap-4`}>
                    <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm opacity-60 font-medium">Rezerwacje (Ten msc.)</p>
                        <h4 className="text-3xl font-bold">{stats.activeThisMonth}</h4>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-100 shadow-sm'} flex items-center gap-4`}>
                    <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm opacity-60 font-medium">Dynamika rezerwacji</p>
                        <h4 className="text-xl font-bold text-amber-500">+ Stabilnie</h4>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">Przewidywane Obłożenie (Najbliższe 30 Dni)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.next30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOblozenie" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} allowDecimals={false} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                        borderColor: darkMode ? '#374151' : '#f3f4f6',
                                        borderRadius: '0.5rem',
                                        color: darkMode ? '#f3f4f6' : '#111827'
                                    }}
                                />
                                <Area type="monotone" dataKey="oblozenie" name="Zajęte pokoje" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOblozenie)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">Popularność Kategorii Pokoi</h3>
                    {stats.categoryData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center opacity-50 text-sm">Brak ustrukturyzowanych danych na temat kategorii.</div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={stats.COLORS[index % stats.COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                            borderColor: darkMode ? '#374151' : '#f3f4f6',
                                            borderRadius: '0.5rem',
                                            color: darkMode ? '#f3f4f6' : '#111827'
                                        }}
                                        formatter={(value) => [`${value} rezerwacji`]}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
