import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  CalendarDays, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Hexagon,
  ChevronLeft,
  ChevronRight,
  Zap,
  MapPin,
  FileText,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, isCollapsed, onToggleCollapse, onSignOut }) => {
  const { t, dir } = useLanguage();
  const { subscription, daysLeftInTrial, openPaywall, isExpired } = useSubscription();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'tracking', label: t('tracking'), icon: MapPin },
    { id: 'cars', label: t('cars'), icon: Car },
    { id: 'bookings', label: t('bookings'), icon: CalendarDays },
    { id: 'clients', label: t('clients'), icon: Users },
    { id: 'documents', label: t('documents'), icon: FileText }, 
    { id: 'payments', label: t('payments'), icon: CreditCard }, 
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  // Helper to determine badge color/text
  const getBadge = () => {
    if (subscription.plan === 'free') return { text: 'TRIAL', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 border-yellow-200 dark:bg-yellow-400/10 dark:border-yellow-400/20' };
    if (subscription.plan === 'starter') return { text: 'STARTER', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 border-blue-200 dark:bg-blue-400/10 dark:border-blue-400/20' };
    return { text: 'PRO', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-400/20' };
  };

  const badge = getBadge();

  return (
    <aside 
      className={`fixed top-0 bottom-0 z-40 bg-white dark:bg-[#0B0F19] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        ${isCollapsed ? 'w-[88px]' : 'w-[280px]'}
        ${isOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')} 
        lg:translate-x-0 ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
    >
      <div className="flex flex-col h-full relative py-6">
        
        {/* Collapse Toggle */}
        <button 
            onClick={onToggleCollapse}
            className={`hidden lg:flex absolute top-12 ${dir === 'rtl' ? '-left-3' : '-right-3'} w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-white transition-all z-50 hover:border-emerald-400 ${isCollapsed ? 'rotate-180' : ''}`}
        >
            {dir === 'rtl' ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Logo - Force LTR for brand name to fix Arabic display issues */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-8'} mb-10 transition-all`} dir="ltr">
          <div className="relative flex items-center justify-center">
             <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-glow">
                <Hexagon className="w-6 h-6 text-white dark:text-gray-900 fill-white dark:fill-gray-900" />
             </div>
          </div>
          {!isCollapsed && (
             <div className="ml-4 animate-in fade-in duration-300">
                <span className="block text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  Fleet<span className="text-emerald-500 dark:text-emerald-400">Cmd</span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color}`}>
                   {badge.text}
                </span>
             </div>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 space-y-2 px-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'cars' && currentView === 'add-car');
            
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewState)}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center w-full py-3.5 rounded-2xl transition-all duration-300 group relative
                  ${isCollapsed ? 'justify-center px-0' : 'px-5'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white dark:text-gray-950 font-bold shadow-glow' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                
                {!isCollapsed && (
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'} ml-4 ${dir === 'rtl' ? 'mr-4 ml-0' : ''} animate-in fade-in duration-200`}>
                    {item.label}
                  </span>
                )}
                
                {/* Active Indicator Dot for collapsed state */}
                {isCollapsed && isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Subscription Banner */}
        {!isCollapsed && (
          <div className="px-6 mb-6 animate-in slide-in-from-bottom-4 duration-500">
             {subscription.plan === 'free' ? (
                // TRIAL BANNER
                <div className={`border rounded-2xl p-5 relative overflow-hidden group ${isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'}`}>
                   <div className="relative z-10">
                     <div className="flex justify-between items-start mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                           {isExpired ? <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-500" /> : <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
                        </div>
                        <span className={`text-xs font-black uppercase ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500'}`}>
                           {isExpired ? t('locked') : t('daysLeft').replace('{days}', String(daysLeftInTrial))}
                        </span>
                     </div>
                     
                     {!isExpired && (
                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mb-3 overflow-hidden">
                           <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${(daysLeftInTrial/14)*100}%` }}></div>
                        </div>
                     )}

                     <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{isExpired ? t('accessLocked') : t('freeTrial')}</h4>
                     <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{isExpired ? t('upgradeToRestore') : t('upgradeToKeep')}</p>
                     
                     <button 
                        onClick={openPaywall}
                        className={`w-full text-xs font-bold py-2 rounded-lg transition-colors ${
                           isExpired 
                           ? 'bg-red-500 hover:bg-red-400 text-white' 
                           : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                     >
                        {t('upgradeNow')} &rarr;
                     </button>
                   </div>
                </div>
             ) : (
                // PRO / PAID BANNER
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                   <div className="relative z-10">
                     <div className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg flex items-center justify-center mb-3">
                        <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400" />
                     </div>
                     <h4 className="text-gray-900 dark:text-white font-bold text-sm">{subscription.plan === 'pro' ? t('proPlan') : t('starterPlan')}</h4>
                     <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 mb-3">{t('activeAndBilled')}</p>
                     <button onClick={() => onChangeView('settings')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">{t('manageBilling')} &rarr;</button>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* Sign Out */}
        <div className="px-4 pb-2">
          <button 
            onClick={onSignOut}
            className={`flex items-center w-full py-3.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-900 ${isCollapsed ? 'justify-center' : 'px-5'}`}
            title={t('signOut')}
          >
            <LogOut className={`w-5 h-5 transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span className={`ml-4 ${dir === 'rtl' ? 'mr-4 ml-0' : ''}`}>{t('signOut')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;