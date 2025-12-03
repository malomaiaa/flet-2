import React, { useState } from 'react';
import { Bell, Search, Menu, ChevronDown, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../translations';
import { UserProfile } from '../types';

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
  user: UserProfile;
  onProfileClick: () => void;
  notificationsCount?: number;
  onNotificationClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ title, onMenuClick, user, onProfileClick, notificationsCount = 0, onNotificationClick }) => {
  const { language, setLanguage, t, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const toggleLangMenu = () => setIsLangMenuOpen(!isLangMenuOpen);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-24 px-6 lg:px-12 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl transition-all duration-300 border-b border-gray-200 dark:border-white/5">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ms-2 text-gray-500 dark:text-gray-400 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white hidden md:block">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center relative group">
          <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors`} />
          <input 
            type="text" 
            placeholder={t('search')} 
            className={`w-64 py-2.5 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-full text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600`}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button 
          onClick={onNotificationClick}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          )}
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <button 
            onClick={toggleLangMenu}
            className="flex items-center gap-2 py-2 text-sm font-bold text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <span className="text-base leading-none grayscale hover:grayscale-0 transition-all">{currentLang?.flag}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {isLangMenuOpen && (
            <div className={`absolute top-full mt-4 w-40 bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-xl py-2 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsLangMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-5 py-3 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${language === lang.code ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="mr-3 rtl:mr-0 rtl:ml-3 text-base grayscale">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4 ps-4 border-l border-gray-200 dark:border-gray-800 ml-2">
          <button onClick={onProfileClick} className="relative group">
             <div className="p-0.5 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.4)] transition-all">
               <img 
                src={user.avatar}
                alt="User" 
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-[#0B0F19]"
              />
             </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;