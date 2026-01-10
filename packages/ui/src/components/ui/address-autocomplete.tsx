import * as React from "react";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AddressSuggestion {
  id: string;
  formatted_address: string;
  place_id: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface AddressAutocompleteProps {
  onAddressSelect?: (address: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  apiKey?: string;
  country?: string;
  types?: string[];
}

// Mock address data - in real app, this would use Google Places API
const mockAddresses: AddressSuggestion[] = [
  {
    id: "1",
    formatted_address: "123 Main St, New York, NY 10001, USA",
    place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
    types: ["street_address"],
    geometry: {
      location: { lat: 40.758, lng: -73.9855 },
    },
  },
  {
    id: "2",
    formatted_address: "456 Broadway, New York, NY 10013, USA",
    place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcB",
    types: ["street_address"],
    geometry: {
      location: { lat: 40.7614, lng: -73.9776 },
    },
  },
  {
    id: "3",
    formatted_address: "789 5th Ave, New York, NY 10022, USA",
    place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcC",
    types: ["street_address"],
    geometry: {
      location: { lat: 40.7505, lng: -73.9934 },
    },
  },
  {
    id: "4",
    formatted_address: "Times Square, New York, NY, USA",
    place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcD",
    types: ["establishment", "point_of_interest"],
    geometry: {
      location: { lat: 40.758, lng: -73.9855 },
    },
  },
  {
    id: "5",
    formatted_address: "Central Park, New York, NY, USA",
    place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcE",
    types: ["park", "establishment"],
    geometry: {
      location: { lat: 40.7829, lng: -73.9654 },
    },
  },
];

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Enter an address...",
  className,
  apiKey,
  country = "us",
  types = ["address"],
}: AddressAutocompleteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAddress, setSelectedAddress] = React.useState<AddressSuggestion | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<AddressSuggestion[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter mock addresses based on query
    const filtered = mockAddresses.filter(address =>
      address.formatted_address.toLowerCase().includes(query.toLowerCase())
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

  const handleAddressSelect = (address: AddressSuggestion) => {
    setSelectedAddress(address);
    setSearchQuery(address.formatted_address);
    setSearchResults([]);
    onAddressSelect?.(address);
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getTypeColor = (types: string[]) => {
    if (types.includes("street_address")) return "bg-blue-100 text-blue-800";
    if (types.includes("establishment")) return "bg-green-100 text-green-800";
    if (types.includes("park")) return "bg-emerald-100 text-emerald-800";
    return "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (types: string[]) => {
    if (types.includes("street_address")) return "Address";
    if (types.includes("establishment")) return "Business";
    if (types.includes("park")) return "Park";
    return "Location";
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
        {selectedAddress && (
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
              {searchResults.map(address => (
                <div
                  key={address.id}
                  className="hover:bg-accent flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0"
                  onClick={() => handleAddressSelect(address)}
                >
                  <MapPin className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{address.formatted_address}</p>
                      <Badge variant="secondary" className={cn("text-xs", getTypeColor(address.types))}>
                        {getTypeLabel(address.types)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {address.geometry.location.lat.toFixed(4)}, {address.geometry.location.lng.toFixed(4)}
                    </p>
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
              <span className="text-sm">Searching addresses...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAddress && (
        <div className="bg-accent mt-2 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary h-4 w-4" />
            <div>
              <p className="font-medium">{selectedAddress.formatted_address}</p>
              <p className="text-muted-foreground text-sm">
                {selectedAddress.geometry.location.lat.toFixed(4)}, {selectedAddress.geometry.location.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
