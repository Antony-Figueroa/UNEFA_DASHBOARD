import palette from "../palette.json";

describe("Color Palette Integrity", () => {
  it("should have primary brand colors defined", () => {
    expect(palette.brand).toBeDefined();
    expect(palette.brand["500"]).toBe("#007fff");
  });

  it("should have functional colors (success, error, warning) defined", () => {
    expect(palette.success).toBeDefined();
    expect(palette.error).toBeDefined();
    expect(palette.warning).toBeDefined();
  });

  it("should have a complete gray scale for text and borders", () => {
    expect(palette.gray).toBeDefined();
    expect(palette.gray["800"]).toBeDefined(); // Primary text
    expect(palette.gray["500"]).toBeDefined(); // Secondary text
    expect(palette.gray["300"]).toBeDefined(); // Border medium
  });

  it("should follow the hierarchical structure", () => {
    const categories = Object.keys(palette);
    categories.forEach((category) => {
      const shades = Object.keys(palette[category as keyof typeof palette]);
      expect(shades.length).toBeGreaterThan(0);
    });
  });
});
