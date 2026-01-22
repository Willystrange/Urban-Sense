import { useState, useEffect } from 'react';
import { Navigation, Clock, Bus, AlertCircle, Bike, CreditCard, CheckCircle2 } from 'lucide-react';
import { services } from '@tomtom-international/web-sdk-services';
import { clsx } from 'clsx';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useAuth } from '../context/AuthContext';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface Location {
    lat: number;
    lon: number;
    address: string;
}

interface BikeStation {
    station_id: string;
    name: string;
    lat: number;
    lon: number;
    num_bikes_available: number;
    num_docks_available: number;
}

export interface RouteGeometry {
    walk1: number[][]; 
    bus: number[][];
    bike: number[][]; 
    walk2: number[][];
    start: Location;
    end: Location;
    lineColor: string;
}

interface ItinerarySearchProps {
    routes: any[];
    stops: any[];
    onRouteCalculated?: (geometry: RouteGeometry | null) => void;
}

const ItinerarySearch = ({ routes, stops, onRouteCalculated }: ItinerarySearchProps) => {
  const { user } = useAuth(); // Récupération de l'utilisateur pour l'âge
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  const [startLoc, setStartLoc] = useState<Location | null>(null);
  const [endLoc, setEndLoc] = useState<Location | null>(null);
  const [includeBikes, setIncludeBikes] = useState(false); 
  
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bikeStations, setBikeStations] = useState<BikeStation[]>([]);

  // Désactiver les vélos si l'utilisateur a moins de 10 ans
  useEffect(() => {
      if (user && user.age < 10) {
          setIncludeBikes(false);
      }
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation && !startLoc) {
        navigator.geolocation.getCurrentPosition((pos) => {
            setStartLoc({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                address: "Ma position actuelle"
            });
            setStartAddress("Ma position actuelle");
        }, () => {}, { timeout: 5000 });
    }
  }, []);

  useEffect(() => {
      const fetchBikes = async () => {
          try {
              const infoRes = await fetch('/api/bikes/station_information.json');
              const infoData = await infoRes.json();
              const statusRes = await fetch('/api/bikes/station_status.json');
              const statusData = await statusRes.json();

              const stations = infoData.data.stations.map((st: any) => {
                  const status = statusData.data.stations.find((s: any) => s.station_id === st.station_id);
                  return {
                      station_id: st.station_id,
                      name: st.name,
                      lat: st.lat,
                      lon: st.lon,
                      num_bikes_available: status ? status.num_bikes_available : 0,
                      num_docks_available: status ? status.num_docks_available : 0
                  };
              });
              setBikeStations(stations);
          } catch (e) {
              console.warn("Erreur chargement vélos GBFS (Proxy):", e);
          }
      };
      fetchBikes();
  }, []);

  const fetchRealRoute = async (origin: Location, dest: Location, mode: 'pedestrian' | 'bus' | 'bicycle'): Promise<number[][]> => {
      try {
          if (!import.meta.env.VITE_TOMTOM_API_KEY) return [[origin.lon, origin.lat], [dest.lon, dest.lat]];

          const response = await services.calculateRoute({
              key: import.meta.env.VITE_TOMTOM_API_KEY,
              locations: `${origin.lon},${origin.lat}:${dest.lon},${dest.lat}`,
              travelMode: mode,
              routeType: 'fastest'
          });

          if (response.routes && response.routes.length > 0) {
              return response.routes[0].legs[0].points
                .map(p => [p.lng, p.lat])
                .filter((p): p is number[] => p[0] !== undefined && p[1] !== undefined);
          }
      } catch (e) {
          console.warn("Erreur routing TomTom:", e);
      }
      return [[origin.lon, origin.lat], [dest.lon, dest.lat]];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLoc || !endLoc) {
        setError("Veuillez sélectionner des adresses valides.");
        return;
    }
    setError(null);
    setLoading(true);
    setItinerary(null);
    if (onRouteCalculated) onRouteCalculated(null);
    
    calculateSmartItinerary(startLoc, endLoc).finally(() => setLoading(false));
  };

  const findNextSchedule = (stop: any, routeName: string, afterTime: string) => {
      if (!stop.schedules || !stop.schedules[routeName]) return null;
      const times = stop.schedules[routeName] as string[];
      return times.find(t => t > afterTime);
  };

  const calculateSmartItinerary = async (start: Location, end: Location) => {
     // --- CONSTANTES DE VITESSE DYNAMIQUES ---
     const WALK_MIN_KM = 12; // 5 km/h
     
     // Adaptation vitesse vélo selon âge
     let bikeSpeedMinKm = 3.3; // Adulte par défaut (18 km/h)
     if (user && user.age) {
         if (user.age < 15) {
             bikeSpeedMinKm = 5.0; // 12 km/h (Enfant/Jeune ado)
         } else if (user.age < 19) {
             bikeSpeedMinKm = 4.0; // 15 km/h (Ado)
         }
     }
     const BIKE_MIN_KM = bikeSpeedMinKm;
     const BUS_MIN_KM = 2.5;

     // ---------------------------------------------------------
     // SCENARIO 1 : VÉLO INTÉGRAL (Seulement si coché ET âge >= 10)
     // ---------------------------------------------------------
     let fullBikeScore = Infinity;
     let fullBikeStartStation: BikeStation | null = null;
     let fullBikeEndStation: BikeStation | null = null;
     let fullBikeTime = 0;

     // Double sécurité sur l'âge ici aussi
     if (includeBikes && bikeStations.length > 0 && user && user.age >= 10) {
         const nearBikeStart = bikeStations
            .filter(s => s.num_bikes_available > 0 && getDistance(start.lat, start.lon, s.lat, s.lon) < 2.5)
            .sort((a, b) => getDistance(start.lat, start.lon, a.lat, a.lon) - getDistance(start.lat, start.lon, b.lat, b.lon))[0];
         
         const nearBikeEnd = bikeStations
            .filter(s => s.num_docks_available > 0 && getDistance(end.lat, end.lon, s.lat, s.lon) < 2.0)
            .sort((a, b) => getDistance(end.lat, end.lon, a.lat, a.lon) - getDistance(end.lat, end.lon, b.lat, b.lon))[0];

         if (nearBikeStart && nearBikeEnd) {
             const d1 = getDistance(start.lat, start.lon, nearBikeStart.lat, nearBikeStart.lon);
             const d2 = getDistance(nearBikeStart.lat, nearBikeStart.lon, nearBikeEnd.lat, nearBikeEnd.lon);
             const d3 = getDistance(nearBikeEnd.lat, nearBikeEnd.lon, end.lat, end.lon);
             
             fullBikeTime = Math.ceil(d1 * WALK_MIN_KM) + Math.ceil(d2 * BIKE_MIN_KM) + Math.ceil(d3 * WALK_MIN_KM) + 2; 
             fullBikeScore = fullBikeTime;
             fullBikeStartStation = nearBikeStart;
             fullBikeEndStation = nearBikeEnd;
         }
     }

     // ---------------------------------------------------------
     // SCENARIO 2 : BUS
     // ---------------------------------------------------------
     let nearestEndStop: any = null;
     let minEndDist = Infinity;

     if (stops) {
         for (const stop of stops) {
             const distEnd = getDistance(end.lat, end.lon, stop.lat, stop.lon);
             if (distEnd < minEndDist) {
                 minEndDist = distEnd;
                 nearestEndStop = stop;
             }
         }
     }

     if (!nearestEndStop) {
         setError("Aucun arrêt d'arrivée trouvé.");
         return;
     }

     const targetRoutes = nearestEndStop.schedules ? Object.keys(nearestEndStop.schedules) : [];

     let bestStartStop: any = null;
     let bestScore = Infinity; 
     let bestDepartureTime = "";
     let bestRouteInfo: any = null;
     let bestWaitTime = 0;
     let bestAccessMode = 'walk';
     let bestAccessTime = 0;
     let bestBikeStart: BikeStation | null = null;
     let bestBikeEnd: BikeStation | null = null;
     let bestWalkToStop = 0;

     let candidateStops = stops.filter(s => getDistance(start.lat, start.lon, s.lat, s.lon) < 2.5);

     if (candidateStops.length === 0) {
         let absoluteNearest = null;
         let minAbsDist = Infinity;
         for (const stop of stops) {
             const d = getDistance(start.lat, start.lon, stop.lat, stop.lon);
             if (d < minAbsDist) {
                 minAbsDist = d;
                 absoluteNearest = stop;
             }
         }
         if (absoluteNearest) candidateStops = [absoluteNearest];
     }

     const now = new Date();
     
     for (const stop of candidateStops) {
         if (!stop.schedules) continue;
         const stopRoutes = Object.keys(stop.schedules);
         const commonRoutes = stopRoutes.filter(r => targetRoutes.includes(r));
         if (commonRoutes.length === 0) continue;

         const distStop = getDistance(start.lat, start.lon, stop.lat, stop.lon);
         
         let accessTime = Math.ceil(distStop * WALK_MIN_KM); 
         let mode = 'walk';
         let bikeStart = null;
         let bikeEnd = null;

         // Check Vélo d'approche (Si coché ET âge ok)
         if (includeBikes && user && user.age >= 10 && distStop > 0.8 && bikeStations.length > 0) {
             const nearBikeStart = bikeStations
                .filter(s => s.num_bikes_available > 0 && getDistance(start.lat, start.lon, s.lat, s.lon) < 2.0)
                .sort((a, b) => getDistance(start.lat, start.lon, a.lat, a.lon) - getDistance(start.lat, start.lon, b.lat, b.lon))[0];
             
             const nearBikeEnd = bikeStations
                .filter(s => s.num_docks_available > 0 && getDistance(stop.lat, stop.lon, s.lat, s.lon) < 1.0)
                .sort((a, b) => getDistance(stop.lat, stop.lon, a.lat, a.lon) - getDistance(stop.lat, stop.lon, b.lat, b.lon))[0];

             if (nearBikeStart && nearBikeEnd) {
                 const d1 = getDistance(start.lat, start.lon, nearBikeStart.lat, nearBikeStart.lon);
                 const d2 = getDistance(nearBikeStart.lat, nearBikeStart.lon, nearBikeEnd.lat, nearBikeEnd.lon);
                 const d3 = getDistance(nearBikeEnd.lat, nearBikeEnd.lon, stop.lat, stop.lon);
                 const bikeTotalTime = Math.ceil(d1 * WALK_MIN_KM) + Math.ceil(d2 * BIKE_MIN_KM) + Math.ceil(d3 * WALK_MIN_KM) + 2; 
                 if (bikeTotalTime < accessTime) {
                     accessTime = bikeTotalTime;
                     mode = 'bike';
                     bikeStart = nearBikeStart;
                     bikeEnd = nearBikeEnd;
                 }
             }
         }

         const arrivalAtStop = new Date(now.getTime() + accessTime * 60000);
         const arrivalStr = arrivalAtStop.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

         let minWait = Infinity;
         let bestTimeForStop = "";
         let bestRouteForStop = "";

         for (const route of commonRoutes) {
             const nextTime = findNextSchedule(stop, route, arrivalStr);
             if (nextTime) {
                 const [h1, m1] = nextTime.split(':').map(Number);
                 const [h2, m2] = arrivalStr.split(':').map(Number);
                 const wait = (h1 * 60 + m1) - (h2 * 60 + m2);
                 if (wait >= 0 && wait < minWait) {
                     minWait = wait;
                     bestTimeForStop = nextTime;
                     bestRouteForStop = route;
                 }
             }
         }

         if (minWait !== Infinity) {
             const totalStartCost = accessTime + minWait;
             const busDistEst = getDistance(stop.lat, stop.lon, nearestEndStop.lat, nearestEndStop.lon);
             const busTimeEst = Math.ceil(busDistEst * BUS_MIN_KM);
             const walkDestEst = Math.ceil(getDistance(nearestEndStop.lat, nearestEndStop.lon, end.lat, end.lon) * WALK_MIN_KM);
             const totalTripScore = totalStartCost + busTimeEst + walkDestEst;

             if (totalTripScore < bestScore) {
                 bestScore = totalTripScore;
                 bestStartStop = stop;
                 bestDepartureTime = bestTimeForStop;
                 bestWaitTime = minWait;
                 bestAccessTime = accessTime;
                 bestAccessMode = mode;
                 bestWalkToStop = Math.ceil(distStop * WALK_MIN_KM); 
                 bestRouteInfo = routes.find(r => r.short_name === bestRouteForStop) || { short_name: bestRouteForStop, color: '#3b82f6' };
                 bestBikeStart = bikeStart;
                 bestBikeEnd = bikeEnd;
             }
         }
     }

     if (fullBikeStartStation && fullBikeEndStation && (fullBikeScore < bestScore || !bestStartStop)) {
         const finalArrival = new Date(now.getTime() + fullBikeScore * 60000);
         const finalArrivalStr = finalArrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
         const bGeo = await fetchRealRoute(
             { lat: fullBikeStartStation.lat, lon: fullBikeStartStation.lon, address: '' }, 
             { lat: fullBikeEndStation.lat, lon: fullBikeEndStation.lon, address: '' }, 
             'bicycle'
         );
         if (onRouteCalculated) onRouteCalculated({ walk1: [], bike: bGeo, bus: [], walk2: [], start, end, lineColor: '#f97316' });
         setItinerary({
             duration: fullBikeScore > 60 ? `${Math.floor(fullBikeScore/60)}h${fullBikeScore%60}` : `${fullBikeScore} min`,
             arrivalTime: finalArrivalStr,
             steps: [
                 { type: 'walk', instruction: `Aller à la station "${fullBikeStartStation.name}"`, duration: `2 min`, distance: `100 m` },
                 { type: 'bike', instruction: `Vélo Ti'Vélo vers "${fullBikeEndStation.name}"`, duration: `${Math.ceil(fullBikeTime - 4)} min`, distance: `${(getDistance(fullBikeStartStation.lat, fullBikeStartStation.lon, fullBikeEndStation.lat, fullBikeEndStation.lon)).toFixed(1)} km`, bikesAvailable: fullBikeStartStation.num_bikes_available },
                 { type: 'walk', instruction: `Déposer vélo et marcher vers destination`, duration: `2 min`, distance: `100 m` }
             ]
         });
         return;
     }

     if (!bestStartStop) {
         setError("Aucun itinéraire trouvé.");
         return;
     }

     const busDist = getDistance(bestStartStop.lat, bestStartStop.lon, nearestEndStop.lat, nearestEndStop.lon);
     let busDuration = Math.ceil(busDist * BUS_MIN_KM);
     const nextTimeAtDest = findNextSchedule(nearestEndStop, bestRouteInfo.short_name, bestDepartureTime);
     if (nextTimeAtDest) {
         const [h1, m1] = nextTimeAtDest.split(':').map(Number);
         const [h2, m2] = bestDepartureTime.split(':').map(Number);
         busDuration = (h1 * 60 + m1) - (h2 * 60 + m2);
         if (busDuration < 0) busDuration = Math.ceil(busDist * BUS_MIN_KM); 
     }
     const walkDestTime = Math.ceil(getDistance(nearestEndStop.lat, nearestEndStop.lon, end.lat, end.lon) * WALK_MIN_KM);
     const totalTripTime = bestAccessTime + bestWaitTime + busDuration + walkDestTime;
     const finalArrivalStr = new Date(now.getTime() + totalTripTime * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

     const stopStartLoc = { lat: bestStartStop.lat, lon: bestStartStop.lon, address: bestStartStop.name };
     const stopEndLoc = { lat: nearestEndStop.lat, lon: nearestEndStop.lon, address: nearestEndStop.name };

     let walk1Geo: number[][] = [];
     let bikeGeo: number[][] = [];
     let busGeo: number[][] = [];
     let walk2Geo: number[][] = [];

     const [b, w2] = await Promise.all([
        fetchRealRoute(stopStartLoc, stopEndLoc, 'bus'),
        fetchRealRoute(stopEndLoc, end, 'pedestrian')
     ]);
     busGeo = b; walk2Geo = w2;
        
     if (bestAccessMode === 'bike' && bestBikeStart && bestBikeEnd) {
        bikeGeo = await fetchRealRoute({ lat: bestBikeStart.lat, lon: bestBikeStart.lon, address: '' }, { lat: bestBikeEnd.lat, lon: bestBikeEnd.lon, address: '' }, 'bicycle');
     } else {
        walk1Geo = await fetchRealRoute(start, stopStartLoc, 'pedestrian');
     }

     if (onRouteCalculated) onRouteCalculated({ walk1: walk1Geo, bike: bikeGeo, bus: busGeo, walk2: walk2Geo, start, end, lineColor: bestRouteInfo.color });

     const steps = [];
     const isOptimizedWalk = bestWalkToStop > 10 && bestWaitTime < 10;

     if (bestAccessMode === 'bike' && bestBikeStart && bestBikeEnd) {
         steps.push({ type: 'walk', instruction: `Aller à la station "${bestBikeStart.name}"`, duration: `2 min`, distance: `100 m` });
         steps.push({ type: 'bike', instruction: `Vélo Ti'Vélo vers "${bestBikeEnd.name}"`, duration: `${Math.ceil(bestAccessTime - 4)} min`, distance: `${(getDistance(bestBikeStart.lat, bestBikeStart.lon, bestBikeEnd.lat, bestBikeEnd.lon)).toFixed(1)} km`, bikesAvailable: bestBikeStart.num_bikes_available });
         steps.push({ type: 'walk', instruction: `Déposer vélo et aller à l'arrêt "${bestStartStop.name}"`, duration: `2 min`, distance: `50 m` });
     } else {
         steps.push({ type: 'walk', instruction: `Marcher jusqu'à l'arrêt "${bestStartStop.name}"` + (isOptimizedWalk ? ' (Arrêt optimal)' : ''), duration: `${bestWalkToStop} min`, distance: `${(getDistance(start.lat, start.lon, bestStartStop.lat, bestStartStop.lon)).toFixed(1)} km` });
     }
     
     steps.push({ type: 'bus', instruction: `Prendre le bus de ${bestDepartureTime} vers "${nearestEndStop.name}"`, duration: `${busDuration} min`, line: bestRouteInfo, isReal: true, waitTime: bestWaitTime > 0 ? `${bestWaitTime} min d'attente` : 'Départ immédiat', distance: `${(busDist).toFixed(1)} km` });
     steps.push({ type: 'walk', instruction: `Marcher jusqu'à votre destination`, duration: `${walkDestTime} min`, distance: `${(getDistance(nearestEndStop.lat, nearestEndStop.lon, end.lat, end.lon)).toFixed(1)} km` });

     setItinerary({ duration: totalTripTime > 60 ? `${Math.floor(totalTripTime/60)}h${totalTripTime%60}` : `${totalTripTime} min`, arrivalTime: finalArrivalStr, steps });
  };

  return (
    <div className="bg-urbansense-surface-1 rounded-xl p-4 border border-urbansense-border-mid shadow-lg relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none rounded-xl" />
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <Navigation size={18} className="text-urbansense-accent" /> Calculer un itinéraire
      </h3>
      <form onSubmit={handleSearch} className="space-y-3 relative z-20">
        <div className="relative group">
          <div className="absolute left-3 top-3 z-10 w-2 h-2 rounded-full bg-white border border-urbansense-surface-1 shadow-sm group-focus-within:bg-urbansense-accent transition-colors"></div>
          <div className="absolute left-[15px] top-5 bottom-[-15px] w-0.5 bg-white/10 z-0"></div>
          <AddressAutocomplete value={startAddress} onChange={setStartAddress} onSelect={setStartLoc} placeholder="Départ (Ma position)" className="pl-8" />
        </div>
        <div className="relative group">
           <div className="absolute left-3 top-3 z-10 w-2 h-2 rounded-full bg-urbansense-accent border border-urbansense-surface-1 shadow-sm"></div>
           <AddressAutocomplete value={endAddress} onChange={setEndAddress} onSelect={setEndLoc} placeholder="Destination" className="pl-8" />
        </div>
        
        {/* Toggle Vélo - Caché si < 10 ans */}
        {user && user.age >= 10 && (
            <div className="flex items-center gap-2 mt-2 cursor-pointer group select-none" onClick={() => setIncludeBikes(!includeBikes)}>
                <div className={clsx("w-5 h-5 rounded border border-urbansense-border-light flex items-center justify-center transition-colors", includeBikes ? "bg-urbansense-accent border-urbansense-accent" : "bg-urbansense-surface-0")}>
                    {includeBikes && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span className="text-xs text-urbansense-secondary group-hover:text-white transition-colors flex items-center gap-1">
                    Inclure Ti'Vélo <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] border border-white/5 flex items-center gap-1 text-zinc-400"><CreditCard size={10} /> CB requise</span>
                </span>
            </div>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2 rounded-lg flex items-center gap-2 animate-fade-in"><AlertCircle size={14} /> {error}</div>}
        <button type="submit" disabled={!endLoc || loading} className="btn btn-primary w-full mt-2">{loading ? 'Calcul en cours...' : 'Rechercher'}</button>
      </form>
      {itinerary && (
        <div className="mt-6 animate-fade-in relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10 sticky top-0 bg-urbansense-surface-1 z-20">
            <div>
              <div className="text-3xl font-bold text-white tracking-tight">{itinerary.duration}</div>
              <div className="text-xs text-urbansense-secondary font-medium">Arrivée estimée à <span className="text-white">{itinerary.arrivalTime}</span></div>
            </div>
            <div className="text-right"><span className="badge bg-green-500/10 text-green-400 border-green-500/20 shadow-sm shadow-green-500/5">Optimal</span></div>
          </div>
          <div className="space-y-0 relative">
            {itinerary.steps.map((step: any, i: number) => (
              <div key={i} className="flex gap-4 pb-8 last:pb-0 relative group">
                {i !== itinerary.steps.length - 1 && <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-white/10 group-hover:bg-white/20 transition-colors" />}
                <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${step.type === 'walk' ? 'bg-urbansense-surface-0 border-urbansense-border-dim text-urbansense-tertiary' : (step.type === 'bike' ? 'bg-orange-500 text-white border-orange-500' : 'bg-urbansense-accent text-white border-urbansense-accent')}`}>
                  {step.type === 'walk' ? <div className="flex flex-col items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-current opacity-60" /><div className="w-1 h-1 rounded-full bg-current" /><div className="w-1 h-1 rounded-full bg-current opacity-60" /></div> : (step.type === 'bike' ? <Bike size={18} /> : <Bus size={18} />)}
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-bold text-zinc-100 text-sm">{step.instruction}</div>
                  <div className="text-xs text-urbansense-secondary mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-zinc-300"><Clock size={12} className="text-urbansense-accent" /> {step.duration}</span>
                    {step.type === 'bike' && step.bikesAvailable !== undefined && <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-2 py-1 rounded font-bold"><Bike size={12} /> {step.bikesAvailable} disp.</span>}
                    {step.waitTime && <span className={clsx("flex items-center gap-1.5 px-2 py-1 rounded font-bold", step.isReal ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-500")}><Clock size={12} /> {step.waitTime} {step.isReal && <span className="text-[8px] uppercase tracking-tighter opacity-70 ml-1">GTFS</span>}</span>}
                    <span className="text-zinc-500">{step.distance}</span>
                    {step.line && <span className="px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm flex items-center gap-1" style={{ backgroundColor: step.line.color }}><Bus size={10} /> {step.line.short_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItinerarySearch;