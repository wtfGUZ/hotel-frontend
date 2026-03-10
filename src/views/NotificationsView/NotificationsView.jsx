import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Check, Clock, User, AlertTriangle, ArrowRight } from 'lucide-react';

export default function NotificationsView({ hotelData }) {
    const { theme, darkMode } = useTheme();
    const { notifications, markAllNotificationsAsReadAPI, markNotificationAsReadAPI } = hotelData;

    const getIconForType = (type) => {
        switch (type) {
            case 'new_ical': return <Bell className="w-5 h-5" />;
            case 'moved_ical': return <ArrowRight className="w-5 h-5" />;
            case 'conflict': return <AlertTriangle className="w-5 h-5" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getColorForType = (type) => {
        switch (type) {
            case 'new_ical': return darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600';
            case 'moved_ical': return darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600';
            case 'conflict': return darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600';
            default: return darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600';
        }
    };

    if (!notifications) return null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className={`p-4 md:p-8 ${theme.bg} min-h-screen rounded-xl`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        Historia Powiadomień
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                {unreadCount} nowych
                            </span>
                        )}
                    </h2>
                    <p className="text-sm opacity-60 mt-1">Dziennik zautomatyzowanych akcji i logów systemu</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllNotificationsAsReadAPI}
                        className={`mt-4 md:mt-0 flex items-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600`}
                    >
                        <Check className="w-4 h-4" />
                        Oznacz wszystkie jako przeczytane
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Brak historii powiadomień.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${notif.isRead ? (darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100 opacity-80') : (darkMode ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-blue-100 shadow-md')}`}
                        >
                            <div className={`p-3 rounded-full shrink-0 flex items-center justify-center self-start sm:self-center ${getColorForType(notif.type)}`}>
                                {getIconForType(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold ${notif.isRead ? 'opacity-80' : ''}`}>{notif.title}</h4>
                                <p className="text-sm opacity-80 mt-1 whitespace-pre-wrap">{notif.message}</p>
                                <p className="text-xs opacity-50 flex items-center gap-1 mt-2">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notif.createdAt).toLocaleString('pl-PL')}
                                </p>
                            </div>
                            {!notif.isRead && (
                                <button
                                    onClick={() => markNotificationAsReadAPI(notif.id)}
                                    className={`shrink-0 flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${theme.button}`}
                                >
                                    <Check className="w-4 h-4" />
                                    Potwierdź
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
