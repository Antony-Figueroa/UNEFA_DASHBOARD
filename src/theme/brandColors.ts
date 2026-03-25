export type BrandColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'teal' | 'indigo';

export interface BrandColorPalette {
  key: BrandColorKey;
  name: string;
  primary: string;
  palette: {
    25: string;
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export const BRAND_COLORS: BrandColorPalette[] = [
  {
    key: 'blue',
    name: 'Azul UNEFA',
    primary: '#1510a0',
    palette: {
      25: '#f7f6ff',
      50: '#ebe9ff',
      100: '#d6d4ff',
      200: '#acadff',
      300: '#6e67ff',
      400: '#4036ff',
      500: '#1a15acff', // Color solicitado
      600: '#0e0a86ff',
      700: '#090663ff',
      800: '#070550ff',
      900: '#090745ff',
      950: '#06052eff',
    }
  },
  {
    key: 'green',
    name: 'Verde',
    primary: '#059669',
    palette: {
      25: '#f0fdf4',
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    }
  },
  {
    key: 'purple',
    name: 'Morado',
    primary: '#7c3aed',
    palette: {
      25: '#faf5ff',
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    }
  },
  {
    key: 'orange',
    name: 'Naranja',
    primary: '#ea580c',
    palette: {
      25: '#fffaf5',
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    }
  },
  {
    key: 'red',
    name: 'Rojo',
    primary: '#dc2626',
    palette: {
      25: '#fef2f2',
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    }
  },
  {
    key: 'pink',
    name: 'Rosa',
    primary: '#db2777',
    palette: {
      25: '#fdf2f8',
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724',
    }
  },
  {
    key: 'teal',
    name: 'Teal',
    primary: '#0d9488',
    palette: {
      25: '#f0fdfa',
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    }
  },
  {
    key: 'indigo',
    name: 'Indigo',
    primary: '#4f46e5',
    palette: {
      25: '#f5f3ff',
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    }
  },
];

export const getBrandColorPalette = (key: BrandColorKey): BrandColorPalette => {
  return BRAND_COLORS.find(c => c.key === key) || BRAND_COLORS[0];
};

export const isValidBrandColor = (color: string): color is BrandColorKey => {
  return BRAND_COLORS.some(c => c.key === color);
};

export const applyBrandColor = (key: BrandColorKey): void => {
  const palette = getBrandColorPalette(key);
  const root = document.documentElement;
  
  Object.entries(palette.palette).forEach(([shade, color]) => {
    root.style.setProperty(`--color-brand-${shade}`, color);
  });
};
