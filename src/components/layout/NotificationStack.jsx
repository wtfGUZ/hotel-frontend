import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function NotificationStack({ hotelData }) {
    const { theme, darkMode } = useTheme();
    const { notifications, markNotificationAsReadAPI } = hotelData;
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (createdAtString) => {
        if (!createdAtString) return 'przed chwilą';
        const diffMs = now.getTime() - new Date(createdAtString).getTime();
        if (diffMs < 60000) return 'przed chwilą';
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min temu`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} godz temu`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} dni temu`;
    };

    if (!notifications) return null;
    const unreadNotifs = notifications.filter(n => !n.isRead);

    if (unreadNotifs.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'new_ical': return <Bell className="w-5 h-5 animate-pulse" />;
            case 'moved_ical': return <ArrowRight className="w-5 h-5 animate-pulse" />;
            case 'conflict': return <AlertTriangle className="w-5 h-5 animate-pulse" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'new_ical':
                return {
                    border: 'border-blue-500',
                    bgDark: 'bg-gray-800',
                    bgLight: 'bg-white',
                    iconBgDark: 'bg-blue-500/20 text-blue-400',
                    iconBgLight: 'bg-blue-100 text-blue-600',
                    btn: theme.button
                };
            case 'moved_ical':
            case 'conflict':
                return {
                    border: type === 'conflict' ? 'border-red-500' : 'border-amber-500',
                    bgDark: type === 'conflict' ? 'bg-red-900/40 border-red-600' : 'bg-amber-900/40 border-amber-600',
                    bgLight: 'bg-white',
                    iconBgDark: type === 'conflict' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400',
                    iconBgLight: type === 'conflict' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
                    btn: type === 'conflict'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                };
            default:
                return {
                    border: 'border-gray-500', bgDark: 'bg-gray-800', bgLight: 'bg-white',
                    iconBgDark: 'bg-gray-500/20', iconBgLight: 'bg-gray-100', btn: theme.button
                };
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2 md:p-0">
            {unreadNotifs.map(notif => {
                const colors = getColors(notif.type);
                const timeAgo = getTimeAgo(notif.createdAt);

                return (
                    <div
                        key={notif.id}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border-l-4 ${colors.border} transform transition-all duration-300 translate-y-0 opacity-100 ${darkMode ? colors.bgDark : colors.bgLight}`}
                    >
                        <div className={`p-2 rounded-full shrink-0 ${darkMode ? colors.iconBgDark : colors.iconBgLight}`}>
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm mb-1 truncate">{notif.title}</h4>
                            <p className="text-xs opacity-80 mb-1.5 whitespace-normal border-b pb-1.5 border-gray-500/20">
                                {notif.message}
                            </p>
                            <p className="text-[10px] opacity-60 flex items-center gap-1 mb-2">
                                <Clock className="w-3 h-3" /> {timeAgo}
                            </p>
                            <button
                                onClick={() => markNotificationAsReadAPI(notif.id)}
                                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${colors.btn}`}
                            >
                                <Check className="w-4 h-4" />
                                Potwierdź odczytanie
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
