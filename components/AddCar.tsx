import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, MapPin, Check, X, Calendar, Camera, Info, Wifi } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Car, CarStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AddCarProps {
  onCancel: () => void;
  onAddCar: (car: Car) => void;
  initialData?: Car;
}

const AddCar: React.FC<AddCarProps> = ({ onCancel, onAddCar, initialData }) => {
  const { t, dir } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  const [formData, setFormData] = useState({
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    type: 'Sedan',
    fuelType: 'Petrol',
    status: CarStatus.AVAILABLE,
    mileage: '',
    pricePerDay: '',
    securityDeposit: '',
    description: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    inspectionExpiry: '',
    traccarDeviceId: ''
  });
  
  const [activeFeatures, setActiveFeatures] = useState<string[]>(['gps']);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        model: initialData.model,
        brand: initialData.brand,
        year: initialData.year,
        licensePlate: initialData.licensePlate,
        type: initialData.type,
        fuelType: initialData.fuelType,
        status: initialData.status,
        mileage: initialData.mileage ? String(initialData.mileage) : '',
        pricePerDay: String(initialData.pricePerDay),
        securityDeposit: initialData.securityDeposit ? String(initialData.securityDeposit) : '',
        description: '',
        insuranceExpiry: initialData.insuranceExpiry || '',
        registrationExpiry: initialData.registrationExpiry || '',
        inspectionExpiry: initialData.inspectionExpiry || '',
        traccarDeviceId: initialData.traccarDeviceId || ''
      });
      setActiveFeatures(initialData.features);
      setImages(initialData.images || [initialData.imageUrl]);
    }
  }, [initialData]);

  const toggleFeature = (featureKey: string) => {
    setActiveFeatures(prev => 
      prev.includes(featureKey) 
        ? prev.filter(f => f !== featureKey)
        : [...prev, featureKey]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      const newImages: string[] = [];

      for (const fileItem of fileList) {
        const file = fileItem as File;
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `cars/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('fleet-assets')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('fleet-assets').getPublicUrl(filePath);
          newImages.push(data.publicUrl);
        } catch (error: any) {
          console.warn("Upload failed, falling back to local preview:", error.message);
          // Fallback to local blob so user can still see the image they picked
          newImages.push(URL.createObjectURL(file));
        }
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCar: Car = {
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      model: formData.model,
      brand: formData.brand || 'Generic',
      year: Number(formData.year),
      licensePlate: formData.licensePlate || 'NEW-CAR',
      type: formData.type,
      fuelType: formData.fuelType,
      pricePerDay: Number(formData.pricePerDay),
      status: formData.status as CarStatus,
      imageUrl: images.length > 0 ? images[0] : `https://picsum.photos/400/250?random=${Math.floor(Math.random() * 1000)}`,
      images: images.length > 0 ? images : undefined,
      mileage: Number(formData.mileage),
      insuranceExpiry: formData.insuranceExpiry,
      registrationExpiry: formData.registrationExpiry,
      inspectionExpiry: formData.inspectionExpiry,
      securityDeposit: Number(formData.securityDeposit),
      features: activeFeatures,
      rating: initialData ? initialData.rating : 5.0,
      traccarDeviceId: formData.traccarDeviceId
    };

    onAddCar(newCar);
  };

  const featureKeys = ['gps', 'bluetooth', 'backupCamera', 'sunroof', 'heatedSeats', 'autopilot', 'childSeat', 'wifi'];

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-12">
      <div ref={topRef} className="flex items-center gap-4 mb-8">
        <button type="button" onClick={onCancel} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
          {dir === 'rtl' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {initialData ? t('editCar') : t('addNewVehicle')}
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">{t('fillDetails')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Basic Info */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] relative overflow-hidden shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">1</div>
              {t('vehicleInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('makeModel')} *</label>
                <input required name="model" value={formData.model} onChange={handleInputChange} type="text" placeholder="e.g. Tesla Model 3" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('brand')} *</label>
                <input required name="brand" value={formData.brand} onChange={handleInputChange} type="text" placeholder="e.g. Tesla" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('year')} *</label>
                <input required name="year" value={formData.year} onChange={handleInputChange} type="number" min="1990" max={new Date().getFullYear() + 1} placeholder="2024" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('licensePlate')} *</label>
                <input required name="licensePlate" value={formData.licensePlate} onChange={handleInputChange} type="text" placeholder="ABC-123" className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold" />
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('mileage')}</label>
                <input name="mileage" value={formData.mileage} onChange={handleInputChange} type="number" placeholder={t('mileagePlaceholder')} className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('carType')}</label>
                <div className="relative">
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-bold appearance-none">
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Coupe</option>
                    <option>Convertible</option>
                    <option>Van</option>
                    <option>Truck</option>
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('fuelType')}</label>
                <div className="relative">
                  <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-bold appearance-none">
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('status')}</label>
                <div className="relative">
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-bold appearance-none">
                    {Object.values(CarStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Section 1.5: GPS Tracker */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] relative overflow-hidden shadow-sm dark:shadow-none">
             <div className="flex items-center gap-3 mb-6">
                <Wifi className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">GPS Tracker Configuration</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Device Unique Identifier (e.g. IMEI)</label>
                   <input 
                      name="traccarDeviceId" 
                      value={formData.traccarDeviceId} 
                      onChange={handleInputChange} 
                      type="text" 
                      placeholder="e.g. 865432049123456" 
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-gray-900 dark:text-white font-bold font-mono" 
                   />
                   <p className="text-[10px] text-gray-500 mt-2 ml-4">Enter the Unique ID used in your Traccar server for this vehicle.</p>
                </div>
             </div>
          </section>

          {/* Section 2: Pricing */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] relative overflow-hidden shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">2</div>
              {t('pricingDeposit')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('dailyRate')} (MAD) *</label>
                <div className="relative">
                  <span className={`absolute ${dir === 'rtl' ? 'right-6' : 'left-6'} top-4 text-gray-500 font-bold text-xs`}>MAD</span>
                  <input required name="pricePerDay" value={formData.pricePerDay} onChange={handleInputChange} type="number" min="0" step="0.01" placeholder="0.00" className={`w-full ${dir === 'rtl' ? 'pr-16 pl-6' : 'pl-16 pr-6'} py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('securityDeposit')} (MAD)</label>
                <div className="relative">
                  <span className={`absolute ${dir === 'rtl' ? 'right-6' : 'left-6'} top-4 text-gray-500 font-bold text-xs`}>MAD</span>
                  <input name="securityDeposit" value={formData.securityDeposit} onChange={handleInputChange} type="number" min="0" step="0.01" placeholder="5000.00" className={`w-full ${dir === 'rtl' ? 'pr-16 pl-6' : 'pl-16 pr-6'} py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700`} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Documents & Compliance */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] relative overflow-hidden shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">3</div>
              {t('compliance')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('insuranceExpiry')}</label>
                <div className="relative">
                  <Calendar className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-4 w-4 h-4 text-gray-500`} />
                  <input name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleInputChange} type="date" className={`w-full ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none dark:[color-scheme:dark]`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('registrationExpiry')}</label>
                 <div className="relative">
                  <Calendar className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-4 w-4 h-4 text-gray-500`} />
                  <input name="registrationExpiry" value={formData.registrationExpiry} onChange={handleInputChange} type="date" className={`w-full ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none dark:[color-scheme:dark]`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('inspectionExpiry')}</label>
                 <div className="relative">
                  <Calendar className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-4 w-4 h-4 text-gray-500`} />
                  <input name="inspectionExpiry" value={formData.inspectionExpiry} onChange={handleInputChange} type="date" className={`w-full ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none dark:[color-scheme:dark]`} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Features */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">4</div>
              {t('featuresAmenities')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featureKeys.map(key => {
                 const isActive = activeFeatures.includes(key);
                 return (
                  <button
                    key={key}
                    type="button" 
                    onClick={() => toggleFeature(key)}
                    className={`flex items-center px-4 py-3 text-sm rounded-2xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-100 dark:bg-emerald-400/10 border-emerald-500 dark:border-emerald-400/50 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${dir === 'rtl' ? 'ml-2.5' : 'mr-2.5'} ${
                      isActive ? 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800'
                    }`}>
                      {isActive && <Check className="w-2.5 h-2.5" />}
                    </div>
                    {t(`features.${key}`)}
                  </button>
                 );
              })}
            </div>
          </section>

          {/* Section 5: Description */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">5</div>
              {t('description')}
            </h3>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4} 
              placeholder={t('enterDescription')}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-700"
            ></textarea>
          </section>

        </div>

        {/* Sidebar / Media Upload */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('baselinePhotos')}</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group"
            >
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-all">
                <Camera className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('dragDrop')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('supportedFiles')}</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-video">
                    <img src={img} className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700" alt={`Preview ${idx}`} />
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/70 backdrop-blur rounded-full transition-all hover:bg-red-500 text-white opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                       <span className="absolute bottom-1 left-1 bg-emerald-500 text-white dark:text-black text-[10px] font-bold px-1.5 py-0.5 rounded">Main</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
             <button type="button" onClick={onCancel} className="flex-1 py-3.5 text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all">
               {t('cancel')}
             </button>
             <button type="submit" className="flex-1 py-3.5 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 rounded-full hover:scale-105 shadow-glow transition-all">
               {t('publishCar')}
             </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddCar;