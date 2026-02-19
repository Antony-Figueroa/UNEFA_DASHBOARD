import { describe, it, expect } from 'vitest';
import {
  BRAND_COLORS,
  getBrandColorPalette,
  isValidBrandColor,
  applyBrandColor,
  type BrandColorKey
} from '../brandColors';

describe('brandColors', () => {
  describe('BRAND_COLORS', () => {
    it('should have 8 predefined colors', () => {
      expect(BRAND_COLORS).toHaveLength(8);
    });

    it('should include blue as default UNEFA color', () => {
      const blueColor = BRAND_COLORS.find(c => c.key === 'blue');
      expect(blueColor).toBeDefined();
      expect(blueColor?.name).toBe('Azul UNEFA');
      expect(blueColor?.primary).toBe('#054f94');
    });

    it('each color should have complete palette from 25 to 950', () => {
      BRAND_COLORS.forEach(color => {
        expect(color.palette[25]).toBeDefined();
        expect(color.palette[50]).toBeDefined();
        expect(color.palette[100]).toBeDefined();
        expect(color.palette[200]).toBeDefined();
        expect(color.palette[300]).toBeDefined();
        expect(color.palette[400]).toBeDefined();
        expect(color.palette[500]).toBeDefined();
        expect(color.palette[600]).toBeDefined();
        expect(color.palette[700]).toBeDefined();
        expect(color.palette[800]).toBeDefined();
        expect(color.palette[900]).toBeDefined();
        expect(color.palette[950]).toBeDefined();
      });
    });
  });

  describe('getBrandColorPalette', () => {
    it('should return correct palette for valid key', () => {
      const greenPalette = getBrandColorPalette('green');
      expect(greenPalette.key).toBe('green');
      expect(greenPalette.name).toBe('Verde');
    });

    it('should return blue palette for invalid key', () => {
      const defaultPalette = getBrandColorPalette('invalid' as BrandColorKey);
      expect(defaultPalette.key).toBe('blue');
    });
  });

  describe('isValidBrandColor', () => {
    it('should return true for valid color keys', () => {
      expect(isValidBrandColor('blue')).toBe(true);
      expect(isValidBrandColor('green')).toBe(true);
      expect(isValidBrandColor('purple')).toBe(true);
      expect(isValidBrandColor('orange')).toBe(true);
      expect(isValidBrandColor('red')).toBe(true);
      expect(isValidBrandColor('pink')).toBe(true);
      expect(isValidBrandColor('teal')).toBe(true);
      expect(isValidBrandColor('indigo')).toBe(true);
    });

    it('should return false for invalid color keys', () => {
      expect(isValidBrandColor('yellow')).toBe(false);
      expect(isValidBrandColor('cyan')).toBe(false);
      expect(isValidBrandColor('')).toBe(false);
      expect(isValidBrandColor('BLUE')).toBe(false);
    });
  });

  describe('applyBrandColor', () => {
    it('should set CSS custom properties on document root', () => {
      applyBrandColor('green');
      
      const root = document.documentElement;
      const brand500 = root.style.getPropertyValue('--color-brand-500');
      
      expect(brand500).toBeTruthy();
    });
  });
});
