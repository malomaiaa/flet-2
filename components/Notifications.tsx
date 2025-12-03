import React from 'react';
import { AlertTriangle, Clock, ArrowRight, CheckCircle, Calendar, X } from 'lucide-react';
import { AppNotification, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationsProps {
  notifications: AppNotification[];
  onNavigate: (view: ViewState) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onNavigate }) => {
  const { t, dir } = useLanguage();

  const urgentAlerts = notifications.filter(n => n.type === 'urgent');
  const warningAlerts = notifications.filter(n => n.type === 'warning');
  const infoAlerts = notifications.filter(n => n.type === 'info');

  const renderNotificationCard = (notification: AppNotification) => {
    const isUrgent = notification.type === 'urgent';
    const isWarning = notification.type === 'warning';

    return (
      <div 
        key={notification.id} 
        className={`relative overflow-hidden rounded-2xl p-5 border shadow-sm transition-all hover:border-opacity-100 group ${
          isUrgent 
            ? 'bg-red-900/10 border-red-500/30' 
            : isWarning
            ? 'bg-orange-900/10 border-orange-500/30'
            : 'bg-gray-900 border-gray-800'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl flex-shrink-0 ${
             isUrgent 
               ? 'bg-red-500/20 text-red-400' 
               : isWarning
               ? 'bg-orange-500/20 text-orange-400'
               : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isUrgent ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          
          <div className="flex-1">
            <h4 className={`text-base font-black mb-1 ${
              isUrgent ? 'text-red-400' : 'text-white'
            }`}>
              {notification.title}
            </h4>
            <p className="text-sm font-medium text-gray-400 mb-3 leading-relaxed">
              {notification.message}
            </p>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center text-xs font-bold text-gray-500 bg-black/40 px-2 py-1 rounded-md">
                <Calendar className={`w-3 h-3 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                {notification.date}
              </span>
              
              {/* Action Button */}
              {(notification.category === 'expiry' || notification.category === 'return') && (
                <button 
                  onClick={() => onNavigate(notification.category === 'expiry' ? 'cars' : 'bookings')}
                  className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                    isUrgent ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('viewDetails')} <ArrowRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-white">{t('urgentAlerts')}</h2>
           <p className="text-gray-400 font-medium mt-1">
             You have <span className="text-white font-bold">{notifications.length}</span> active notifications.
           </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 rounded-[2rem] border border-gray-800 text-center">
          <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-500 max-w-md">
            Great job! Your fleet is in perfect condition and all returns are on schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
           {/* Urgent Section */}
           {urgentAlerts.length > 0 && (
             <div className="space-y-4">
                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest px-1">Critical Attention Needed</h3>
                <div className="grid gap-4">
                   {urgentAlerts.map(renderNotificationCard)}
                </div>
             </div>
           )}

           {/* Warning Section */}
           {warningAlerts.length > 0 && (
             <div className="space-y-4">
                <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest px-1">Upcoming Expirations</h3>
                <div className="grid gap-4">
                   {warningAlerts.map(renderNotificationCard)}
                </div>
             </div>
           )}
           
           {/* Info Section */}
           {infoAlerts.length > 0 && (
             <div className="space-y-4">
                <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest px-1">Information</h3>
                <div className="grid gap-4">
                   {infoAlerts.map(renderNotificationCard)}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Notifications;