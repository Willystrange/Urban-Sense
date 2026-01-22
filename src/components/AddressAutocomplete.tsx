import { useState, useEffect, useRef } from 'react';
import { services } from '@tomtom-international/web-sdk-services';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (location: { lat: number, lon: number, address: string }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete = ({ value, onChange, onSelect, placeholder = "Rechercher une adresse...", className }: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 3 && showSuggestions) {
        setLoading(true);
        try {
          if (!import.meta.env.VITE_TOMTOM_API_KEY) {
             console.warn("API Key TomTom manquante");
             setSuggestions([]);
             return;
          }
          
          const response = await services.fuzzySearch({
            key: import.meta.env.VITE_TOMTOM_API_KEY,
            query: value,
            language: 'fr-FR',
            countrySet: 'FR',
            limit: 5
          });
          setSuggestions(response.results || []);
        } catch (error) {
          console.error("Erreur TomTom Search:", error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  const handleSelect = (result: any) => {
    const address = result.address.freeformAddress;
    onChange(address);
    setShowSuggestions(false);
    
    if (onSelect) {
        onSelect({
            lat: result.position.lat,
            lon: result.position.lng,
            address: address
        });
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
        <input 
          type="text" 
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          className={clsx("input-field pl-10", className)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-3 text-urbansense-accent animate-spin">
            <Loader2 size={18} />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-urbansense-surface-0 rounded-xl shadow-xl border border-urbansense-border-mid overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-urbansense-surface-1 flex items-start gap-3 transition-colors border-b border-white/5 last:border-0 group"
            >
              <div className="mt-1 min-w-[16px]">
                <MapPin size={16} className="text-zinc-500 group-hover:text-urbansense-accent transition-colors" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">
                  {suggestion.address.streetNumber} {suggestion.address.streetName}
                </div>
                <div className="text-xs text-urbansense-secondary">
                  {suggestion.address.municipality}, {suggestion.address.postalCode}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
