import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface Country {
  code: string;
  name: string;
  flag: string;
  phone: string;
}

const countries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", phone: "+1" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phone: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phone: "+44" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phone: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", phone: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", phone: "+33" },
  { code: "IT", name: "Italy", flag: "🇮🇹", phone: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", phone: "+34" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phone: "+31" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", phone: "+32" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", phone: "+41" },
  { code: "AT", name: "Austria", flag: "🇦🇹", phone: "+43" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phone: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", phone: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phone: "+45" },
  { code: "FI", name: "Finland", flag: "🇫🇮", phone: "+358" },
  { code: "PL", name: "Poland", flag: "🇵🇱", phone: "+48" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", phone: "+420" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", phone: "+36" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phone: "+351" },
  { code: "GR", name: "Greece", flag: "🇬🇷", phone: "+30" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", phone: "+353" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", phone: "+352" },
  { code: "MT", name: "Malta", flag: "🇲🇹", phone: "+356" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", phone: "+357" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", phone: "+372" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", phone: "+371" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", phone: "+370" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", phone: "+386" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", phone: "+421" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", phone: "+385" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", phone: "+359" },
  { code: "RO", name: "Romania", flag: "🇷🇴", phone: "+40" },
  { code: "JP", name: "Japan", flag: "🇯🇵", phone: "+81" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", phone: "+82" },
  { code: "CN", name: "China", flag: "🇨🇳", phone: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", phone: "+91" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", phone: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", phone: "+52" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phone: "+54" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phone: "+56" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phone: "+57" },
  { code: "PE", name: "Peru", flag: "🇵🇪", phone: "+51" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phone: "+58" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", phone: "+27" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", phone: "+20" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", phone: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", phone: "+254" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", phone: "+212" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", phone: "+216" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", phone: "+213" },
  { code: "LY", name: "Libya", flag: "🇱🇾", phone: "+218" },
  { code: "SD", name: "Sudan", flag: "🇸🇩", phone: "+249" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", phone: "+251" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", phone: "+233" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", phone: "+256" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", phone: "+255" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", phone: "+250" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", phone: "+257" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", phone: "+253" },
  { code: "SO", name: "Somalia", flag: "🇸🇴", phone: "+252" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷", phone: "+291" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸", phone: "+211" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫", phone: "+236" },
  { code: "TD", name: "Chad", flag: "🇹🇩", phone: "+235" },
  { code: "NE", name: "Niger", flag: "🇳🇪", phone: "+227" },
  { code: "ML", name: "Mali", flag: "🇲🇱", phone: "+223" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", phone: "+226" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", phone: "+225" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", phone: "+231" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", phone: "+232" },
  { code: "GN", name: "Guinea", flag: "🇬🇳", phone: "+224" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", phone: "+245" },
  { code: "GM", name: "Gambia", flag: "🇬🇲", phone: "+220" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", phone: "+221" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷", phone: "+222" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻", phone: "+238" },
  { code: "ST", name: "São Tomé and Príncipe", flag: "🇸🇹", phone: "+239" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", phone: "+240" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", phone: "+241" },
  { code: "CG", name: "Republic of the Congo", flag: "🇨🇬", phone: "+242" },
  {
    code: "CD",
    name: "Democratic Republic of the Congo",
    flag: "🇨🇩",
    phone: "+243",
  },
  { code: "AO", name: "Angola", flag: "🇦🇴", phone: "+244" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", phone: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", phone: "+263" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", phone: "+267" },
  { code: "NA", name: "Namibia", flag: "🇳🇦", phone: "+264" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", phone: "+268" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", phone: "+266" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", phone: "+261" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", phone: "+230" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", phone: "+248" },
  { code: "KM", name: "Comoros", flag: "🇰🇲", phone: "+269" },
  { code: "YT", name: "Mayotte", flag: "🇾🇹", phone: "+262" },
  { code: "RE", name: "Réunion", flag: "🇷🇪", phone: "+262" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", phone: "+258" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", phone: "+265" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", phone: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", phone: "+263" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", phone: "+267" },
  { code: "NA", name: "Namibia", flag: "🇳🇦", phone: "+264" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", phone: "+268" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", phone: "+266" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", phone: "+261" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", phone: "+230" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", phone: "+248" },
  { code: "KM", name: "Comoros", flag: "🇰🇲", phone: "+269" },
  { code: "YT", name: "Mayotte", flag: "🇾🇹", phone: "+262" },
  { code: "RE", name: "Réunion", flag: "🇷🇪", phone: "+262" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", phone: "+258" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", phone: "+265" },
];

export interface CountryDropdownProps {
  value?: Country;
  onValueChange?: (country: Country) => void;
  placeholder?: string;
  className?: string;
}

export function CountryDropdown({
  value,
  onValueChange,
  placeholder = "Select country...",
  className,
}: CountryDropdownProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <span>{value.flag}</span>
              <span>{value.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map(country => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onValueChange?.(country);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value?.code === country.code ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-muted-foreground">{country.phone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
