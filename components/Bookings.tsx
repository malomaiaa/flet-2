import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookingStatus, Booking, Car, Client } from '../types';
import { CheckCircle, Clock, XCircle, MoreVertical, Plus, X, Edit, Trash } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BookingsProps {
  bookings: Booking[];
  cars: Car[];
  clients: Client[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  autoOpenModal?: boolean;
  onModalClose?: () => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, cars, clients, onAddBooking, onUpdateBooking, onDeleteBooking, autoOpenModal, onModalClose }) => {
  const { t, dir } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenModal) {
      setEditingBooking(null);
      setFormData({ clientId: '', carId: '', startDate: '', endDate: '' });
      setIsModalOpen(true);
    }
  }, [autoOpenModal]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };
  
  const [formData, setFormData] = useState({
    clientId: '',
    carId: '',
    startDate: '',
    endDate: '',
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACTIVE:
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20"><Clock className="w-3 h-3" /> {t('active')}</span>;
      case BookingStatus.UPCOMING:
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-cyan-100 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/20"><Clock className="w-3 h-3" /> {t('upcoming')}</span>;
      case BookingStatus.COMPLETED:
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"><CheckCircle className="w-3 h-3" /> {t('completed')}</span>;
      case BookingStatus.CANCELLED:
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-400/20"><XCircle className="w-3 h-3" /> {t('cancelled')}</span>;
    }
  };

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        clientId: booking.clientId || '', 
        carId: booking.carId || '',
        startDate: booking.startDate,
        endDate: booking.endDate
      });
    } else {
      setEditingBooking(null);
      setFormData({ clientId: '', carId: '', startDate: '', endDate: '' });
    }
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onModalClose) onModalClose();
  };

  const handleSubmit = () => {
    if (!formData.clientId || !formData.carId || !formData.startDate || !formData.endDate) {
      alert("Please fill all fields");
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    const car = cars.find(c => c.id === formData.carId);
    
    if (client && car) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const total = diffDays * car.pricePerDay;

      const bookingObj: Booking = {
        id: editingBooking ? editingBooking.id : `BK-${Math.floor(Math.random() * 10000)}`,
        clientId: client.id,
        carId: car.id,
        clientName: client.name,
        clientAvatar: client.avatar,
        carModel: car.model,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalPrice: total,
        status: editingBooking ? editingBooking.status : BookingStatus.UPCOMING,
        paymentStatus: editingBooking ? editingBooking.paymentStatus : 'Pending'
      };

      if (editingBooking) {
        onUpdateBooking(bookingObj);
      } else {
        onAddBooking(bookingObj);
      }
      handleCloseModal();
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden min-h-[500px] shadow-sm dark:shadow-none" onClick={() => setOpenMenuId(null)}>
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('allBookings')}</h2>
          <div className="flex gap-3">
             <button className="text-sm text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-5 py-3 rounded-full transition-colors border border-gray-200 dark:border-gray-700">
                {t('exportCsv')}
             </button>
             <button 
               onClick={() => handleOpenModal()}
               className="flex items-center gap-2 text-sm text-white dark:text-gray-900 font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 hover:scale-105 px-6 py-3 rounded-full transition-all shadow-glow"
             >
                <Plus className="w-4 h-4" />
                {t('newBooking')}
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('bookingId')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('client')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('vehicle')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('dates')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rtl:text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">{booking.id}</td>
                  <td className="px-8 py-5 text-sm text-gray-700 dark:text-gray-300 font-bold">{booking.clientName}</td>
                  <td className="px-8 py-5 text-sm text-gray-600 dark:text-gray-400 font-medium">{booking.carModel}</td>
                  <td className="px-8 py-5 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-gray-300">{booking.startDate}</span>
                      <span className="text-xs text-gray-500">to {booking.endDate}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-gray-900 dark:text-white">MAD {booking.totalPrice}</td>
                  <td className="px-8 py-5">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-8 py-5 text-right rtl:text-left relative">
                    <button 
                      onClick={(e) => toggleMenu(booking.id, e)}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {/* Dropdown Menu */}
                    {openMenuId === booking.id && (
                      <div className={`absolute right-8 top-10 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden`}>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleOpenModal(booking); }}
                           className="w-full text-left rtl:text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                         >
                           <Edit className="w-3.5 h-3.5" />
                           {t('editBooking')}
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteBooking(booking.id); }}
                           className="w-full text-left rtl:text-right px-4 py-3 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                         >
                           <Trash className="w-3.5 h-3.5" />
                           {t('deleteBooking')}
                         </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Booking Modal with Portal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                {editingBooking ? t('editBooking') : t('newBooking')}
              </h3>
              <button onClick={handleCloseModal} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('selectClient')}</label>
                <div className="relative">
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none"
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="">{t('chooseClient')}</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('selectCar')}</label>
                <div className="relative">
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none"
                    value={formData.carId}
                    onChange={(e) => setFormData({...formData, carId: e.target.value})}
                  >
                    <option value="">{t('chooseCar')}</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>{car.model} (MAD {car.pricePerDay}/day)</option>
                    ))}
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('startDate')}</label>
                   <input 
                    type="date" 
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold dark:[color-scheme:dark]"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('endDate')}</label>
                   <input 
                    type="date" 
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold dark:[color-scheme:dark]"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                   />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-[2rem] flex gap-3">
              <button 
                onClick={handleCloseModal}
                className="flex-1 py-3.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3.5 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 hover:scale-105 rounded-full shadow-glow transition-all"
              >
                {editingBooking ? t('saveBooking') : t('createBooking')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Bookings;