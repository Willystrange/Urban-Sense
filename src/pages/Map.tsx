import { useState, useEffect, useRef } from 'react';
import { MapPin, Layers, Navigation, Loader2, AlertOctagon, Bus } from 'lucide-react';
import ItinerarySearch from '../components/ItinerarySearch';

interface Location {
    lat: number;
    lon: number;
    address: string;
}

interface RouteGeometry {
    walk1: number[][]; 
    bus: number[][];
    bike: number[][];   
    walk2: number[][]; 
    start: Location;
    end: Location;
    lineColor: string;
}

const terminals = [
  { id: 1, name: 'Mairie de Plouédern', status: 'active', address: 'Place de la Mairie, Plouédern', lat: 48.4819, lon: -4.2455 },
  { id: 2, name: 'Gare de Landerneau', status: 'active', address: 'Place de la Gare, Landerneau', lat: 48.4526, lon: -4.2555 },
  { id: 3, name: 'Pont de Rohan', status: 'maintenance', address: 'Quai de Cornouaille, Landerneau', lat: 48.4505, lon: -4.2493 },
];

const MapView = () => {
  const [filter, setFilter] = useState('all');
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [transportData, setTransportData] = useState<{ stops: any[], routes: any[] } | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
  
  const trafficLayersRef = useRef<{ flow: any; incidents: any } | null>(null);
  const userMarkerRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);

  const filteredTerminals = terminals.filter(t => filter === 'all' || filter === 'transport' || t.status === filter);
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  // Charger les données de transport
  useEffect(() => {
    const loadData = async () => {
        try {
            const response = await fetch('/data/transport_data.json');
            const data = await response.json();
            setTransportData(data);
        } catch (e) {
            console.error("Erreur chargement transport:", e);
        } finally {
        }
    };
    loadData();
  }, []);

  // Initialisation Carte
  useEffect(() => {
    if (!apiKey) {
      setError("Clé API manquante. Redémarrez le serveur.");
      return;
    }
    if (mapInstance) return;

    const waitForTomTom = setInterval(() => {
      if ((window as any).tt) {
        clearInterval(waitForTomTom);
        initializeMap();
      }
    }, 100);

    const initializeMap = (center: [number, number] = [-4.2555, 48.4526]) => { 
      if (!mapContainer.current) return;
      
      const tt = (window as any).tt;

      try {
        const map = tt.map({
          key: apiKey,
          container: mapContainer.current,
          center: center,
          zoom: 13,
          style: 'https://api.tomtom.com/map/1/style/22.2.1-9/basic_night.json', 
          dragPan: true,
        });

        map.addControl(new tt.NavigationControl());
        
        const userEl = document.createElement('div');
        userEl.className = 'user-marker';
        userEl.innerHTML = '<div class="w-6 h-6 bg-urbansense-accent rounded-full border-2 border-white shadow-lg animate-pulse ring-4 ring-blue-500/30"></div>';
        
        const userMarker = new tt.Marker({ element: userEl }).setLngLat(center).addTo(map);
        userMarkerRef.current = userMarker;

        setMapInstance(map);
        setLoadingLocation(false);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const userPos = [pos.coords.longitude, pos.coords.latitude];
              map.flyTo({ center: userPos, zoom: 14 });
              userMarkerRef.current?.setLngLat(userPos);
            },
            () => console.warn("Loc refusée"),
            { timeout: 4000 }
          );
        }

      } catch (err) {
        console.error("Erreur init carte:", err);
        setError("Erreur chargement carte.");
        setLoadingLocation(false);
      }
    };

    return () => { 
        clearInterval(waitForTomTom);
        try { mapInstance?.remove(); } catch(e) { /* ignore */ }
    };
  }, [apiKey]);

  // Dessin de l'itinéraire sur la carte
  useEffect(() => {
      if (!mapInstance) return;

      const layerIds = ['route-walk-1', 'route-bike', 'route-bus', 'route-walk-2'];
      
      const cleanLayers = () => {
          layerIds.forEach(id => {
              if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
              if (mapInstance.getSource(id)) mapInstance.removeSource(id);
          });
      };

      if (!routeGeometry) {
          cleanLayers();
          return;
      }

      const draw = () => {
        try {
            cleanLayers(); 

            // 1. Marche Départ
            if (routeGeometry.walk1 && routeGeometry.walk1.length > 0) {
                mapInstance.addSource('route-walk-1', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeGeometry.walk1 }
                    }
                });
                mapInstance.addLayer({
                    id: 'route-walk-1', type: 'line', source: 'route-walk-1',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#94a3b8', 'line-width': 4, 'line-dasharray': [2, 2] }
                });
            }

            // 2. Vélo (NOUVEAU)
            if (routeGeometry.bike && routeGeometry.bike.length > 0) {
                mapInstance.addSource('route-bike', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeGeometry.bike }
                    }
                });
                mapInstance.addLayer({
                    id: 'route-bike', type: 'line', source: 'route-bike',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#f97316', 'line-width': 5 } // Orange
                });
            }

            // 3. Bus
            if (routeGeometry.bus && routeGeometry.bus.length > 0) {
                mapInstance.addSource('route-bus', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeGeometry.bus }
                    }
                });
                mapInstance.addLayer({
                    id: 'route-bus', type: 'line', source: 'route-bus',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': routeGeometry.lineColor, 'line-width': 6 }
                });
            }

            // 4. Marche Arrivée
            if (routeGeometry.walk2 && routeGeometry.walk2.length > 0) {
                mapInstance.addSource('route-walk-2', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeGeometry.walk2 }
                    }
                });
                mapInstance.addLayer({
                    id: 'route-walk-2', type: 'line', source: 'route-walk-2',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#94a3b8', 'line-width': 4, 'line-dasharray': [2, 2] }
                });
            }

            // Zoom
            const bounds = new (window as any).tt.LngLatBounds();
            bounds.extend([routeGeometry.start.lon, routeGeometry.start.lat]);
            bounds.extend([routeGeometry.end.lon, routeGeometry.end.lat]);
            mapInstance.fitBounds(bounds, { padding: 100 });
        } catch (e) {
            console.error("Erreur dessin itinéraire:", e);
        }
      };

      if (mapInstance.isStyleLoaded()) {
          draw();
      } else {
          mapInstance.once('style.load', draw);
      }

  }, [mapInstance, routeGeometry]);

  // Gestion Trafic (SECURISÉE)
  useEffect(() => {
    if (!mapInstance || !apiKey) return;

    const updateTraffic = () => {
      const tt = (window as any).tt;
      try {
        if (!tt.TrafficFlowTilesTier || !tt.TrafficIncidentTier) {
            console.warn("Modules trafic TomTom non disponibles");
            return;
        }

        if (!trafficLayersRef.current) {
           const config = {
              key: apiKey,
              incidentDetails: { style: 's3' },
              trafficFlow: { style: 'relative', refresh: 30000 }
           };
           const flow = new tt.TrafficFlowTilesTier(config);
           const incidents = new tt.TrafficIncidentTier(config);
           trafficLayersRef.current = { flow, incidents };
        }

        const { flow, incidents } = trafficLayersRef.current;
        if (trafficEnabled) {
          try { mapInstance.addTier(flow); } catch(e) { /* ignore */ }
          try { mapInstance.addTier(incidents); } catch(e) { /* ignore */ }
        } else {
          try { mapInstance.removeTier(flow.getId()); } catch(e) { /* ignore */ }
          try { mapInstance.removeTier(incidents.getId()); } catch(e) { /* ignore */ }
        }
      } catch (e) {
        console.warn("Erreur toggle trafic (non critique):", e);
      }
    };

    if (mapInstance.isStyleLoaded()) updateTraffic();
    else mapInstance.once('style.load', updateTraffic);

  }, [mapInstance, trafficEnabled, apiKey]);

  // Gestion Markers Bornes
  useEffect(() => {
    if (!mapInstance) return;
    const tt = (window as any).tt;

    document.querySelectorAll('.tt-terminal-marker').forEach(el => el.remove());

    filteredTerminals.forEach(terminal => {
      const el = document.createElement('div');
      el.className = 'tt-terminal-marker';
      
      let colorClass = 'bg-emerald-500';
      if (terminal.status === 'maintenance') colorClass = 'bg-amber-500';

      el.innerHTML = `
        <div class="relative group cursor-pointer z-20">
          <div class="w-8 h-8 ${colorClass} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transform transition-transform hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>
      `;

      const marker = new tt.Marker({ element: el })
        .setLngLat([terminal.lon, terminal.lat])
        .addTo(mapInstance);
      
      const popup = new tt.Popup({ offset: 30, className: 'custom-popup' }).setHTML(`
        <div class="p-2 text-slate-800">
          <strong class="block text-sm font-bold mb-1">${terminal.name}</strong>
          <span class="text-xs text-slate-500">${terminal.address}</span>
        </div>
      `);
      
      marker.setPopup(popup);
    });

  }, [mapInstance, filter, filteredTerminals]);

  // Gestion Markers Arrêts de Bus
  useEffect(() => {
    if (!mapInstance || !transportData) return;
    const tt = (window as any).tt;

    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    if (filter === 'transport') {
        const center = mapInstance.getCenter();
        const nearbyStops = transportData.stops.filter(s => {
            return Math.abs(s.lat - center.lat) < 0.05 && Math.abs(s.lon - center.lng) < 0.05;
        }).slice(0, 100); 

        nearbyStops.forEach((stop: any) => {
            const el = document.createElement('div');
            el.className = 'tt-bus-marker';
            el.innerHTML = `
                <div class="w-3 h-3 bg-white rounded-full border border-slate-900 shadow-sm flex items-center justify-center text-slate-900 opacity-60 hover:opacity-100 hover:scale-150 transition-all cursor-pointer"></div>
            `;
            
            const marker = new tt.Marker({ element: el })
                .setLngLat([stop.lon, stop.lat])
                .addTo(mapInstance);

            const popup = new tt.Popup({ offset: 10, closeButton: false }).setHTML(`
                <div class="px-2 py-1 text-slate-800 text-xs font-bold whitespace-nowrap">
                   🚏 ${stop.name}
                </div>
            `);
            
            el.addEventListener('mouseenter', () => marker.togglePopup());
            el.addEventListener('mouseleave', () => marker.togglePopup());
            marker.setPopup(popup);

            stopMarkersRef.current.push(marker);
        });
    }

  }, [mapInstance, filter, transportData]);

  if (error) {
    return (
      <main className="pt-24 px-4 max-w-7xl mx-auto flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <AlertOctagon className="w-16 h-16 text-urbansense-error mx-auto" />
          <h2 className="text-xl font-bold text-white">Problème de carte</h2>
          <p className="text-urbansense-secondary">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto h-[calc(100vh-20px)] flex flex-col">
      <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Carte Interactive</h1>
          <p className="text-urbansense-secondary">Localisez les bornes et planifiez vos trajets en Bretagne.</p>
        </div>
        
        <div className="flex items-center gap-1 bg-urbansense-surface-1 p-1 rounded-xl border border-white/5 shadow-lg overflow-x-auto max-w-full">
           {[
             { id: 'all', label: 'Bornes', icon: MapPin },
             { id: 'transport', label: 'Transports', icon: Bus },
             { id: 'maintenance', label: 'Maintenance', icon: AlertOctagon },
           ].map((f) => (
             <button 
               key={f.id}
               onClick={() => setFilter(f.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                 filter === f.id 
                  ? 'bg-urbansense-accent text-white'
                  : 'text-urbansense-secondary hover:text-white hover:bg-white/5'
               }`}
             >
               <f.icon size={16} />
               <span className="hidden sm:inline">{f.label}</span>
             </button>
           ))}
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-urbansense-surface-1 p-1 rounded-lg mb-4 border border-white/5">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileTab === 'map' ? 'bg-urbansense-surface-2 text-white shadow-sm' : 'text-urbansense-secondary'
          }`}
        >
          Carte
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileTab === 'list' ? 'bg-urbansense-surface-2 text-white shadow-sm' : 'text-urbansense-secondary'
          }`}
        >
          Liste
        </button>
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-3 gap-6 overflow-hidden min-h-[500px] relative">
        {/* Sidebar Liste / Recherche */}
        <div className={`lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full ${mobileTab === 'list' ? 'block absolute inset-0 z-20 bg-urbansense-background lg:relative lg:bg-transparent lg:z-auto' : 'hidden lg:block'}`}>
          {filter === 'transport' && (
             <ItinerarySearch 
                routes={transportData?.routes || []} 
                stops={transportData?.stops || []}
                onRouteCalculated={(route) => {
                    setRouteGeometry(route as any);
                    setMobileTab('map'); // Switch to map on mobile when route is found
                }}
             />
          )}

          <div className="space-y-3">
             <h3 className="font-bold text-white text-sm uppercase tracking-wider opacity-60 px-1">
               {filter === 'transport' ? 'Arrêts à proximité' : 'Bornes UrbanSense'}
             </h3>
             
             {filter !== 'transport' ? (
                filteredTerminals.map((terminal) => (
                    <div 
                    key={terminal.id} 
                    className="card hover:border-urbansense-accent cursor-pointer group transition-all flex items-start gap-4 p-4"
                    onClick={() => {
                        mapInstance?.flyTo({ center: [terminal.lon, terminal.lat], zoom: 16 });
                        setMobileTab('map'); // Switch to map on mobile
                    }}
                    >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        terminal.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        terminal.status === 'maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white group-hover:text-urbansense-accent transition-colors">{terminal.name}</h3>
                        <p className="text-xs text-urbansense-secondary">{terminal.address}</p>
                    </div>
                    </div>
                ))
             ) : (
                <div className="text-center p-8 border-2 border-dashed border-white/5 rounded-xl">
                    <p className="text-sm text-urbansense-secondary">Sélectionnez un point de départ et une arrivée pour voir les options de transport.</p>
                </div>
             )}
          </div>
        </div>

        {/* Carte */}
        <div className={`lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black h-full flex flex-col group ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
          {loadingLocation && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-urbansense-accent animate-spin mx-auto mb-2" />
                <p className="text-white font-medium">Localisation en cours...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapContainer} 
            className="flex-1 w-full" 
            style={{ height: '100%' }} 
          />
          
          {/* Contrôles Trafic */}
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-urbansense-surface-1/90 backdrop-blur-md shadow-xl rounded-xl border border-white/10 z-[1000] flex justify-between items-center transform translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 mobile-traffic-controls">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-urbansense-accent/10 rounded-lg text-urbansense-accent border border-urbansense-accent/20">
                <Layers size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Info Trafic TomTom™</h4>
                <p className="text-xs text-urbansense-secondary">
                  {trafficEnabled ? "Données en temps réel activées" : "Trafic masqué"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={trafficEnabled} onChange={(e) => setTrafficEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-urbansense-accent"></div>
            </label>
          </div>

          {/* Bouton Recentrer */}
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const userPos = [pos.coords.longitude, pos.coords.latitude];
                    mapInstance?.flyTo({ center: userPos, zoom: 15 });
                    userMarkerRef.current?.setLngLat(userPos);
                  });
              }
            }}
            className="absolute top-4 right-14 p-3 bg-urbansense-surface-1 border border-white/10 shadow-lg rounded-xl text-white hover:text-urbansense-accent hover:bg-urbansense-surface-2 z-[1000] transition-colors"
            title="Ma position"
          >
            <Navigation size={20} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default MapView;