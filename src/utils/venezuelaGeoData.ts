import venezuelaData from './venezuela.json';

export interface Municipality {
  municipio: string;
  capital: string;
  parroquias: string[];
}

export interface State {
  iso_31662: string;
  estado: string;
  capital: string;
  id_estado: number;
  municipios: Municipality[];
  ciudades: string[];
}

export const VENEZUELA_GEOGRAPHIC_DATA: State[] = venezuelaData as State[];

export const getStates = (enabledStates?: string[]): string[] => {
  const states = VENEZUELA_GEOGRAPHIC_DATA.map(s => s.estado).sort();
  if (enabledStates && enabledStates.length > 0) {
    return states.filter(state => enabledStates.includes(state));
  }
  return states;
};

export const getAllStates = (): string[] => {
  return VENEZUELA_GEOGRAPHIC_DATA.map(s => s.estado).sort();
};

export const getMunicipalitiesByState = (stateName: string): string[] => {
  const state = VENEZUELA_GEOGRAPHIC_DATA.find(s => s.estado === stateName);
  return state ? state.municipios.map(m => m.municipio).sort() : [];
};

export const getCitiesByStateAndMunicipality = (stateName: string, municipalityName: string): string[] => {
  const state = VENEZUELA_GEOGRAPHIC_DATA.find(s => s.estado === stateName);
  if (!state) return [];
  
  const municipality = state.municipios.find(m => m.municipio === municipalityName);
  if (!municipality) return [];
  
  const capitalCity = municipality.capital;
  const otherCities = state.ciudades.filter(c => c !== capitalCity);
  
  return [capitalCity, ...otherCities].filter(Boolean);
};

export const getParishesByStateAndMunicipality = (stateName: string, municipalityName: string): string[] => {
  const state = VENEZUELA_GEOGRAPHIC_DATA.find(s => s.estado === stateName);
  if (!state) return [];
  
  const municipality = state.municipios.find(m => m.municipio === municipalityName);
  return municipality ? municipality.parroquias.sort() : [];
};

export const getPostalCodeByStateCity = (stateName: string, cityName: string): string => {
  const postalCodes: Record<string, Record<string, string>> = {
    "Amazonas": { "Puerto Ayacucho": "7100", "Maroa": "7131", "San Fernando de Atabapo": "7111" },
    "Anzoátegui": { "Barcelona": "6001", "Puerto La Cruz": "6023", "Anaco": "6003", "El Tigre": "6051", "Cantaura": "6041", "Clarines": "6017" },
    "Apure": { "San Fernando de Apure": "7000", "Guasdualito": "7007", "Achaguas": "7001", "Biruaca": "7003" },
    "Aragua": { "Maracay": "2103", "Cagua": "2122", "La Victoria": "2121", "El Limón": "2105", "Villa de Cura": "2115" },
    "Barinas": { "Barinas": "5201", "Barinitas": "5207", "Sabaneta": "5233", "Santa Bárbara": "5215" },
    "Bolívar": { "Ciudad Bolívar": "8001", "Puerto Ordaz": "8015", "Ciudad Guayana": "8001", "El Dorado": "8035", "Santa Elena de Uairen": "7102" },
    "Carabobo": { "Valencia": "2001", "Puerto Cabello": "2050", "Naguanagua": "2005", "Guacara": "2050", "Los Guayos": "2030" },
    "Cojedes": { "San Carlos": "2201", "Tinaco": "2261", "Tinaquillo": "2221", "El Baúl": "2211" },
    "Delta Amacuro": { "Tucupita": "7400", "Curiapo": "7401", "Pedernales": "7421" },
    "Falcón": { "Coro": "4101", "Punto Fijo": "4102", "La Vela de Coro": "4131", "Chichiriviche": "4121", "Tucacas": "4215" },
    "Guárico": { "San Juan de los Morros": "2301", "Calabozo": "2311", "Valle de la Pascua": "2321", "Zaraza": "2371" },
    "Lara": { "Barquisimeto": "3001", "Carora": "3015", "El Tocuyo": "3065", "Cabudare": "3023", "Quíbor": "3035" },
    "Mérida": { "Mérida": "5101", "El Vigía": "5105", "Tovar": "5195", "Santa Cruz de Mora": "5121", "La Azulita": "5103" },
    "Miranda": { "Los Teques": "1201", "Caracas": "1010", "Guarenas": "1261", "Guatire": "2150", "Ocumare del Tuy": "1245" },
    "Monagas": { "Maturín": "6201", "Caripito": "6215", "Punta de Mata": "6205", "Aguasay": "6205" },
    "Nueva Esparta": { "Porlamar": "6301", "Pampatar": "6302", "La Asunción": "6301", "Juan Griego": "6301", "El Valle": "6303" },
    "Portuguesa": { "Guanare": "3350", "Acarigua": "3302", "Araure": "3303", "Ospino": "3381" },
    "Sucre": { "Cumaná": "6101", "Carúpano": "6130", "Cariaco": "6125", "Río Caribe": "6175", "Irapa": "6151" },
    "Táchira": { "San Cristóbal": "5001", "Colón": "5007", "Rubio": "5089", "La Grita": "5101", "Ureña": "5163" },
    "Trujillo": { "Trujillo": "3101", "Valera": "3105", "Boconó": "3325", "Carache": "3101", "Escuque": "5131" },
    "Vargas": { "La Guaira": "1160", "Maiquetía": "1162", "Caraballeda": "1161", "Catia La Mar": "1160" },
    "Yaracuy": { "San Felipe": "3201", "Chivacoa": "3207", "Yaritagua": "3203", "Nirgua": "3231", "Aroa": "3211" },
    "Zulia": { "Maracaibo": "4001", "Cabimas": "4011", "Ciudad Ojeda": "4013", "Machiques": "4041", "Los Puertos de Altagracia": "4035" },
    "Distrito Capital": { "Caracas": "1010" }
  };
  
  const stateCities = postalCodes[stateName];
  if (!stateCities) return "";
  
  return stateCities[cityName] || "";
};
