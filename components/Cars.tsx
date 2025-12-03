import React, { useState } from 'react';
import { Plus, Filter, MoreHorizontal, Fuel, Settings2, Star, Edit, Trash, Zap } from 'lucide-react';
import { CarStatus, Car } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CarsProps {
  onAddClick: () => void;
  onEditClick: (car: Car) => void;
  onDeleteClick: (carId: string) => void;
  cars: Car[];
}

const Cars: React.FC<CarsProps> = ({ onAddClick, onEditClick, onDeleteClick, cars }) => {
  const { t, dir } = useLanguage();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="space-y-8" onClick={() => setOpenMenuId(null)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
           <button className="flex items-center px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
             <Filter className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
             {t('filters')}
           </button>
           <button className="flex items-center px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
             <Settings2 className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
             {t('sort')}
           </button>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center justify-center px-8 py-3 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 rounded-full shadow-glow hover:shadow-lg hover:scale-105 transition-all"
        >
          <Plus className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
          {t('addNewCar')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cars.map((car) => (
          <div key={car.id} className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10">
            <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img 
                src={car.imageUrl} 
                alt={car.model} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50 dark:opacity-80"></div>
              
              <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>
                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg backdrop-blur-md ${
                   car.status === 'Available' ? 'bg-emerald-400/90 text-gray-900' : 'bg-gray-900/80 text-white border border-gray-700'
                }`}>
                  {car.status}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1 relative z-10 -mt-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1">{car.brand}</p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-1">{car.model}</h3>
                </div>
                <div className="flex items-center text-gray-900 dark:text-white font-bold bg-white/90 dark:bg-gray-800/80 backdrop-blur px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                   <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                   <span className="text-xs">{car.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Fuel className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  {car.fuelType}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Zap className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                  {car.type}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">MAD {car.pricePerDay}</span>
                  <span className="text-xs font-medium text-gray-500 ml-1">{t('perDay')}</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => toggleMenu(car.id, e)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === car.id && (
                    <div className={`absolute bottom-full mb-2 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-40 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl z-20 overflow-hidden`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditClick(car); }}
                        className="w-full text-left rtl:text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {t('editCar')}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteClick(car.id); }}
                        className="w-full text-left rtl:text-right px-4 py-3 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        {t('deleteCar')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cars;