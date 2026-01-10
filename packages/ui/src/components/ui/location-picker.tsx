import * as React from "react";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type?: "address" | "poi" | "city";
}

export interface LocationPickerProps {
  onLocationSelect?: (location: Location) => void;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
}

// Mock location data - in real app, this would come from a geocoding API
const mockLocations: Location[] = [
  {
    id: "1",
    name: "Times Square",
    address: "Times Square, New York, NY, USA",
    coordinates: { lat: 40.758, lng: -73.9855 },
    type: "poi",
  },
  {
    id: "2",
    name: "Central Park",
    address: "Central Park, New York, NY, USA",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    type: "poi",
  },
  {
    id: "3",
    name: "Empire State Building",
    address: "350 5th Ave, New York, NY 10118, USA",
    coordinates: { lat: 40.7484, lng: -73.9857 },
    type: "poi",
  },
  {
    id: "4",
    name: "Brooklyn Bridge",
    address: "Brooklyn Bridge, New York, NY, USA",
    coordinates: { lat: 40.7061, lng: -73.9969 },
    type: "poi",
  },
  {
    id: "5",
    name: "Statue of Liberty",
    address: "Liberty Island, New York, NY 10004, USA",
    coordinates: { lat: 40.6892, lng: -74.0445 },
    type: "poi",
  },
];

export function LocationPicker({
  onLocationSelect,
  placeholder = "Search for a location...",
  className,
  showMap = false,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Location[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter mock locations based on query
    const filtered = mockLocations.filter(
      location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
    setIsSearching(false);
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setSearchResults([]);
    onLocationSelect?.(location);
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getLocationTypeColor = (type?: string) => {
    switch (type) {
      case "poi":
        return "bg-blue-100 text-blue-800";
      case "address":
        return "bg-green-100 text-green-800";
      case "city":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-10 pl-10"
        />
        {selectedLocation && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchResults.length > 0 && (
        <Card className="absolute top-full z-50 mt-1 w-full">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map(location => (
                <div
                  key={location.id}
                  className="hover:bg-accent flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0"
                  onClick={() => handleLocationSelect(location)}
                >
                  <MapPin className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{location.name}</p>
                      {location.type && (
                        <Badge variant="secondary" className={cn("text-xs", getLocationTypeColor(location.type))}>
                          {location.type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">{location.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isSearching && (
        <Card className="absolute top-full z-50 mt-1 w-full">
          <CardContent className="p-3">
            <div className="text-muted-foreground flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Searching...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLocation && (
        <div className="bg-accent mt-2 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary h-4 w-4" />
            <div>
              <p className="font-medium">{selectedLocation.name}</p>
              <p className="text-muted-foreground text-sm">{selectedLocation.address}</p>
              <p className="text-muted-foreground text-xs">
                {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
