/* Platform and tunnel segment definitions. Segments carry all surface, hazard,
   pickup, and route information needed by collision and rendering. */
export const SURFACE_NAMES = ["floor", "right wall", "upper right", "ceiling", "upper left", "left wall"];

export class Segment {
  constructor({ z, length, surfaces, theme, branch = false }) {
    this.z = z;
    this.length = length;
    this.surfaces = surfaces;
    this.theme = theme;
    this.branch = branch;
    this.age = 0;
  }

  contains(forward) {
    return forward >= this.z && forward <= this.z + this.length;
  }
}

export function makeSurface() {
  return {
    lanes: [-1, 0, 1],
    missing: [],
    glass: [],
    broken: [],
    boost: [],
    moving: [],
    falling: [],
    rotating: false,
    lowCeiling: false,
    gravitySwitch: 0,
    obstacles: [],
    powerups: [],
    crystals: [],
  };
}

export function laneExists(surface, lane) {
  const nearest = Math.round(lane);
  return surface.lanes.includes(nearest) && !surface.missing.includes(nearest);
}

export function surfaceColor(theme, type) {
  const map = {
    candy: { base: "#ffb7d5", glass: "#b9f3ff", edge: "#fff7b8" },
    aurora: { base: "#a8f0d1", glass: "#d8c8ff", edge: "#fff8fb" },
    nebula: { base: "#9ec8ff", glass: "#ffc7e0", edge: "#c9b6ff" },
    moon: { base: "#eee9ff", glass: "#b8f4ff", edge: "#ffd8eb" },
  };
  return (map[theme] || map.candy)[type];
}
