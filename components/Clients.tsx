import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Phone, MoreHorizontal, ArrowUpRight, Plus, X, Upload, Check, Edit2, Trash } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Client } from '../types';
import { supabase } from '../lib/supabase';

interface ClientsProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient }) => {
  const { t, dir } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'Active',
    avatar: 'https://picsum.photos/100/100?random=50'
  });

  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      licenseNumber: '',
      licenseExpiry: '',
      status: 'Active',
      avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 1000)}`
    });
    setIdPhotoPreview(null);
    setLicensePhotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      ...client,
      idNumber: client.idNumber || '',
      licenseExpiry: client.licenseExpiry || '',
      idPhoto: client.idPhoto || '',
      licensePhoto: client.licensePhoto || '',
      email: client.email || '',
      phone: client.phone || ''
    });
    setIdPhotoPreview(client.idPhoto || null);
    setLicensePhotoPreview(client.licensePhoto || null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'license') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `clients/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fleet-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('fleet-assets').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        if (type === 'id') {
          setIdPhotoPreview(publicUrl);
          setFormData(prev => ({ ...prev, idPhoto: publicUrl }));
        } else {
          setLicensePhotoPreview(publicUrl);
          setFormData(prev => ({ ...prev, licensePhoto: publicUrl }));
        }
      } catch (error: any) {
        // Fallback to local URL if RLS blocks upload
        console.warn("Image upload failed, falling back to local preview", error.message);
        const localUrl = URL.createObjectURL(file);
        if (type === 'id') {
          setIdPhotoPreview(localUrl);
          setFormData(prev => ({ ...prev, idPhoto: localUrl }));
        } else {
          setLicensePhotoPreview(localUrl);
          setFormData(prev => ({ ...prev, licensePhoto: localUrl }));
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      const updatedClient: Client = {
        ...editingClient,
        ...formData as Client,
        idPhoto: idPhotoPreview || editingClient.idPhoto,
        licensePhoto: licensePhotoPreview || editingClient.licensePhoto
      };
      onUpdateClient(updatedClient);
    } else {
      const newClient: Client = {
        id: `C-${Math.floor(Math.random() * 10000)}`,
        name: formData.name || 'Unknown',
        email: formData.email || '',
        phone: formData.phone || '',
        spent: 0,
        rentalsCount: 0,
        status: 'Active',
        avatar: formData.avatar || 'https://picsum.photos/100/100',
        idNumber: formData.idNumber || '',
        licenseNumber: formData.licenseNumber || '',
        licenseExpiry: formData.licenseExpiry || '',
        idPhoto: idPhotoPreview || undefined,
        licensePhoto: licensePhotoPreview || undefined
      };
      onAddClient(newClient);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('registeredClients')}</h2>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 text-sm text-white dark:text-gray-900 font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 hover:scale-105 px-6 py-3 rounded-full transition-all shadow-glow"
        >
          <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
          {t('addClient')}
        </button>
      </div>

      {/* CHANGED GRID TO 4 COLUMNS (xl:grid-cols-4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {clients.map(client => (
          <div key={client.id} className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border border-gray-200 dark:border-gray-800 relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                   <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800" />
                   <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${client.status === 'Active' ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{client.name}</h3>
                  <p className="text-xs font-bold text-gray-500">ID: {client.id.substring(0,8)}...</p>
                </div>
              </div>
              <div className="flex gap-1">
                 <button 
                  onClick={() => openEditModal(client)}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-all"
                 >
                   <Edit2 className="w-3.5 h-3.5" />
                 </button>
                 <button 
                  onClick={() => onDeleteClient(client.id)}
                  className="text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-all"
                 >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                <Mail className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'} text-gray-400 dark:text-gray-500`} />
                <span className="truncate">{client.email || 'No Email'}</span>
              </div>
              <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                <Phone className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'} text-gray-400 dark:text-gray-500`} />
                <span className="truncate">{client.phone || 'No Phone'}</span>
              </div>
              {client.licenseNumber && (
                 <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                   <span>Lic: {client.licenseNumber}</span>
                   <span className={new Date(client.licenseExpiry || '') < new Date() ? 'text-red-500' : 'text-emerald-500 dark:text-emerald-400'}>
                     Exp: {client.licenseExpiry || 'N/A'}
                   </span>
                 </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 dark:group-hover:from-emerald-400/20 dark:group-hover:to-cyan-400/20 transition-colors duration-300">
                <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5 opacity-60 text-gray-500 dark:text-gray-400">{t('totalSpent')}</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">MAD {client.spent}</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-0.5">{t('rentals')}</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{client.rentalsCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Client Modal with Portal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {editingClient ? t('editClient') : t('addClient')}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('fullName')}</label>
                      <input required name="name" value={formData.name || ''} onChange={handleInputChange} type="text" placeholder="John Doe" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('phoneNumber')}</label>
                      <input required name="phone" value={formData.phone || ''} onChange={handleInputChange} type="tel" placeholder="+212 6..." className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" />
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('email')}</label>
                      <input name="email" value={formData.email || ''} onChange={handleInputChange} type="email" placeholder="john@example.com" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" />
                   </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* Identity & License */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('idPassportNumber')} *</label>
                      <input required name="idNumber" value={formData.idNumber || ''} onChange={handleInputChange} type="text" placeholder="A123456" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('licenseNumber')} *</label>
                      <input required name="licenseNumber" value={formData.licenseNumber || ''} onChange={handleInputChange} type="text" placeholder="L-12345" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('licenseExpiryDate')} *</label>
                      <input required name="licenseExpiry" value={formData.licenseExpiry || ''} onChange={handleInputChange} type="date" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold dark:[color-scheme:dark]" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('status')}</label>
                      <div className="relative">
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none">
                          <option value="Active">Active</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                      </div>
                   </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ID Photo */}
                  <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-gray-700 text-center relative group hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'id')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {idPhotoPreview ? (
                      <div className="relative h-32 w-full">
                        <img src={idPhotoPreview} alt="ID" className="w-full h-full object-contain rounded-xl" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                           <span className="text-white text-xs font-bold">Change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-4">
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" mb-2 />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('uploadIdPhoto')}</span>
                      </div>
                    )}
                  </div>

                  {/* License Photo */}
                   <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-gray-700 text-center relative group hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'license')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {licensePhotoPreview ? (
                      <div className="relative h-32 w-full">
                         <img src={licensePhotoPreview} alt="License" className="w-full h-full object-contain rounded-xl" />
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                           <span className="text-white text-xs font-bold">Change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-4">
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" mb-2 />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('uploadLicensePhoto')}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-[2rem] flex gap-3 sticky bottom-0 z-10">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 hover:scale-105 rounded-full shadow-glow transition-all"
                >
                  {t('saveClient')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Clients;