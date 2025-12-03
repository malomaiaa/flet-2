import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import * as Leaflet from 'leaflet';
import { 
  Play, Pause, Navigation, MapPin, 
  Settings, Battery, Signal, Zap, History, User, 
  Filter, Search, X,
  Car as CarIcon, AlertTriangle
} from 'lucide-react';
import { Car, TrackingVehicle, Geofence, CarStatus, GlobalSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

// Robust Leaflet Import Handling for Browser Environments
const L = (Leaflet as any).default || Leaflet;

// Default Center (Casablanca)
const CENTER_LAT = 33.5731;
const CENTER_LNG = -7.5898;

const ROUTES = [
  // Route 1: Downtown Loop
  [
    [33.5731, -7.5898], [33.5745, -7.5920], [33.5760, -7.5950], [33.5780, -7.5980],
    [33.5800, -7.5950], [33.5785, -7.5910], [33.5750, -7.5880], [33.5731, -7.5898]
  ],
  // Route 2: Coastline
  [
    [33.5950, -7.6100], [33.5960, -7.6150], [33.5980, -7.6200], [33.6000, -7.6250],
    [33.6020, -7.6300], [33.6000, -7.6250], [33.5980, -7.6200], [33.5950, -7.6100]
  ]
];

const createCarIcon = (heading: number, color: 'emerald' | 'cyan') => L.divIcon({
  html: `
    <div style="transform: rotate(${heading}deg);" class="relative w-8 h-8 flex items-center justify-center transition-all duration-300 ease-linear">
      <div class="absolute inset-0 bg-${color}-500/20 rounded-full animate-pulse"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color === 'emerald' ? '#34D399' : '#22D3EE'}" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    </div>
  `,
  className: 'custom-marker-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface InterpolatedMarkerProps {
  position: { lat: number; lng: number; heading: number };
  duration: number; 
  color: 'emerald' | 'cyan';
  onClick: () => void;
  children?: React.ReactNode;
}

const InterpolatedMarker: React.FC<InterpolatedMarkerProps> = ({ position, duration, color, onClick, children }) => {
  const [currentPos, setCurrentPos] = useState([position.lat, position.lng]);
  const [currentHeading, setCurrentHeading] = useState(position.heading);
  
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const startPosRef = useRef<[number, number]>([position.lat, position.lng]);
  const targetPosRef = useRef<[number, number]>([position.lat, position.lng]);
  const startHeadingRef = useRef<number>(position.heading);
  const targetHeadingRef = useRef<number>(position.heading);

  useEffect(() => {
    startPosRef.current = currentPos as [number, number];
    targetPosRef.current = [position.lat, position.lng];
    
    startHeadingRef.current = currentHeading;
    targetHeadingRef.current = position.heading;

    let dHeading = position.heading - currentHeading;
    if (dHeading > 180) dHeading -= 360;
    if (dHeading < -180) dHeading += 360;
    targetHeadingRef.current = currentHeading + dHeading;

    startTimeRef.current = null;
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = (time - startTimeRef.current) / duration;

      if (progress < 1) {
        const lat = startPosRef.current[0] + (targetPosRef.current[0] - startPosRef.current[0]) * progress;
        const lng = startPosRef.current[1] + (targetPosRef.current[1] - startPosRef.current[1]) * progress;
        const heading = startHeadingRef.current + (targetHeadingRef.current - startHeadingRef.current) * progress;

        setCurrentPos([lat, lng]);
        setCurrentHeading(heading);
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentPos(targetPosRef.current);
        setCurrentHeading(targetHeadingRef.current);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [position.lat, position.lng, position.heading, duration]); 

  const smoothIcon = createCarIcon(currentHeading, color);

  return (
    <Marker 
      position={currentPos as [number, number]} 
      icon={smoothIcon} 
      eventHandlers={{ click: onClick }}
    >
      {children}
    </Marker>
  );
};

interface LiveTrackingProps {
  initialCars: Car[];
  settings: GlobalSettings;
}

const LiveTracking: React.FC<LiveTrackingProps> = ({ initialCars, settings }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const [vehicles, setVehicles] = useState<TrackingVehicle[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<'all' | 'Owner A' | 'Owner B'>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([CENTER_LAT, CENTER_LNG]);
  
  const [isUsingTraccar, setIsUsingTraccar] = useState(false);
  const [traccarError, setTraccarError] = useState<string | null>(null);
  const [traccarDevicesMap, setTraccarDevicesMap] = useState<{[key: number]: string}>({}); 

  const [isSimulating, setIsSimulating] = useState(false); 
  const [simFrequency, setSimFrequency] = useState(3000); 
  const simulationRef = useRef<any>(null);
  const traccarIntervalRef = useRef<any>(null);
  const routeIndices = useRef<{[key: string]: number}>({});

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isDrawMode, setIsDrawMode] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsTimeoutRef = useRef<any>(null);

  const handleSettingsEnter = () => {
    if (settingsTimeoutRef.current) clearTimeout(settingsTimeoutRef.current);
    setIsSettingsOpen(true);
  };

  const handleSettingsLeave = () => {
    settingsTimeoutRef.current = setTimeout(() => {
      setIsSettingsOpen(false);
    }, 300);
  };

  useEffect(() => {
    if (initialCars.length === 0) return;

    const trackingCars = initialCars.filter(c => c.status === CarStatus.BOOKED || c.traccarDeviceId);

    const initialVehicles: TrackingVehicle[] = trackingCars.map((car, index) => ({
      ...car,
      ownerId: 'Owner A', 
      driverName: 'Driver',
      isIgnitionOn: false,
      batteryLevel: 0,
      fuelLevel: 0,
      currentLocation: {
        lat: CENTER_LAT,
        lng: CENTER_LNG,
        heading: 0,
        speed: 0,
        timestamp: Date.now()
      },
      history: []
    }));

    setVehicles(initialVehicles);

    if (settings.traccarUrl && settings.traccarUsername && settings.traccarPassword) {
      setIsUsingTraccar(true);
    } else {
      setIsSimulating(true); 
    }

    setGeofences([{
      id: 'geo-1',
      name: 'HQ Zone',
      center: { lat: 33.5731, lng: -7.5898 },
      radius: 500,
      color: '#34D399',
      active: true
    }]);

  }, [initialCars, settings]);

  const fetchTraccarDevices = async () => {
     if (!settings.traccarUrl || !settings.traccarUsername || !settings.traccarPassword) return;

     const auth = btoa(`${settings.traccarUsername}:${settings.traccarPassword}`);
     let url = settings.traccarUrl;
     if (!url.startsWith('http')) url = 'http://' + url;
     if (url.endsWith('/')) url = url.slice(0, -1);

     try {
        const response = await fetch(`${url}/api/devices`, {
           headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        
        if (response.ok) {
           const devices = await response.json();
           const map: {[key: number]: string} = {};
           devices.forEach((d: any) => {
              map[d.id] = d.uniqueId; 
           });
           setTraccarDevicesMap(map);
           setTraccarError(null);
        } else {
           throw new Error(`Status: ${response.status}`);
        }
     } catch (e: any) {
        console.warn("Failed to fetch Traccar devices:", e);
        setTraccarError("Connection Failed");
     }
  };

  const fetchTraccarPositions = async () => {
    if (!settings.traccarUrl || !settings.traccarUsername || !settings.traccarPassword) return;

    const auth = btoa(`${settings.traccarUsername}:${settings.traccarPassword}`);
    let url = settings.traccarUrl;
    if (!url.startsWith('http')) url = 'http://' + url;
    if (url.endsWith('/')) url = url.slice(0, -1);

    try {
       const response = await fetch(`${url}/api/positions`, {
          headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
       });

       if (response.ok) {
          const positions = await response.json();
          updateVehiclesFromTraccar(positions);
          setTraccarError(null);
       } else {
          throw new Error("Failed to fetch positions");
       }
    } catch (e) {
       console.error("Traccar position sync error", e);
    }
  };

  const updateVehiclesFromTraccar = (positions: any[]) => {
    setVehicles(prev => {
       return prev.map(v => {
          if (!v.traccarDeviceId) return v;

          const traccarInternalId = Object.keys(traccarDevicesMap).find(
             key => traccarDevicesMap[Number(key)] === v.traccarDeviceId
          );

          if (!traccarInternalId) return v;

          const pos = positions.find(p => p.deviceId === Number(traccarInternalId));

          if (pos) {
             const newLoc = {
                lat: pos.latitude,
                lng: pos.longitude,
                heading: pos.course,
                speed: pos.speed * 1.852, 
                timestamp: Date.now()
             };
             
             return {
                ...v,
                currentLocation: newLoc,
                isIgnitionOn: pos.attributes?.ignition || false,
                batteryLevel: pos.attributes?.batteryLevel || 100,
                fuelLevel: pos.attributes?.fuelLevel || 50,
                history: [...v.history.slice(-50), newLoc],
                isOnline: true,
                lastUpdate: new Date().toLocaleTimeString()
             };
          }
          return v;
       });
    });
  };

  useEffect(() => {
     if (isUsingTraccar) {
        fetchTraccarDevices(); 
        
        traccarIntervalRef.current = setInterval(fetchTraccarPositions, simFrequency);
        fetchTraccarPositions(); 
     }

     return () => {
        if (traccarIntervalRef.current) clearInterval(traccarIntervalRef.current);
     };
  }, [isUsingTraccar, simFrequency, settings, traccarDevicesMap]);

  useEffect(() => {
    if (!isSimulating || isUsingTraccar) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      return;
    }

    simulationRef.current = setInterval(() => {
      setVehicles(prevVehicles => {
        return prevVehicles.map((v, index) => {
          if (v.traccarDeviceId) return v; 

          const hash = v.id.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
          const routeIndex = Math.abs(hash) % ROUTES.length;
          const route = ROUTES[routeIndex];
          
          const currentIndex = routeIndices.current[v.id] || 0;
          const nextIndex = (currentIndex + 1) % route.length;
          
          const [lat1, lng1] = route[currentIndex];
          const [lat2, lng2] = route[nextIndex];
          
          routeIndices.current[v.id] = nextIndex;

          const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
          const heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

          const speed = 30 + Math.random() * 40;

          const newLoc = {
            lat: lat2,
            lng: lng2,
            heading,
            speed,
            timestamp: Date.now()
          };

          return {
            ...v,
            currentLocation: newLoc,
            history: [...v.history.slice(-50), newLoc],
            isIgnitionOn: true,
            isOnline: true
          };
        });
      });
    }, simFrequency);

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isSimulating, isUsingTraccar, simFrequency]);

  const filteredVehicles = vehicles.filter(v => 
    selectedOwner === 'all' || v.ownerId === selectedOwner
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleMapClick = (e: any) => {
     if (isDrawMode) {
        setGeofences(prev => [...prev, {
           id: `geo-${Date.now()}`,
           name: `Zone ${prev.length + 1}`,
           center: e.latlng,
           radius: 300,
           color: '#F59E0B',
           active: true
        }]);
        setIsDrawMode(false);
     }
  };

  const handleCenterVehicle = (v: TrackingVehicle) => {
     setMapCenter([v.currentLocation.lat, v.currentLocation.lng]);
     setSelectedVehicleId(v.id);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 relative">
      
      <div className="w-80 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl z-20 flex-shrink-0 relative overflow-visible">
         <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl z-30 relative">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                 {t('fleetStatus')}
               </h3>
               <div className="flex gap-2">
                  {!isUsingTraccar && (
                    <button onClick={() => setIsSimulating(!isSimulating)} title={isSimulating ? t('stopSim') : t('startSim')} className={`p-2 rounded-full transition-colors ${isSimulating ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                       {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                  
                  <div 
                    className="relative"
                    onMouseEnter={handleSettingsEnter}
                    onMouseLeave={handleSettingsLeave}
                  >
                     <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Settings className="w-4 h-4" />
                     </button>
                     {isSettingsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-[9999] animate-in fade-in zoom-in-95 duration-200">
                           <label className="text-xs font-bold text-gray-500 uppercase">{t('frequency')}</label>
                           <input 
                              type="range" min="1000" max="10000" step="500" 
                              value={simFrequency} onChange={(e) => setSimFrequency(Number(e.target.value))}
                              className="w-full mt-2 accent-emerald-400"
                           />
                           <div className="text-xs text-right text-gray-400 mt-1">{simFrequency/1000}s</div>
                           <label className="text-xs font-bold text-gray-500 uppercase mt-2 block">{t('owner')}</label>
                           <select 
                              value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value as any)}
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs rounded p-1 mt-1 text-gray-900 dark:text-white"
                           >
                              <option value="all">All Owners</option>
                              <option value="Owner A">Owner A</option>
                           </select>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            {isUsingTraccar ? (
                <div className={`text-xs font-bold px-3 py-2 rounded mb-2 flex items-center gap-2 ${traccarError ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                   <div className={`w-2 h-2 rounded-full ${traccarError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                   {traccarError ? 'Traccar Offline' : 'Traccar Live'}
                </div>
            ) : (
                <div className="text-xs font-bold px-3 py-2 rounded mb-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   Simulation Mode
                </div>
            )}
            
            <div className="relative">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
               <input 
                 type="text" placeholder={t('search')} 
                 className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:border-emerald-500 outline-none"
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {filteredVehicles.map(vehicle => {
               const isSelected = selectedVehicleId === vehicle.id;
               const statusColor = vehicle.isOnline 
                  ? (vehicle.isIgnitionOn ? 'text-emerald-500' : 'text-orange-500') 
                  : 'text-gray-400';
               
               return (
                  <button
                     key={vehicle.id}
                     onClick={() => handleCenterVehicle(vehicle)}
                     className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-500/50 shadow-md' 
                        : 'bg-white dark:bg-gray-800/50 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                     }`}
                  >
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{vehicle.brand} {vehicle.model}</span>
                        <Signal className={`w-3 h-3 ${vehicle.isOnline ? 'text-emerald-500' : 'text-gray-400'}`} />
                     </div>
                     <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono">{vehicle.licensePlate}</span>
                        {vehicle.driverName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {vehicle.driverName}</span>}
                     </div>
                     
                     <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-gray-400">
                        <div className={`flex items-center gap-1 ${statusColor}`}>
                           <Zap className="w-3 h-3" />
                           {vehicle.isIgnitionOn ? 'ON' : 'OFF'}
                        </div>
                        <div className="flex items-center gap-1">
                           <Navigation className="w-3 h-3" />
                           {Math.round(vehicle.currentLocation.speed)} km/h
                        </div>
                        <div className="flex items-center gap-1">
                           <Battery className="w-3 h-3" />
                           {vehicle.batteryLevel}%
                        </div>
                     </div>
                  </button>
               )
            })}
         </div>
      </div>

      <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800 relative z-10">
         <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
         >
            <TileLayer
               url={theme === 'dark' 
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                  : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
               }
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            <MapController center={mapCenter} />
            <MapResizeHandler />

            {geofences.map(geo => (
               <Circle 
                  key={geo.id}
                  center={[geo.center.lat, geo.center.lng]}
                  radius={geo.radius}
                  pathOptions={{ color: geo.color, fillColor: geo.color, fillOpacity: 0.2 }}
               />
            ))}

            {filteredVehicles.map(vehicle => (
               <InterpolatedMarker
                  key={vehicle.id}
                  position={vehicle.currentLocation}
                  duration={simFrequency}
                  color={vehicle.isIgnitionOn ? 'emerald' : 'cyan'}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
               >
                  <Popup className="custom-popup">
                     <div className="p-1">
                        <h4 className="font-bold text-sm">{vehicle.brand} {vehicle.model}</h4>
                        <p className="text-xs text-gray-500">{vehicle.licensePlate}</p>
                        <div className="mt-2 space-y-1 text-xs">
                           <div className="flex justify-between"><span>Speed:</span> <b>{Math.round(vehicle.currentLocation.speed)} km/h</b></div>
                           <div className="flex justify-between"><span>Fuel:</span> <b>{vehicle.fuelLevel}%</b></div>
                           <div className="flex justify-between"><span>Status:</span> <b>{vehicle.isIgnitionOn ? 'Moving' : 'Parked'}</b></div>
                        </div>
                     </div>
                  </Popup>
               </InterpolatedMarker>
            ))}

            <MapClickHandler onClick={handleMapClick} />

         </MapContainer>

         <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            <button 
               onClick={() => setIsDrawMode(!isDrawMode)}
               className={`p-3 rounded-full shadow-lg transition-all ${isDrawMode ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white'}`}
               title={t('addFence')}
            >
               <MapPin className="w-5 h-5" />
            </button>
            <button 
               onClick={() => setGeofences([])}
               className="p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
               title={t('clearFences')}
            >
               <X className="w-5 h-5" />
            </button>
         </div>

         {selectedVehicle && (
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl z-[400] animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-start">
                  <div>
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedVehicle.brand} {selectedVehicle.model}</h2>
                     <div className="flex items-center gap-3 mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">{selectedVehicle.licensePlate}</span>
                        <span>•</span>
                        <span>{selectedVehicle.driverName || 'No Driver'}</span>
                        <span>•</span>
                        <span className="text-emerald-500">{t('active')}</span>
                     </div>
                  </div>
                  <button onClick={() => setSelectedVehicleId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">{t('speed')}</div>
                     <div className="text-xl font-black text-gray-900 dark:text-white">{Math.round(selectedVehicle.currentLocation.speed)} <span className="text-xs font-normal text-gray-500">km/h</span></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">{t('fuel')}</div>
                     <div className="text-xl font-black text-gray-900 dark:text-white">{selectedVehicle.fuelLevel}<span className="text-xs font-normal text-gray-500">%</span></div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full" style={{ width: `${selectedVehicle.fuelLevel}%` }}></div>
                     </div>
                  </div>
                   <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">{t('battery')}</div>
                     <div className="text-xl font-black text-gray-900 dark:text-white">{selectedVehicle.batteryLevel}<span className="text-xs font-normal text-gray-500">%</span></div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${selectedVehicle.batteryLevel}%` }}></div>
                     </div>
                  </div>
                   <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">{t('lastSeen')}</div>
                     <div className="text-xl font-black text-gray-900 dark:text-white">{selectedVehicle.lastUpdate || 'Now'}</div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const MapClickHandler = ({ onClick }: { onClick: (e: any) => void }) => {
   const map = useMap();
   useEffect(() => {
      map.on('click', onClick);
      return () => { map.off('click', onClick); };
   }, [map, onClick]);
   return null;
};

export default LiveTracking;