import React, { useState } from 'react';
import { 
  Building, Bell, Shield, 
  Save, Upload, CheckCircle, Activity, Camera, CreditCard, Download, MapPin, User
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GlobalSettings, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../contexts/SubscriptionContext';

interface SettingsProps {
  settings: GlobalSettings;
  onUpdateSettings: (settings: GlobalSettings) => void;
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

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, user, onUpdateUser }) => {
  const { t, dir } = useLanguage();
  const { subscription, openPaywall } = useSubscription();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // --- 1. GENERAL STATE ---
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
  const [localUser, setLocalUser] = useState<UserProfile>(user);

  // Password State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  // Update local user state when prop changes (e.g. initial load)
  React.useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Update local settings state when prop changes (e.g. after fetch)
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Math.random()}.${fileExt}`;
        const filePath = `company/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fleet-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('fleet-assets').getPublicUrl(filePath);
        setLocalSettings(prev => ({ ...prev, logo: data.publicUrl }));
      } catch (error: any) {
        console.warn("Logo upload failed, using local preview", error.message);
        // Fallback
        const localUrl = URL.createObjectURL(file);
        setLocalSettings(prev => ({ ...prev, logo: localUrl }));
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setLocalUser(prev => ({ ...prev, avatar: data.publicUrl }));
      } catch (error: any) {
        console.warn("Avatar upload failed, using local preview", error.message);
        const localUrl = URL.createObjectURL(file);
        setLocalUser(prev => ({ ...prev, avatar: localUrl }));
      }
    }
  };

  const handleSave = async () => {
    // Propagate changes up to App
    onUpdateSettings(localSettings);
    await onUpdateUser(localUser);
    
    // Handle Password Update if filled
    if (passwordForm.new) {
       if (passwordForm.new !== passwordForm.confirm) {
          setPasswordError("Passwords do not match");
          return;
       }
       const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
       if (error) {
          setPasswordError(error.message);
          return;
       } else {
          setPasswordForm({ current: '', new: '', confirm: '' });
          setPasswordError('');
       }
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const menuItems = [
    { id: 'general', icon: Building, label: 'generalInfo' },
    { id: 'profile', icon: User, label: 'myProfile' },
    { id: 'billing', icon: CreditCard, label: 'billing' },
    { id: 'gps', icon: MapPin, label: 'GPS Integration' },
    { id: 'notifications', icon: Bell, label: 'settingsSections.notifications' },
    { id: 'security', icon: Shield, label: 'settingsSections.security' },
    { id: 'activity', icon: Activity, label: 'settingsSections.activity' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-12 relative">
      
      {/* SUCCESS TOAST */}
      {showToast && (
        <div className={`fixed top-24 ${dir === 'rtl' ? 'left-10' : 'right-10'} z-50 bg-black border border-emerald-500 text-white px-6 py-4 rounded-2xl shadow-glow flex items-center gap-3 animate-in fade-in slide-in-from-top-4`}>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-bold">{t('settingsSaved')}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="w-full xl:w-[22rem] flex-shrink-0 transition-all duration-300">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-4 sticky top-6 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 px-4 pt-2">
            {t('settings')}
          </h2>
          <nav className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // Handle untranslated keys for now
              const label = item.id === 'gps' ? item.label : t(item.label);
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center w-full px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-400 dark:to-cyan-400 text-gray-900 shadow-sm dark:shadow-glow' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${dir === 'rtl' ? 'ml-4' : 'mr-4'} transition-transform group-hover:scale-110`} />
                  <span className={`flex-1 ${dir === 'rtl' ? 'text-right' : 'text-left'} leading-tight`}>
                    {label}
                  </span>
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
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {activeTab === 'billing' ? t('billing') : activeTab === 'gps' ? 'GPS Integration' : activeTab === 'profile' ? t('myProfile') : t(`settingsSections.${activeTab}`)}
            </h3>
            {activeTab !== 'billing' && (
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full shadow-lg hover:scale-105 transition-all"
              >
                <Save className="w-4 h-4" />
                {t('saveChanges')}
              </button>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* 1. GENERAL (AGENCY INFO) */}
            {activeTab === 'general' && (
              <div className="space-y-12 max-w-3xl">
                 <div>
                   <h4 className={`text-lg font-bold text-gray-900 dark:text-white mb-6 ${dir === 'rtl' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-emerald-500 dark:border-emerald-400`}>{t('generalInfo')}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('companyName')}</label>
                          <input 
                            type="text" 
                            value={localSettings.companyName || ''}
                            onChange={e => setLocalSettings({...localSettings, companyName: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('companyAddress')}</label>
                          <input 
                            type="text" 
                            value={localSettings.address || ''}
                            onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('phoneNumber')}</label>
                          <input 
                            type="text" 
                            value={localSettings.phone || ''}
                            onChange={e => setLocalSettings({...localSettings, phone: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('email')}</label>
                          <input 
                            type="email" 
                            value={localSettings.email || ''}
                            onChange={e => setLocalSettings({...localSettings, email: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                       <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('timezone')}</label>
                        <select 
                          value={localSettings.timezone || 'Africa/Casablanca'}
                          onChange={e => setLocalSettings({...localSettings, timezone: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none"
                        >
                          <option>Africa/Casablanca (GMT+1)</option>
                          <option>Europe/Paris (GMT+2)</option>
                          <option>UTC (GMT+0)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-gray-500 mb-4 uppercase">{t('logo')}</label>
                         <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-black border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                               {localSettings.logo ? (
                                  <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                               ) : (
                                  <span className="text-xs font-black text-gray-400 dark:text-gray-700">LOGO</span>
                               )}
                            </div>
                            <div className="relative">
                               <button 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full transition-colors flex items-center gap-2"
                               >
                                 <Upload className="w-4 h-4" />
                                 {t('uploadImage')}
                               </button>
                               <input 
                                 type="file" 
                                 ref={fileInputRef} 
                                 className="hidden" 
                                 accept="image/*" 
                                 onChange={handleLogoUpload} 
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* 2. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-12 max-w-3xl">
                 <div>
                   <h4 className={`text-lg font-bold text-gray-900 dark:text-white mb-6 ${dir === 'rtl' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-emerald-500 dark:border-emerald-400`}>{t('personalInfo')}</h4>
                   
                   {/* Avatar Upload */}
                   <div className="flex items-center gap-6 mb-10">
                      <div className="relative w-24 h-24 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                          <img src={localUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800" />
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-8 h-8 text-white" />
                          </div>
                          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{localUser.name || 'Admin User'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{localUser.role}</p>
                          <button 
                            onClick={() => avatarInputRef.current?.click()} 
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            {t('changeAvatar')}
                          </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('fullName')}</label>
                          <input 
                            type="text" 
                            value={localUser.name || ''}
                            onChange={e => setLocalUser({...localUser, name: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('username')}</label>
                          <input 
                            type="text" 
                            value={localUser.username || ''}
                            onChange={e => setLocalUser({...localUser, username: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('contactEmail')}</label>
                          <input 
                            type="email" 
                            value={localUser.email || ''}
                            onChange={e => setLocalUser({...localUser, email: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('contactPhone')}</label>
                          <input 
                            type="text" 
                            value={localUser.phone || ''}
                            onChange={e => setLocalUser({...localUser, phone: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            {/* 3. BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-8 max-w-3xl">
                 <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-xl font-bold text-gray-900 dark:text-white">{t('currentPlan')}</h4>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                subscription.plan === 'free' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : 
                                subscription.plan === 'starter' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500' :
                                'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500'
                             }`}>
                                {subscription.plan === 'free' ? t('freeTrial') : subscription.plan === 'starter' ? t('starterPlan') : t('proPlan')}
                             </span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                             {subscription.plan === 'free' 
                               ? t('trialDaysLeft').replace('{days}', String(Math.max(0, 14 - Math.ceil(Math.abs(new Date().getTime() - new Date(subscription.trialStartDate).getTime()) / (1000 * 60 * 60 * 24))))) 
                               : `${t('billed')} ${subscription.billingCycle} • ${t('renewsOn')} ${new Date(subscription.nextBillingDate || '').toLocaleDateString()}`
                             }
                          </p>
                       </div>
                       <button 
                          onClick={openPaywall}
                          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                       >
                          {subscription.plan === 'free' ? t('upgradePlan') : t('changePlan')}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{t('invoices')}</h4>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                       <table className="w-full text-left rtl:text-right">
                          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase">
                             <tr>
                                <th className="px-6 py-4">{t('date')}</th>
                                <th className="px-6 py-4">{t('amount')}</th>
                                <th className="px-6 py-4">{t('status')}</th>
                                <th className={`px-6 py-4 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('invoices')}</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
                             {/* Mock Invoices */}
                             {subscription.plan !== 'free' ? (
                               <tr>
                                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$ {subscription.plan === 'starter' ? (subscription.billingCycle === 'monthly' ? 29 : 288) : (subscription.billingCycle === 'monthly' ? 79 : 780)}</td>
                                  <td className="px-6 py-4"><span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded">Paid</span></td>
                                  <td className={`px-6 py-4 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                     <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><Download className="w-4 h-4" /></button>
                                  </td>
                               </tr>
                             ) : (
                               <tr>
                                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                     {t('noInvoices')}
                                  </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
                 
                 <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                    <button className="text-red-500 text-sm font-bold hover:text-red-400">{t('cancelSubscription')}</button>
                 </div>
              </div>
            )}
            
            {/* 4. GPS / TRACCAR INTEGRATION */}
            {activeTab === 'gps' && (
              <div className="space-y-8 max-w-3xl">
                <div>
                   <h4 className={`text-lg font-bold text-gray-900 dark:text-white mb-6 ${dir === 'rtl' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-emerald-500 dark:border-emerald-400`}>Traccar Integration</h4>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                      Enter your Traccar server details to enable live GPS tracking on the dashboard. Ensure your server allows CORS for this dashboard URL.
                   </p>
                   
                   <div className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Server URL</label>
                          <input 
                            type="text" 
                            placeholder="http://demo.traccar.org"
                            value={localSettings.traccarUrl || ''}
                            onChange={e => setLocalSettings({...localSettings, traccarUrl: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                          />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Username / Email</label>
                            <input 
                              type="text" 
                              value={localSettings.traccarUsername || ''}
                              onChange={e => setLocalSettings({...localSettings, traccarUsername: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Password</label>
                            <input 
                              type="password" 
                              value={localSettings.traccarPassword || ''}
                              onChange={e => setLocalSettings({...localSettings, traccarPassword: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold"
                            />
                        </div>
                      </div>
                   </div>

                   {/* Database Migration Helper */}
                   <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                      <h5 className="font-bold text-gray-900 dark:text-white mb-2">Database Setup</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                         If you encounter errors saving cars with GPS IDs, run this SQL command in your Supabase SQL Editor:
                      </p>
                      <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs font-mono relative group">
                         ALTER TABLE cars ADD COLUMN IF NOT EXISTS traccar_device_id TEXT;
                         <button 
                           onClick={() => navigator.clipboard.writeText("ALTER TABLE cars ADD COLUMN IF NOT EXISTS traccar_device_id TEXT;")}
                           className="absolute top-2 right-2 px-2 py-1 bg-gray-800 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           Copy
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
                <div className="space-y-8 max-w-2xl">
                    <div className="space-y-4">
                     <h4 className="font-bold text-gray-900 dark:text-white">{t('notificationSettings')}</h4>
                     
                     <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white">{t('emailAlerts')}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Get updates on bookings & payments.</p>
                        </div>
                        <ToggleSwitch 
                           active={localUser.preferences.emailNotifications} 
                           onClick={() => setLocalUser({
                               ...localUser, 
                               preferences: { ...localUser.preferences, emailNotifications: !localUser.preferences.emailNotifications }
                           })}
                           dir={dir}
                        />
                     </div>

                     <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                         <div>
                           <p className="font-bold text-gray-900 dark:text-white">{t('smsAlerts')}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Get urgent alerts via SMS.</p>
                        </div>
                        <ToggleSwitch 
                           active={localUser.preferences.smsNotifications} 
                           onClick={() => setLocalUser({
                               ...localUser, 
                               preferences: { ...localUser.preferences, smsNotifications: !localUser.preferences.smsNotifications }
                           })}
                           dir={dir}
                        />
                     </div>
                  </div>
                </div>
            )}

            {/* 6. SECURITY */}
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
               </div>
            )}
            
             {/* 7. ACTIVITY */}
             {activeTab === 'activity' && (
               <div className="space-y-6">
                 {/* Placeholder for activity log */}
                 <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No recent activity to display.
                 </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;