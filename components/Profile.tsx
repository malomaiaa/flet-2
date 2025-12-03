import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Link as LinkIcon, Save, Camera, CheckCircle, Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const ToggleSwitch = ({ active, onClick, dir }: { active: boolean; onClick: () => void; dir: 'ltr' | 'rtl' }) => (
  <button 
    onClick={onClick}
    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${active ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400' : 'bg-gray-300 dark:bg-gray-700'}`}
  >
    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${active ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : ''}`}></div>
  </button>
);

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences' | 'linked'>('personal');
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserProfile>(user);
  
  // Sync state with props if user changes (e.g. initial load)
  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (key: keyof UserProfile['preferences'], value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fleet-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('fleet-assets').getPublicUrl(filePath);
        setFormData(prev => ({ ...prev, avatar: data.publicUrl }));
      } catch (error: any) {
        console.warn("Avatar upload failed, using local preview", error.message);
        // Fallback to local preview
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatar: localUrl }));
      }
    }
  };

  const handleSave = () => {
    onUpdateUser(formData);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: 'personal', label: 'personalInfo', icon: User },
    { id: 'security', label: 'securityLogin', icon: Lock },
    { id: 'preferences', label: 'preferences', icon: Globe },
    { id: 'linked', label: 'linkedAccounts', icon: LinkIcon },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-12 relative">
      
      {/* SUCCESS TOAST */}
      {showToast && (
        <div className="fixed top-24 right-10 z-50 bg-black border border-emerald-500 text-white px-6 py-4 rounded-2xl shadow-glow flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-bold">{t('profileSaved')}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="w-full xl:w-72 flex-shrink-0">
        {/* User Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-6 mb-6 text-center shadow-sm dark:shadow-none">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <img src={formData.avatar} alt="Profile" className="w-full h-full rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800" />
               <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="w-8 h-8 text-white" />
               </div>
               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{formData.name}</h3>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
               {formData.role}
            </span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-4 sticky top-6 shadow-sm dark:shadow-none">
          <nav className="space-y-1">
            {tabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center w-full px-5 py-3.5 text-sm font-bold rounded-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-400 dark:to-cyan-400 text-gray-900 shadow-sm dark:shadow-glow' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                  {t(item.label)}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 min-h-[600px] shadow-sm dark:shadow-none">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {t(tabs.find(t => t.id === activeTab)?.label || '')}
            </h3>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full shadow-lg hover:scale-105 transition-all"
            >
              <Save className="w-4 h-4" />
              {t('saveChanges')}
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* 1. PERSONAL INFO */}
            {activeTab === 'personal' && (
              <div className="space-y-6 max-w-2xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('fullName')}</label>
                       <input 
                         name="name" 
                         value={formData.name} 
                         onChange={handleInputChange} 
                         className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('username')}</label>
                       <input 
                         name="username" 
                         value={formData.username} 
                         onChange={handleInputChange} 
                         className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('contactEmail')}</label>
                       <div className="relative">
                          <Mail className={`absolute top-3.5 w-5 h-5 text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`} />
                          <input 
                            name="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleInputChange} 
                            className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('contactPhone')}</label>
                        <div className="relative">
                          <Phone className={`absolute top-3.5 w-5 h-5 text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`} />
                          <input 
                            name="phone" 
                            type="tel"
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* 2. SECURITY */}
            {activeTab === 'security' && (
               <div className="space-y-8 max-w-2xl">
                  <div>
                     <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('changePassword')}</h4>
                     <div className="space-y-4">
                        <input 
                          type="password" 
                          placeholder={t('currentPassword')} 
                          className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" 
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <input 
                             type="password" 
                             placeholder={t('newPassword')} 
                             className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" 
                           />
                           <input 
                             type="password" 
                             placeholder={t('confirmPassword')} 
                             className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" 
                           />
                        </div>
                     </div>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-800" />

                  <div className="flex items-center justify-between p-6 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div>
                       <h4 className="font-bold text-gray-900 dark:text-white mb-1">{t('enable2FA')}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                    </div>
                    <ToggleSwitch active={false} onClick={() => {}} dir={dir} />
                 </div>

                 <div className="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-600 dark:text-gray-300 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    <span>{t('lastLogin')}: Today at 09:41 AM</span>
                 </div>
               </div>
            )}

            {/* 3. PREFERENCES */}
            {activeTab === 'preferences' && (
               <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('timezone')}</label>
                        <select 
                           value={formData.preferences.timezone}
                           onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                           className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none"
                        >
                           <option>Africa/Casablanca (GMT+1)</option>
                           <option>Europe/Paris (GMT+2)</option>
                           <option>UTC (GMT+0)</option>
                           <option>America/New_York (GMT-5)</option>
                        </select>
                     </div>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-800" />

                  <div className="space-y-4">
                     <h4 className="font-bold text-gray-900 dark:text-white">{t('notificationSettings')}</h4>
                     
                     <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white">{t('emailAlerts')}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Get updates on bookings & payments.</p>
                        </div>
                        <ToggleSwitch 
                           active={formData.preferences.emailNotifications} 
                           onClick={() => handlePreferenceChange('emailNotifications', !formData.preferences.emailNotifications)}
                           dir={dir}
                        />
                     </div>

                     <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                         <div>
                           <p className="font-bold text-gray-900 dark:text-white">{t('smsAlerts')}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Get urgent alerts via SMS.</p>
                        </div>
                        <ToggleSwitch 
                           active={formData.preferences.smsNotifications} 
                           onClick={() => handlePreferenceChange('smsNotifications', !formData.preferences.smsNotifications)}
                           dir={dir}
                        />
                     </div>
                  </div>
               </div>
            )}

            {/* 4. LINKED ACCOUNTS */}
            {activeTab === 'linked' && (
               <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between p-6 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                           <span className="font-bold text-blue-500">G</span>
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900 dark:text-white">{t('googleCalendar')}</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Sync bookings with Google Calendar</p>
                        </div>
                     </div>
                     <button className="px-5 py-2 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">
                        {t('connect')}
                     </button>
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;