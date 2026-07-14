/* Frog Kingdom: an isometric, dependency-free civilization simulation for Gabi's Games. */
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const stage = document.querySelector(".kingdom-stage");
  const SAVE_KEY = "gabi_frog_kingdom_civilization_v2";
  const GRID_W = 30;
  const GRID_H = 24;
  const TILE_W = 72;
  const TILE_H = 36;
  const TAU = Math.PI * 2;
  let W = 1040;
  let H = 680;

  const ui = {
    start: document.getElementById("screen-start"),
    pause: document.getElementById("screen-pause"),
    victory: document.getElementById("screen-victory"),
    continueButton: document.getElementById("btn-continue"),
    name: document.getElementById("name-input"),
    buildList: document.getElementById("build-list"),
    buildTitle: document.getElementById("build-category-title"),
    buildCatalogTools: document.getElementById("build-catalog-tools"),
    buildEraFilter: document.getElementById("build-era-filter"),
    hint: document.getElementById("placement-hint"),
    toasts: document.getElementById("toast-stack"),
    chronicle: document.getElementById("chronicle-list"),
    eraNumber: document.getElementById("era-number"),
    eraName: document.getElementById("era-name"),
    eraDescription: document.getElementById("era-description"),
    eraMotto: document.getElementById("era-motto"),
    eraDetail: document.getElementById("era-detail"),
    eraHealthNote: document.getElementById("era-health-note"),
    eraProgress: document.getElementById("era-progress"),
    questTitle: document.getElementById("quest-title"),
    questDescription: document.getElementById("quest-description"),
    questReward: document.getElementById("quest-reward"),
    selectedLabel: document.getElementById("selected-label"),
    selectedTitle: document.getElementById("selected-title"),
    selectedDescription: document.getElementById("selected-description"),
    selectedAvatar: document.getElementById("selected-avatar"),
    frogVitals: document.getElementById("frog-vitals"),
    selectedStats: document.getElementById("selected-stats"),
    frogActions: document.getElementById("frog-actions"),
    jobAssignment: document.getElementById("job-assignment"),
    jobSelect: document.getElementById("job-select"),
    taskAssignment: document.getElementById("task-assignment"),
    taskSelect: document.getElementById("task-select"),
    buildingResidents: document.getElementById("building-residents"),
    buildingAssignment: document.getElementById("building-assignment"),
    buildingWorkerSelect: document.getElementById("building-worker-select"),
    buildingActions: document.getElementById("building-actions"),
    buildingTier: document.getElementById("building-tier"),
    specializationOptions: document.getElementById("specialization-options"),
    upgradeBuildingCost: document.getElementById("upgrade-building-cost"),
    eraResources: document.getElementById("era-resource-strip"),
    advanceEra: document.getElementById("advance-era-button"),
    advanceEraRequirement: document.getElementById("advance-era-requirement"),
    councilSummary: document.getElementById("council-summary"),
    governmentSummary: document.getElementById("government-summary"),
    councilModal: document.getElementById("civilization-modal"),
    councilModalTitle: document.getElementById("council-modal-title"),
    councilModalCopy: document.getElementById("council-modal-copy"),
    councilModalContent: document.getElementById("council-modal-content"),
    citizenRoster: document.getElementById("citizen-roster"),
    day: document.getElementById("world-day"),
    season: document.getElementById("world-season"),
    weather: document.getElementById("world-weather"),
    flies: document.getElementById("res-flies"),
    berries: document.getElementById("res-berries"),
    reeds: document.getElementById("res-reeds"),
    knowledge: document.getElementById("res-knowledge"),
    population: document.getElementById("res-population"),
    health: document.getElementById("res-health"),
    harmony: document.getElementById("res-harmony"),
    safety: document.getElementById("res-safety"),
    mute: document.getElementById("mute-button"),
    marshActions: document.getElementById("marsh-actions"),
  };

  const SEASONS = [
    { name: "Blossomtide", grass: "#9fd89f", grass2: "#86c991", flowers: "#ffb5d2", sky: "#dff5e7" },
    { name: "Sunshower", grass: "#8fd1a3", grass2: "#73bf94", flowers: "#ffe28f", sky: "#d8f2ef" },
    { name: "Firefly Summer", grass: "#86c78a", grass2: "#69b87f", flowers: "#d9c0ff", sky: "#d7ece0" },
    { name: "Moonleaf", grass: "#94bfa1", grass2: "#739e88", flowers: "#f5b9d4", sky: "#dde2f3" },
  ];
  const ERA_LANDSCAPES = [
    { grass: "#a8c887", grass2: "#85a96f", sky: "#e8f0d5" },
    { grass: "#a1d09a", grass2: "#7db67d", sky: "#def1dc" },
    { grass: "#94d2a9", grass2: "#70ba91", sky: "#daf3e5" },
    { grass: "#8fcbb7", grass2: "#6aa99b", sky: "#dcefeb" },
    { grass: "#9ebcc0", grass2: "#789ba3", sky: "#e5edf2" },
    { grass: "#a9cfc3", grass2: "#82ad9f", sky: "#edf2e5" },
    { grass: "#aabfc2", grass2: "#829ba2", sky: "#e5ecf0" },
    { grass: "#94ccd0", grass2: "#70acb4", sky: "#e0f2f5" },
    { grass: "#9fc7df", grass2: "#7aa4c7", sky: "#e8effa" },
    { grass: "#abb8e4", grass2: "#838fc5", sky: "#eeeafd" },
  ];

  const ERAS = [
    { name: "Forager Age", society: "Willow-Clan Wanderers", description: "Small family bands follow berry blooms, fish the shallows, and shelter beneath the Great Willow.", motto: "Every path begins with one ripple.", world: "Hide tents, story fires, and shell tools circle a sacred pond whose oldest routes are remembered in song.", healthNote: "Wild herbs help, but fever and injury remain dangerous.", architecture: "Willow & Hide", accent: "#8eb16d", diseasePressure: 0.7, resource: "lore", resourceName: "Oral Lore", icon: "🔥", requirement: { population: 5, lore: 12 } },
    { name: "Settled Shores", society: "Claybank Hamlets", description: "Clay homes, shared granaries, and permanent gardens form the first hamlets.", motto: "Shape the riverbank; shape tomorrow.", world: "Families press river clay into warm round cottages, mark seasons on pottery, and elect the first Mudbank Council.", healthNote: "Crowded wells bring Marsh Chills; herbalists are essential.", architecture: "River Clay", accent: "#d49a78", diseasePressure: 1.15, resource: "clay", resourceName: "River Clay", icon: "🏺", requirement: { population: 7, clay: 24, reeds: 45 } },
    { name: "Reedtown Age", society: "Bellflower Villages", description: "Schools, councils, storehouses, and specialist crafts unite a necklace of growing villages.", motto: "Many ponds, one bell.", world: "Painted beams and flower-tiled roofs surround common greens where teachers, healers, and artisans share their skills.", healthNote: "Clinics curb Spore Cough, though village outbreaks still travel quickly.", architecture: "Painted Timber", accent: "#ba8fd2", diseasePressure: 0.9, resource: "grain", resourceName: "Pond Grain", icon: "🌾", requirement: { population: 10, grain: 32, knowledge: 35 } },
    { name: "Ironlily Age", society: "Canal City-States", description: "Metal tools, mills, aqueducts, and defended canal towns reshape the wetlands.", motto: "Strong bridges, open gates.", world: "Stone quays and copper roofs rise over busy canals while rival city-states compete through games, craft, and engineering.", healthNote: "Aqueducts reduce water sickness, but forge smoke strains workers.", architecture: "Stone & Copper", accent: "#7f9fb4", diseasePressure: 1.0, resource: "iron", resourceName: "Bog Iron", icon: "⚒️", requirement: { population: 13, iron: 34, knowledge: 70 } },
    { name: "Moonpetal Realm", society: "Lantern-Crown Kingdom", description: "A castle, guilds, monasteries, and heraldic districts establish a true frog kingdom.", motto: "Beneath one moon, every lily blooms.", world: "Moonpetal Castle watches over guild boroughs, tournament ponds, royal barges, and candlelit archives.", healthNote: "Dense castle wards face Lily Pox; infirmaries decide whether outbreaks become plagues.", architecture: "Moonstone Gothic", accent: "#937db5", diseasePressure: 1.45, resource: "crowns", resourceName: "Petal Crowns", icon: "👑", requirement: { population: 16, crowns: 40, knowledge: 110, castle: 1 } },
    { name: "Scholar Renaissance", society: "Republic of Ponds", description: "Universities, printing, art, anatomy, and diplomacy connect Mossbell to neighboring realms.", motto: "Question kindly; build beautifully.", world: "Domed libraries, garden courts, theaters, and embassies make the capital a meeting place for ideas from every wetland.", healthNote: "Apothecaries understand contagion, sharply improving survival.", architecture: "Petal Renaissance", accent: "#dfa2ba", diseasePressure: 0.75, resource: "parchment", resourceName: "Lily Parchment", icon: "📜", requirement: { population: 19, parchment: 45, knowledge: 170 } },
    { name: "Steamfen Revolution", society: "Industrial Marsh", description: "Steam pumps, factories, railboats, and sanitation works transform labor and production.", motto: "Power the pumps; protect the people.", world: "Brick steamworks and brass water towers fill the basin with opportunity, noise, soot, and a new class of city worker.", healthNote: "Soot Lung and factory crowding make this the harshest era for public health.", architecture: "Brick & Brass", accent: "#c68191", diseasePressure: 1.65, resource: "steam", resourceName: "Steam Cores", icon: "⚙️", requirement: { population: 22, steam: 50, knowledge: 235 } },
    { name: "Glowgrid Modernity", society: "Civic Garden Metropolis", description: "Electric lights, hospitals, transit, apartments, and public services reach every district.", motto: "A bright window for every family.", world: "Streamlined glass civic halls and glowing transit lilies connect healthy green neighborhoods around the clock.", healthNote: "Hospitals make fatal illness rare, though seasonal Glowflu remains.", architecture: "Pastel Modern", accent: "#70b8ca", diseasePressure: 0.45, resource: "energy", resourceName: "Glow Energy", icon: "⚡", requirement: { population: 25, energy: 60, knowledge: 310 } },
    { name: "Crystalnet Age", society: "Living Information Commons", description: "Computers, automation, vaccine research, and crystal networks coordinate the entire marsh.", motto: "Knowledge flows like water.", world: "Responsive crystal towers adjust light, transit, farms, and medicine while every citizen can address the digital council.", healthNote: "Predictive clinics prevent most outbreaks before symptoms appear.", architecture: "Crystal Biotech", accent: "#898ce0", diseasePressure: 0.25, resource: "data", resourceName: "Crystal Data", icon: "💾", requirement: { population: 28, data: 75, knowledge: 400 } },
    { name: "Starleap Future", society: "Interpond Space Commonwealth", description: "Mossbell builds living rockets, trains astro-frogs, and carries wetland culture beyond the moonlit pond.", motto: "No pond is the edge of the sky.", world: "Lunar lily domes, stardust laboratories, and orbital gardens turn the old marsh into the heart of a gentle spacefaring civilization.", healthNote: "Bio-dome medicine is superb, but Starfade requires specialized care.", architecture: "Lunar Organic", accent: "#7773cb", diseasePressure: 0.35, resource: "stardust", resourceName: "Stardust", icon: "🚀", requirement: null },
  ];

  const DISEASES = [
    { id: "marshchill", name: "Marsh Chills", eras: [0, 1, 2], severity: 7, days: 3, mortality: 0.045, icon: "🤧" },
    { id: "sporecough", name: "Spore Cough", eras: [1, 2, 3], severity: 9, days: 4, mortality: 0.06, icon: "🍄" },
    { id: "lilypox", name: "Lily Pox", eras: [3, 4, 5], severity: 13, days: 5, mortality: 0.11, icon: "🌸" },
    { id: "sootlung", name: "Soot Lung", eras: [6], severity: 15, days: 6, mortality: 0.13, icon: "⚙️" },
    { id: "glowflu", name: "Glowflu", eras: [7, 8], severity: 8, days: 3, mortality: 0.035, icon: "✨" },
    { id: "starfade", name: "Starfade", eras: [9], severity: 11, days: 4, mortality: 0.055, icon: "🌙" },
  ];

  const EXPANSIONS = [
    { minX: 10, maxX: 19, minY: 8, maxY: 15, name: "Willow Heart" },
    { minX: 8, maxX: 21, minY: 7, maxY: 16, name: "Dapplefen Banks", cost: { flies: 80, reeds: 20 } },
    { minX: 6, maxX: 23, minY: 5, maxY: 18, name: "Moonwater Reach", cost: { flies: 180, reeds: 55, knowledge: 20 } },
    { minX: 4, maxX: 25, minY: 4, maxY: 19, name: "Clovermead Basin", cost: { flies: 330, reeds: 90, clay: 28 } },
    { minX: 2, maxX: 27, minY: 2, maxY: 21, name: "Amberreed Provinces", cost: { flies: 520, reeds: 140, iron: 35 } },
    { minX: 1, maxX: 28, minY: 1, maxY: 22, name: "Seven-Pond Marches", cost: { flies: 760, knowledge: 180, crowns: 45 } },
    { minX: 0, maxX: 29, minY: 0, maxY: 23, name: "Starlotus Frontier", cost: { flies: 1100, energy: 70, data: 35 } },
  ];

  const BUILDINGS = [
    { id: "lily", icon: "🪷", name: "Lily Home", category: "home", era: 0, terrain: "water", cost: { flies: 18, reeds: 6 }, description: "A floating home for one frog.", capacity: 1 },
    { id: "foragercamp", icon: "⛺", name: "Willow Forager Camp", category: "home", era: 0, terrain: "grass", cost: { reeds: 12, berries: 8 }, description: "A hide-and-reed camp for the first roaming frog families.", capacity: 4, familyHome: true, job: "Forager" },
    { id: "mossnest", icon: "🍃", name: "Mossy Family Nest", category: "home", era: 0, terrain: "grass", cost: { reeds: 20, berries: 10 }, description: "A snug living dome woven by a small family band.", capacity: 3, familyHome: true },
    { id: "cottage", icon: "🏡", name: "Mushroom Cottage", category: "home", era: 1, terrain: "grass", cost: { flies: 42, reeds: 18, clay: 6 }, description: "A settled family cottage shared by up to four related frogs.", capacity: 4, familyHome: true },
    { id: "loglodge", icon: "🪵", name: "Hollow Log Lodge", category: "home", era: 1, terrain: "grass", footprint: [2, 1], cost: { flies: 82, reeds: 34, berries: 12 }, description: "A roomy woodland home for a family of five.", capacity: 5, familyHome: true },
    { id: "path", icon: "◈", name: "Petal Path", category: "home", era: 0, terrain: "grass", cost: { reeds: 2 }, description: "Connects districts and brightens nearby homes." },
    { id: "bridge", icon: "🌉", name: "Reed Bridge", category: "home", era: 1, terrain: "water", cost: { flies: 24, reeds: 16 }, description: "Carries citizens safely over water." },
    { id: "ferry", icon: "⛵", name: "Tadpole Ferry Dock", category: "home", era: 0, terrain: "water", cost: { flies: 28, reeds: 14 }, description: "A tiny ferry stop connecting distant pond districts.", job: "Ferrymaster" },
    { id: "houseboat", icon: "🛶", name: "Lotus Houseboat", category: "home", era: 1, terrain: "water", cost: { flies: 68, reeds: 28, berries: 10 }, description: "A floating family home with four snug bunks.", capacity: 4, familyHome: true },
    { id: "pond", icon: "💧", name: "New Pond", category: "home", era: 1, terrain: "grass", cost: { flies: 15, reeds: 4 }, description: "Shapes a new water tile for lilies and bridges.", terrainTool: true },
    { id: "apartment", icon: "🏘️", name: "Glowgrid Apartments", category: "home", era: 7, terrain: "grass", footprint: [2, 1], cost: { flies: 280, reeds: 55, energy: 20 }, description: "Comfortable modern homes for several related households.", capacity: 10, familyHome: true },
    { id: "moonhab", icon: "🛰️", name: "Moon Habitat", category: "home", era: 9, terrain: "grass", footprint: [2, 2], cost: { flies: 520, data: 45, stardust: 12 }, description: "A sealed pastel habitat for future astro-frog families.", capacity: 12, familyHome: true },
    { id: "reedhall", icon: "🏠", name: "Bellflower Longhouse", category: "home", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 105, reeds: 42, grain: 12 }, description: "A painted village hall where two related households share meals.", capacity: 7, familyHome: true },
    { id: "treetop", icon: "🌳", name: "Treetop Hamlet", category: "home", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 126, reeds: 54, grain: 14 }, description: "Round bark rooms connected by flower-rope bridges above the village paths.", capacity: 7, familyHome: true },
    { id: "canalhouse", icon: "🏛️", name: "Copper Canal House", category: "home", era: 3, terrain: "grass", cost: { flies: 150, clay: 26, iron: 9 }, description: "A narrow stone home overlooking the city-state canals.", capacity: 5, familyHome: true },
    { id: "manor", icon: "🏰", name: "Moonrose Manor", category: "home", era: 4, terrain: "grass", footprint: [2, 1], cost: { flies: 230, reeds: 52, iron: 18 }, description: "A turreted guild-era residence with a shared family courtyard.", capacity: 8, familyHome: true },
    { id: "gardenrow", icon: "🏤", name: "Scholar's Garden Row", category: "home", era: 5, terrain: "grass", footprint: [2, 1], cost: { flies: 255, crowns: 16, parchment: 10 }, description: "Elegant connected homes arranged around a reading garden.", capacity: 9, familyHome: true },
    { id: "booktower", icon: "📖", name: "Roseglass Booktower", category: "home", era: 5, terrain: "grass", footprint: [2, 2], cost: { flies: 315, crowns: 22, parchment: 18 }, description: "A spiral residence where scholar families live among indoor gardens and libraries.", capacity: 11, familyHome: true },
    { id: "workerflats", icon: "🏭", name: "Brassbutton Worker Flats", category: "home", era: 6, terrain: "grass", footprint: [2, 1], cost: { flies: 250, clay: 20, steam: 12 }, description: "Compact brick homes built beside the new railboat lines.", capacity: 10, familyHome: true },

    { id: "berry", icon: "🍓", name: "Berry Patch", category: "food", era: 0, terrain: "grass", cost: { flies: 24, reeds: 8 }, description: "Grows sweet marshberries every day.", job: "Gardener" },
    { id: "reedbed", icon: "🌾", name: "Reed Nursery", category: "food", era: 0, terrain: "grass", cost: { flies: 18, berries: 4 }, description: "Grows a steady supply of building reeds.", job: "Reedkeeper" },
    { id: "flyfarm", icon: "🫧", name: "Glowfly Ranch", category: "food", era: 0, terrain: "grass", cost: { berries: 10, reeds: 12 }, description: "Raises sparkling glowflies, Mossbell's currency.", job: "Rancher" },
    { id: "duckweed", icon: "🌿", name: "Duckweed Gardens", category: "food", era: 0, terrain: "water", cost: { flies: 30, reeds: 10 }, description: "Floating crop beds grow berries and pond greens.", job: "Aquafarmer" },
    { id: "apiary", icon: "🍯", name: "Bumblebee Apiary", category: "food", era: 0, terrain: "grass", cost: { flies: 36, reeds: 14, berries: 6 }, description: "Friendly bees pollinate gardens and make honey drops.", job: "Beekeeper" },
    { id: "fishingcamp", icon: "🎣", name: "Minnow Fishing Camp", category: "food", era: 0, terrain: "water", cost: { reeds: 14, berries: 4 }, description: "Hunter-gatherers catch pond minnows from woven rafts.", job: "Fisher" },
    { id: "granary", icon: "🫙", name: "Acorn Granary", category: "food", era: 1, terrain: "grass", cost: { flies: 48, reeds: 20, clay: 10 }, description: "Stores pond grain and protects harvests during bad weather.", job: "Grainkeeper" },
    { id: "cafe", icon: "🍵", name: "Dewdrop Cafe", category: "food", era: 1, terrain: "grass", cost: { flies: 60, berries: 18, reeds: 18 }, description: "Turns berries into meals and happiness.", job: "Chef" },
    { id: "bakery", icon: "🥐", name: "Snail-Shell Bakery", category: "food", era: 1, terrain: "grass", cost: { flies: 72, berries: 20, reeds: 18 }, description: "Bakes berry buns that keep every household cheerful.", job: "Baker" },
    { id: "market", icon: "🎏", name: "Ripple Market", category: "food", era: 2, terrain: "grass", cost: { flies: 95, berries: 28, reeds: 24 }, description: "Trades surplus harvests for flies.", job: "Merchant" },
    { id: "floatingmarket", icon: "🪁", name: "Floating Night Market", category: "food", era: 1, terrain: "water", footprint: [2, 1], cost: { flies: 78, berries: 16, reeds: 30 }, description: "Lantern boats trade berries for extra glowflies.", job: "Boat Merchant" },
    { id: "windmill", icon: "🌬️", name: "Cattail Windmill", category: "food", era: 3, terrain: "grass", cost: { flies: 130, grain: 22, iron: 8 }, description: "Turns pond grain into flour for a growing city-state.", job: "Miller" },
    { id: "foodlab", icon: "🧪", name: "Future Food Lab", category: "food", era: 8, terrain: "grass", cost: { flies: 330, energy: 25, data: 18 }, description: "Grows perfect berries using crystal-guided hydroponics.", job: "Food Scientist" },
    { id: "souphall", icon: "🥣", name: "Clover Community Kitchen", category: "food", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 118, grain: 18, reeds: 30 }, description: "A village kitchen where every family can share a warm bowl.", job: "Community Cook", outputs: { flies: 0.16 }, benefit: "Improves food security" },
    { id: "royalorchard", icon: "🍎", name: "Mooncrown Orchard", category: "food", era: 4, terrain: "grass", footprint: [2, 1], cost: { flies: 205, crowns: 12, reeds: 48 }, description: "Heraldic fruit trees provide feasts for the castle and common pantry alike.", job: "Royal Orchardist", outputs: { berries: 0.34 }, benefit: "Produces berries" },
    { id: "teapavilion", icon: "🫖", name: "Rosehip Tea Pavilion", category: "food", era: 5, terrain: "water", cost: { flies: 245, parchment: 14, berries: 30 }, description: "A floating tearoom where poets, traders, and families exchange news.", job: "Tea Keeper", outputs: { flies: 0.28 }, benefit: "Trade and social joy" },
    { id: "glasshouse", icon: "🌱", name: "Steamglass Conservatory", category: "food", era: 6, terrain: "grass", footprint: [2, 1], cost: { flies: 330, steam: 24, iron: 22 }, description: "Warm glass gardens grow fruit through every season.", job: "Hothouse Tender", outputs: { berries: 0.42 }, benefit: "All-season harvest" },
    { id: "aquaponics", icon: "💧", name: "Glowgrid Aquaponics", category: "food", era: 7, terrain: "water", footprint: [2, 2], cost: { flies: 420, energy: 34, knowledge: 190 }, description: "Clean-energy terraces grow duckweed, berries, and minnows together.", job: "Aquaponic Engineer", outputs: { berries: 0.48, energy: 0.08 }, benefit: "Food and clean energy" },
    { id: "moonbiosphere", icon: "🪐", name: "Moonberry Biosphere", category: "food", era: 9, terrain: "grass", footprint: [2, 2], cost: { flies: 650, data: 45, stardust: 18 }, description: "A sealed lunar garden preserving every beloved Mossbell flavor.", job: "Lunar Botanist", outputs: { berries: 0.62, stardust: 0.06 }, benefit: "Space harvest" },

    { id: "claypit", icon: "🏺", name: "Mudbank Clay Works", category: "industry", era: 1, terrain: "grass", footprint: [2, 1], cost: { flies: 36, reeds: 18 }, description: "Clay diggers cut rich riverbank earth, wash it, and stack it for builders.", job: "Clay Digger" },
    { id: "grainterrace", icon: "🌾", name: "Sunreed Grain Terrace", category: "industry", era: 2, terrain: "grass", cost: { flies: 82, reeds: 28, clay: 8 }, description: "Raised village beds turn pond grain into a dependable civic resource.", job: "Grain Tender" },
    { id: "ironbog", icon: "⛏️", name: "Ironlily Bog Mine", category: "industry", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 138, clay: 24, grain: 14 }, description: "Miners sift rust-red bog stone for the city-state foundries.", job: "Bog Miner" },
    { id: "royalmint", icon: "🪙", name: "Moonpetal Royal Mint", category: "industry", era: 4, terrain: "grass", cost: { flies: 220, iron: 26, knowledge: 85 }, description: "Guild engravers press ceremonial petal crowns for the realm.", job: "Mint Keeper" },
    { id: "papermill", icon: "📜", name: "Lily Parchment Mill", category: "industry", era: 5, terrain: "water", footprint: [2, 1], cost: { flies: 250, crowns: 20, reeds: 65 }, description: "Water wheels press lily fiber into maps, books, and treaties.", job: "Papermaker" },
    { id: "boilerworks", icon: "⚙️", name: "Clovercoil Boilerworks", category: "industry", era: 6, terrain: "grass", footprint: [2, 1], cost: { flies: 340, iron: 42, parchment: 14 }, description: "Brass boilers manufacture the steam cores powering industrial Mossbell.", job: "Boiler Engineer" },
    { id: "solarlily", icon: "☀️", name: "Sunpetal Energy Garden", category: "industry", era: 7, terrain: "water", footprint: [2, 1], cost: { flies: 390, steam: 30, iron: 24 }, description: "Floating petals follow the sun and feed clean energy into the glowgrid.", job: "Grid Gardener" },
    { id: "datagrove", icon: "💎", name: "Crystal Data Grove", category: "industry", era: 8, terrain: "grass", footprint: [2, 2], cost: { flies: 455, energy: 44, knowledge: 260 }, description: "Living crystal trees store civic memory and research data.", job: "Data Tender" },
    { id: "starpond", icon: "🌠", name: "Stardust Condensation Pond", category: "industry", era: 9, terrain: "water", footprint: [2, 2], cost: { flies: 640, energy: 70, data: 55 }, description: "Moonlit collectors condense high-atmosphere dust into rocket fuel.", job: "Stardust Keeper" },
    { id: "basketry", icon: "🧺", name: "Willow Basketry Circle", category: "industry", era: 0, terrain: "grass", cost: { reeds: 22, berries: 6 }, description: "Clever weavers turn marsh reeds into baskets, nets, and shelters.", job: "Reed Weaver", outputs: { reeds: 0.12, flies: 0.08 }, benefit: "Reeds and trade goods" },
    { id: "potterykiln", icon: "🏺", name: "Painted Pottery Kiln", category: "industry", era: 1, terrain: "grass", cost: { flies: 68, reeds: 24, clay: 16 }, description: "A communal kiln fires sturdy crockery and story-painted tiles.", job: "Potter", outputs: { clay: 0.12, flies: 0.14 }, benefit: "Clay goods" },
    { id: "carpentry", icon: "🪚", name: "Bluebell Carpentry Yard", category: "industry", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 108, grain: 12, reeds: 44 }, description: "Village carpenters shape bridges, furniture, and painted timber frames.", job: "Carpenter", outputs: { reeds: 0.2, flies: 0.12 }, benefit: "Building materials" },
    { id: "jewelers", icon: "💍", name: "Moonstone Jewelers' Court", category: "industry", era: 4, terrain: "grass", cost: { flies: 235, iron: 18, crowns: 20 }, description: "Guild jewelers cut moonstone into regalia, instruments, and diplomatic gifts.", job: "Crown Jeweler", outputs: { crowns: 0.18, flies: 0.16 }, benefit: "Crowns and luxury trade" },
    { id: "mapstudio", icon: "🗺️", name: "Dragonfly Map Studio", category: "industry", era: 5, terrain: "grass", cost: { flies: 270, parchment: 20, knowledge: 115 }, description: "Surveyors illustrate waterways, trade routes, and distant civilizations.", job: "Cartographer", outputs: { parchment: 0.16, knowledge: 0.12 }, benefit: "Maps and knowledge" },
    { id: "recycler", icon: "♻️", name: "Circular Lilyworks", category: "industry", era: 7, terrain: "grass", footprint: [2, 1], cost: { flies: 395, energy: 28, steam: 26 }, description: "A cheerful modern works recovers useful material from every district.", job: "Reuse Engineer", outputs: { iron: 0.2, energy: 0.1 }, benefit: "Recovers materials" },
    { id: "nanofab", icon: "✨", name: "Nanopetal Fabricator", category: "industry", era: 8, terrain: "grass", footprint: [2, 1], cost: { flies: 520, energy: 44, data: 36 }, description: "Tiny crystal machines print tools, habitat parts, and medical devices.", job: "Fabrication Scientist", outputs: { data: 0.18, iron: 0.16 }, benefit: "Advanced fabrication" },

    { id: "library", icon: "📚", name: "Raindrop Library", category: "civic", era: 1, terrain: "grass", cost: { flies: 85, reeds: 30 }, description: "Produces knowledge and trains curious frogs.", job: "Scholar" },
    { id: "healerhut", icon: "🌿", name: "Willow Herb Shelter", category: "civic", era: 0, terrain: "grass", cost: { reeds: 18, berries: 12 }, description: "An early healer dries mintleaf, treats injuries, and lowers fatal illness risk.", job: "Herbalist" },
    { id: "storycircle", icon: "🔥", name: "Great Story Circle", category: "civic", era: 0, terrain: "grass", cost: { reeds: 16, berries: 8 }, description: "Elders teach routes, remedies, songs, and family history around a sheltered fire.", job: "Storykeeper", outputs: { lore: 0.14, knowledge: 0.05 }, benefit: "Lore and learning" },
    { id: "firehouse", icon: "🚒", name: "Croak & Ladder Firehouse", category: "civic", era: 1, terrain: "grass", cost: { flies: 92, reeds: 34, berries: 12 }, description: "Firekeepers protect reed roofs and lantern districts.", job: "Firekeeper" },
    { id: "police", icon: "🛡️", name: "Lilypad Watch Station", category: "civic", era: 1, terrain: "grass", cost: { flies: 88, reeds: 26, knowledge: 8 }, description: "Kind constables keep paths safe and find lost tadpoles.", job: "Constable" },
    { id: "jail", icon: "🔐", name: "Toadstool Holding House", category: "civic", era: 1, terrain: "grass", footprint: [2, 1], cost: { flies: 105, reeds: 32, clay: 14 }, description: "A secure but humane jail for dangerous rogue frogs, with warm bunks and supervised garden work.", job: "Warden", justiceCapacity: 5 },
    { id: "nursery", icon: "🍼", name: "Tadpole Nursery", category: "civic", era: 1, terrain: "water", cost: { flies: 74, reeds: 24, berries: 16 }, description: "Caregivers help tadpoles grow healthy, curious, and happy.", job: "Caregiver" },
    { id: "school", icon: "🏫", name: "Lilybell Elementary", category: "civic", era: 2, terrain: "grass", cost: { flies: 96, reeds: 32, grain: 10 }, description: "Frogs ages 3–9 learn pondcraft, stories, counting, and kindness.", job: "Elementary Teacher" },
    { id: "meetinghouse", icon: "🔔", name: "Bellflower Assembly Hall", category: "civic", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 128, reeds: 44, grain: 16 }, description: "Village delegates debate roads, schools, harvest rules, and the rights of every pond.", job: "Assembly Speaker" },
    { id: "archive", icon: "🗄️", name: "Copper Canal Archive", category: "civic", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 180, clay: 28, iron: 14 }, description: "Stone vaults preserve censuses, laws, maps, and every citizen's family record.", job: "Archivist", outputs: { knowledge: 0.24 }, benefit: "Civic records" },
    { id: "highschool", icon: "🎒", name: "Moonbrook High School", category: "civic", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 145, reeds: 38, iron: 12 }, description: "Frogs ages 10–14 explore sciences, crafts, athletics, and civics.", job: "High School Teacher" },
    { id: "university", icon: "🎓", name: "Mossbell University", category: "civic", era: 5, terrain: "grass", footprint: [2, 2], cost: { flies: 310, crowns: 22, parchment: 18, knowledge: 120 }, description: "Qualified frogs ages 15–17 pursue advanced study before joining specialist careers.", job: "Professor" },
    { id: "postoffice", icon: "💌", name: "Snail Mail Post", category: "civic", era: 1, terrain: "grass", cost: { flies: 66, reeds: 22 }, description: "Delivers letters and parcels between every marsh district.", job: "Mailfrog" },
    { id: "workshop", icon: "🛠️", name: "Reed Workshop", category: "civic", era: 2, terrain: "grass", cost: { flies: 110, reeds: 38 }, description: "Crafts reeds more efficiently for builders.", job: "Artisan" },
    { id: "clinic", icon: "🌼", name: "Lotus Clinic", category: "civic", era: 2, terrain: "grass", cost: { flies: 125, berries: 20, knowledge: 18 }, description: "Treats illness, speeds recovery, and sharply lowers the chance that sick frogs die.", job: "Healer" },
    { id: "aqueduct", icon: "🚰", name: "Copperleaf Aqueduct", category: "civic", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 175, clay: 30, iron: 16 }, description: "Carries clean spring water into crowded canal districts and reduces disease.", job: "Water Keeper" },
    { id: "courthouse", icon: "⚖️", name: "Canal Court of Ripples", category: "civic", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 195, clay: 36, iron: 18 }, description: "Judges hear evidence, review detentions, and turn disputes into written civic precedent.", job: "Magistrate" },
    { id: "infirmary", icon: "🕯️", name: "Moonpetal Infirmary", category: "civic", era: 4, terrain: "grass", footprint: [2, 1], cost: { flies: 240, crowns: 18, iron: 12 }, description: "Heraldic healers isolate Lily Pox and care for the kingdom's sick.", job: "Royal Healer" },
    { id: "apothecary", icon: "⚗️", name: "Roseglass Apothecary", category: "civic", era: 5, terrain: "grass", cost: { flies: 275, parchment: 18, knowledge: 130 }, description: "Scholar-physicians test remedies and teach the first principles of contagion.", job: "Apothecary" },
    { id: "sanitation", icon: "🚿", name: "Steamfen Sanitation Works", category: "civic", era: 6, terrain: "water", footprint: [2, 1], cost: { flies: 370, steam: 28, iron: 34 }, description: "Filters factory runoff and pumps clean water throughout the industrial wards.", job: "Sanitary Engineer" },
    { id: "stage", icon: "🎪", name: "Firefly Stage", category: "civic", era: 2, terrain: "grass", cost: { flies: 150, reeds: 42, knowledge: 24 }, description: "Hosts festivals beneath the lantern canopy.", job: "Musician" },
    { id: "observatory", icon: "🔭", name: "Moonpool Observatory", category: "civic", era: 2, terrain: "water", cost: { flies: 135, reeds: 34, knowledge: 18 }, description: "Studies stars reflected in perfectly still water.", job: "Astronomer" },
    { id: "foundry", icon: "⚒️", name: "Bog-Iron Foundry", category: "civic", era: 3, terrain: "grass", footprint: [2, 1], cost: { flies: 165, clay: 24, grain: 16 }, description: "Smelts bog iron into tools for the city-state.", job: "Blacksmith" },
    { id: "castle", icon: "👑", name: "Moonpetal Castle", category: "civic", era: 4, terrain: "grass", footprint: [2, 2], cost: { flies: 420, berries: 80, reeds: 100, iron: 45 }, description: "The medieval heart of a flourishing frog realm and a grand family home.", capacity: 6, familyHome: true, job: "Steward" },
    { id: "guildhall", icon: "🛡️", name: "Royal Guildhall", category: "civic", era: 4, terrain: "grass", footprint: [2, 1], cost: { flies: 230, iron: 28, crowns: 18 }, description: "Coordinates medieval artisans, builders, and royal commissions.", job: "Guildmaster" },
    { id: "monastery", icon: "🕯️", name: "Order of the Quiet Pond", category: "civic", era: 4, terrain: "water", footprint: [2, 1], cost: { flies: 225, crowns: 16, reeds: 58 }, description: "Monastic historians preserve songs, mediate feuds, and offer sanctuary on a silent island.", job: "Pondkeeper" },
    { id: "printing", icon: "📰", name: "Dragonfly Printing House", category: "civic", era: 5, terrain: "grass", cost: { flies: 260, crowns: 20, knowledge: 95 }, description: "Prints books, maps, and trade agreements on lily parchment.", job: "Printer" },
    { id: "museum", icon: "🏺", name: "Museum of Ten Thousand Ripples", category: "civic", era: 5, terrain: "grass", footprint: [2, 2], cost: { flies: 340, parchment: 28, knowledge: 150 }, description: "Displays clan tools, royal banners, pottery, fossils, and memories from every Mossbell era.", job: "Curator" },
    { id: "tradeharbor", icon: "⚓", name: "Diplomatic Trade Harbor", category: "civic", era: 5, terrain: "water", footprint: [2, 1], cost: { flies: 290, reeds: 65, parchment: 22 }, description: "Welcomes delegations and trade barges from neighboring frog civilizations.", job: "Diplomat" },
    { id: "factory", icon: "🏭", name: "Pastel Steamworks", category: "civic", era: 6, terrain: "grass", footprint: [2, 1], cost: { flies: 360, iron: 40, parchment: 18 }, description: "Produces steam cores and mechanized building parts.", job: "Engineer" },
    { id: "unionhall", icon: "🤝", name: "Cattail Workers' Hall", category: "civic", era: 6, terrain: "grass", footprint: [2, 1], cost: { flies: 315, steam: 20, parchment: 20 }, description: "Workers negotiate safer hours, apprenticeships, pensions, and festival leave.", job: "Union Steward", outputs: { knowledge: 0.14 }, benefit: "Worker safety and joy" },
    { id: "railterminal", icon: "🚂", name: "Lilyline Grand Terminal", category: "civic", era: 6, terrain: "grass", footprint: [3, 1], cost: { flies: 430, steam: 36, iron: 42 }, description: "Clockwork railboats connect factory wards, villages, schools, and distant trade docks.", job: "Stationmaster" },
    { id: "powerstation", icon: "⚡", name: "Glowbulb Power Station", category: "civic", era: 7, terrain: "water", footprint: [2, 1], cost: { flies: 420, steam: 35, iron: 30 }, description: "Turns water flow and glowflies into clean energy.", job: "Power Keeper" },
    { id: "hospital", icon: "🏥", name: "Grand Lotus Hospital", category: "civic", era: 7, terrain: "grass", footprint: [2, 1], cost: { flies: 390, energy: 22, knowledge: 220 }, description: "Modern medicine improves health and extends adult lifespans.", job: "Doctor" },
    { id: "parliament", icon: "🗳️", name: "Garden Parliament", category: "civic", era: 7, terrain: "grass", footprint: [2, 2], cost: { flies: 520, energy: 38, knowledge: 260 }, description: "Elected districts share power with the Moonpetal Crown beneath a vast glass lily roof.", job: "Civic Minister" },
    { id: "rehabilitation", icon: "🌱", name: "Second-Chance Lotus Center", category: "civic", era: 7, terrain: "grass", footprint: [2, 1], cost: { flies: 380, energy: 20, knowledge: 190 }, description: "Counselors, gardeners, and teachers help detained rogue frogs return safely to civic life.", job: "Restoration Guide", justiceCapacity: 7 },
    { id: "vaccinelab", icon: "🧬", name: "Dewdrop Vaccine Conservatory", category: "civic", era: 8, terrain: "grass", footprint: [2, 1], cost: { flies: 510, energy: 38, data: 32 }, description: "Predicts outbreaks and develops gentle vaccines from crystal-grown herbs.", job: "Epidemiologist" },
    { id: "civiccore", icon: "🔮", name: "Civic Memory Core", category: "civic", era: 8, terrain: "grass", footprint: [2, 2], cost: { flies: 590, energy: 52, data: 45 }, description: "A transparent civic system explains every budget, law, and automated decision to the public.", job: "Civic Analyst" },
    { id: "weathercenter", icon: "🌦️", name: "Marsh Climate Center", category: "civic", era: 8, terrain: "water", footprint: [2, 1], cost: { flies: 540, energy: 46, data: 38 }, description: "Crystal instruments forecast floods, droughts, disease weather, and migration seasons.", job: "Climate Forecaster", outputs: { data: 0.2, knowledge: 0.12 }, benefit: "Disaster forecasting" },
    { id: "medbay", icon: "🩺", name: "Starleap Bio-Dome Medbay", category: "civic", era: 9, terrain: "grass", footprint: [2, 1], cost: { flies: 620, data: 48, stardust: 12 }, description: "Regenerative moonwater medicine protects citizens on Mossbell and in orbit.", job: "Astro Medic" },
    { id: "lunarembassy", icon: "🌍", name: "Interpond Lunar Embassy", category: "civic", era: 9, terrain: "grass", footprint: [2, 2], cost: { flies: 760, data: 62, stardust: 24 }, description: "Welcomes off-world wetlands into a peaceful commonwealth of planets and ponds.", job: "Orbital Ambassador" },
    { id: "computerlab", icon: "💻", name: "Crystalnet Computing Hall", category: "civic", era: 8, terrain: "grass", footprint: [2, 1], cost: { flies: 470, energy: 35, knowledge: 280 }, description: "Stores crystal data and coordinates the whole civilization.", job: "Programmer" },
    { id: "robotics", icon: "🤖", name: "Pollywog Robotics Lab", category: "civic", era: 8, terrain: "grass", footprint: [2, 2], cost: { flies: 490, energy: 40, data: 28 }, description: "Builds helpful machines for farms, homes, and rescue services.", job: "Roboticist" },
    { id: "spaceport", icon: "🚀", name: "Starleap Spaceport", category: "civic", era: 9, terrain: "grass", footprint: [3, 2], cost: { flies: 900, energy: 90, data: 70, stardust: 20 }, description: "Launches Mossbell's first brave astro-frogs toward the stars.", job: "Flight Director" },
    { id: "rocketlab", icon: "🔬", name: "Moonshot Research Lab", category: "civic", era: 9, terrain: "grass", footprint: [2, 2], cost: { flies: 650, energy: 65, data: 55 }, description: "Creates stardust fuel, life-support bubbles, and tiny frog rockets.", job: "Rocket Scientist" },
    { id: "astroacademy", icon: "🎓", name: "Starpond Astro Academy", category: "civic", era: 9, terrain: "grass", footprint: [2, 2], cost: { flies: 720, data: 58, stardust: 20 }, description: "Pilots, botanists, medics, diplomats, and engineers train together for off-world life.", job: "Astro Dean", outputs: { data: 0.2, stardust: 0.05 }, benefit: "Space training" },

    { id: "wildflower", icon: "🌼", name: "Wildflower Gathering", category: "beauty", era: 0, terrain: "grass", cost: { berries: 6, reeds: 8 }, description: "A natural meadow where the earliest families sing and rest.", beauty: 2, benefit: "+2 harmony" },
    { id: "garden", icon: "🌷", name: "Ribbon Garden", category: "beauty", era: 0, terrain: "grass", cost: { flies: 26, berries: 5 }, description: "Raises harmony for nearby citizens.", beauty: 3, benefit: "+3 harmony" },
    { id: "fountain", icon: "⛲", name: "Frog Prince Fountain", category: "beauty", era: 0, terrain: "grass", cost: { flies: 34, reeds: 8 }, description: "A smiling stone frog sprays sparkling wishing water.", beauty: 3, benefit: "+3 harmony" },
    { id: "lotusspa", icon: "♨️", name: "Lotus Bathhouse", category: "beauty", era: 1, terrain: "water", cost: { flies: 58, berries: 14, reeds: 20 }, description: "A warm floating spa that restores joy and energy.", beauty: 4, benefit: "Restores energy" },
    { id: "waterstage", icon: "🎭", name: "Waterlily Puppet Theater", category: "beauty", era: 1, terrain: "water", cost: { flies: 64, reeds: 26, berries: 8 }, description: "Floating evening shows delight whole frog families.", beauty: 4, benefit: "Family entertainment" },
    { id: "playground", icon: "🛝", name: "Tadpole Splash Park", category: "beauty", era: 1, terrain: "grass", cost: { flies: 52, reeds: 20, berries: 10 }, description: "Tiny slides, puddles, and mushroom stepping stones.", beauty: 3, benefit: "Young frog joy" },
    { id: "lantern", icon: "🏮", name: "Firefly Lantern", category: "beauty", era: 1, terrain: "grass", cost: { flies: 20, reeds: 8 }, description: "Makes paths glow after sunset.", beauty: 1, benefit: "Nighttime glow" },
    { id: "shrine", icon: "🌙", name: "Moonwell Shrine", category: "beauty", era: 2, terrain: "grass", cost: { flies: 130, knowledge: 30, reeds: 22 }, description: "Preserves old marsh stories and raises harmony.", beauty: 5, benefit: "Stories and harmony" },
    { id: "topiary", icon: "🐸", name: "Frogberry Topiary Walk", category: "beauty", era: 2, terrain: "grass", footprint: [2, 1], cost: { flies: 112, grain: 12, reeds: 28 }, description: "Living frog sculptures line a painted village promenade.", beauty: 5, benefit: "+5 harmony" },
    { id: "canalplaza", icon: "🏛️", name: "Pearl Canal Plaza", category: "beauty", era: 3, terrain: "grass", footprint: [2, 2], cost: { flies: 190, clay: 34, iron: 12 }, description: "A tiled civic square with shade pools, mosaics, and public music.", beauty: 7, benefit: "Major gathering place" },
    { id: "rosegallery", icon: "🌹", name: "Royal Rose Gallery", category: "beauty", era: 4, terrain: "grass", footprint: [2, 1], cost: { flies: 245, crowns: 18, iron: 14 }, description: "A moonstone arcade displaying royal portraits and living rose tapestries.", beauty: 8, benefit: "Royal culture" },
    { id: "sculpturecourt", icon: "🗿", name: "Dragonfly Sculpture Court", category: "beauty", era: 5, terrain: "grass", footprint: [2, 2], cost: { flies: 305, parchment: 20, crowns: 20 }, description: "Renaissance artists fill a garden court with playful marble frogs.", beauty: 10, benefit: "Renaissance arts" },
    { id: "carousel", icon: "🎠", name: "Clockwork Lily Carousel", category: "beauty", era: 6, terrain: "grass", footprint: [2, 2], cost: { flies: 360, steam: 26, iron: 30 }, description: "Brass lily seats circle beneath a glowing music-box canopy.", beauty: 11, benefit: "Mechanical entertainment" },
    { id: "aurorapark", icon: "🌈", name: "Aurora Commons", category: "beauty", era: 7, terrain: "grass", footprint: [3, 2], cost: { flies: 470, energy: 38, knowledge: 220 }, description: "A modern public park with light ribbons, accessible play gardens, and concert lawns.", beauty: 14, benefit: "Citywide harmony" },
    { id: "hologarden", icon: "💠", name: "Crystal Hologarden", category: "beauty", era: 8, terrain: "grass", footprint: [2, 2], cost: { flies: 560, energy: 46, data: 38 }, description: "Living flowers mingle with interactive memories of every Mossbell era.", beauty: 16, benefit: "Interactive civic memory" },
    { id: "moonpark", icon: "🌌", name: "Zero-G Moonpetal Park", category: "beauty", era: 9, terrain: "grass", footprint: [3, 2], cost: { flies: 740, data: 58, stardust: 24 }, description: "A domed lunar garden where frogs float among star lilies and miniature ponds.", beauty: 20, benefit: "Space-age wonder" },
    { id: "remove", icon: "↶", name: "Reclaim", category: "beauty", era: 0, terrain: "any", cost: {}, description: "Remove a structure and recover half its materials.", removeTool: true },
  ];

  const QUESTS = [
    { title: "Homes on the Water", description: "Create room for four frogs with lily homes or cottages.", reward: { flies: 35, reeds: 12 }, check: () => housingCapacity() >= 4 },
    { title: "A Marsh That Feeds Itself", description: "Build both a Berry Patch and a Glowfly Ranch.", reward: { flies: 45, berries: 16 }, check: () => countBuilding("berry") >= 1 && countBuilding("flyfarm") >= 1 },
    { title: "Welcome the Wanderers", description: "Grow Mossbell to five citizens.", reward: { flies: 55, reeds: 18 }, check: () => world.frogs.length >= 5 },
    { title: "The Raindrop Archive", description: "Build the library requested by Elder Puddlewick.", reward: { flies: 60, knowledge: 14 }, check: () => countBuilding("library") >= 1 },
    { title: "Stories for the Next Tadpoles", description: "Gather 35 knowledge.", reward: { flies: 70, reeds: 24 }, check: () => world.resources.knowledge >= 35 },
    { title: "A Happy Little Village", description: "Raise kingdom harmony to 80 percent.", reward: { flies: 80, berries: 25 }, check: () => harmony() >= 80 },
    { title: "Lanterns Over Mossbell", description: "Build a Firefly Stage and host the first festival.", reward: { flies: 90, knowledge: 20 }, check: () => world.flags.festival },
    { title: "The Busy Commons", description: "Welcome ten citizens to the wetlands.", reward: { flies: 120, reeds: 35 }, check: () => world.frogs.length >= 10 },
    { title: "Remember the Moon", description: "Restore the Moonwell Shrine.", reward: { flies: 110, knowledge: 35 }, check: () => countBuilding("shrine") >= 1 },
    { title: "A Palace for Every Frog", description: "Build the Moonpetal Palace.", reward: { flies: 180, berries: 45 }, check: () => countBuilding("castle") >= 1 },
    { title: "A Flourishing Realm", description: "Reach 12 citizens, 120 knowledge, and 82 harmony.", reward: { flies: 250 }, check: () => world.frogs.length >= 12 && world.resources.knowledge >= 120 && harmony() >= 82 },
    { title: "The Moonpetal Crown", description: "Let one full day pass with the palace standing.", reward: { flies: 300 }, check: () => world.flags.palaceDay },
  ];

  const FROG_NAMES = ["Mochi", "Pip", "Basil", "Poppy", "Mallow", "Clover", "Nori", "Peach", "Toto", "Fern", "Bubbles", "Umi", "Pudding", "Lulu", "Tama", "Sprout", "Suki", "Beans", "Kero", "Dewdrop", "Mimi", "Bramble"];
  const TADPOLE_NAMES = ["Tilly", "Pebble", "Boba", "Dot", "Wiggles", "Button", "Miso", "Puddle", "Tutu", "Nibbles", "Dottie", "Beanie"];
  const PERSONALITIES = ["Sunny", "Bookish", "Sleepy", "Bubbly", "Shy", "Brave", "Dreamy"];
  const FAVORITES = ["Moonberries", "Dewdrop tea", "Glowfly pie", "Lotus cake", "Mint boba"];
  const FROG_COLORS = ["#8fd99b", "#72cfa0", "#a5df88", "#77c7b5", "#b4dc8d", "#f4a9c7", "#9fcdf1", "#c3afe9"];
  const NAME_STARTS = ["Ari", "Boo", "Cinna", "Dandi", "Fifi", "Gumi", "Hachi", "Jun", "Kiki", "Lumi", "Maple", "Nana", "Ollie", "Peko", "Riri", "Sora", "Taffy", "Winnie", "Yuzu", "Zuzu"];
  const NAME_ENDS = ["bean", "bell", "berry", "bloom", "bun", "dew", "hop", "leaf", "moss", "petal", "pop", "puff", "skip", "sprig", "wink"];
  const ATTRIBUTE_LABELS = { strength: "Strength", intelligence: "Intelligence", craftiness: "Craftiness" };
  const JOB_APTITUDES = {
    strength: ["Forager", "Fisher", "Gardener", "Reedkeeper", "Rancher", "Aquafarmer", "Firekeeper", "Constable", "Warden", "Ferrymaster", "Blacksmith", "Power Keeper", "Clay Digger", "Bog Miner", "Grain Tender", "Stationmaster", "Carpenter", "Royal Orchardist", "Hothouse Tender"],
    intelligence: ["Scholar", "Astronomer", "Healer", "Herbalist", "Royal Healer", "Apothecary", "Doctor", "Epidemiologist", "Astro Medic", "Water Keeper", "Magistrate", "Assembly Speaker", "Civic Minister", "Civic Analyst", "Orbital Ambassador", "Teacher", "Elementary Teacher", "High School Teacher", "Professor", "Programmer", "Food Scientist", "Rocket Scientist", "Flight Director", "Archivist", "Cartographer", "Aquaponic Engineer", "Lunar Botanist", "Climate Forecaster", "Fabrication Scientist", "Astro Dean"],
    craftiness: ["Beekeeper", "Chef", "Baker", "Community Cook", "Tea Keeper", "Merchant", "Boat Merchant", "Artisan", "Musician", "Mailfrog", "Printer", "Engineer", "Boiler Engineer", "Sanitary Engineer", "Grid Gardener", "Data Tender", "Stardust Keeper", "Papermaker", "Mint Keeper", "Roboticist", "Guildmaster", "Diplomat", "Curator", "Pondkeeper", "Restoration Guide", "Reed Weaver", "Potter", "Crown Jeweler", "Reuse Engineer", "Storykeeper", "Union Steward"],
  };
  const CIVIC_TASKS = [
    { id: "none", name: "No special task", attribute: null },
    { id: "forage", name: "Lead a moonberry expedition", attribute: "strength", resource: "berries", rate: 0.1, milestone: 55, story: "returned with baskets of rare moonberries and a map of a hidden grove" },
    { id: "gather", name: "Harvest civic reed bundles", attribute: "strength", resource: "reeds", rate: 0.085, milestone: 60, story: "organized a reed-cutting circle that left the nesting banks untouched" },
    { id: "fish", name: "Survey minnow migration", attribute: "intelligence", resource: "lore", secondary: "berries", rate: 0.055, era: 0, milestone: 62, story: "charted the silver minnow run and taught every family where to fish sustainably" },
    { id: "herbs", name: "Gather healing herbs", attribute: "craftiness", resource: "berries", effect: "health", rate: 0.052, era: 0, milestone: 58, story: "found a mintleaf hollow and restocked every healer's shelf" },
    { id: "clay", name: "Dig and wash river clay", attribute: "strength", resource: "clay", rate: 0.075, era: 1, milestone: 65, story: "opened a clean clay seam and stamped each brick with a tiny lily" },
    { id: "pottery", name: "Shape council pottery", attribute: "craftiness", resource: "clay", secondary: "flies", rate: 0.06, era: 1, milestone: 62, story: "fired a set of painted vessels telling Mossbell's founding story" },
    { id: "survey", name: "Survey expansion lands", attribute: "intelligence", resource: "knowledge", rate: 0.055, milestone: 70, story: "completed a careful district map with bridges, springs, and nesting grounds marked" },
    { id: "teach", name: "Run community lessons", attribute: "intelligence", resource: "knowledge", effect: "education", rate: 0.06, era: 2, milestone: 68, story: "held an open-air lesson where three generations learned together" },
    { id: "canals", name: "Inspect canals and bridges", attribute: "craftiness", resource: "iron", effect: "safety", rate: 0.048, era: 3, milestone: 72, story: "reinforced the canal gates before the high-water moon" },
    { id: "guard", name: "Guard the Moonpetal realm", attribute: "strength", resource: "crowns", effect: "legitimacy", rate: 0.05, era: 4, milestone: 72, story: "settled a border dispute with patience, tea, and impeccable ceremonial armor" },
    { id: "scribe", name: "Copy books and civic records", attribute: "intelligence", resource: "parchment", secondary: "knowledge", rate: 0.05, era: 5, milestone: 70, story: "completed a public edition of the laws with illustrations for young readers" },
    { id: "factory", name: "Inspect steamfen workplaces", attribute: "craftiness", resource: "steam", effect: "health", rate: 0.045, era: 6, milestone: 68, story: "redesigned a dangerous boiler valve and prevented a factory accident" },
    { id: "grid", name: "Maintain the glowgrid", attribute: "intelligence", resource: "energy", effect: "safety", rate: 0.05, era: 7, milestone: 66, story: "kept every clinic, home, and street lantern glowing through a storm" },
    { id: "data", name: "Curate the Crystalnet archive", attribute: "intelligence", resource: "data", secondary: "knowledge", rate: 0.05, era: 8, milestone: 65, story: "restored a century of family songs from a cracked memory crystal" },
    { id: "stars", name: "Train the first astro-frogs", attribute: "strength", resource: "stardust", secondary: "knowledge", rate: 0.045, era: 9, milestone: 70, story: "completed a full moonwalk rehearsal without spilling the ceremonial tea" },
    { id: "investigate", name: "Investigate civic trouble", attribute: "intelligence", effect: "justice", rate: 0.055, era: 1, milestone: 60, story: "solved a difficult case by listening to every witness and following the berry crumbs" },
    { id: "invent", name: "Develop era technology", attribute: "intelligence", eraResource: true, rate: 0.045, milestone: 75, story: "presented a new civic invention beneath the Great Willow" },
    { id: "craft", name: "Craft civic supplies", attribute: "craftiness", resource: "flies", rate: 0.12, milestone: 62, story: "organized a makers' fair where every tool was repaired for free" },
    { id: "care", name: "Care for young frogs", attribute: "craftiness", effect: "education", rate: 0.06, milestone: 58, story: "guided the tadpoles through their first safe journey beyond the nursery pond" },
    { id: "patrol", name: "Patrol the waterways", attribute: "strength", effect: "safety", rate: 0.07, milestone: 60, story: "completed a moonlit patrol and returned two lost boats before breakfast" },
  ];

  const SPECIALIZATIONS = {
    home: [
      { id: "family", name: "Family Wing", description: "+2 residents and stronger family joy" },
      { id: "commons", name: "Community Courtyard", description: "Nearby citizens gain social wellbeing" },
    ],
    food: [
      { id: "abundance", name: "Abundant Harvest", description: "+28% resource production" },
      { id: "pantry", name: "Community Pantry", description: "Improves health and disaster resilience" },
    ],
    industry: [
      { id: "precision", name: "Precision Tools", description: "+32% material production" },
      { id: "cooperative", name: "Worker Cooperative", description: "Higher worker joy and safety" },
    ],
    civic: [
      { id: "service", name: "Expanded Service", description: "Stronger health, safety, or education effect" },
      { id: "academy", name: "Training Academy", description: "Workers gain efficiency and knowledge" },
    ],
    beauty: [
      { id: "festival", name: "Festival Grounds", description: "More harmony during public celebrations" },
      { id: "sanctuary", name: "Quiet Sanctuary", description: "Restores health and joy nearby" },
    ],
  };
  const BUILDING_TIERS = ["Local Site", "Improved Hall", "District Institution", "Era Landmark", "Civic Masterwork"];

  const REALM_LAWS = [
    { id: "commonPantry", era: 1, name: "Common Pantry Charter", description: "Food stores protect families during drought and illness.", cost: { flies: 70, reeds: 30 } },
    { id: "gentleJustice", era: 1, name: "Gentle Justice Code", description: "Detained rogue frogs reform faster and return with less infamy.", cost: { clay: 18, knowledge: 18 } },
    { id: "schoolBell", era: 2, name: "Every Tadpole Learns", description: "Community lessons improve education and civic task mastery.", cost: { grain: 24, knowledge: 45 } },
    { id: "cleanCanals", era: 3, name: "Clean Canal Mandate", description: "Aqueducts and sanitation provide stronger disease prevention.", cost: { iron: 20, knowledge: 65 } },
    { id: "royalHealers", era: 4, name: "Royal Healers' Writ", description: "The Crown funds treatment for every sick citizen.", cost: { crowns: 22, knowledge: 90 } },
    { id: "artisanCharter", era: 4, name: "Free Guild Charter", description: "Specialized workshops and industries produce more.", cost: { crowns: 28, iron: 24 } },
    { id: "workersSafety", era: 6, name: "Steamfen Safety Act", description: "Industrial illness, crime, and factory accidents fall sharply.", cost: { steam: 32, knowledge: 180 } },
    { id: "openCrystalnet", era: 8, name: "Open Crystalnet Covenant", description: "Knowledge and data tasks benefit the whole commonwealth.", cost: { data: 38, energy: 28 } },
  ];
  const TRADE_CIVILIZATIONS = [
    { id: "lilypad", name: "Lilypad League", color: "#85d5a0", offers: [{ give: { berries: 25 }, receive: { reeds: 32 } }, { give: { flies: 65 }, receive: { grain: 18 } }] },
    { id: "amber", name: "Amberfen Duchy", color: "#f1c57e", offers: [{ give: { reeds: 38 }, receive: { iron: 16 } }, { give: { grain: 24 }, receive: { crowns: 12 } }] },
    { id: "cloud", name: "Cloudcap Republic", color: "#a9cbed", offers: [{ give: { parchment: 18 }, receive: { knowledge: 42 } }, { give: { flies: 140 }, receive: { steam: 20 } }] },
    { id: "aurora", name: "Aurora Pond Collective", color: "#c3afe9", offers: [{ give: { energy: 24 }, receive: { data: 15 } }, { give: { data: 30 }, receive: { stardust: 8 } }] },
  ];

  const state = {
    mode: "start",
    time: 0,
    lastTime: performance.now(),
    selectedTool: null,
    selected: { type: "willow", value: null },
    category: "home",
    buildEraFilter: "all",
    hoverTile: null,
    hoverPoint: null,
    pointerDown: null,
    dragging: false,
    muted: false,
    audio: null,
    nextMusic: 0,
    domTimer: 0,
    productionTimer: 0,
    autosaveTimer: 0,
    arrivalTimer: 12,
    eventTimer: 42,
    victoryShown: false,
  };

  const view = { x: 0, y: -125, targetX: 0, targetY: -125, zoom: 0.9, targetZoom: 0.9 };
  let world = null;

  function freshWorld() {
    world = null;
    const tiles = [];
    for (let y = 0; y < GRID_H; y += 1) {
      const row = [];
      for (let x = 0; x < GRID_W; x += 1) {
        const pond = Math.pow((x - 15.2) / 5.1, 2) + Math.pow((y - 11.2) / 3.4, 2) < 1;
        row.push({ terrain: pond ? "water" : "grass", building: null, decor: Math.random(), ripple: Math.random() * TAU });
      }
      tiles.push(row);
    }
    tiles[12][10].building = makeBuilding("willow", 10, 12);
    tiles[11][14].building = makeBuilding("lily", 14, 11);
    tiles[11][16].building = makeBuilding("lily", 16, 11);
    tiles[14][11].building = makeBuilding("foragercamp", 11, 14);
    tiles[15][12].building = makeBuilding("berry", 12, 15);
    tiles[15][13].building = makeBuilding("reedbed", 13, 15);
    tiles[13][12].building = makeBuilding("path", 12, 13);
    tiles[13][13].building = makeBuilding("path", 13, 13);

    world = {
      version: 2,
      ruler: "Keeper of the Marsh",
      tiles,
      frogs: [],
      tadpoles: [],
      resources: { flies: 120, berries: 30, reeds: 40, knowledge: 0, lore: 0, clay: 0, grain: 0, iron: 0, crowns: 0, parchment: 0, steam: 0, energy: 0, data: 0, stardust: 0 },
      expansion: 1,
      era: 0,
      quest: 0,
      day: 1,
      hour: 7.5,
      season: 0,
      weather: { type: "clear", timer: 58 },
      flags: { festival: false, palaceBuiltDay: null, palaceDay: false },
      disaster: null,
      tradeHistory: [],
      healthHistory: [],
      actionCooldowns: { forage: 0, reeds: 0, clay: 0 },
      government: { kind: "council", name: "Willow Circle", monarchId: null, heirId: null, dynastyName: "", legitimacy: 64, laws: [], cases: [], coronations: 0 },
      justice: { incidents: [], totalIncidents: 0, rehabilitated: 0 },
      chronicle: [],
      nextFrogId: 1,
      nextTadpoleId: 1,
      nextFamilyId: 1,
      playedSeconds: 0,
    };
    addChronicle("The First Ripple", "Three travelers found the silent Great Willow and promised to make the marsh sing again.");
    spawnFrog(11, 14, "Mochi");
    spawnFrog(14, 11, "Pip");
    spawnFrog(16, 11, "Clover");
    assignHomesAndJobs();
    birthTadpole(world.frogs[0].familyId, true);
    state.selected = { type: "willow", value: null };
    state.selectedTool = null;
    state.victoryShown = false;
    view.x = view.targetX = 0;
    view.y = view.targetY = H > W ? -60 : -125;
    view.zoom = view.targetZoom = H > W ? 0.82 : 0.9;
  }

  function makeBuilding(id, x, y) {
    const definition = buildingDefinition(id);
    return { id, x, y, footprint: [...(definition?.footprint || [1, 1])], level: 1, eraStyle: world?.era || 0, specialization: null, progress: 0, active: true, builtAt: Date.now() };
  }

  function spawnFrog(x, y, forcedName = null, family = null, origin = "arrival") {
    const used = new Set(world.frogs.map((frog) => frog.name));
    const available = FROG_NAMES.filter((name) => !used.has(name));
    const name = forcedName || available[Math.floor(Math.random() * available.length)] || generateUniqueFrogName(used);
    const frog = {
      id: world.nextFrogId,
      name,
      color: FROG_COLORS[Math.floor(Math.random() * FROG_COLORS.length)],
      personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
      favorite: FAVORITES[Math.floor(Math.random() * FAVORITES.length)],
      role: "Neighbor",
      x,
      y,
      fx: x + 0.5,
      fy: y + 0.5,
      target: null,
      home: null,
      workplace: null,
      hunger: 20 + Math.random() * 18,
      energy: 78 + Math.random() * 16,
      social: 65 + Math.random() * 20,
      joy: 72 + Math.random() * 14,
      health: 92 + Math.random() * 8,
      illness: null,
      immunity: 0,
      hop: Math.random() * TAU,
      blink: 1 + Math.random() * 3,
      thinkTimer: 1 + Math.random() * 3,
      bubble: "",
      bubbleTimer: 0,
      friendships: {},
      bond: 0,
      ageDays: origin === "grown" ? 3 : 18 + Math.floor(Math.random() * 13),
      lifespanDays: 58 + Math.floor(Math.random() * 24),
      attributes: {
        strength: 35 + Math.floor(Math.random() * 61),
        intelligence: 35 + Math.floor(Math.random() * 61),
        craftiness: 35 + Math.floor(Math.random() * 61),
      },
      education: { elementary: false, highschool: false, university: false },
      universityEligible: false,
      task: "none",
      taskProgress: 0,
      taskMastery: {},
      disposition: Math.random() < 0.07 ? "chaotic" : "gentle",
      infamy: 0,
      detainedUntil: 0,
      sentenceReason: "",
      title: "",
      familyId: null,
      familyName: "",
    };
    if (family) {
      frog.familyId = family.id;
      frog.familyName = family.name;
    } else placeFrogInFamily(frog);
    world.nextFrogId += 1;
    world.frogs.push(frog);
    if (origin === "grown") addChronicle(`${name} grew into a young frog`, `${name} left the nursery pond and joined the ${frog.familyName} as a full citizen.`);
    else addChronicle(`${name} arrived`, `${name}, a ${frog.personality.toLowerCase()} frog who loves ${frog.favorite.toLowerCase()}, joined Mossbell.`);
    return frog;
  }

  function generateUniqueFrogName(usedNames) {
    for (let attempt = 0; attempt < 240; attempt += 1) {
      const name = `${choose(NAME_STARTS)}${choose(NAME_ENDS)}`;
      const formatted = name.charAt(0).toUpperCase() + name.slice(1);
      if (!usedNames.has(formatted)) return formatted;
    }
    return `Mossbell ${world.nextFrogId}`;
  }

  function placeFrogInFamily(frog) {
    const newestFamily = [...world.frogs].reverse().find((member) => member.familyId && familyMembers(member.familyId).length < 3);
    if (newestFamily) {
      frog.familyId = newestFamily.familyId;
      frog.familyName = newestFamily.familyName;
      return;
    }
    const familyId = world.nextFamilyId || 1;
    frog.familyId = familyId;
    frog.familyName = `${choose(["Pondskip", "Mossbell", "Moonhop", "Dewdrop", "Lilyleap", "Reedwhistle"])} Family`;
    world.nextFamilyId = familyId + 1;
  }

  function familyMembers(familyId) {
    return world.frogs.filter((frog) => frog.familyId === familyId);
  }

  function totalPopulation() {
    return world.frogs.length + (world.tadpoles?.length || 0);
  }

  function nearestWaterTile(fromX, fromY) {
    let nearest = null;
    let distance = Infinity;
    forEachTile((tile, x, y) => {
      if (!isTileUnlocked(x, y) || tile.terrain !== "water") return;
      const nextDistance = Math.hypot(x - fromX, y - fromY);
      if (nextDistance < distance) {
        nearest = { x, y };
        distance = nextDistance;
      }
    });
    return nearest || { x: 15, y: 11 };
  }

  function birthTadpole(familyId, guaranteed = false) {
    const family = familyMembers(familyId);
    if (!family.length || totalPopulation() >= housingCapacity()) return false;
    if (!guaranteed && world.resources.berries < 8) return false;
    const home = family.find((frog) => frog.home)?.home || { x: family[0].x, y: family[0].y };
    const water = nearestWaterTile(home.x, home.y);
    const usedNames = new Set([...world.frogs.map((frog) => frog.name), ...world.tadpoles.map((tadpole) => tadpole.name)]);
    const name = TADPOLE_NAMES.find((candidate) => !usedNames.has(candidate)) || `Tiny ${world.nextTadpoleId}`;
    const tadpole = {
      id: world.nextTadpoleId,
      name,
      familyId,
      familyName: family[0].familyName,
      color: choose(FROG_COLORS),
      ageDays: 0,
      growDays: countBuilding("nursery") > 0 ? 2 : 3,
      x: water.x,
      y: water.y,
      fx: water.x + 0.5,
      fy: water.y + 0.5,
      wiggle: Math.random() * TAU,
      bubble: guaranteed ? "New baby!" : "Pop!",
      bubbleTimer: 4,
      attributes: randomAttributes(),
    };
    world.nextTadpoleId += 1;
    world.tadpoles.push(tadpole);
    if (!guaranteed) world.resources.berries -= 8;
    addChronicle(`${name} the tadpole was born`, `The ${tadpole.familyName} welcomed a tiny tadpole. In ${tadpole.growDays} days, ${name} will become a young frog.`);
    toast(`${name} joined the nursery pond`);
    return true;
  }

  function healthInfrastructure() {
    const careBuildings = {
      healerhut: 0.22,
      clinic: 0.48,
      infirmary: 0.68,
      apothecary: 0.58,
      hospital: 1.05,
      vaccinelab: 0.72,
      medbay: 1.3,
    };
    let care = 0;
    forEachTile((tile) => {
      const amount = careBuildings[tile.building?.id];
      if (amount) care += amount * staffedMultiplier(tile.building) * (tile.building.specialization === "service" ? 1.3 : 1);
      if (["souphall", "glasshouse", "aquaponics", "moonbiosphere"].includes(tile.building?.id)) care += 0.035 * staffedMultiplier(tile.building);
      if (["pantry", "sanctuary"].includes(tile.building?.specialization)) care += 0.08;
    });
    const lawCare = hasLaw("royalHealers") ? 0.3 : 0;
    const lawPrevention = (hasLaw("cleanCanals") ? 0.12 : 0) + (hasLaw("workersSafety") ? 0.1 : 0);
    care += lawCare;
    const prevention = countBuilding("aqueduct") * 0.14 + countBuilding("sanitation") * 0.24 + countBuilding("hospital") * 0.12 + countBuilding("vaccinelab") * 0.3 + countBuilding("medbay") * 0.28 + lawPrevention;
    return { care, prevention: clamp(prevention, 0, 0.82) };
  }

  function kingdomWellbeing() {
    if (!world?.frogs.length) return 100;
    return Math.round(world.frogs.reduce((sum, frog) => sum + (frog.health ?? 100), 0) / world.frogs.length);
  }

  function eraDiseases() {
    return DISEASES.filter((disease) => disease.eras.includes(currentEra()));
  }

  function processHealthDay(frog) {
    frog.health = clamp(frog.health ?? 100, 0, 100);
    frog.immunity = Math.max(0, (frog.immunity || 0) - 1);
    const era = ERAS[currentEra()];
    const infrastructure = healthInfrastructure();

    if (frog.illness) {
      const disease = DISEASES.find((entry) => entry.id === frog.illness.id) || frog.illness;
      const treatment = clamp(infrastructure.care / Math.max(1, world.frogs.length / 7), 0, 1.35);
      const untreatedLoss = disease.severity * (world.disaster ? 1.18 : 1);
      frog.health = clamp(frog.health - untreatedLoss * (1 - Math.min(0.82, treatment * 0.62)) + treatment * 4.5, 0, 100);
      frog.illness.daysLeft -= 1 + treatment * 0.45;
      const critical = frog.health < 42 ? 1.7 : 1;
      const fatalChance = disease.mortality * era.diseasePressure * critical * (treatment > 0.2 ? 0.16 / (1 + treatment) : 1);
      if (frog.health <= 0 || Math.random() < fatalChance) {
        frog.healthDeath = disease.name;
        return;
      }
      if (frog.illness.daysLeft <= 0) {
        frog.illness = null;
        frog.immunity = 8;
        frog.health = clamp(frog.health + 18, 0, 100);
        frog.bubble = "Feeling better!";
        frog.bubbleTimer = 4;
        addChronicle(`${frog.name} recovered`, `${frog.name} recovered with ${treatment > 0.25 ? "help from Mossbell's healers" : "rest, warm pondwater, and family care"}.`);
        toast(`${frog.name} recovered`);
      }
      return;
    }

    frog.health = clamp(frog.health + 3.5 + infrastructure.care * 0.6, 0, 100);
    if (frog.immunity > 0) return;
    const diseases = eraDiseases();
    if (!diseases.length) return;
    const crowding = 1 + Math.max(0, totalPopulation() - 8) * 0.018;
    const disasterRisk = world.disaster ? 1.55 : 1;
    const ageRisk = frog.ageDays > frog.lifespanDays * 0.72 ? 1.45 : frog.ageDays < 10 ? 1.2 : 1;
    const infectionChance = 0.022 * era.diseasePressure * crowding * disasterRisk * ageRisk * (1 - infrastructure.prevention);
    if (Math.random() >= infectionChance) return;
    const disease = choose(diseases);
    frog.illness = { id: disease.id, name: disease.name, icon: disease.icon, daysLeft: disease.days };
    frog.bubble = `${disease.icon} I feel poorly`;
    frog.bubbleTimer = 5;
    frog.joy = clamp(frog.joy - 12, 0, 100);
    world.healthHistory.push({ day: world.day, frog: frog.name, disease: disease.name });
    world.healthHistory = world.healthHistory.slice(-50);
    addChronicle(`${frog.name} caught ${disease.name}`, `${disease.name} reached the ${frog.familyName}. ${infrastructure.care > 0.25 ? "A healer has begun treatment." : "Without a staffed clinic, the family must rely on rest and wild herbs."}`);
    toast(`${frog.name} is sick with ${disease.name}`);
  }

  function advanceGenerations() {
    const departed = [];
    world.frogs.forEach((frog) => {
      frog.ageDays = (frog.ageDays || 0) + 1;
      updateEducation(frog, true);
      processHealthDay(frog);
      const hospitalBonus = countBuilding("hospital") > 0 ? 10 : countBuilding("clinic") > 0 ? 4 : 0;
      if (frog.healthDeath || frog.ageDays >= frog.lifespanDays + hospitalBonus) departed.push(frog);
    });
    departed.forEach((frog) => {
      world.frogs = world.frogs.filter((citizen) => citizen.id !== frog.id);
      handleSuccession(frog);
      const cause = frog.healthDeath;
      addChronicle(`${frog.name}'s final moonrise`, cause ? `${frog.name} died from ${cause} at age ${frog.ageDays}. The council mourned with the ${frog.familyName} and renewed its promise to protect public health.` : `${frog.name} passed peacefully at age ${frog.ageDays}, surrounded by the ${frog.familyName}. Their stories remain in Mossbell.`);
      toast(cause ? `${frog.name} died from ${cause}` : `${frog.name} passed away peacefully`);
      if (state.selected.type === "frog" && state.selected.value?.id === frog.id) state.selected = { type: "willow", value: null };
    });

    const grown = world.tadpoles.filter((tadpole) => {
      tadpole.ageDays += countBuilding("nursery") > 0 ? 1.35 : 1;
      return tadpole.ageDays >= tadpole.growDays;
    });
    grown.forEach((tadpole) => {
      world.tadpoles = world.tadpoles.filter((baby) => baby.id !== tadpole.id);
      const frog = spawnFrog(tadpole.x, tadpole.y, tadpole.name, { id: tadpole.familyId, name: tadpole.familyName }, "grown");
      frog.color = tadpole.color;
      frog.attributes = tadpole.attributes || frog.attributes;
      frog.bubble = "I have legs!";
      frog.bubbleTimer = 4;
      toast(`${tadpole.name} grew into a frog`);
    });

    const birthChance = 0.1 + countBuilding("nursery") * 0.05;
    const eligibleFamilies = [...new Set(world.frogs.map((frog) => frog.familyId))].filter((familyId) => familyMembers(familyId).length >= 2);
    if (totalPopulation() < housingCapacity() && eligibleFamilies.length && Math.random() < birthChance) birthTadpole(choose(eligibleFamilies));
    processJusticeDay();
    refreshGovernment();
    assignHomesAndJobs();
  }

  function updateEducation(frog, advance = false) {
    frog.education ||= { elementary: false, highschool: false, university: false };
    frog.attributes ||= randomAttributes();
    if (frog.ageDays < 10) {
      frog.role = countBuilding("school") ? "Elementary Student" : "Home-taught Student";
      if (countBuilding("school")) {
        frog.education.elementary = true;
        if (advance) frog.attributes.intelligence = clamp(frog.attributes.intelligence + 1 + (hasLaw("schoolBell") ? 1 : 0), 1, 100);
      }
    } else if (frog.ageDays < 15) {
      frog.role = countBuilding("highschool") ? "High School Student" : "Apprentice Student";
      if (countBuilding("highschool")) {
        frog.education.highschool = true;
        const focus = frog.attributes.strength > frog.attributes.craftiness ? "strength" : "craftiness";
        if (advance) frog.attributes[focus] = clamp(frog.attributes[focus] + 1 + (hasLaw("schoolBell") ? 1 : 0), 1, 100);
      }
    } else if (frog.ageDays < 18) {
      if (frog.universityEligible === undefined || frog.universityEligible === null) frog.universityEligible = frog.attributes.intelligence >= 67 && (frog.id % 4 !== 0);
      const attending = frog.universityEligible && countBuilding("university") > 0;
      frog.role = attending ? "University Student" : "Community Student";
      if (attending) {
        frog.education.university = true;
        if (advance) frog.attributes.intelligence = clamp(frog.attributes.intelligence + 2, 1, 100);
      } else if (advance) frog.attributes.craftiness = clamp(frog.attributes.craftiness + 1, 1, 100);
    }
  }

  function randomAttributes() {
    return {
      strength: 35 + Math.floor(Math.random() * 61),
      intelligence: 35 + Math.floor(Math.random() * 61),
      craftiness: 35 + Math.floor(Math.random() * 61),
    };
  }

  function isAdult(frog) {
    return frog.ageDays >= 18;
  }

  function frogAptitude(frog, role) {
    const key = Object.entries(JOB_APTITUDES).find(([, roles]) => roles.includes(role))?.[0] || "craftiness";
    return { key, value: frog.attributes?.[key] || 50 };
  }

  function jobEfficiency(frog, role = frog.role) {
    if (!frog || !isAdult(frog) || isDetained(frog)) return 0;
    const aptitude = frogAptitude(frog, role).value;
    const educationBonus = frog.education?.university ? 0.16 : frog.education?.highschool ? 0.08 : frog.education?.elementary ? 0.04 : 0;
    const healthFactor = frog.illness ? 0.58 : clamp((frog.health ?? 100) / 82, 0.72, 1.08);
    return clamp((0.52 + aptitude / 100 + educationBonus) * healthFactor, 0.38, 1.72);
  }

  function fitCanvas() {
    const rect = stage.getBoundingClientRect();
    const portrait = rect.height > rect.width;
    W = portrait ? 760 : 1040;
    H = portrait ? 980 : 680;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (portrait) {
      view.zoom = view.targetZoom = 0.82;
      view.y = view.targetY = -60;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function damp(a, b, smoothing, dt) {
    return lerp(a, b, 1 - Math.pow(smoothing, dt));
  }

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return null;
    return world.tiles[y][x];
  }

  function buildingDefinition(id) {
    if (id === "willow") return { id: "willow", name: "The Great Willow", description: "The oldest tree in Mossbell. The council gathers beneath its lanterns." };
    return BUILDINGS.find((building) => building.id === id);
  }

  function footprintOf(value) {
    if (!value) return [1, 1];
    if (Array.isArray(value.footprint)) return value.footprint;
    const definition = value.id ? buildingDefinition(value.id) : value;
    return definition?.footprint || [1, 1];
  }

  function footprintCells(x, y, footprint) {
    const [width, height] = footprint;
    const cells = [];
    for (let dy = 0; dy < height; dy += 1) {
      for (let dx = 0; dx < width; dx += 1) cells.push({ x: x + dx, y: y + dy });
    }
    return cells;
  }

  function buildingAt(x, y) {
    const tile = tileAt(x, y);
    if (!tile) return null;
    if (tile.building) return tile.building;
    if (!tile.occupiedBy) return null;
    return tileAt(tile.occupiedBy.x, tile.occupiedBy.y)?.building || null;
  }

  function footprintCanFit(definition, x, y, ignoreBuilding = null) {
    return footprintCells(x, y, definition.footprint || [1, 1]).every((cell) => {
      const tile = tileAt(cell.x, cell.y);
      if (!tile || !isTileUnlocked(cell.x, cell.y)) return false;
      const occupant = buildingAt(cell.x, cell.y);
      if (occupant && occupant !== ignoreBuilding) return false;
      return definition.terrain === "any" || tile.terrain === definition.terrain;
    });
  }

  function reserveBuildingFootprint(building) {
    const cells = footprintCells(building.x, building.y, footprintOf(building));
    cells.forEach((cell, index) => {
      if (index === 0) return;
      const tile = tileAt(cell.x, cell.y);
      if (tile) tile.occupiedBy = { x: building.x, y: building.y };
    });
  }

  function clearBuildingFootprint(building) {
    footprintCells(building.x, building.y, footprintOf(building)).forEach((cell) => {
      const tile = tileAt(cell.x, cell.y);
      if (!tile) return;
      if (tile.building === building) tile.building = null;
      if (tile.occupiedBy?.x === building.x && tile.occupiedBy?.y === building.y) tile.occupiedBy = null;
    });
  }

  function countBuilding(id) {
    let count = 0;
    forEachTile((tile) => { if (tile.building?.id === id) count += 1; });
    return count;
  }

  function forEachTile(callback) {
    for (let y = 0; y < GRID_H; y += 1) {
      for (let x = 0; x < GRID_W; x += 1) callback(world.tiles[y][x], x, y);
    }
  }

  function housingCapacity() {
    let capacity = 0;
    forEachTile((tile) => {
      const definition = tile.building && buildingDefinition(tile.building.id);
      capacity += buildingCapacity(tile.building, definition);
    });
    return Math.max(3, capacity);
  }

  function buildingCapacity(building, definition = buildingDefinition(building?.id)) {
    if (!building || !definition?.capacity) return 0;
    return definition.capacity + (building.specialization === "family" ? 2 : 0) + Math.max(0, (building.level || 1) - 3);
  }

  function expansionLevelForTile(x, y) {
    return EXPANSIONS.findIndex((area) => x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY);
  }

  function isTileUnlocked(x, y) {
    const area = EXPANSIONS[Math.min(world?.expansion || 0, EXPANSIONS.length - 1)];
    return x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY;
  }

  function safety() {
    if (!world) return 0;
    const staffedFirehouses = staffedBuildingCount("firehouse");
    const staffedStations = staffedBuildingCount("police");
    const services = countBuilding("firehouse") * 16 + countBuilding("police") * 16;
    const staffing = staffedFirehouses * 9 + staffedStations * 9;
    const patrols = world.frogs.filter((frog) => frog.task === "patrol" && isAdult(frog)).reduce((sum, frog) => sum + jobEfficiency(frog, "Constable") * 4, 0);
    const justice = countBuilding("jail") * 9 + countBuilding("courthouse") * 10 + countBuilding("rehabilitation") * 12 + countBuilding("civiccore") * 8;
    const threats = world.frogs.filter((frog) => frog.disposition === "chaotic" && !isDetained(frog)).reduce((sum, frog) => sum + 2 + Math.min(5, frog.infamy || 0), 0);
    const openCases = (world.government?.cases || []).filter((entry) => entry.status === "open").length * 2;
    const lawBonus = hasLaw("gentleJustice") ? 5 : 0;
    return Math.round(clamp(42 + services + staffing + patrols + justice + lawBonus + countBuilding("clinic") * 4 + countBuilding("hospital") * 8 - threats - openCases, 0, 100));
  }

  function staffedBuildingCount(id) {
    let count = 0;
    forEachTile((tile) => {
      if (tile.building?.id !== id) return;
      const worker = world.frogs.find((frog) => frog.workplace?.x === tile.building.x && frog.workplace?.y === tile.building.y && !isDetained(frog));
      if (worker) count += 1;
    });
    return count;
  }

  function harmony() {
    if (!world?.frogs.length) return 0;
    const citizenMood = world.frogs.reduce((sum, frog) => sum + (frog.joy + frog.social + (100 - frog.hunger)) / 3, 0) / world.frogs.length;
    let specializations = 0;
    forEachTile((tile) => {
      if (["commons", "festival", "sanctuary"].includes(tile.building?.specialization)) specializations += tile.building.specialization === "festival" ? 5 : 3;
    });
    let beauty = countBuilding("stage") * 2 + specializations;
    forEachTile((tile) => {
      const definition = tile.building && buildingDefinition(tile.building.id);
      if (definition?.beauty) beauty += definition.beauty * (1 + Math.max(0, (tile.building.level || 1) - 1) * 0.12);
    });
    return Math.round(clamp(citizenMood * 0.82 + beauty, 0, 100));
  }

  function currentEra() {
    return clamp(world?.era || 0, 0, ERAS.length - 1);
  }

  function isDetained(frog) {
    return Boolean(frog && (frog.detainedUntil || 0) > world.day);
  }

  function hasLaw(id) {
    return Boolean(world?.government?.laws?.includes(id));
  }

  function justiceCapacity() {
    let capacity = 0;
    forEachTile((tile) => {
      const definition = tile.building && buildingDefinition(tile.building.id);
      if (definition?.justiceCapacity) capacity += definition.justiceCapacity + Math.max(0, (tile.building.level || 1) - 1) * 2;
    });
    return capacity;
  }

  function detainedCitizens() {
    return world.frogs.filter(isDetained);
  }

  function governmentDisplayName() {
    if (world.government.kind !== "monarchy") {
      return ["Willow Circle", "Mudbank Council", "Assembly of Bells", "League of Canal Cities"][Math.min(currentEra(), 3)];
    }
    if (currentEra() >= 9) return "Interpond Crown Commonwealth";
    if (currentEra() >= 8) return "Crystal Crown & Commons";
    if (currentEra() >= 7 && countBuilding("parliament")) return "Moonpetal Constitutional Monarchy";
    if (currentEra() >= 5) return "Moonpetal Crown & Assembly";
    return "Moonpetal Monarchy";
  }

  function monarch() {
    return world.frogs.find((frog) => frog.id === world.government?.monarchId) || null;
  }

  function royalHeir() {
    return world.frogs.find((frog) => frog.id === world.government?.heirId) || null;
  }

  function chooseRoyalHeir(ruler = monarch()) {
    if (!ruler) return null;
    const family = world.frogs.filter((frog) => frog.id !== ruler.id && frog.familyId === ruler.familyId && !isDetained(frog));
    return family.sort((a, b) => b.ageDays - a.ageDays || b.attributes.intelligence - a.attributes.intelligence)[0] || world.frogs.filter((frog) => frog.id !== ruler.id && !isDetained(frog)).sort((a, b) => b.attributes.intelligence + b.attributes.craftiness - (a.attributes.intelligence + a.attributes.craftiness))[0] || null;
  }

  function establishMonarchy() {
    if (world.government.kind === "monarchy") return;
    const candidates = world.frogs.filter((frog) => isAdult(frog) && !isDetained(frog));
    const ruler = candidates.sort((a, b) => (b.attributes.intelligence + b.attributes.craftiness + (b.bond || 0) * 3) - (a.attributes.intelligence + a.attributes.craftiness + (a.bond || 0) * 3))[0];
    if (!ruler) return;
    world.government.kind = "monarchy";
    world.government.monarchId = ruler.id;
    world.government.dynastyName = ruler.familyName.replace(" Family", " Dynasty");
    world.government.coronations = (world.government.coronations || 0) + 1;
    world.government.legitimacy = Math.max(72, world.government.legitimacy || 0);
    ruler.title = "Crownkeeper";
    const heir = chooseRoyalHeir(ruler);
    world.government.heirId = heir?.id || null;
    if (heir) heir.title = "Moonpetal Heir";
    addChronicle(`Crownkeeper ${ruler.name} was crowned`, `Every district sent one lantern to Moonpetal Castle. ${ruler.name} of the ${world.government.dynastyName} promised to guard the waterways, uphold gentle justice, and share power with the old Willow Circle.`);
    toast(`${ruler.name} became Crownkeeper of Mossbell`);
  }

  function refreshGovernment() {
    world.government.name = governmentDisplayName();
    if (countBuilding("castle") > 0 && world.government.kind !== "monarchy") establishMonarchy();
    if (world.government.kind === "monarchy") {
      const ruler = monarch();
      if (!ruler) handleSuccession();
      const heir = royalHeir();
      if (!heir || heir.id === world.government.monarchId) {
        const next = chooseRoyalHeir(monarch());
        world.government.heirId = next?.id || null;
        if (next) next.title = "Moonpetal Heir";
      }
    }
  }

  function handleSuccession(departed = null) {
    if (departed && departed.id !== world.government.monarchId) {
      if (departed.id === world.government.heirId) world.government.heirId = null;
      return;
    }
    const previousName = departed?.name || "the previous Crownkeeper";
    const preferred = royalHeir();
    const candidates = world.frogs.filter((frog) => frog.id !== departed?.id && isAdult(frog) && !isDetained(frog));
    const successor = preferred && candidates.includes(preferred) ? preferred : candidates.sort((a, b) => b.attributes.intelligence + b.attributes.craftiness - (a.attributes.intelligence + a.attributes.craftiness))[0];
    if (!successor) {
      world.government.kind = "council";
      world.government.monarchId = null;
      world.government.heirId = null;
      addChronicle("The Crown returned to the Willow Circle", `With no eligible successor after ${previousName}, the council placed the Moonpetal Crown beneath the Great Willow until a new age.`);
      return;
    }
    world.government.monarchId = successor.id;
    world.government.dynastyName = successor.familyName.replace(" Family", " Dynasty");
    world.government.coronations += 1;
    successor.title = "Crownkeeper";
    const heir = chooseRoyalHeir(successor);
    world.government.heirId = heir?.id || null;
    if (heir) heir.title = "Moonpetal Heir";
    addChronicle(`The Moonpetal succession`, `${successor.name} succeeded ${previousName} as Crownkeeper. Bells sounded from the castle to the smallest ferry dock.`);
    toast(`${successor.name} inherited the Moonpetal Crown`);
  }

  function detainFrog(frog, reason = "Civic endangerment", days = 3) {
    if (!frog || detainedCitizens().length >= justiceCapacity()) return false;
    frog.detainedUntil = world.day + days;
    frog.sentenceReason = reason;
    frog.task = "none";
    frog.taskProgress = 0;
    frog.workplace = null;
    frog.bubble = "I will face the council.";
    frog.bubbleTimer = 5;
    const existing = world.government.cases.find((entry) => entry.frogId === frog.id && entry.status === "open");
    if (existing) {
      existing.status = "detained";
      existing.outcome = `${days}-day restorative sentence`;
    }
    return true;
  }

  function sentenceCitizen(frogId) {
    const frog = world.frogs.find((citizen) => citizen.id === Number(frogId));
    if (!frog || frog.disposition !== "chaotic" || isDetained(frog)) return;
    if (!justiceCapacity()) return toast("Build the Toadstool Holding House before issuing a detention");
    if (!detainFrog(frog, frog.sentenceReason || "Repeated civic harm", hasLaw("gentleJustice") ? 2 : 4)) return toast("Every humane holding room is occupied");
    world.government.legitimacy = clamp(world.government.legitimacy + (countBuilding("courthouse") ? 2 : -1), 0, 100);
    addChronicle(`${frog.name} entered restorative custody`, `${frog.name} will spend time in the Toadstool Holding House making amends, tending its garden, and meeting with ${countBuilding("courthouse") ? "a Canal Court magistrate" : "the Willow Circle"}.`);
    toast(`${frog.name} was safely detained`);
    assignHomesAndJobs();
    renderGovernmentCouncil();
    updateDom();
    saveWorld(false);
  }

  function releaseCitizen(frog) {
    const restored = countBuilding("rehabilitation") > 0 || hasLaw("gentleJustice");
    frog.detainedUntil = 0;
    frog.sentenceReason = "";
    frog.infamy = Math.max(0, (frog.infamy || 0) - (restored ? 4 : 2));
    if (restored && Math.random() < 0.72) {
      frog.disposition = "gentle";
      world.justice.rehabilitated += 1;
      frog.bubble = "A kinder chapter begins.";
      addChronicle(`${frog.name} returned through the lotus gate`, `${frog.name} completed a restorative plan, repaired what was damaged, and returned to the ${frog.familyName} with a community mentor.`);
    } else {
      frog.bubble = "I have another chance.";
      addChronicle(`${frog.name} completed a civic sentence`, `${frog.name} returned home under the watch of neighbors and the Canal Court.`);
    }
    frog.bubbleTimer = 5;
    world.government.cases.filter((entry) => entry.frogId === frog.id && entry.status !== "resolved").forEach((entry) => {
      entry.status = "resolved";
      entry.outcome = restored ? "Restorative plan completed" : "Sentence completed";
    });
  }

  function commitRogueAct(frog) {
    const potentialVictims = world.frogs.filter((citizen) => citizen.id !== frog.id && !isDetained(citizen));
    if (!potentialVictims.length) return;
    const victim = choose(potentialVictims);
    const offenses = [
      { name: "wrecked a reed cart", loss: "reeds", amount: 7, harm: 5 },
      { name: "stole the market lantern purse", loss: "flies", amount: 12, harm: 3 },
      { name: "started a fight by the ferry bell", loss: "berries", amount: 5, harm: 12 },
      { name: "smashed a council pottery display", loss: "clay", amount: 6, harm: 7 },
    ];
    const offense = choose(offenses);
    world.resources[offense.loss] = Math.max(0, (world.resources[offense.loss] || 0) - offense.amount);
    victim.health = clamp((victim.health ?? 100) - offense.harm, 0, 100);
    victim.joy = clamp(victim.joy - 13, 0, 100);
    frog.infamy = (frog.infamy || 0) + 1;
    frog.sentenceReason = offense.name;
    frog.bubble = "Chaos!";
    frog.bubbleTimer = 4;
    victim.bubble = "What a fright!";
    victim.bubbleTimer = 4;
    const incident = { id: `${world.day}-${frog.id}-${world.justice.totalIncidents}`, frogId: frog.id, victimId: victim.id, offense: offense.name, day: world.day };
    world.justice.totalIncidents += 1;
    world.justice.incidents.unshift(incident);
    world.justice.incidents = world.justice.incidents.slice(0, 40);
    world.government.cases.unshift({ ...incident, status: "open", outcome: "Awaiting review" });
    world.government.cases = world.government.cases.slice(0, 40);
    world.government.legitimacy = clamp(world.government.legitimacy - 3, 0, 100);
    const caught = justiceCapacity() > detainedCitizens().length && (staffedBuildingCount("police") > 0 || safety() >= 68);
    if (caught) detainFrog(frog, offense.name, hasLaw("gentleJustice") ? 2 : 4);
    addChronicle(`${frog.name} caused trouble`, `${frog.name} ${offense.name} and hurt ${victim.name}. ${caught ? "The Lilypad Watch intervened and opened a restorative case." : "The case remains open because the kingdom lacks staffed justice capacity."}`);
    toast(caught ? `${frog.name} was stopped by the Watch` : `${frog.name} caused trouble near ${victim.name}`);
  }

  function processJusticeDay() {
    world.frogs.filter((frog) => frog.detainedUntil && frog.detainedUntil <= world.day).forEach(releaseCitizen);
    const rogueFrogs = world.frogs.filter((frog) => isAdult(frog) && frog.disposition === "chaotic" && !isDetained(frog));
    for (const frog of rogueFrogs) {
      const distress = (100 - frog.joy + 100 - frog.social) / 200;
      const prevention = clamp(safety() / 180 + (hasLaw("gentleJustice") ? 0.08 : 0) + (countBuilding("meetinghouse") ? 0.05 : 0), 0, 0.74);
      if (Math.random() < (0.08 + distress * 0.1 + Math.min(0.08, (frog.infamy || 0) * 0.015)) * (1 - prevention)) commitRogueAct(frog);
    }
    world.government.legitimacy = clamp(world.government.legitimacy + (harmony() > 72 && safety() > 70 ? 0.5 : -0.1), 0, 100);
  }

  function enactLaw(lawId) {
    const law = REALM_LAWS.find((entry) => entry.id === lawId);
    if (!law || hasLaw(law.id) || law.era > currentEra()) return;
    if (!canAfford({ cost: law.cost })) return toast(`The charter needs ${formatCost(law.cost)}`);
    spend(law.cost);
    world.government.laws.push(law.id);
    world.government.legitimacy = clamp(world.government.legitimacy + 5, 0, 100);
    addChronicle(`${law.name} became law`, `${governmentDisplayName()} adopted the charter after public testimony beneath the bellflowers. ${law.description}`);
    toast(`${law.name} enacted`);
    renderGovernmentCouncil();
    updateDom();
    saveWorld(false);
  }

  function iso(x, y, elevation = 0) {
    const originY = H > W ? 220 : 128;
    return {
      x: W / 2 + view.x + (x - y) * TILE_W * 0.5 * view.zoom,
      y: originY + view.y + (x + y) * TILE_H * 0.5 * view.zoom - elevation * view.zoom,
    };
  }

  function screenToTile(screenX, screenY) {
    const point = screenToWorld(screenX, screenY);
    return { x: Math.floor(point.x), y: Math.floor(point.y) };
  }

  function screenToWorld(screenX, screenY) {
    const originY = H > W ? 220 : 128;
    const x = (screenX - W / 2 - view.x) / view.zoom;
    const y = (screenY - originY - view.y) / view.zoom;
    const gridX = (x / (TILE_W * 0.5) + y / (TILE_H * 0.5)) * 0.5;
    const gridY = (y / (TILE_H * 0.5) - x / (TILE_W * 0.5)) * 0.5;
    return { x: gridX, y: gridY };
  }

  function zoomAt(screenX, screenY, amount) {
    const worldPoint = screenToWorld(screenX, screenY);
    const nextZoom = clamp(view.targetZoom + amount, 0.5, 1.9);
    const originY = H > W ? 220 : 128;
    view.targetX = screenX - W / 2 - (worldPoint.x - worldPoint.y) * TILE_W * 0.5 * nextZoom;
    view.targetY = screenY - originY - (worldPoint.x + worldPoint.y) * TILE_H * 0.5 * nextZoom;
    view.targetZoom = nextZoom;
  }

  function focusMapPoint(gridX, gridY, zoom = 1.42) {
    const originY = H > W ? 220 : 128;
    view.targetZoom = clamp(zoom, 0.5, 1.9);
    view.targetX = -(gridX - gridY) * TILE_W * 0.5 * view.targetZoom;
    view.targetY = H * 0.54 - originY - (gridX + gridY) * TILE_H * 0.5 * view.targetZoom;
  }

  function focusSelection() {
    const selected = state.selected;
    if (selected.type === "frog" || selected.type === "tadpole") {
      focusMapPoint(selected.value.fx, selected.value.fy, 1.62);
      return;
    }
    if (selected.type === "building") {
      const [width, height] = footprintOf(selected.value);
      focusMapPoint(selected.value.x + width * 0.5, selected.value.y + height * 0.5, width * height > 2 ? 1.28 : 1.58);
      return;
    }
    const willow = findBuilding(["willow"], 15, 12);
    focusMapPoint(willow?.x + 0.5 || 10.5, willow?.y + 0.5 || 12.5, 1.45);
  }

  function eraPalette() {
    const landscape = ERA_LANDSCAPES[currentEra()] || ERA_LANDSCAPES[0];
    return { ...landscape, flowers: SEASONS[world?.season || 0].flowers };
  }

  function update(dt) {
    if (state.mode !== "playing" || !world) return;
    state.time += dt;
    world.playedSeconds += dt;
    view.zoom = damp(view.zoom, view.targetZoom, 0.002, dt);
    view.x = damp(view.x, view.targetX, 0.004, dt);
    view.y = damp(view.y, view.targetY, 0.004, dt);
    Object.keys(world.actionCooldowns || {}).forEach((action) => {
      world.actionCooldowns[action] = Math.max(0, world.actionCooldowns[action] - dt);
    });

    world.hour += dt * 0.18;
    if (world.hour >= 24) {
      world.hour -= 24;
      world.day += 1;
      advanceGenerations();
      const previousSeason = world.season;
      world.season = Math.floor((world.day - 1) / 4) % SEASONS.length;
      if (world.season !== previousSeason) {
        addChronicle(`${SEASONS[world.season].name} begins`, "The wetlands changed color overnight, and every district woke to a new season.");
        toast(`${SEASONS[world.season].name} has arrived`);
      }
      if (world.flags.palaceBuiltDay !== null && world.day > world.flags.palaceBuiltDay) world.flags.palaceDay = true;
    }

    world.weather.timer -= dt;
    if (world.weather.timer <= 0) changeWeather();
    if (world.disaster) {
      world.disaster.timer -= dt;
      if (world.disaster.timer <= 0) endDisaster();
    }

    state.productionTimer += dt;
    if (state.productionTimer >= 1) {
      produceResources(state.productionTimer);
      state.productionTimer = 0;
    }

    for (const frog of world.frogs) updateFrog(frog, dt);
    for (const tadpole of world.tadpoles) {
      tadpole.wiggle += dt * 5;
      tadpole.bubbleTimer = Math.max(0, tadpole.bubbleTimer - dt);
    }
    state.arrivalTimer -= dt;
    if (state.arrivalTimer <= 0) {
      state.arrivalTimer = 18 + Math.random() * 12;
      tryWelcomeFrog();
    }

    state.eventTimer -= dt;
    if (state.eventTimer <= 0) {
      state.eventTimer = 48 + Math.random() * 38;
      triggerWorldEvent();
    }

    checkQuest();
    checkVictory();
    updateMusic();

    state.autosaveTimer += dt;
    if (state.autosaveTimer >= 12) {
      state.autosaveTimer = 0;
      saveWorld(false);
    }

    state.domTimer += dt;
    if (state.domTimer >= 0.25) {
      state.domTimer = 0;
      updateDom();
    }
  }

  function changeWeather() {
    const roll = Math.random();
    const next = roll < 0.38 ? "rain" : roll < 0.58 ? "mist" : roll < 0.72 ? "fireflies" : "clear";
    world.weather = { type: next, timer: 36 + Math.random() * 34 };
    const names = { rain: "Silver rain", mist: "Morning mist", fireflies: "Firefly bloom", clear: "Clear skies" };
    toast(names[next]);
    if (next === "rain") addChronicle("Silver rain crossed the marsh", "The berry fields drank deeply, and every frog went outside to listen.");
  }

  function produceResources(seconds) {
    const rainBonus = world.weather.type === "rain" ? 1.35 : 1;
    const droughtFactor = world.disaster?.type === "drought" ? 0.32 : 1;
    const floodFactor = world.disaster?.type === "flood" ? 0.72 : 1;
    const festivalBonus = world.flags.festivalTimer > 0 ? 1.3 : 1;
    world.flags.festivalTimer = Math.max(0, (world.flags.festivalTimer || 0) - seconds);
    forEachTile((tile) => {
      if (!tile.building?.active) return;
      const id = tile.building.id;
      if (id === "berry") world.resources.berries += 0.32 * seconds * rainBonus * droughtFactor;
      if (id === "apiary") {
        world.resources.berries += 0.16 * seconds * rainBonus * staffedMultiplier(tile.building);
        world.resources.flies += 0.12 * seconds * staffedMultiplier(tile.building);
      }
      if (id === "reedbed") world.resources.reeds += 0.4 * seconds * rainBonus * staffedMultiplier(tile.building);
      if (id === "duckweed") world.resources.berries += 0.26 * seconds * rainBonus * droughtFactor * staffedMultiplier(tile.building);
      if (id === "flyfarm") world.resources.flies += 0.46 * seconds * festivalBonus;
      if (id === "library") world.resources.knowledge += 0.18 * seconds * staffedMultiplier(tile.building);
      if (id === "school") world.resources.knowledge += 0.21 * seconds * staffedMultiplier(tile.building);
      if (id === "postoffice") world.resources.flies += 0.24 * seconds * staffedMultiplier(tile.building);
      if (id === "observatory") world.resources.knowledge += 0.25 * seconds * (nightAmount() > 0.25 ? 1.5 : 1) * staffedMultiplier(tile.building);
      if (id === "workshop") world.resources.reeds += 0.24 * seconds * staffedMultiplier(tile.building);
      if (id === "ferry") world.resources.flies += 0.16 * seconds * staffedMultiplier(tile.building);
      if (id === "floatingmarket" && world.resources.berries >= 1) {
        world.resources.berries -= 0.12 * seconds;
        world.resources.flies += 0.62 * seconds * staffedMultiplier(tile.building);
      }
      if (id === "market" && world.resources.berries >= 1) {
        world.resources.berries -= 0.16 * seconds;
        world.resources.flies += 0.72 * seconds;
      }
      if (id === "cafe" && world.resources.berries >= 0.2) world.resources.berries -= 0.08 * seconds;
      if (id === "bakery" && world.resources.berries >= 0.2) {
        world.resources.berries -= 0.07 * seconds;
        world.resources.flies += 0.32 * seconds * staffedMultiplier(tile.building);
      }
      const eraOutput = {
        foragercamp: ["lore", 0.12],
        fishingcamp: ["lore", 0.1],
        granary: ["grain", 0.19],
        cottage: ["clay", 0.055],
        claypit: ["clay", 0.32],
        school: ["grain", 0.07],
        grainterrace: ["grain", 0.31],
        foundry: ["iron", 0.18],
        ironbog: ["iron", 0.3],
        windmill: ["grain", 0.23],
        castle: ["crowns", 0.16],
        guildhall: ["crowns", 0.12],
        royalmint: ["crowns", 0.3],
        printing: ["parchment", 0.18],
        university: ["parchment", 0.12],
        papermill: ["parchment", 0.3],
        factory: ["steam", 0.2],
        boilerworks: ["steam", 0.32],
        powerstation: ["energy", 0.22],
        solarlily: ["energy", 0.34],
        computerlab: ["data", 0.2],
        robotics: ["data", 0.15],
        datagrove: ["data", 0.32],
        rocketlab: ["stardust", 0.12],
        spaceport: ["stardust", 0.08],
        starpond: ["stardust", 0.25],
      }[id];
      if (eraOutput) world.resources[eraOutput[0]] += eraOutput[1] * seconds * staffedMultiplier(tile.building) * floodFactor;
      const definition = buildingDefinition(id);
      if (definition?.outputs) {
        for (const [resource, rate] of Object.entries(definition.outputs)) world.resources[resource] += rate * seconds * staffedMultiplier(tile.building) * floodFactor;
      }
    });
    produceTaskResources(seconds);
    world.resources.flies = Math.max(0, world.resources.flies);
    world.resources.berries = Math.max(0, world.resources.berries);
    world.resources.reeds = Math.max(0, world.resources.reeds);
    world.resources.knowledge = Math.max(0, world.resources.knowledge);
    Object.keys(world.resources).forEach((key) => { world.resources[key] = Math.max(0, world.resources[key]); });
  }

  function produceTaskResources(seconds) {
    for (const frog of world.frogs) {
      if (!isAdult(frog) || isDetained(frog) || !frog.task || frog.task === "none") continue;
      const task = CIVIC_TASKS.find((entry) => entry.id === frog.task);
      if (!task || (task.era || 0) > currentEra()) continue;
      const aptitude = frog.attributes?.[task.attribute] || 50;
      const mastery = frog.taskMastery?.[task.id] || 0;
      const educationBoost = hasLaw("schoolBell") ? 0.1 : 0;
      const crystalBoost = hasLaw("openCrystalnet") && ["knowledge", "data"].includes(task.resource) ? 0.22 : 0;
      const efficiency = 0.55 + aptitude / 100 + Math.min(0.25, mastery * 0.035) + educationBoost + crystalBoost;
      if (task.resource) world.resources[task.resource] += task.rate * seconds * efficiency;
      if (task.secondary) world.resources[task.secondary] += task.rate * seconds * efficiency * 0.32;
      if (task.eraResource) world.resources[ERAS[currentEra()].resource] += task.rate * seconds * efficiency;
      if (task.effect === "education") world.frogs.filter((child) => !isAdult(child)).forEach((child) => { child.joy = clamp(child.joy + task.rate * seconds, 0, 100); });
      if (task.effect === "health") frog.health = clamp((frog.health ?? 100) + task.rate * seconds * 0.25, 0, 100);
      if (task.effect === "safety") world.government.legitimacy = clamp(world.government.legitimacy + task.rate * seconds * 0.012, 0, 100);
      if (task.effect === "justice") world.government.cases.filter((entry) => entry.status === "open").slice(0, 1).forEach((entry) => { entry.progress = (entry.progress || 0) + task.rate * seconds * efficiency; });
      if (task.effect === "legitimacy") world.government.legitimacy = clamp(world.government.legitimacy + task.rate * seconds * 0.018, 0, 100);
      frog.taskProgress = (frog.taskProgress || 0) + seconds * efficiency;
      if (task.milestone && frog.taskProgress >= task.milestone) {
        frog.taskProgress -= task.milestone;
        frog.taskMastery ||= {};
        frog.taskMastery[task.id] = mastery + 1;
        if (task.attribute) frog.attributes[task.attribute] = clamp(frog.attributes[task.attribute] + 1, 1, 100);
        world.government.legitimacy = clamp(world.government.legitimacy + 1, 0, 100);
        frog.bubble = "Task complete!";
        frog.bubbleTimer = 4;
        addChronicle(`${frog.name} completed a civic mission`, `${frog.name} ${task.story}. Mastery rank ${frog.taskMastery[task.id]} earned.`);
        toast(`${frog.name} completed ${task.name}`);
      }
    }
  }

  function staffedMultiplier(building) {
    const worker = world.frogs.find((frog) => frog.workplace?.x === building.x && frog.workplace?.y === building.y && !isDetained(frog));
    if (!worker) return 0.45;
    const specialization = building.specialization;
    const specializationBoost = ["abundance", "precision"].includes(specialization) ? 0.3 : specialization === "academy" ? 0.16 : 0;
    const lawBoost = hasLaw("artisanCharter") && ["industry", "food"].includes(buildingDefinition(building.id)?.category) ? 0.12 : 0;
    return jobEfficiency(worker) * (1 + ((building.level || 1) - 1) * 0.18 + specializationBoost + lawBoost);
  }

  function updateFrog(frog, dt) {
    frog.hunger = clamp(frog.hunger + dt * 0.34, 0, 100);
    frog.energy = clamp(frog.energy - dt * 0.18, 0, 100);
    frog.social = clamp(frog.social - dt * (frog.personality === "Bubbly" ? 0.3 : 0.2), 0, 100);
    frog.joy = clamp(frog.joy - dt * 0.055 + beautyNear(frog.fx, frog.fy) * dt * 0.012, 0, 100);
    if (frog.illness) {
      frog.energy = clamp(frog.energy - dt * 0.2, 0, 100);
      frog.joy = clamp(frog.joy - dt * 0.12, 0, 100);
    }
    if (world.weather.type === "rain") frog.joy = clamp(frog.joy + dt * 0.18, 0, 100);
    if (world.flags.festivalTimer > 0) {
      frog.joy = clamp(frog.joy + dt * 0.6, 0, 100);
      frog.social = clamp(frog.social + dt * 0.75, 0, 100);
    }

    frog.thinkTimer -= dt;
    frog.blink -= dt;
    frog.bubbleTimer = Math.max(0, frog.bubbleTimer - dt);
    if (frog.blink <= 0) frog.blink = 2 + Math.random() * 3;
    if (frog.thinkTimer <= 0) chooseFrogDestination(frog);

    if (frog.target) {
      const dx = frog.target.x + 0.5 - frog.fx;
      const dy = frog.target.y + 0.5 - frog.fy;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.06) arriveFrog(frog);
      else {
        const speed = (0.8 + (frog.personality === "Sleepy" ? -0.15 : 0.1)) * (frog.illness ? 0.68 : 1);
        frog.fx += dx / distance * speed * dt;
        frog.fy += dy / distance * speed * dt;
        frog.hop += dt * 9;
      }
    } else frog.hop += dt * 2;
  }

  function chooseFrogDestination(frog) {
    frog.thinkTimer = 4 + Math.random() * 5;
    let preferred = null;
    if (isDetained(frog)) preferred = findBuilding(["rehabilitation", "jail"], frog.fx, frog.fy);
    else if (frog.illness) preferred = findBuilding(["medbay", "hospital", "vaccinelab", "apothecary", "infirmary", "clinic", "healerhut"], frog.fx, frog.fy) || frog.home;
    else if (frog.hunger > 62) preferred = findBuilding(["cafe", "bakery", "berry", "duckweed", "floatingmarket"], frog.fx, frog.fy);
    else if (frog.energy < 28 && frog.home) preferred = frog.home;
    else if (frog.social < 38) preferred = findBuilding(["stage", "market", "floatingmarket", "willow", ...BUILDINGS.filter((building) => building.category === "beauty").map((building) => building.id)], frog.fx, frog.fy);
    else if (frog.workplace && Math.random() < 0.62) preferred = frog.workplace;
    else preferred = randomWalkableTile();
    if (preferred) frog.target = { x: preferred.x, y: preferred.y };
  }

  function arriveFrog(frog) {
    frog.x = frog.target.x;
    frog.y = frog.target.y;
    frog.fx = frog.x + 0.5;
    frog.fy = frog.y + 0.5;
    const building = tileAt(frog.x, frog.y)?.building;
    if (["cafe", "bakery", "berry", "duckweed", "floatingmarket"].includes(building?.id)) {
      if (world.resources.berries >= 1) world.resources.berries -= 1;
      frog.hunger = Math.max(0, frog.hunger - 56);
      frog.joy = clamp(frog.joy + 8, 0, 100);
      frog.bubble = "Yum!";
    } else if (building && ["lily", "cottage", "loglodge", "houseboat", "castle"].includes(building.id)) {
      frog.energy = clamp(frog.energy + 48, 0, 100);
      frog.bubble = "Zzz";
    } else if (building && (["stage", "market", "floatingmarket", "willow"].includes(building.id) || buildingDefinition(building.id)?.category === "beauty")) {
      frog.social = clamp(frog.social + 36, 0, 100);
      frog.joy = clamp(frog.joy + 7 + (buildingDefinition(building.id)?.beauty || 0) * 0.45, 0, 100);
      if (building.id === "lotusspa") frog.energy = clamp(frog.energy + 38, 0, 100);
      frog.bubble = choose(["Lovely!", "Hello!", "Ribbit!", "So pretty"]);
      makeFriendNearby(frog);
    } else if (building?.id === "library") {
      frog.joy = clamp(frog.joy + 5, 0, 100);
      frog.bubble = "New idea!";
    } else if (building && ["healerhut", "clinic", "infirmary", "apothecary", "hospital", "vaccinelab", "medbay"].includes(building.id)) {
      frog.health = clamp((frog.health ?? 100) + 10, 0, 100);
      if (frog.illness) frog.illness.daysLeft -= 0.45;
      frog.bubble = frog.illness ? "Warm pondwater helps" : "Healthy checkup!";
    }
    frog.bubbleTimer = 2;
    frog.target = null;
  }

  function makeFriendNearby(frog) {
    for (const other of world.frogs) {
      if (other.id === frog.id || Math.hypot(other.fx - frog.fx, other.fy - frog.fy) > 2) continue;
      frog.friendships[other.id] = (frog.friendships[other.id] || 0) + 1;
      other.friendships[frog.id] = (other.friendships[frog.id] || 0) + 1;
      other.social = clamp(other.social + 16, 0, 100);
      break;
    }
  }

  function beautyNear(x, y) {
    let beauty = 0;
    forEachTile((tile, tx, ty) => {
      if (!tile.building || Math.hypot(tx + 0.5 - x, ty + 0.5 - y) > 3.2) return;
      const definition = buildingDefinition(tile.building.id);
      beauty += (definition?.beauty || 0) * 0.7;
    });
    return beauty;
  }

  function findBuilding(ids, fromX, fromY) {
    let best = null;
    let bestDistance = Infinity;
    forEachTile((tile, x, y) => {
      if (!tile.building || !ids.includes(tile.building.id)) return;
      const distance = Math.hypot(x - fromX, y - fromY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x, y };
      }
    });
    return best;
  }

  function randomWalkableTile() {
    const choices = [];
    forEachTile((tile, x, y) => {
      if (isTileUnlocked(x, y) && !tile.occupiedBy && (tile.terrain === "grass" || ["bridge", "lily", "ferry", "houseboat", "duckweed", "floatingmarket", "observatory", "lotusspa", "nursery", "waterstage", "fishingcamp", "tradeharbor", "powerstation", "monastery"].includes(tile.building?.id))) choices.push({ x, y });
    });
    return choose(choices);
  }

  function tryWelcomeFrog() {
    if (totalPopulation() >= housingCapacity() || world.resources.berries < 6 || harmony() < 48) return;
    world.resources.berries -= 6;
    const home = findOpenHome();
    const frog = spawnFrog(home?.x || 3, home?.y || 6);
    assignHomesAndJobs();
    frog.bubble = "I'm home!";
    frog.bubbleTimer = 3;
    toast(`${frog.name} moved to Mossbell`);
  }

  function findOpenHome() {
    const occupancy = new Map();
    world.frogs.forEach((frog) => {
      if (!frog.home) return;
      const key = `${frog.home.x},${frog.home.y}`;
      occupancy.set(key, (occupancy.get(key) || 0) + 1);
    });
    let result = null;
    forEachTile((tile, x, y) => {
      if (result || !tile.building) return;
      const definition = buildingDefinition(tile.building.id);
      if (!definition?.capacity) return;
      if ((occupancy.get(`${x},${y}`) || 0) < buildingCapacity(tile.building, definition)) result = { x, y };
    });
    return result;
  }

  function assignHomesAndJobs() {
    const homes = [];
    const jobs = [];
    forEachTile((tile, x, y) => {
      if (!tile.building) return;
      const definition = buildingDefinition(tile.building.id);
      if (definition?.capacity) homes.push({ x, y, id: definition.id, capacity: buildingCapacity(tile.building, definition), familyHome: Boolean(definition.familyHome), familyId: null, residents: [] });
      if (definition?.job) jobs.push({ x, y, role: definition.job, building: definition.name });
    });

    world.frogs.forEach((frog) => { frog.home = null; });
    const families = new Map();
    world.frogs.forEach((frog) => {
      if (!families.has(frog.familyId)) families.set(frog.familyId, []);
      families.get(frog.familyId).push(frog);
    });
    for (const [familyId, members] of families) {
      let waiting = [...members];
      const sharedHomes = homes.filter((home) => home.familyHome && home.familyId === null).sort((a, b) => b.capacity - a.capacity);
      for (const home of sharedHomes) {
        if (!waiting.length) break;
        home.familyId = familyId;
        const movingIn = waiting.splice(0, home.capacity);
        movingIn.forEach((frog) => {
          frog.home = { x: home.x, y: home.y };
          home.residents.push(frog.id);
        });
      }
      const privateLilies = homes.filter((home) => home.id === "lily" && home.residents.length === 0);
      waiting.forEach((frog, index) => {
        const home = privateLilies[index];
        if (!home) return;
        frog.home = { x: home.x, y: home.y };
        home.familyId = familyId;
        home.residents.push(frog.id);
      });
    }

    const occupiedJobs = new Set();
    world.frogs.forEach((frog) => {
      frog.workplace = null;
      if (!isAdult(frog)) {
        frog.jobPreference = undefined;
        updateEducation(frog);
        return;
      }
      if (isDetained(frog)) {
        frog.role = "Detained Citizen";
        return;
      }
      frog.role = frog.id === world.frogs.find((citizen) => isAdult(citizen))?.id ? "Council Keeper" : "Neighbor";
      if (frog.jobPreference === null) {
        frog.role = "Neighbor";
        return;
      }
      if (!frog.jobPreference) return;
      const key = `${frog.jobPreference.x},${frog.jobPreference.y}`;
      const job = jobs.find((entry) => entry.x === frog.jobPreference.x && entry.y === frog.jobPreference.y);
      if (!job || occupiedJobs.has(key)) {
        frog.jobPreference = undefined;
        return;
      }
      frog.workplace = { x: job.x, y: job.y };
      frog.role = job.role;
      occupiedJobs.add(key);
    });
    world.frogs.forEach((frog) => {
      if (!isAdult(frog) || frog.workplace || frog.jobPreference === null) return;
      const job = jobs.filter((entry) => !occupiedJobs.has(`${entry.x},${entry.y}`)).sort((a, b) => jobEfficiency(frog, b.role) - jobEfficiency(frog, a.role))[0];
      if (!job) return;
      frog.workplace = { x: job.x, y: job.y };
      frog.role = job.role;
      occupiedJobs.add(`${job.x},${job.y}`);
    });
  }

  function triggerWorldEvent() {
    const events = ["merchant", "picnic", "tadpoles", "moonberries", "lanternFire", "lostTadpoles", "drought", "flood"];
    if (world.government?.kind === "monarchy") events.push("royalAudience", "royalAudience");
    if (countBuilding("meetinghouse")) events.push("assemblyVote");
    if (countBuilding("parliament")) events.push("parliamentDebate");
    if (countBuilding("museum")) events.push("museumDiscovery");
    if (countBuilding("lunarembassy")) events.push("orbitalDelegation");
    if (BUILDINGS.some((building) => building.category === "beauty" && building.id !== "remove" && countBuilding(building.id))) events.push("cultureNight", "cultureNight");
    if (ERAS[currentEra()].diseasePressure >= 0.85) events.push("outbreak");
    if (ERAS[currentEra()].diseasePressure >= 1.35) events.push("outbreak");
    const event = choose(events);
    if ((event === "drought" || event === "flood") && world.disaster) return;
    if ((event === "drought" || event === "flood") && !world.disaster) {
      startDisaster(event);
    } else if (event === "outbreak") {
      startOutbreak();
    } else if (event === "cultureNight") {
      const landmarks = BUILDINGS.filter((building) => building.category === "beauty" && building.id !== "remove" && countBuilding(building.id));
      const landmark = choose(landmarks);
      const celebrations = {
        wildflower: ["The meadow song circle", "Families wove flower crowns and taught the oldest migration song to the youngest frogs."],
        garden: ["Ribbon Garden bloom day", "Every household contributed one ribbon, turning the garden paths into a fluttering family history."],
        fountain: ["The wishing-water evening", "Citizens whispered hopes into the fountain while musicians played from the canal steps."],
        topiary: ["The Great Hedge Parade", "Gardeners dressed the frogberry topiaries in tiny hats and awarded the crowd's favorite a golden watering can."],
        canalplaza: ["The Pearl Plaza mosaic feast", "Long tables followed the colored tiles while dancers traced the old waterways across the square."],
        rosegallery: ["The muddy crown exhibition", "The Royal Gallery displayed portraits of rulers repairing bridges, teaching classes, and serving soup."],
        sculpturecourt: ["The winking statue debate", "Half the city insisted the marble frog winked; the other half returned after sunset to check again."],
        carousel: ["The midnight carousel", "Factory whistles joined the carousel organ while elders rode brass lilies beside their grandchildren."],
        aurorapark: ["Aurora Commons concert", "Accessible light paths pulsed with the orchestra, and every district added a verse to the city song."],
        hologarden: ["The memory blossom festival", "Crystal flowers replayed voices from every era, letting descendants hear long-ago family laughter."],
        moonpark: ["Mossbell's first zero-gravity picnic", "Berry tarts floated through the dome while astro-frogs practiced catching crumbs with tiny nets."],
      };
      const [title, copy] = celebrations[landmark.id] || [`A gathering at ${landmark.name}`, "Citizens shared music, food, stories, and a long peaceful evening together."];
      world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy + 8, 0, 100); frog.social = clamp(frog.social + 10, 0, 100); });
      world.government.legitimacy = clamp(world.government.legitimacy + 1, 0, 100);
      addChronicle(title, copy);
      toast(`${landmark.name} hosted a cultural celebration`);
    } else if (event === "royalAudience") {
      const ruler = monarch();
      world.resources.knowledge += 10;
      world.government.legitimacy = clamp(world.government.legitimacy + 3, 0, 100);
      world.frogs.sort(() => Math.random() - 0.5).slice(0, 3).forEach((frog) => { frog.social = clamp(frog.social + 10, 0, 100); });
      addChronicle("The open crown audience", `${ruler?.name || "The Crownkeeper"} moved the throne into the castle garden and heard petitions about bridges, schools, berry prices, and one mysteriously loud duck.`);
      toast("The Crown held a public audience");
    } else if (event === "assemblyVote") {
      world.resources.knowledge += 12;
      world.government.legitimacy = clamp(world.government.legitimacy + 2, 0, 100);
      addChronicle("The Bellflower vote", "District delegates debated until the speaking bell closed, then funded shaded rest pools for workers and elders.");
      toast("The Assembly passed a civic measure");
    } else if (event === "parliamentDebate") {
      world.resources.energy += 8;
      world.government.legitimacy = clamp(world.government.legitimacy + 4, 0, 100);
      addChronicle("Crown and Commons agreed", "After a lively broadcast debate, Parliament and the Crown approved clean night ferries for every district.");
      toast("A parliamentary compromise delighted Mossbell");
    } else if (event === "museumDiscovery") {
      world.resources.knowledge += 22;
      addChronicle("A founding cup was identified", "Museum curators proved that a chipped clay cup belonged to Mossbell's first communal picnic. Families queued all day to see it.");
      toast("The museum revealed a piece of Mossbell history");
    } else if (event === "orbitalDelegation") {
      world.resources.stardust += 7;
      world.resources.data += 12;
      addChronicle("The first off-world wetland summit", "Ambassadors compared moonwater, migration songs, and habitat plans beneath the Lunar Embassy's living star map.");
      toast("Orbital delegates arrived in peace");
    } else if (event === "merchant") {
      world.resources.flies += 28;
      world.resources.reeds += 8;
      addChronicle("The reedboat merchant arrived", "A traveler from Dapplefen traded colored thread for Mossbell stories.");
      toast("A reedboat merchant brought supplies");
    } else if (event === "picnic") {
      world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy + 9, 0, 100); frog.social = clamp(frog.social + 12, 0, 100); });
      addChronicle("An unplanned picnic", "Someone opened a berry basket beneath the willow. Soon the whole council was there.");
      toast("The frogs held a berry picnic");
    } else if (event === "tadpoles") {
      world.resources.knowledge += 8;
      addChronicle("Tadpole questions", "The youngest visitors asked why the moon follows the pond. The library began a new astronomy shelf.");
      toast("Curious tadpoles inspired the scholars");
    } else if (event === "moonberries") {
      world.resources.berries += 18;
      addChronicle("Moonberry bloom", "Silver berries appeared along the waterline before dawn.");
      toast("A moonberry bloom filled the baskets");
    } else if (event === "lanternFire") {
      if (staffedBuildingCount("firehouse") > 0) {
        world.resources.knowledge += 5;
        world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy + 3, 0, 100); });
        addChronicle("Croak & Ladder answered the bell", "A lantern singed a market awning, but the Firekeepers arrived in their lily-petal water cart before one reed was lost.");
        toast("Firekeepers protected the market");
      } else {
        world.resources.reeds = Math.max(0, world.resources.reeds - 12);
        world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy - 5, 0, 100); });
        addChronicle("A lantern flare", "Neighbors formed a bucket line, but twelve bundles of building reeds were lost. A firehouse would protect the district.");
        toast("Lantern flare: 12 reeds lost");
      }
    } else if (staffedBuildingCount("police") > 0) {
      world.resources.flies += 10;
      world.frogs.forEach((frog) => { frog.social = clamp(frog.social + 4, 0, 100); });
      addChronicle("The Watch found the tadpoles", "Constables followed a trail of cookie crumbs and returned every young explorer before supper.");
      toast("Lilypad Watch brought everyone home");
    } else {
      world.resources.flies = Math.max(0, world.resources.flies - 15);
      addChronicle("The great tadpole search", "The whole village searched until moonrise. Everyone returned safely, but fifteen glowflies were spent on boats and lanterns.");
      toast("Search party: 15 flies spent");
    }
  }

  function startOutbreak() {
    const disease = choose(eraDiseases());
    if (!disease) return;
    const infrastructure = healthInfrastructure();
    const healthy = world.frogs.filter((frog) => !frog.illness && frog.immunity <= 0);
    const exposed = Math.max(1, Math.round((1 + world.frogs.length / 12) * ERAS[currentEra()].diseasePressure * (1 - infrastructure.prevention * 0.75)));
    const patients = healthy.sort(() => Math.random() - 0.5).slice(0, exposed);
    patients.forEach((frog) => {
      frog.illness = { id: disease.id, name: disease.name, icon: disease.icon, daysLeft: disease.days };
      frog.joy = clamp(frog.joy - 10, 0, 100);
      frog.bubble = `${disease.icon} Rest day`;
      frog.bubbleTimer = 5;
      world.healthHistory.push({ day: world.day, frog: frog.name, disease: disease.name });
    });
    if (!patients.length) {
      addChronicle(`${disease.name} was contained`, "Public health workers noticed the warning signs early and stopped the outbreak at the district gates.");
      toast("Health workers contained an outbreak");
      return;
    }
    world.healthHistory = world.healthHistory.slice(-50);
    addChronicle(`${disease.name} outbreak`, `${patients.length} ${patients.length === 1 ? "citizen was" : "citizens were"} taken ill. ${infrastructure.care > 0.45 ? "Mossbell's health service opened its doors immediately." : "The council urgently recommends building and staffing a health facility."}`);
    toast(`${disease.name}: ${patients.length} sick`);
  }

  function startDisaster(type) {
    world.disaster = { type, timer: 48 + Math.random() * 34 };
    if (type === "drought") {
      const protectedFood = countBuilding("granary") * 10 + countBuilding("weathercenter") * 8 + (hasLaw("commonPantry") ? 12 : 0);
      const loss = Math.max(4, 22 - protectedFood);
      world.resources.berries = Math.max(0, world.resources.berries - loss);
      world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy - 7, 0, 100); });
      addChronicle("The Long Sun drought began", `Waterlines fell and berry growth slowed. Acorn Granaries prevented ${protectedFood} potential food loss.`);
      toast(`Drought: ${loss} berries lost`);
    } else {
      const protectedReeds = (staffedBuildingCount("firehouse") + staffedBuildingCount("police")) * 8 + countBuilding("weathercenter") * 10;
      const loss = Math.max(5, 26 - protectedReeds);
      world.resources.reeds = Math.max(0, world.resources.reeds - loss);
      world.frogs.forEach((frog) => { frog.energy = clamp(frog.energy - 8, 0, 100); });
      addChronicle("The Silverwater flood arrived", `The pond crossed its banks. Emergency crews prevented ${protectedReeds} potential material loss.`);
      toast(`Flood: ${loss} reeds damaged`);
    }
  }

  function endDisaster() {
    const name = world.disaster.type === "drought" ? "Long Sun drought" : "Silverwater flood";
    addChronicle(`${name} ended`, "Neighbors repaired paths, shared supplies, and celebrated the return of calm water.");
    toast(`${name} has ended`);
    world.disaster = null;
  }

  function checkQuest() {
    if (world.quest >= QUESTS.length) return;
    const quest = QUESTS[world.quest];
    if (!quest.check()) return;
    for (const [resource, amount] of Object.entries(quest.reward)) world.resources[resource] += amount;
    addChronicle(`Council request complete: ${quest.title}`, "The Mossbell Council rang the tiny silver bell and opened the next chapter.");
    toast(`${quest.title} complete`);
    world.quest += 1;
    assignHomesAndJobs();
    renderBuildList();
    sound(620, 0.16, "triangle", 0.045, 240);
  }

  function checkVictory() {
    if (state.victoryShown || currentEra() < 9 || countBuilding("spaceport") < 1) return;
    state.victoryShown = true;
    state.mode = "victory";
    document.getElementById("victory-copy").textContent = `${world.ruler}'s civilization crossed ten eras, from willow foragers to the first Starleap launch. Mossbell's frogs are ready to explore the stars.`;
    document.getElementById("victory-stats").innerHTML = `<div>${world.frogs.length}<br>Citizens</div><div>${Math.floor(world.resources.knowledge)}<br>Knowledge</div><div>${harmony()}%<br>Harmony</div>`;
    ui.victory.classList.remove("hide");
    saveWorld(false);
  }

  function canAfford(definition) {
    return Object.entries(definition.cost).every(([resource, amount]) => world.resources[resource] >= amount);
  }

  function spend(cost) {
    for (const [resource, amount] of Object.entries(cost)) world.resources[resource] -= amount;
  }

  function placeSelected(tileX, tileY) {
    const tile = tileAt(tileX, tileY);
    const definition = BUILDINGS.find((building) => building.id === state.selectedTool);
    if (!tile || !definition) return;
    if (!isTileUnlocked(tileX, tileY)) return toast("Purchase the next wetland expansion to build here");

    if (definition.removeTool) {
      const existing = buildingAt(tileX, tileY);
      if (!existing || existing.id === "willow") return toast("The Great Willow must remain");
      const old = buildingDefinition(existing.id);
      for (const [resource, amount] of Object.entries(old.cost || {})) world.resources[resource] += Math.floor(amount * 0.5);
      addChronicle(`${old.name} was reclaimed`, "The materials returned to the workshop for another idea.");
      clearBuildingFootprint(existing);
      assignHomesAndJobs();
      sound(240, 0.08, "sine", 0.03, -80);
      return;
    }

    if (definition.era > currentEra()) return toast(`Unlocks in Era ${definition.era}`);
    if (!canAfford(definition)) return toast("The kingdom needs more materials");
    if (definition.terrainTool) {
      if (tile.terrain !== "grass" || buildingAt(tileX, tileY)) return toast("Choose an empty grass tile");
      spend(definition.cost);
      tile.terrain = "water";
      tile.decor = Math.random();
      toast("A new pond joined the waterways");
      sound(480, 0.12, "sine", 0.035, -180);
      return;
    }
    if (!footprintCanFit(definition, tileX, tileY)) {
      const [width, height] = definition.footprint || [1, 1];
      return toast(width * height > 1 ? `${definition.name} needs an empty ${width}×${height} ${definition.terrain} site` : "That tile is occupied or has the wrong terrain");
    }
    spend(definition.cost);
    tile.building = makeBuilding(definition.id, tileX, tileY);
    reserveBuildingFootprint(tile.building);
    if (definition.id === "castle") {
      world.flags.palaceBuiltDay = world.day;
      establishMonarchy();
    }
    refreshGovernment();
    addChronicle(`${definition.name} opened`, buildingStory(definition.id));
    state.selected = { type: "building", value: tile.building };
    assignHomesAndJobs();
    toast(`${definition.name} built`);
    sound(390, 0.1, "triangle", 0.035, 180);
  }

  function buildingStory(id) {
    const stories = {
      mossnest: "The family tucked soft moss between every woven branch and hung a shell chime above the round doorway.",
      treetop: "The first rope bridge was tested by six frogs, three baskets, and one delighted tadpole at the same time.",
      booktower: "Scholar families moved into the spiral tower with telescopes, tea kettles, and enough books to bend the shelves.",
      souphall: "The kitchen's first cauldron held seven-family stew, and no visitor was allowed to leave without a warm bowl.",
      royalorchard: "Each heraldic tree was named for a district rather than a noble, by order of the new Crownkeeper.",
      teapavilion: "Poets launched folded parchment boats from the pavilion while traders compared news over rosehip tea.",
      glasshouse: "The first winter strawberry ripened beneath a brass sun lamp and was divided into twelve ceremonial slices.",
      aquaponics: "Minnows, duckweed, and berry roots found a perfect rhythm in the clean glowing terraces.",
      moonbiosphere: "Botanists planted the first moonberry beside a sealed vial of Mossbell pondwater brought from home.",
      basketry: "The weavers agreed that every useful basket should also contain at least one unnecessary decorative ribbon.",
      potterykiln: "Families pressed tiny footprints into the first batch of blue-gray tiles before the kiln doors closed.",
      carpentry: "Carpenters carved each new chair to fit frog feet, tadpole tails, or visiting snail shells equally well.",
      jewelers: "The jewelers' first moonstone brooch depicted the Great Willow instead of the royal crest.",
      mapstudio: "Cartographers left one corner of every map blank for places the next generation had not discovered yet.",
      recycler: "The Lilyworks turned broken boilers into park benches and issued a celebratory whistle at every saved part.",
      nanofab: "Its first printed object was a perfectly tiny wrench, immediately borrowed by a robotics student.",
      storycircle: "Elders lit the sheltered fire and told the story of the First Ripple until every young frog knew the refrain.",
      archive: "The archivist opened the vault with one law: every citizen may read the records that shape their life.",
      unionhall: "Workers painted the meeting hall themselves, then voted unanimously to take the afternoon off for berry pie.",
      weathercenter: "Forecasters caught the first silver-rain signal in a crystal bowl and rang every district bell before the clouds arrived.",
      astroacademy: "The first class practiced moonwalking in weighted boots while the botany students packed emergency mintleaf.",
      wildflower: "No one planted the meadow; the frogs simply promised to protect the place where the flowers had chosen to grow.",
      topiary: "Gardeners trimmed the largest hedge into a smiling frog whose leafy cheeks blush pink every spring.",
      canalplaza: "Families set one colored tile each into the plaza mosaic until the floor became a map of Mossbell.",
      rosegallery: "The gallery's most popular royal portrait shows a muddy Crownkeeper helping repair a village bridge.",
      sculpturecourt: "Artists unveiled twelve marble frogs, including one that appears to wink when viewed from the fountain.",
      carousel: "The carousel's brass lilies played an old forager song while steam fireflies circled the canopy.",
      aurorapark: "The opening concert ended with every path glowing in the colors chosen by Mossbell's children.",
      hologarden: "Visitors touched a crystal blossom and heard the voices of citizens from the First Ripple era.",
      moonpark: "Inside the dome, the first floating lily drifted upward and every astro-frog forgot their formal speech.",
      lily: "A lantern was hung beneath the leaf so its new resident could always find home.",
      cottage: "The roof was woven from reed ribbon, with a round window facing the moon.",
      loglodge: "A fallen willow limb became a warm five-bed lodge, complete with round windows and a clover chimney.",
      path: "Citizens pressed petals into the path to mark the way toward the commons.",
      bridge: "The first frog across stopped halfway to admire the reflected clouds.",
      ferry: "A bell made from a blue snail shell announced the first ferry crossing.",
      houseboat: "The new family hung three tiny hammocks beneath a roof of lotus petals.",
      reedhall: "Three families painted their handprints along the beams before sharing the longhouse's first grain supper.",
      canalhouse: "Copper gutters chimed whenever rain crossed the canal house roof.",
      manor: "The Moonrose guild raised twin turrets and planted a courtyard for every generation of the household.",
      gardenrow: "Scholars moved into the garden row with more books than furniture.",
      workerflats: "Railboat builders opened bright brick flats with hot water and a shared rooftop allotment.",
      berry: "The gardeners planted three old varieties: blushberry, dewberry, and midnight jamberry.",
      reedbed: "Reedkeepers planted soft marsh reed in tidy rows, ready for homes, bridges, and baskets.",
      flyfarm: "The ranchers promised every glowfly a warm lantern and plenty of mint pollen.",
      duckweed: "Aquafarmers anchored floating crop baskets where the sun warmed the shallows.",
      apiary: "The bumblebees accepted tiny ribbon aprons and immediately began mapping every flower in Mossbell.",
      cafe: "The first cup of dewdrop tea was served with a tiny lotus biscuit.",
      bakery: "A cinnamon snail donated the shell-shaped oven and received the very first berry bun.",
      market: "Colorful banners announced a weekly trade between every wetland district.",
      floatingmarket: "Lantern boats tied their ribbons together and opened for moonlit trading.",
      claypit: "Clay diggers found a rich blue-gray bank beneath the reeds and shaped the first weatherproof bricks.",
      grainterrace: "Villagers raised the grain above the floodline and celebrated with sunreed bread.",
      ironbog: "Bog miners rang a copper bell when the first red ironstone reached daylight.",
      royalmint: "The first petal crown bore a tiny portrait of the Great Willow instead of a ruler.",
      papermill: "The water wheel pressed its first perfect sheet of lily parchment beneath a rainbow of spray.",
      boilerworks: "Clovercoil engineers promised the brass boilers would whistle only in tune.",
      solarlily: "A field of glass petals turned together to greet the morning sun.",
      datagrove: "The crystal saplings stored their first memory: the sound of rain on the council roof.",
      starpond: "At midnight, the first silver mote of stardust condensed above the collector pond.",
      library: "Elder Puddlewick donated the first book: A Map of Places the Rain Remembers.",
      healerhut: "The herbalist hung mintleaf, mushroom silk, and a bluebell chime beside the resting mat.",
      firehouse: "Firekeepers polished the acorn alarm bell and filled the lily-petal water carts.",
      police: "The first constables promised to solve problems with patience, snacks, and very small notebooks.",
      jail: "The holding house opened with warm bunks, a supervised garden, a reading room, and a promise that custody would never erase dignity.",
      nursery: "Caregivers tied a ring of soft lily cradles where tadpoles could nap between swimming lessons.",
      school: "The school bell rang from a bluebell, calling young frogs to their first pondcraft lesson.",
      meetinghouse: "Delegates from every bank placed one carved pebble in the speaking bowl and agreed that even the smallest voice deserved a turn.",
      postoffice: "Snails and mailfrogs agreed that every letter should arrive with one pressed flower.",
      workshop: "Artisans began making bridges, lantern hooks, and very small comfortable chairs.",
      clinic: "The healers filled the shelves with lotus balm and peppermint pondwater.",
      aqueduct: "Clean spring water crossed the first copperleaf arch and flowed into the city fountains.",
      courthouse: "Magistrates opened the Canal Court with public benches, plain-language laws, and a fountain where feuding families could talk in peace.",
      infirmary: "Royal healers opened every moonstone ward to commoner and courtier alike.",
      apothecary: "Roseglass physicians labeled every remedy, every dose, and every question still unanswered.",
      sanitation: "Steam pumps cleared the canal overnight, and minnows returned by sunrise.",
      hospital: "Doctors planted a healing garden outside every bright patient window.",
      vaccinelab: "The conservatory's first crystal vaccine protected the nursery before the next Glowflu season.",
      medbay: "A bubble of regenerative moonwater healed the first astro-frog's travel-weary feet.",
      stage: "Musicians tuned acorn drums while fireflies practiced their entrance.",
      observatory: "Astronomers adjusted the pearl telescope until Saturn appeared in the moonpool.",
      castle: "The lost Moonpetal stones fit together as though they had only been waiting.",
      monastery: "The Quiet Pond order lit seven floating candles and began copying the oldest songs in waterproof ink.",
      museum: "Families brought heirlooms from every era, including the first reed basket and the chipped cup from Mossbell's founding picnic.",
      railterminal: "The first Lilyline railboat arrived exactly on time, carrying schoolchildren, berry crates, and one extremely proud conductor.",
      parliament: "Every district planted a flower beneath its seat in the glass-roofed chamber, turning debate into a living garden.",
      rehabilitation: "The lotus gate opened onto workshops, counseling pools, classrooms, and a garden built around second chances.",
      civiccore: "The Civic Memory Core published its first decision in glowing plain language so every family could understand it.",
      lunarembassy: "Delegates from orbital ponds exchanged sealed jars of home water beneath a ceiling painted with every known wetland world.",
      garden: "Every citizen chose one flower, so no two corners of the garden matched.",
      fountain: "The little frog statue granted its first wish before the mortar had finished drying.",
      lotusspa: "Warm spring water filled the lotus pools, and the first guests immediately fell asleep.",
      waterstage: "Lotus curtains opened on a puppet tale about the moon, a minnow, and one very brave raindrop.",
      playground: "The splash park opened with mushroom slides, puddle bells, and a strict no-dry-feet rule.",
      lantern: "A patient glowfly family moved in before sunset.",
      shrine: "The moon returned to the old well's reflection for the first time in generations.",
    };
    return stories[id] || "Mossbell gained a new place for stories to happen.";
  }

  function hostFestival() {
    if (countBuilding("stage") < 1) return;
    if (world.resources.berries < 18 || world.resources.flies < 35) return toast("A festival needs 18 berries and 35 flies");
    world.resources.berries -= 18;
    world.resources.flies -= 35;
    world.flags.festival = true;
    world.flags.festivalTimer = 25;
    world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy + 20, 0, 100); frog.social = clamp(frog.social + 25, 0, 100); });
    addChronicle("The First Firefly Festival", "Lanterns crossed the water like a second constellation, and every citizen danced.");
    toast("The Firefly Festival has begun");
    sound(520, 0.2, "triangle", 0.045, 260);
  }

  function performMarshAction(action) {
    const definitions = {
      forage: { era: 0, resource: "berries", amount: 6, cooldown: 7, label: "berry baskets" },
      reeds: { era: 0, resource: "reeds", amount: 7, cooldown: 8, label: "reed bundles" },
      clay: { era: 1, resource: "clay", amount: 6, cooldown: 10, label: "river clay" },
    };
    const definition = definitions[action];
    if (!definition || currentEra() < definition.era) return toast(`Unlocks in Era ${definition?.era || 1}`);
    world.actionCooldowns ||= { forage: 0, reeds: 0, clay: 0 };
    if ((world.actionCooldowns[action] || 0) > 0) return toast(`${definition.label} will be ready soon`);
    const adultHelpers = world.frogs.filter((frog) => isAdult(frog) && !frog.illness);
    const helper = adultHelpers.length ? choose(adultHelpers) : null;
    const aptitude = helper ? (helper.attributes?.strength || 50) / 100 : 0.5;
    const amount = Math.round(definition.amount * (0.85 + aptitude * 0.45));
    world.resources[definition.resource] += amount;
    world.actionCooldowns[action] = definition.cooldown;
    if (helper) {
      helper.bubble = action === "clay" ? "Perfect river clay!" : action === "reeds" ? "Fresh reeds!" : "Berry basket full!";
      helper.bubbleTimer = 3;
    }
    if (action === "clay" && !world.flags.clayIntroduced) {
      world.flags.clayIntroduced = true;
      addChronicle("The first clay bank opened", "Frogs learned to dig below the dry river crust, wash the blue-gray clay, and shape it into pottery and weatherproof bricks.");
    }
    toast(`+${amount} ${definition.label}`);
    sound(action === "clay" ? 240 : action === "reeds" ? 330 : 480, 0.12, "triangle", 0.025, 80);
    updateDom();
    saveWorld(false);
  }

  function updateMarshActions() {
    if (!ui.marshActions) return;
    ui.marshActions.querySelectorAll("[data-marsh-action]").forEach((button) => {
      const action = button.dataset.marshAction;
      const era = action === "clay" ? 1 : 0;
      const cooldown = world.actionCooldowns?.[action] || 0;
      const locked = currentEra() < era;
      button.disabled = locked || cooldown > 0;
      button.classList.toggle("is-cooling", cooldown > 0);
      const small = button.querySelector("small");
      if (small) small.textContent = locked ? `Era ${era}` : cooldown > 0 ? `${Math.ceil(cooldown)}s` : action === "clay" ? "+ clay" : action === "reeds" ? "+ reeds" : "+ berries";
    });
  }

  function addChronicle(title, text) {
    if (!world) return;
    world.chronicle.unshift({ title, text, day: world.day });
    world.chronicle = world.chronicle.slice(0, 28);
    renderChronicle();
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "game-toast";
    element.textContent = message;
    ui.toasts.appendChild(element);
    window.setTimeout(() => element.remove(), 2300);
  }

  function updateDom() {
    if (!world) return;
    const era = currentEra();
    const eraData = ERAS[era];
    ui.flies.textContent = Math.floor(world.resources.flies);
    ui.berries.textContent = Math.floor(world.resources.berries);
    ui.reeds.textContent = Math.floor(world.resources.reeds);
    ui.knowledge.textContent = Math.floor(world.resources.knowledge);
    ui.population.textContent = `${totalPopulation()}/${housingCapacity()}`;
    ui.health.textContent = `${kingdomWellbeing()}%`;
    ui.harmony.textContent = `${harmony()}%`;
    ui.safety.textContent = `${safety()}%`;
    ui.day.textContent = `Day ${world.day}`;
    ui.season.textContent = SEASONS[world.season].name;
    ui.weather.textContent = world.disaster ? (world.disaster.type === "drought" ? "Long Sun drought" : "Silverwater flood") : ({ clear: "Clear skies", rain: "Silver rain", mist: "Morning mist", fireflies: "Firefly bloom" })[world.weather.type];
    ui.eraNumber.textContent = `Era ${era}`;
    ui.eraName.textContent = `${eraData.name} · ${eraData.society}`;
    ui.eraDescription.textContent = eraData.description;
    ui.eraMotto.textContent = eraData.motto;
    ui.eraDetail.textContent = eraData.world;
    ui.eraHealthNote.textContent = `Health: ${eraData.healthNote}`;
    const eraStatus = eraRequirementStatus();
    ui.eraProgress.style.width = `${eraStatus.progress}%`;
    ui.advanceEra.disabled = !eraStatus.ready || era >= ERAS.length - 1;
    ui.advanceEra.querySelector("span").textContent = era >= ERAS.length - 1 ? "Spacefaring Society" : `Advance to ${ERAS[era + 1].name}`;
    ui.advanceEraRequirement.textContent = era >= ERAS.length - 1 ? "Mossbell has reached the stars" : eraStatus.text;
    ui.councilSummary.textContent = `${eraData.society} · ${world.frogs.filter(isAdult).length} adults · ${world.frogs.filter((frog) => !isAdult(frog)).length + world.tadpoles.length} young`;
    const ruler = monarch();
    ui.governmentSummary.textContent = world.government.kind === "monarchy" ? `${governmentDisplayName()} · ${ruler ? `Crownkeeper ${ruler.name}` : "succession council"} · ${Math.round(world.government.legitimacy)}% trust` : `${governmentDisplayName()} governs by council · ${Math.round(world.government.legitimacy)}% trust`;
    const quest = QUESTS[Math.min(world.quest, QUESTS.length - 1)];
    ui.questTitle.textContent = world.quest >= QUESTS.length ? "The Chronicle Continues" : quest.title;
    ui.questDescription.textContent = world.quest >= QUESTS.length ? "Mossbell is yours to shape for as long as you wish." : quest.description;
    ui.questReward.textContent = world.quest >= QUESTS.length ? "All council chapters complete" : `Reward: ${formatCost(quest.reward)}`;
    updateSelectedPanel();
    renderCitizenRoster();
    renderEraResources();
    updateMarshActions();
    updateBuildAffordability();
  }

  function eraRequirementStatus() {
    const requirement = ERAS[currentEra()].requirement;
    if (!requirement) return { ready: true, progress: 100, text: "Final era reached" };
    const parts = [];
    const ratios = [];
    for (const [key, amount] of Object.entries(requirement)) {
      const value = key === "population" ? totalPopulation() : key === "castle" ? countBuilding("castle") : world.resources[key] || 0;
      const label = key === "population" ? "population" : key === "castle" ? "castle" : ERAS.find((era) => era.resource === key)?.resourceName.toLowerCase() || key;
      parts.push(`${Math.floor(value)}/${amount} ${label}`);
      ratios.push(clamp(value / amount, 0, 1));
    }
    return { ready: ratios.every((ratio) => ratio >= 1), progress: Math.round(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length * 100), text: parts.join(" · ") };
  }

  function advanceEra() {
    const status = eraRequirementStatus();
    if (!status.ready || currentEra() >= ERAS.length - 1) return toast(status.text);
    world.era += 1;
    const era = ERAS[currentEra()];
    world.resources[era.resource] = world.resources[era.resource] || 0;
    refreshGovernment();
    addChronicle(`${era.name} began`, `${era.society} transformed Mossbell. ${era.description}`);
    world.frogs.forEach((frog) => { frog.joy = clamp(frog.joy + 10, 0, 100); });
    renderBuildList();
    updateDom();
    toast(currentEra() === 1 ? "Settled Shores unlocked: dig clay or build Mudbank Clay Works" : `${era.name} unlocked`);
    sound(420 + currentEra() * 35, 0.35, "triangle", 0.05, 240);
    saveWorld(false);
  }

  function renderEraResources() {
    ui.eraResources.innerHTML = ERAS.slice(0, currentEra() + 1).map((era, index) => `<div class="era-resource ${index === currentEra() ? "is-current" : ""}"><span>${era.icon}</span><small>${escapeHtml(era.resourceName)}</small><strong>${Math.floor(world.resources[era.resource] || 0)}</strong></div>`).join("");
  }

  function buyExpansion() {
    const next = EXPANSIONS[world.expansion + 1];
    if (!next) return toast("Every wetland district is already open");
    if (!Object.entries(next.cost).every(([resource, amount]) => world.resources[resource] >= amount)) return toast(`Expansion needs ${formatCost(next.cost)}`);
    spend(next.cost);
    world.expansion += 1;
    view.targetZoom = Math.max(0.7, 0.92 - world.expansion * 0.08);
    view.x = view.targetX = 0;
    view.y = view.targetY = -125;
    addChronicle(`${next.name} joined Mossbell`, "Surveyors opened new grassland and waterways for homes, services, and floating districts.");
    toast(`${next.name} unlocked`);
    sound(430, 0.24, "triangle", 0.045, 260);
    if (state.category === "expansion") renderBuildList();
    updateDom();
    saveWorld(false);
  }

  function renderBuildList() {
    if (!world) return;
    const titles = { home: "Homes & Paths", food: "Harvest & Trade", industry: "Materials & Industry", civic: "Learning, Health & Community", expansion: "Civic Wetland Expansion", beauty: "Gardens & Landmarks" };
    ui.buildTitle.textContent = titles[state.category];
    ui.buildCatalogTools.classList.toggle("hide", state.category === "expansion");
    ui.buildEraFilter.value = state.buildEraFilter;
    if (state.category === "expansion") {
      ui.buildList.innerHTML = EXPANSIONS.map((area, index) => {
        const owned = index <= world.expansion;
        const next = index === world.expansion + 1;
        const locked = index > world.expansion + 1;
        const width = area.maxX - area.minX + 1;
        const height = area.maxY - area.minY + 1;
        return `<button class="build-card expansion-card ${owned ? "is-owned" : ""} ${next ? "is-next" : ""}" data-expand-level="${index}" ${owned || locked ? "disabled" : ""}>
          <span class="build-card__top"><span class="build-card__icon">${owned ? "✓" : locked ? "🔒" : "🗺️"}</span><span class="build-card__era">${owned ? "Council owned" : next ? "Council vote" : "Survey locked"}</span></span>
          <strong>${area.name}</strong>
          <small>${width} × ${height} tiles of grassland and waterways${owned ? " are open for building." : " become available for new districts."}</small>
          <span class="build-card__cost">${owned ? "Open territory" : formatCost(area.cost)}</span>
        </button>`;
      }).join("");
      return;
    }
    const orderedBuildings = BUILDINGS.filter((building) => {
      if (building.category !== state.category) return false;
      if (building.removeTool) return true;
      if (state.buildEraFilter === "available") return building.era <= currentEra();
      if (state.buildEraFilter !== "all") return building.era === Number(state.buildEraFilter);
      return true;
    }).sort((a, b) => {
      if (a.removeTool) return 1;
      if (b.removeTool) return -1;
      return a.era - b.era || a.name.localeCompare(b.name);
    });
    ui.buildList.innerHTML = orderedBuildings.map((building) => {
      const locked = building.era > currentEra();
      const [footprintWidth, footprintHeight] = building.footprint || [1, 1];
      const eraStyle = ERAS[building.era] || ERAS[0];
      return `<button class="build-card ${state.selectedTool === building.id ? "is-selected" : ""}" style="--era-accent:${eraStyle.accent}" data-build="${building.id}" ${locked ? "disabled" : ""}>
        <span class="build-card__top"><span class="build-card__icon">${building.icon}</span><span class="build-card__era">${building.removeTool ? "Planning tool" : `Era ${building.era} · ${locked ? "Locked" : "Available"}`}</span></span>
        <strong>${building.name}</strong>
        <small>${building.description}</small>
        <span class="build-card__style">${escapeHtml(eraStyle.architecture)}</span>
        ${building.benefit ? `<span class="build-card__benefit">✦ ${escapeHtml(building.benefit)}</span>` : ""}
        <span class="build-card__cost">${formatCost(building.cost)}</span>
        ${footprintWidth * footprintHeight > 1 ? `<span class="build-card__footprint">▦ ${footprintWidth}×${footprintHeight} site</span>` : ""}
      </button>`;
    }).join("");
  }

  function updateBuildAffordability() {
    ui.buildList.querySelectorAll("[data-build]").forEach((button) => {
      const definition = BUILDINGS.find((building) => building.id === button.dataset.build);
      button.classList.toggle("cannot-afford", !canAfford(definition));
    });
    ui.buildList.querySelectorAll("[data-expand-level]").forEach((button) => {
      const area = EXPANSIONS[Number(button.dataset.expandLevel)];
      button.classList.toggle("cannot-afford", !button.disabled && !Object.entries(area.cost || {}).every(([resource, amount]) => world.resources[resource] >= amount));
    });
  }

  function formatCost(cost) {
    const icons = { flies: "flies", berries: "berries", reeds: "reeds", knowledge: "knowledge", lore: "lore", clay: "clay", grain: "grain", iron: "iron", crowns: "crowns", parchment: "parchment", steam: "steam cores", energy: "energy", data: "data", stardust: "stardust" };
    const entries = Object.entries(cost || {});
    return entries.length ? entries.map(([key, amount]) => `${amount} ${icons[key] || key}`).join(" · ") : "No cost";
  }

  function renderChronicle() {
    if (!world) return;
    ui.chronicle.innerHTML = world.chronicle.map((entry) => `<article class="chronicle-entry"><strong>Day ${entry.day}: ${escapeHtml(entry.title)}</strong>${escapeHtml(entry.text)}</article>`).join("");
  }

  function updateSelectedPanel() {
    const selected = state.selected;
    if (selected.type === "frog" && selected.value) {
      const frog = selected.value;
      const home = frog.home && tileAt(frog.home.x, frog.home.y)?.building;
      const homeName = home ? buildingDefinition(home.id).name : "waiting for a home";
      const roommates = world.frogs.filter((other) => other.id !== frog.id && other.home && frog.home && other.home.x === frog.home.x && other.home.y === frog.home.y);
      ui.selectedLabel.textContent = "Citizen Visit";
      ui.selectedTitle.textContent = frog.title ? `${frog.title} ${frog.name}` : frog.name;
      ui.selectedAvatar.classList.remove("hide", "is-chaotic", "is-detained", "is-sick");
      ui.selectedAvatar.style.setProperty("--selected-frog", frog.color);
      ui.selectedAvatar.classList.toggle("is-chaotic", frog.disposition === "chaotic");
      ui.selectedAvatar.classList.toggle("is-detained", isDetained(frog));
      ui.selectedAvatar.classList.toggle("is-sick", Boolean(frog.illness));
      const lifeLabel = frog.ageDays > frog.lifespanDays * 0.72 ? "Beloved elder" : !isAdult(frog) ? "Young frog" : "Adult frog";
      const healthStatus = frog.illness ? `${frog.illness.icon || "🤒"} ${frog.illness.name}` : (frog.health ?? 100) < 65 ? "Recovering" : "Healthy";
      const civicStatus = isDetained(frog) ? `Currently detained for ${frog.sentenceReason || "civic review"}.` : frog.disposition === "chaotic" ? `Known as a Chaos Frog; infamy ${frog.infamy || 0}.` : "A citizen in good standing.";
      ui.selectedDescription.textContent = `${frog.personality} ${frog.role.toLowerCase()} of the ${frog.familyName}. ${lifeLabel}, age ${frog.ageDays}. ${frog.illness ? `Currently resting with ${frog.illness.name}. ` : ""}${civicStatus} Home: ${homeName}${roommates.length ? `, shared with ${roommates.map((member) => member.name).join(" and ")}` : ""}.`;
      const activeTask = CIVIC_TASKS.find((task) => task.id === frog.task);
      const taskProgress = activeTask?.milestone ? Math.round((frog.taskProgress || 0) / activeTask.milestone * 100) : 0;
      const vitalRows = [
        ["Joy", frog.joy, "#ee91b3"], ["Energy", frog.energy, "#e4bd62"], ["Social", frog.social, "#8e82d2"], ["Fullness", 100 - frog.hunger, "#77bc8e"],
      ];
      ui.frogVitals.classList.remove("hide");
      ui.frogVitals.innerHTML = vitalRows.map(([label, value, color]) => `<div class="frog-vital"><span>${label}</span><div><i style="width:${clamp(value, 0, 100)}%;--vital-color:${color}"></i></div><strong>${Math.round(value)}%</strong></div>`).join("");
      ui.selectedStats.innerHTML = `<div>Health<br>${Math.round(frog.health ?? 100)}% · ${escapeHtml(healthStatus)}</div><div>${isAdult(frog) ? "Work efficiency" : "Education"}<br>${isAdult(frog) ? `${Math.round(jobEfficiency(frog) * 100)}%` : escapeHtml(frog.role)}</div><div>Strength<br>${frog.attributes.strength}</div><div>Intelligence<br>${frog.attributes.intelligence}</div><div>Craftiness<br>${frog.attributes.craftiness}</div><div>Civic task<br>${activeTask && activeTask.id !== "none" ? `${clamp(taskProgress, 0, 100)}% · rank ${frog.taskMastery?.[activeTask.id] || 0}` : "None"}</div>`;
      ui.frogActions.classList.remove("hide");
      ui.jobAssignment.classList.toggle("hide", !isAdult(frog) || isDetained(frog));
      ui.taskAssignment.classList.toggle("hide", !isAdult(frog) || isDetained(frog));
      ui.buildingAssignment.classList.add("hide");
      ui.buildingResidents.classList.add("hide");
      ui.buildingActions.classList.add("hide");
      if (isAdult(frog) && !isDetained(frog)) {
        renderJobAssignment(frog);
        renderTaskAssignment(frog);
      }
      ui.frogActions.querySelector('[data-frog-action="treat"]').disabled = world.resources.berries < 2;
      ui.frogActions.querySelector('[data-frog-action="heal"]').disabled = !frog.illness || world.resources.berries < 3;
      return;
    }
    ui.frogActions.classList.add("hide");
    ui.selectedAvatar.classList.add("hide");
    ui.frogVitals.classList.add("hide");
    ui.jobAssignment.classList.add("hide");
    ui.taskAssignment.classList.add("hide");
    ui.buildingAssignment.classList.add("hide");
    ui.buildingResidents.classList.add("hide");
    ui.buildingActions.classList.add("hide");
    if (selected.type === "tadpole" && selected.value) {
      const tadpole = selected.value;
      ui.selectedLabel.textContent = "Nursery Pond";
      ui.selectedTitle.textContent = `${tadpole.name} the Tadpole`;
      ui.selectedDescription.textContent = `A tiny member of the ${tadpole.familyName}, practicing swimming and growing new legs.`;
      const daysUntilGrown = Math.max(0, Math.ceil(tadpole.growDays - tadpole.ageDays));
      ui.selectedStats.innerHTML = `<div>Age<br>${Math.floor(tadpole.ageDays)} days</div><div>Grows in<br>${daysUntilGrown} ${daysUntilGrown === 1 ? "day" : "days"}</div><div>Family<br>${escapeHtml(tadpole.familyName.replace(" Family", ""))}</div><div>Stage<br>Tadpole</div>`;
      return;
    }
    if (selected.type === "building" && selected.value) {
      const definition = buildingDefinition(selected.value.id);
      ui.selectedLabel.textContent = "Building Notes";
      ui.selectedTitle.textContent = definition.name;
      ui.selectedDescription.textContent = definition.description;
      const worker = world.frogs.find((frog) => frog.workplace?.x === selected.value.x && frog.workplace?.y === selected.value.y && !isDetained(frog));
      const residents = world.frogs.filter((frog) => frog.home?.x === selected.value.x && frog.home?.y === selected.value.y);
      const [siteWidth, siteHeight] = footprintOf(selected.value);
      const architecture = ERAS[clamp(selected.value.eraStyle || definition.era || 0, 0, 9)].architecture;
      const capacity = buildingCapacity(selected.value, definition);
      const specialization = specializationFor(selected.value);
      ui.selectedStats.innerHTML = `<div>Level<br>${selected.value.level}</div><div>Site<br>${siteWidth}×${siteHeight} tiles</div><div>Architecture<br>${escapeHtml(architecture)}</div><div>Worker<br>${worker?.name || "Unstaffed"}</div>${worker ? `<div>Efficiency<br>${Math.round(staffedMultiplier(selected.value) * 100)}%</div>` : ""}${definition.capacity ? `<div>Residents<br>${residents.length}/${capacity}</div><div>Household<br>${residents[0]?.familyName || "Available"}</div>` : ""}${specialization ? `<div>Specialization<br>${escapeHtml(specialization.name)}</div>` : ""}${selected.value.id === "stage" ? `<button id="host-festival">Host Festival</button>` : ""}`;
      if (definition.capacity) {
        const familyBabies = residents.length ? world.tadpoles.filter((tadpole) => tadpole.familyId === residents[0].familyId) : [];
        ui.buildingResidents.classList.remove("hide");
        ui.buildingResidents.innerHTML = `<strong>Living here</strong><span>${residents.length ? residents.map((frog) => escapeHtml(frog.name)).join(" · ") : "This home is available"}${familyBabies.length ? ` · ${familyBabies.map((baby) => `${escapeHtml(baby.name)} (tadpole)`).join(" · ")}` : ""}</span>`;
      }
      if (definition.job) {
        ui.buildingAssignment.classList.remove("hide");
        renderBuildingWorkerAssignment(selected.value, worker);
      }
      if (!["path", "remove"].includes(definition.id)) {
        const cost = selected.value.level < 5 ? buildingUpgradeCost(selected.value) : null;
        ui.buildingActions.classList.remove("hide");
        ui.buildingTier.textContent = `Tier ${["I", "II", "III", "IV", "V"][selected.value.level - 1]} · ${BUILDING_TIERS[selected.value.level - 1]}`;
        ui.upgradeBuildingCost.textContent = cost ? `Next: ${BUILDING_TIERS[selected.value.level]} · ${formatCost(cost)}` : "Maximum civic tier reached";
        document.getElementById("upgrade-building").disabled = !cost || !canAfford({ cost });
        renderSpecializationOptions(selected.value, definition);
      }
      return;
    }
    ui.selectedLabel.textContent = "Kingdom Notes";
    ui.selectedTitle.textContent = "The Great Willow";
    ui.selectedDescription.textContent = "The oldest tree in Mossbell. The council gathers beneath its lanterns.";
    ui.selectedStats.innerHTML = `<div>Adult frogs<br>${world.frogs.length}</div><div>Tadpoles<br>${world.tadpoles.length}</div><div>Buildings<br>${buildingCount()}</div><div>Day<br>${world.day}</div>`;
  }

  function renderBuildingWorkerAssignment(building, worker) {
    const targetRole = buildingDefinition(building.id).job;
    const adults = world.frogs.filter((frog) => isAdult(frog) && !isDetained(frog)).sort((a, b) => jobEfficiency(b, targetRole) - jobEfficiency(a, targetRole));
    const signature = `${building.x},${building.y}|${worker?.id || 0}|${adults.map((frog) => `${frog.id}:${frog.role}`).join("|")}`;
    if (ui.buildingWorkerSelect.dataset.signature === signature) return;
    ui.buildingWorkerSelect.dataset.signature = signature;
    ui.buildingWorkerSelect.innerHTML = adults.map((frog, index) => `<option value="${frog.id}">${index === 0 ? "★ Best fit · " : ""}${escapeHtml(frog.name)} · ${Math.round(jobEfficiency(frog, targetRole) * 100)}%</option>`).join("");
    if (worker) ui.buildingWorkerSelect.value = String(worker.id);
  }

  function assignBuildingWorker() {
    const building = state.selected.type === "building" ? state.selected.value : null;
    const definition = building && buildingDefinition(building.id);
    const frog = world.frogs.find((citizen) => citizen.id === Number(ui.buildingWorkerSelect.value));
    if (!building || !definition?.job || !frog) return;
    world.frogs.forEach((citizen) => {
      if (citizen.id !== frog.id && citizen.jobPreference?.x === building.x && citizen.jobPreference?.y === building.y) citizen.jobPreference = undefined;
    });
    frog.jobPreference = { x: building.x, y: building.y };
    assignHomesAndJobs();
    ui.buildingWorkerSelect.dataset.signature = "";
    frog.bubble = `I am the new ${definition.job}!`;
    frog.bubbleTimer = 4;
    addChronicle(`${frog.name} began work at ${definition.name}`, `${frog.name} was personally assigned to serve as ${definition.job.toLowerCase()}.`);
    toast(`${frog.name} assigned to ${definition.name}`);
    updateDom();
    saveWorld(false);
  }

  function renderJobAssignment(frog) {
    const jobs = [];
    forEachTile((tile, x, y) => {
      const definition = tile.building && buildingDefinition(tile.building.id);
      if (!definition?.job) return;
      const occupant = world.frogs.find((other) => other.id !== frog.id && other.workplace?.x === x && other.workplace?.y === y);
      jobs.push({ x, y, role: definition.job, building: definition.name, occupant });
    });
    const selectedValue = frog.jobPreference === null ? "none" : frog.jobPreference ? `${frog.jobPreference.x},${frog.jobPreference.y}` : "auto";
    jobs.sort((a, b) => Number(Boolean(a.occupant)) - Number(Boolean(b.occupant)) || jobEfficiency(frog, b.role) - jobEfficiency(frog, a.role) || a.role.localeCompare(b.role));
    const signature = `${frog.id}|${selectedValue}|${jobs.map((job) => `${job.x},${job.y},${job.occupant?.id || 0}`).join("|")}`;
    if (ui.jobSelect.dataset.signature === signature) return;
    ui.jobSelect.dataset.signature = signature;
    ui.jobSelect.innerHTML = `<option value="auto">★ Auto assign best opening</option><option value="none">Neighbor (no job)</option>${jobs.map((job, index) => `<option value="${job.x},${job.y}" ${job.occupant ? "disabled" : ""}>${index === 0 ? "★ " : ""}${escapeHtml(job.role)} · ${Math.round(jobEfficiency(frog, job.role) * 100)}% · ${escapeHtml(job.building)}${job.occupant ? ` (${escapeHtml(job.occupant.name)})` : ""}</option>`).join("")}`;
    ui.jobSelect.value = selectedValue;
  }

  function assignSelectedJob() {
    const frog = state.selected.type === "frog" ? state.selected.value : null;
    if (!frog || isDetained(frog)) return;
    const choice = ui.jobSelect.value;
    if (choice === "auto") frog.jobPreference = undefined;
    else if (choice === "none") frog.jobPreference = null;
    else {
      const [x, y] = choice.split(",").map(Number);
      frog.jobPreference = { x, y };
    }
    assignHomesAndJobs();
    ui.jobSelect.dataset.signature = "";
    frog.bubble = choice === "none" ? "A restful season!" : `Ready to work as ${frog.role}!`;
    frog.bubbleTimer = 3;
    addChronicle(`${frog.name} received a new assignment`, choice === "none" ? `${frog.name} will spend this season helping neighbors wherever needed.` : `${frog.name} now serves Mossbell as ${frog.role.toLowerCase()}.`);
    toast(`${frog.name}: ${frog.role}`);
    updateDom();
    saveWorld(false);
  }

  function renderTaskAssignment(frog) {
    const signature = `${currentEra()}:${frog.id}:${frog.task}:${frog.attributes.strength}:${frog.attributes.intelligence}:${frog.attributes.craftiness}`;
    if (ui.taskSelect.dataset.signature === signature) return;
    ui.taskSelect.dataset.signature = signature;
    const availableTasks = CIVIC_TASKS.filter((task) => (task.era || 0) <= currentEra()).sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return (frog.attributes?.[b.attribute] || 0) - (frog.attributes?.[a.attribute] || 0) || (a.era || 0) - (b.era || 0);
    });
    ui.taskSelect.innerHTML = availableTasks.map((task, index) => `<option value="${task.id}">${index === 1 ? "★ Best fit · " : ""}${escapeHtml(task.name)}${task.attribute ? ` · ${ATTRIBUTE_LABELS[task.attribute]} ${frog.attributes[task.attribute]}` : ""}</option>`).join("");
    ui.taskSelect.value = frog.task || "none";
  }

  function assignSelectedTask() {
    const frog = state.selected.type === "frog" ? state.selected.value : null;
    if (!frog || !isAdult(frog)) return;
    if (frog.task !== ui.taskSelect.value) frog.taskProgress = 0;
    frog.task = ui.taskSelect.value;
    ui.taskSelect.dataset.signature = "";
    const task = CIVIC_TASKS.find((entry) => entry.id === frog.task);
    frog.bubble = task.id === "none" ? "A quiet day!" : "Task accepted!";
    frog.bubbleTimer = 3;
    addChronicle(`${frog.name} received a civic task`, task.id === "none" ? `${frog.name} returned to regular neighborhood life.` : `${frog.name} will ${task.name.toLowerCase()} for the council.`);
    toast(`${frog.name}: ${task.name}`);
    updateDom();
    saveWorld(false);
  }

  function buildingUpgradeCost(building) {
    const definition = buildingDefinition(building.id);
    const era = ERAS[currentEra()];
    const multiplier = building.level + 1;
    const cost = {
      flies: Math.max(18, Math.round((definition.cost?.flies || 20) * 0.48 * multiplier)),
      reeds: Math.max(6, Math.round((definition.cost?.reeds || 10) * 0.38 * multiplier)),
    };
    cost[era.resource] = Math.max(4, 5 * multiplier);
    return cost;
  }

  function specializationFor(building) {
    const options = SPECIALIZATIONS[buildingDefinition(building?.id)?.category] || [];
    return options.find((entry) => entry.id === building?.specialization) || null;
  }

  function renderSpecializationOptions(building, definition) {
    const options = SPECIALIZATIONS[definition.category] || [];
    const unlocked = building.level >= 3;
    ui.specializationOptions.classList.toggle("hide", !unlocked || !options.length);
    ui.specializationOptions.innerHTML = !unlocked ? "" : options.map((option) => `<button data-specialization="${option.id}" class="${building.specialization === option.id ? "is-selected" : ""}" ${building.specialization ? "disabled" : ""}><strong>${escapeHtml(option.name)}</strong><small>${escapeHtml(option.description)}</small></button>`).join("");
  }

  function chooseBuildingSpecialization(specializationId) {
    const building = state.selected.type === "building" ? state.selected.value : null;
    const definition = building && buildingDefinition(building.id);
    const option = (SPECIALIZATIONS[definition?.category] || []).find((entry) => entry.id === specializationId);
    if (!building || building.level < 3 || building.specialization || !option) return;
    building.specialization = option.id;
    if (option.id === "cooperative") world.frogs.filter((frog) => frog.workplace?.x === building.x && frog.workplace?.y === building.y).forEach((frog) => { frog.joy = clamp(frog.joy + 18, 0, 100); });
    if (option.id === "family") assignHomesAndJobs();
    addChronicle(`${buildingDefinition(building.id).name} chose a civic specialty`, `${option.name} became the institution's permanent mission. ${option.description}.`);
    toast(`${option.name} selected`);
    updateDom();
    saveWorld(false);
  }

  function upgradeSelectedBuilding() {
    const building = state.selected.type === "building" ? state.selected.value : null;
    if (!building || building.level >= 5) return;
    const cost = buildingUpgradeCost(building);
    if (!canAfford({ cost })) return toast(`Upgrade needs ${formatCost(cost)}`);
    spend(cost);
    building.level += 1;
    building.eraStyle = currentEra();
    if (buildingCapacity(building) > 0) assignHomesAndJobs();
    addChronicle(`${buildingDefinition(building.id).name} reached level ${building.level}`, `The structure was rebuilt in the ${ERAS[currentEra()].name.toLowerCase()} style and now works more efficiently.`);
    toast(`${buildingDefinition(building.id).name} upgraded`);
    updateDom();
    saveWorld(false);
    sound(500, 0.2, "triangle", 0.04, 180);
  }

  function renderCitizenRoster() {
    const selectedId = state.selected.type === "frog" ? state.selected.value?.id : null;
    const selectedTadpoleId = state.selected.type === "tadpole" ? state.selected.value?.id : null;
    ui.citizenRoster.innerHTML = world.frogs.map((frog) => `<button class="citizen-chip ${frog.illness ? "is-sick" : ""} ${frog.disposition === "chaotic" ? "is-chaotic" : ""} ${isDetained(frog) ? "is-detained" : ""} ${selectedId === frog.id ? "is-selected" : ""}" data-frog-id="${frog.id}">
      <span class="citizen-chip__frog" style="--frog-color:${frog.color}" aria-hidden="true"></span>
      <span><strong>${isDetained(frog) ? "🔐" : frog.disposition === "chaotic" ? "⚠️" : frog.illness?.icon || ""} ${escapeHtml(frog.title ? `${frog.title} ${frog.name}` : frog.name)}</strong><small>${isDetained(frog) ? `Detained until day ${frog.detainedUntil}` : frog.illness ? escapeHtml(frog.illness.name) : `${escapeHtml(frog.role)} · ${Math.round(frog.health ?? 100)}% health`}</small></span>
    </button>`).join("") + world.tadpoles.map((tadpole) => `<button class="citizen-chip citizen-chip--baby ${selectedTadpoleId === tadpole.id ? "is-selected" : ""}" data-tadpole-id="${tadpole.id}">
      <span class="citizen-chip__tadpole" style="--frog-color:${tadpole.color}" aria-hidden="true"></span>
      <span><strong>${escapeHtml(tadpole.name)}</strong><small>Tadpole · grows in ${Math.max(0, Math.ceil(tadpole.growDays - tadpole.ageDays))}d</small></span>
    </button>`).join("");
  }

  function openCouncil(mode) {
    ui.councilModal.classList.remove("hide");
    if (mode === "trade") renderTradeCouncil();
    else if (mode === "government") renderGovernmentCouncil();
    else renderWorkforceCouncil();
  }

  function closeCouncil() {
    ui.councilModal.classList.add("hide");
  }

  function renderWorkforceCouncil() {
    ui.councilModalTitle.textContent = "Mossbell Workforce";
    ui.councilModalCopy.textContent = "Review schooling, aptitudes, jobs, civic tasks, and efficiency across the civilization.";
    const citizens = [...world.frogs].sort((a, b) => a.ageDays - b.ageDays);
    ui.councilModalContent.innerHTML = `<div class="workforce-grid">${citizens.map((frog) => {
      const best = Object.entries(frog.attributes).sort((a, b) => b[1] - a[1])[0];
      const task = CIVIC_TASKS.find((entry) => entry.id === frog.task);
      return `<button class="workforce-card" data-council-frog="${frog.id}">
        <span class="citizen-chip__frog" style="--frog-color:${frog.color}"></span>
        <span><strong>${isDetained(frog) ? "🔐" : frog.disposition === "chaotic" ? "⚠️" : frog.illness?.icon || ""} ${escapeHtml(frog.title ? `${frog.title} ${frog.name}` : frog.name)}</strong><small>Age ${frog.ageDays} · ${escapeHtml(frog.role)}</small><small>${frog.illness ? escapeHtml(frog.illness.name) : `${Math.round(frog.health ?? 100)}% health`} · Best: ${ATTRIBUTE_LABELS[best[0]]} ${best[1]}</small><small>Task: ${escapeHtml(task?.name || "None")}${task?.id !== "none" ? ` · mastery ${frog.taskMastery?.[task.id] || 0}` : ""}${isAdult(frog) && !isDetained(frog) ? ` · ${Math.round(jobEfficiency(frog) * 100)}%` : ""}</small></span>
      </button>`;
    }).join("")}</div>`;
  }

  function renderTradeCouncil() {
    ui.councilModalTitle.textContent = "Neighboring Frog Civilizations";
    const unlocked = currentEra() >= 5 && countBuilding("tradeharbor") > 0;
    ui.councilModalCopy.textContent = unlocked ? "Choose a treaty exchange. Deals are immediate and recorded in the Marsh Chronicle." : "Trade unlocks in the Scholar Renaissance after building a Diplomatic Trade Harbor.";
    if (!unlocked) {
      ui.councilModalContent.innerHTML = `<div class="trade-locked"><span>⚓</span><strong>Diplomatic waterways are not open yet</strong><small>Reach Era 5 and build the harbor to meet neighboring civilizations.</small></div>`;
      return;
    }
    const availableCivilizations = TRADE_CIVILIZATIONS.slice(0, clamp(currentEra() - 4, 1, TRADE_CIVILIZATIONS.length));
    ui.councilModalContent.innerHTML = `<div class="trade-grid">${availableCivilizations.map((civilization) => `<article class="trade-card" style="--trade-color:${civilization.color}"><div><span>🐸</span><strong>${civilization.name}</strong></div>${civilization.offers.map((offer, index) => {
      const affordable = Object.entries(offer.give).every(([key, amount]) => (world.resources[key] || 0) >= amount);
      return `<button data-trade="${civilization.id}:${index}" ${affordable ? "" : "disabled"}><span>Give ${formatCost(offer.give)}</span><b>⇄</b><span>Receive ${formatCost(offer.receive)}</span></button>`;
    }).join("")}</article>`).join("")}</div>`;
  }

  function renderGovernmentCouncil() {
    refreshGovernment();
    const ruler = monarch();
    const heir = royalHeir();
    const cases = (world.government.cases || []).filter((entry) => entry.status !== "resolved");
    const rogues = world.frogs.filter((frog) => frog.disposition === "chaotic" || isDetained(frog));
    ui.councilModalTitle.textContent = governmentDisplayName();
    ui.councilModalCopy.textContent = world.government.kind === "monarchy" ? `The ${world.government.dynastyName} shares the work of law, public service, succession, and justice with Mossbell's civic institutions.` : "The Willow Circle governs by consensus. Building Moonpetal Castle will begin a royal era with a living dynasty and line of succession.";
    const lawCards = REALM_LAWS.filter((law) => law.era <= currentEra()).map((law) => {
      const active = hasLaw(law.id);
      const affordable = canAfford({ cost: law.cost });
      return `<article class="law-card ${active ? "is-active" : ""}"><strong>${active ? "✓ " : ""}${escapeHtml(law.name)}</strong><small>${escapeHtml(law.description)}</small><button data-law="${law.id}" ${active || !affordable ? "disabled" : ""}>${active ? "Law enacted" : `Enact · ${escapeHtml(formatCost(law.cost))}`}</button></article>`;
    }).join("");
    const caseCards = rogues.length ? rogues.map((frog) => `<article class="case-card"><span>${isDetained(frog) ? "🔐" : "⚠️"}</span><div><strong>${escapeHtml(frog.name)} · ${isDetained(frog) ? "In custody" : "Chaos Frog"}</strong><small>${isDetained(frog) ? `${escapeHtml(frog.sentenceReason || "Civic review")} · release day ${frog.detainedUntil}` : `Infamy ${frog.infamy || 0} · ${escapeHtml(frog.sentenceReason || "No open offense")}`}</small></div>${!isDetained(frog) ? `<button data-sentence="${frog.id}" ${justiceCapacity() <= detainedCitizens().length ? "disabled" : ""}>Detain safely</button>` : ""}</article>`).join("") : `<article class="realm-card"><h3>Peaceful waterways</h3><p>No rogue citizens currently need civic intervention.</p></article>`;
    ui.councilModalContent.innerHTML = `<div class="realm-overview">
      <div class="realm-stat"><span>Government</span><strong>${escapeHtml(governmentDisplayName())}</strong></div>
      <div class="realm-stat"><span>Public trust</span><strong>${Math.round(world.government.legitimacy)}%</strong></div>
      <div class="realm-stat"><span>Justice rooms</span><strong>${detainedCitizens().length}/${justiceCapacity()}</strong></div>
      <div class="realm-stat"><span>Recorded cases</span><strong>${world.justice.totalIncidents || 0}</strong></div>
    </div>
    <h3 class="realm-section-title">The Realm</h3><div class="realm-grid">
      <article class="realm-card"><div class="royal-line"><span>${ruler ? "👑" : "🌿"}</span><div><h3>${ruler ? `Crownkeeper ${escapeHtml(ruler.name)}` : "The Willow Circle"}</h3><p>${ruler ? `${escapeHtml(world.government.dynastyName)} · ${world.government.coronations} coronation${world.government.coronations === 1 ? "" : "s"}` : "Consensus, shared food, oral law, and public gatherings beneath the Great Willow."}</p></div></div></article>
      <article class="realm-card"><div class="royal-line"><span>${heir ? "🌙" : "🔔"}</span><div><h3>${heir ? `Heir ${escapeHtml(heir.name)}` : "Civic succession"}</h3><p>${heir ? `Age ${heir.ageDays} · ${escapeHtml(heir.familyName)} · preparing to guard Mossbell's future.` : "A successor will be selected from capable adult citizens when the realm needs one."}</p></div></div></article>
    </div>
    <h3 class="realm-section-title">Charters & Laws</h3><div class="law-grid">${lawCards || `<article class="realm-card"><p>The first written charters unlock in Settled Shores.</p></article>`}</div>
    <h3 class="realm-section-title">Justice & Restoration</h3><div class="case-list">${caseCards}</div>
    ${cases.length ? `<p class="realm-section-title">${cases.length} active civic ${cases.length === 1 ? "case" : "cases"} under review</p>` : ""}`;
  }

  function executeTrade(code) {
    const [civilizationId, offerIndex] = code.split(":");
    const civilization = TRADE_CIVILIZATIONS.find((entry) => entry.id === civilizationId);
    const offer = civilization?.offers[Number(offerIndex)];
    if (!offer || !Object.entries(offer.give).every(([key, amount]) => (world.resources[key] || 0) >= amount)) return toast("Mossbell cannot afford that trade");
    spend(offer.give);
    for (const [resource, amount] of Object.entries(offer.receive)) world.resources[resource] += amount;
    world.tradeHistory.push({ civilization: civilization.name, day: world.day, give: offer.give, receive: offer.receive });
    addChronicle(`Trade treaty with ${civilization.name}`, `Mossbell gave ${formatCost(offer.give)} and received ${formatCost(offer.receive)}.`);
    toast(`Trade completed with ${civilization.name}`);
    renderTradeCouncil();
    updateDom();
    saveWorld(false);
  }

  function selectFrog(frog, center = false) {
    if (!frog) return;
    state.selected = { type: "frog", value: frog };
    frog.bubble = choose(["Hello, Keeper!", "Come sit by the pond!", `I love ${frog.favorite.toLowerCase()}!`]);
    frog.bubbleTimer = 2.8;
    if (center) centerOnFrog(frog);
    updateDom();
    sound(180, 0.1, "sawtooth", 0.018, -60);
  }

  function selectTadpole(tadpole, center = false) {
    if (!tadpole) return;
    state.selected = { type: "tadpole", value: tadpole };
    tadpole.bubble = choose(["Bloop!", "Wiggle wiggle!", "I am growing legs!"]);
    tadpole.bubbleTimer = 3;
    if (center) centerOnFrog(tadpole);
    updateDom();
    sound(420, 0.08, "sine", 0.014, 90);
  }

  function centerOnFrog(frog) {
    focusMapPoint(frog.fx, frog.fy, 1.62);
  }

  function interactWithFrog(action) {
    const frog = state.selected.type === "frog" ? state.selected.value : null;
    if (!frog) return;
    if (action === "find") {
      centerOnFrog(frog);
      frog.bubble = "Here I am!";
      frog.bubbleTimer = 2.5;
      toast(`Camera centered on ${frog.name}`);
    } else if (action === "chat") {
      frog.social = clamp(frog.social + 22, 0, 100);
      frog.joy = clamp(frog.joy + 6, 0, 100);
      frog.bond = (frog.bond || 0) + 1;
      frog.bubble = choose(["The pond sounds lovely today.", `My favorite treat is ${frog.favorite}!`, "I saw a silver dragonfly!", "Mossbell feels like home."]);
      frog.bubbleTimer = 4;
      toast(`${frog.name} enjoyed your visit`);
      sound(350, 0.12, "triangle", 0.025, 80);
    } else if (action === "treat") {
      if (world.resources.berries < 2) return toast("You need 2 berries for a treat");
      world.resources.berries -= 2;
      frog.hunger = clamp(frog.hunger - 38, 0, 100);
      frog.joy = clamp(frog.joy + 14, 0, 100);
      frog.social = clamp(frog.social + 8, 0, 100);
      frog.bond = (frog.bond || 0) + 2;
      frog.bubble = `My favorite! ${frog.favorite}!`;
      frog.bubbleTimer = 4;
      toast(`${frog.name} loved the treat`);
      sound(520, 0.16, "sine", 0.03, 160);
    } else if (action === "heal") {
      if (!frog.illness) return toast(`${frog.name} is already healthy`);
      if (world.resources.berries < 3) return toast("Home care needs 3 berries");
      world.resources.berries -= 3;
      frog.health = clamp((frog.health ?? 100) + 18, 0, 100);
      frog.illness.daysLeft -= 1.5;
      frog.joy = clamp(frog.joy + 8, 0, 100);
      if (frog.illness.daysLeft <= 0) {
        const illnessName = frog.illness.name;
        frog.illness = null;
        frog.immunity = 6;
        addChronicle(`${frog.name} recovered at home`, `Fresh berries, mintleaf tea, and a quiet family evening helped ${frog.name} recover from ${illnessName}.`);
      }
      frog.bubble = frog.illness ? "Thank you for the care" : "All better!";
      frog.bubbleTimer = 4;
      toast(`${frog.name} received home care`);
      sound(430, 0.18, "sine", 0.03, 150);
    }
    updateDom();
    saveWorld(false);
  }

  function buildingCount() {
    let count = 0;
    forEachTile((tile) => { if (tile.building) count += 1; });
    return count;
  }

  function draw() {
    if (!world) {
      ctx.fillStyle = "#cdebd7";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    drawBackdrop();
    drawTerrain();
    drawEntities();
    drawWeather();
  }

  function drawBackdrop() {
    const palette = eraPalette();
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, palette.sky);
    gradient.addColorStop(0.62, "#c4e7d4");
    gradient.addColorStop(1, "#99c9ab");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const night = nightAmount();
    if (night > 0) {
      ctx.fillStyle = `rgba(40,46,86,${night * 0.58})`;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 45; i += 1) {
        ctx.globalAlpha = night * (0.3 + (i % 5) * 0.12);
        ctx.fillStyle = "#fff7d1";
        ctx.beginPath();
        ctx.arc((i * 139.7) % W, 80 + (i * 61.3) % (H * 0.68), 0.7 + i % 3 * 0.35, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function nightAmount() {
    const hour = world.hour;
    if (hour >= 20) return clamp((hour - 20) / 2, 0, 1);
    if (hour < 6) return clamp((6 - hour) / 2, 0, 1);
    return 0;
  }

  function drawTerrain() {
    const palette = eraPalette();
    for (let y = 0; y < GRID_H; y += 1) {
      for (let x = 0; x < GRID_W; x += 1) {
        if (isTileUnlocked(x, y)) drawTile(world.tiles[y][x], x, y, palette);
        else drawLockedTile(x, y);
      }
    }
  }

  function drawLockedTile(x, y) {
    const a = iso(x, y);
    const b = iso(x + 1, y);
    const c = iso(x + 1, y + 1);
    const d = iso(x, y + 1);
    const nearby = expansionLevelForTile(x, y) === world.expansion + 1;
    ctx.fillStyle = nearby ? "rgba(236,240,245,0.34)" : "rgba(220,228,233,0.18)";
    polygon([a, b, c, d]);
    ctx.fill();
    ctx.strokeStyle = nearby ? "rgba(255,255,255,0.46)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (nearby && (x + y) % 4 === 0) {
      const center = iso(x + 0.5, y + 0.5);
      ctx.fillStyle = "rgba(76,98,89,0.42)";
      ctx.font = `800 ${Math.max(7, 9 * view.zoom)}px Quicksand`;
      ctx.textAlign = "center";
      ctx.fillText("+", center.x, center.y + 3);
    }
  }

  function drawTile(tile, x, y, palette) {
    const a = iso(x, y);
    const b = iso(x + 1, y);
    const c = iso(x + 1, y + 1);
    const d = iso(x, y + 1);
    const selectedDefinition = BUILDINGS.find((building) => building.id === state.selectedTool);
    const previewCells = state.hoverTile && selectedDefinition && !selectedDefinition.removeTool ? footprintCells(state.hoverTile.x, state.hoverTile.y, selectedDefinition.footprint || [1, 1]) : [];
    const removalTarget = state.hoverTile && selectedDefinition?.removeTool ? buildingAt(state.hoverTile.x, state.hoverTile.y) : null;
    const removalCells = removalTarget ? footprintCells(removalTarget.x, removalTarget.y, footprintOf(removalTarget)) : [];
    const footprintHovered = previewCells.some((cell) => cell.x === x && cell.y === y);
    const removalHovered = removalCells.some((cell) => cell.x === x && cell.y === y);
    const hovered = state.selectedTool ? (selectedDefinition?.removeTool ? removalHovered || state.hoverTile?.x === x && state.hoverTile?.y === y : footprintHovered) : state.hoverTile?.x === x && state.hoverTile?.y === y;
    const valid = hovered && state.selectedTool ? placementValid(state.hoverTile.x, state.hoverTile.y) : false;
    const alternating = (x + y) % 2 === 0;

    if (tile.terrain === "water") {
      const waterGradient = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
      waterGradient.addColorStop(0, "#a7e3d7");
      waterGradient.addColorStop(0.52, "#70c8c4");
      waterGradient.addColorStop(1, "#58b1b4");
      ctx.fillStyle = waterGradient;
    } else ctx.fillStyle = alternating ? palette.grass : palette.grass2;

    polygon([a, b, c, d]);
    ctx.fill();
    ctx.strokeStyle = tile.terrain === "water" ? "rgba(226,255,250,0.2)" : "rgba(75,133,85,0.13)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (tile.terrain === "water") drawWaterDetail(tile, x, y);
    else drawGrassDetail(tile, x, y, palette);
    if (tile.building?.id === "path") drawPathTile(x, y);

    if (hovered) {
      ctx.fillStyle = state.selectedTool ? (valid ? "rgba(255,255,255,0.34)" : "rgba(255,106,142,0.3)") : "rgba(255,255,255,0.18)";
      polygon([a, b, c, d]);
      ctx.fill();
      ctx.strokeStyle = state.selectedTool ? (valid ? "#fff" : "#ff759e") : "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawWaterDetail(tile, x, y) {
    const center = iso(x + 0.5, y + 0.5);
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = "#efffff";
    ctx.lineWidth = 1.2 * view.zoom;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y + Math.sin(state.time * 1.5 + tile.ripple) * 2, 15 * view.zoom, 4 * view.zoom, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawGrassDetail(tile, x, y, palette) {
    if (tile.decor < 0.74 || tile.building || tile.occupiedBy) return;
    const center = iso(x + 0.3 + (tile.decor % 0.3), y + 0.38);
    ctx.fillStyle = palette.flowers;
    ctx.globalAlpha = 0.72;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(center.x + (i - 1) * 4 * view.zoom, center.y + (i % 2) * 2 * view.zoom, 1.6 * view.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPathTile(x, y) {
    const a = iso(x + 0.08, y + 0.38);
    const b = iso(x + 0.62, y + 0.08);
    const c = iso(x + 0.92, y + 0.62);
    const d = iso(x + 0.38, y + 0.92);
    ctx.fillStyle = "rgba(255,230,218,0.82)";
    polygon([a, b, c, d]);
    ctx.fill();
    ctx.strokeStyle = "rgba(167,119,122,0.22)";
    ctx.stroke();
  }

  function drawEntities() {
    const entities = [];
    forEachTile((tile, x, y) => {
      if (isTileUnlocked(x, y) && tile.building && tile.building.id !== "path") {
        const [footprintWidth, footprintHeight] = footprintOf(tile.building);
        entities.push({ type: "building", value: tile.building, depth: x + y + (footprintWidth + footprintHeight) * 0.5 });
      }
    });
    for (const frog of world.frogs) entities.push({ type: "frog", value: frog, depth: frog.fx + frog.fy + 0.7 });
    for (const tadpole of world.tadpoles) entities.push({ type: "tadpole", value: tadpole, depth: tadpole.fx + tadpole.fy + 0.6 });
    entities.sort((a, b) => a.depth - b.depth);
    for (const entity of entities) {
      if (entity.type === "building") drawBuilding(entity.value);
      else if (entity.type === "frog") drawFrog(entity.value);
      else drawTadpole(entity.value);
    }
  }

  function drawBuilding(building) {
    const [footprintWidth, footprintHeight] = footprintOf(building);
    drawBuildingFoundation(building, footprintWidth, footprintHeight);
    const point = iso(building.x + footprintWidth * 0.5, building.y + footprintHeight * 0.5);
    const footprintScale = 1 + Math.max(0, footprintWidth + footprintHeight - 2) * 0.12;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.scale(view.zoom * footprintScale, view.zoom * footprintScale);
    drawBuildingShadow(building.id);
    const drawers = {
      willow: drawWillow,
      lily: drawLily,
      mossnest: drawMossNest,
      cottage: drawCottage,
      loglodge: drawLogLodge,
      treetop: drawTreetopHamlet,
      bridge: drawBridge,
      ferry: drawFerry,
      houseboat: drawHouseboat,
      berry: drawBerryPatch,
      reedbed: drawReedNursery,
      flyfarm: drawFlyFarm,
      duckweed: drawDuckweedGarden,
      apiary: drawApiary,
      cafe: drawCafe,
      bakery: drawBakery,
      market: drawMarket,
      floatingmarket: drawFloatingMarket,
      library: drawLibrary,
      firehouse: drawFirehouse,
      police: drawPoliceStation,
      nursery: drawTadpoleNursery,
      school: drawSchoolhouse,
      postoffice: drawPostOffice,
      workshop: drawWorkshop,
      clinic: drawClinic,
      stage: drawStage,
      observatory: drawObservatory,
      castle: drawCastle,
      garden: drawGarden,
      wildflower: drawBeautyLandmark,
      fountain: drawFrogFountain,
      lotusspa: drawLotusSpa,
      waterstage: drawWaterStage,
      playground: drawSplashPark,
      lantern: drawLantern,
      shrine: drawShrine,
      topiary: drawBeautyLandmark,
      canalplaza: drawBeautyLandmark,
      rosegallery: drawBeautyLandmark,
      sculpturecourt: drawBeautyLandmark,
      carousel: drawBeautyLandmark,
      aurorapark: drawBeautyLandmark,
      hologarden: drawBeautyLandmark,
      moonpark: drawBeautyLandmark,
    };
    const drawer = drawers[building.id];
    if (drawer) drawer(building);
    else {
      drawEraStructure(building);
      drawInstitutionIdentity(building);
    }
    if (drawer && building.id !== "willow") drawEraArchitecturalDetails(building);
    drawEraUpgradeAccents(building);
    ctx.restore();
  }

  function drawBuildingFoundation(building, width, height) {
    if (width === 1 && height === 1) return;
    const corners = [iso(building.x + 0.06, building.y + 0.06), iso(building.x + width - 0.06, building.y + 0.06), iso(building.x + width - 0.06, building.y + height - 0.06), iso(building.x + 0.06, building.y + height - 0.06)];
    const gradient = ctx.createLinearGradient(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
    gradient.addColorStop(0, "rgba(255,250,232,.92)");
    gradient.addColorStop(1, building.eraStyle >= 7 ? "rgba(157,224,222,.82)" : "rgba(210,190,215,.82)");
    ctx.fillStyle = gradient;
    polygon(corners);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    const center = iso(building.x + width * 0.5, building.y + height * 0.5);
    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.beginPath(); ctx.ellipse(center.x, center.y, TILE_W * width * .32 * view.zoom, TILE_H * height * .24 * view.zoom, 0, 0, TAU); ctx.fill();
  }

  function drawBuildingShadow(id) {
    const wide = ["willow", "castle", "stage", "market", "loglodge", "waterstage", "playground"].includes(id);
    ctx.fillStyle = "rgba(30,72,53,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 7, wide ? 33 : 25, wide ? 11 : 8, 0, 0, TAU);
    ctx.fill();
  }

  function drawInstitutionIdentity(building) {
    const identity = {
      jail: ["🔐", "#8793ad"], meetinghouse: ["🔔", "#7eb68e"], courthouse: ["⚖", "#9680bd"], monastery: ["☾", "#7f91b8"],
      museum: ["🏺", "#d69b78"], railterminal: ["✦", "#c9819c"], parliament: ["✿", "#78b59a"], rehabilitation: ["🌱", "#77bc91"],
      civiccore: ["◇", "#65bfc2"], lunarembassy: ["◉", "#829cda"],
      souphall: ["♨", "#d58f70"], royalorchard: ["●", "#d97f8e"], teapavilion: ["♨", "#c78ebc"], glasshouse: ["❈", "#79bca0"], aquaponics: ["≈", "#68bfc7"], moonbiosphere: ["◌", "#8e98d8"],
      basketry: ["#", "#b89467"], potterykiln: ["◒", "#ca8369"], carpentry: ["×", "#b48862"], jewelers: ["◆", "#a888d2"], mapstudio: ["⌖", "#78a9b0"], recycler: ["↻", "#70ae8d"], nanofab: ["✣", "#7dbfc9"],
      storycircle: ["✦", "#dc946c"], archive: ["▤", "#8296aa"], unionhall: ["⌁", "#c08396"], weathercenter: ["☁", "#72afc3"], astroacademy: ["★", "#8b8fd5"], booktower: ["B", "#ac83bb"],
    }[building.id];
    if (!identity) return;
    const [symbol, color] = identity;
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundedRect(-15, -38, 30, 22, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, 0, -27);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-23, -10); ctx.lineTo(-23, -48); ctx.moveTo(23, -10); ctx.lineTo(23, -48); ctx.stroke();
    ctx.fillStyle = `${color}cc`;
    ctx.beginPath(); ctx.moveTo(-23, -47); ctx.lineTo(-11, -42); ctx.lineTo(-23, -36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(23, -47); ctx.lineTo(11, -42); ctx.lineTo(23, -36); ctx.closePath(); ctx.fill();
  }

  function drawEraStructure(building) {
    const definition = buildingDefinition(building.id);
    const era = clamp(Number.isInteger(building.eraStyle) ? building.eraStyle : definition.era || 0, 0, ERAS.length - 1);
    ctx.strokeStyle = "rgba(255,255,255,.82)";
    ctx.lineWidth = 2;

    if (era === 0) {
      ctx.fillStyle = "#b48a62"; ctx.beginPath(); ctx.ellipse(0, 3, 31, 11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#88ad72"; ctx.beginPath(); ctx.moveTo(-29, 1); ctx.quadraticCurveTo(-18, -34, 0, -49); ctx.quadraticCurveTo(20, -34, 29, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#6d835b"; ctx.lineWidth = 1.5;
      for (const x of [-15, -7, 7, 15]) { ctx.beginPath(); ctx.moveTo(x, -5); ctx.lineTo(x * .2, -43); ctx.stroke(); }
      ctx.fillStyle = "#6f5849"; ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(0, -17); ctx.lineTo(7, 5); ctx.closePath(); ctx.fill();
    } else if (era === 1) {
      ctx.fillStyle = "#d99b78"; ctx.beginPath(); ctx.ellipse(0, -18, 30, 28, 0, Math.PI, TAU); ctx.lineTo(30, 5); ctx.lineTo(-30, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#b9d589"; ctx.beginPath(); ctx.ellipse(0, -20, 32, 22, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = "#f5cfaa"; ctx.lineWidth = 2;
      for (const y of [-11, 0]) { ctx.beginPath(); ctx.moveTo(-27, y); ctx.quadraticCurveTo(0, y + 5, 27, y); ctx.stroke(); }
      ctx.fillStyle = "#72584f"; roundedRect(-7, -11, 14, 17, 7); ctx.fill();
      for (const x of [-17, 17]) { ctx.fillStyle = "#bdece1"; ctx.beginPath(); ctx.arc(x, -14, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = "white"; ctx.stroke(); }
    } else if (era === 2) {
      ctx.fillStyle = "#f5dfbf"; roundedRect(-28, -38, 56, 44, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#efabc5"; ctx.beginPath(); ctx.moveTo(-32, -36); ctx.lineTo(0, -61); ctx.lineTo(32, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#927165"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-21, -36); ctx.lineTo(-21, 4); ctx.moveTo(21, -36); ctx.lineTo(21, 4); ctx.moveTo(-28, -20); ctx.lineTo(28, -20); ctx.moveTo(-19, -35); ctx.lineTo(19, 3); ctx.moveTo(19, -35); ctx.lineTo(-19, 3); ctx.stroke();
      ctx.fillStyle = "#9bd6cc"; for (const x of [-16, 16]) { roundedRect(x - 5, -31, 10, 10, 3); ctx.fill(); }
      ctx.fillStyle = "#775f59"; roundedRect(-6, -13, 12, 19, 5); ctx.fill();
    } else if (era === 3) {
      ctx.fillStyle = "#9eb4bd"; roundedRect(-26, -53, 52, 59, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#c67e70"; ctx.beginPath(); ctx.moveTo(-31, -51); ctx.lineTo(0, -72); ctx.lineTo(31, -51); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(95,111,116,.45)"; ctx.lineWidth = 1;
      for (const y of [-39, -27, -15, -3]) { ctx.beginPath(); ctx.moveTo(-25, y); ctx.lineTo(25, y); ctx.stroke(); }
      ctx.fillStyle = "#ffe5a5"; for (const x of [-15, 15]) { ctx.beginPath(); ctx.arc(x, -33, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#5f6870"; roundedRect(-7, -16, 14, 22, 5); ctx.fill();
    } else if (era === 4) {
      ctx.fillStyle = "#9382ac"; roundedRect(-30, -43, 60, 49, 3); ctx.fill(); ctx.stroke();
      for (const x of [-22, 22]) { ctx.fillStyle = "#718e9c"; roundedRect(x - 10, -58, 20, 64, 3); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#718e9c";
      for (const x of [-28,-20,-12,12,20,28]) { roundedRect(x - 4, -64, 8, 10, 2); ctx.fill(); }
      ctx.fillStyle = "#f9d979"; for (const x of [-22, 0, 22]) { roundedRect(x - 4, -33, 8, 14, 4); ctx.fill(); }
      ctx.fillStyle = "#5f5571"; roundedRect(-8, -16, 16, 22, 8); ctx.fill();
      ctx.strokeStyle = "#f4b5d0"; ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -75); ctx.stroke();
      ctx.fillStyle = "#f4b5d0"; ctx.beginPath(); ctx.moveTo(1, -74); ctx.lineTo(18, -67); ctx.lineTo(1, -61); ctx.closePath(); ctx.fill();
    } else if (era === 5) {
      ctx.fillStyle = "#f1d5df"; roundedRect(-31, -45, 62, 51, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7eb09d"; roundedRect(-34, -50, 68, 9, 3); ctx.fill();
      ctx.fillStyle = "#fff2c8"; for (const x of [-21, -7, 7, 21]) { roundedRect(x - 3, -37, 6, 35, 2); ctx.fill(); }
      ctx.fillStyle = "#84bcb2"; ctx.beginPath(); ctx.arc(0, -50, 22, Math.PI, TAU); ctx.lineTo(22, -48); ctx.lineTo(-22, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff1a9"; for (const x of [-18, 18]) { ctx.beginPath(); ctx.arc(x, -28, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#765f72"; roundedRect(-7, -16, 14, 22, 7); ctx.fill();
    } else if (era === 6) {
      ctx.fillStyle = "#b67d7d"; roundedRect(-32, -42, 64, 48, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7f9298"; roundedRect(-35, -47, 70, 9, 2); ctx.fill();
      for (const x of [-21, 19]) { ctx.fillStyle = "#9b7a70"; roundedRect(x - 7, -70, 14, 31, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.52)"; ctx.beginPath(); ctx.arc(x + 2, -77, 7, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#9fe1d0"; for (const x of [-18, 0, 18]) { roundedRect(x - 5, -29, 10, 12, 2); ctx.fill(); }
      ctx.strokeStyle = "#f4c0d0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -8, 13, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#695b61"; roundedRect(-6, -13, 12, 19, 4); ctx.fill();
    } else if (era === 7) {
      const glass = ctx.createLinearGradient(-28, -58, 28, 3); glass.addColorStop(0, "#d9f4ff"); glass.addColorStop(.5, "#87c7d5"); glass.addColorStop(1, "#f2b4ce");
      ctx.fillStyle = glass; roundedRect(-29, -60, 58, 66, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.58)"; for (const y of [-47, -31, -15]) { roundedRect(-23, y, 46, 9, 4); ctx.fill(); }
      ctx.fillStyle = "#fff18e"; roundedRect(-32, -5, 64, 8, 4); ctx.fill();
      ctx.fillStyle = "#596683"; roundedRect(-7, -14, 14, 20, 7); ctx.fill();
    } else if (era === 8) {
      ctx.fillStyle = "rgba(117,211,202,.75)"; ctx.beginPath(); ctx.moveTo(-32, 5); ctx.lineTo(-22, -46); ctx.lineTo(-8, -67); ctx.lineTo(0, -38); ctx.lineTo(12, -76); ctx.lineTo(31, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(143,137,229,.75)"; ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(0, -54); ctx.lineTo(17, 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f4b8df"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -30, 36, 11, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#fff3a0"; for (const p of [[-23,-34],[27,-27],[3,-67]]) { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#64649a"; roundedRect(-7, -13, 14, 19, 7); ctx.fill();
    } else {
      ctx.fillStyle = "#d9d7ff"; ctx.beginPath(); ctx.ellipse(0, -21, 33, 31, 0, Math.PI, TAU); ctx.lineTo(33, 5); ctx.lineTo(-33, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(152,239,224,.68)"; ctx.beginPath(); ctx.arc(0, -23, 25, Math.PI, TAU); ctx.lineTo(25, -22); ctx.lineTo(-25, -22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#e9a8e8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -29, 43, 12, -.12, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#fff19b"; for (const x of [-18, 0, 18]) { ctx.beginPath(); ctx.arc(x, -9, 4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#666197"; roundedRect(-7, -13, 14, 19, 7); ctx.fill();
      ctx.strokeStyle = "#8ff0df"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(0, -77); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -80, 4, 0, TAU); ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.beginPath(); ctx.arc(0, era < 2 ? -30 : era >= 8 ? -45 : -50, 10, 0, TAU); ctx.fill();
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(definition.icon, 0, era < 2 ? -30 : era >= 8 ? -45 : -50);
  }

  function drawEraArchitecturalDetails(building) {
    const era = clamp(Number.isInteger(building.eraStyle) ? building.eraStyle : buildingDefinition(building.id)?.era || 0, 0, 9);
    if (era === 0) {
      ctx.strokeStyle = "#7d9c66"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-20, -12, 13, .4, 2.5); ctx.arc(20, -12, 13, .7, 2.8); ctx.stroke();
    } else if (era === 1) {
      ctx.fillStyle = "#d89a78";
      for (const x of [-25, 25]) { ctx.beginPath(); ctx.ellipse(x, 1, 6, 4, 0, 0, TAU); ctx.fill(); }
    } else if (era === 2) {
      ctx.strokeStyle = "rgba(123,91,78,.65)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(25, -26); ctx.moveTo(-25, -26); ctx.lineTo(25, -8); ctx.stroke();
    } else if (era === 3) {
      ctx.fillStyle = "#c67f70";
      for (const x of [-25, 25]) { ctx.beginPath(); ctx.arc(x, -18, 4, 0, TAU); ctx.fill(); }
    } else if (era === 4) {
      ctx.strokeStyle = "#f1b0ca"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(24, -35); ctx.lineTo(24, -63); ctx.stroke();
      ctx.fillStyle = "#f1b0ca"; ctx.beginPath(); ctx.moveTo(25, -61); ctx.lineTo(39, -55); ctx.lineTo(25, -49); ctx.closePath(); ctx.fill();
    } else if (era === 5) {
      ctx.strokeStyle = "#fff0ca"; ctx.lineWidth = 3;
      for (const x of [-18, 18]) { ctx.beginPath(); ctx.arc(x, -10, 7, Math.PI, TAU); ctx.stroke(); }
    } else if (era === 6) {
      ctx.strokeStyle = "#d88fa1"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, -8); ctx.quadraticCurveTo(-38, -28, -27, -40); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-28, -48, 5, 0, TAU); ctx.fill();
    } else if (era === 7) {
      ctx.fillStyle = "rgba(144,231,219,.72)"; roundedRect(-25, -10, 50, 6, 3); ctx.fill();
    } else if (era === 8) {
      ctx.strokeStyle = "rgba(232,169,235,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -24, 34, 9, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#fff2a0"; ctx.beginPath(); ctx.arc(Math.cos(state.time) * 32, -24 + Math.sin(state.time) * 8, 3, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = "#91eddf"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -20, 39, 12, -.15, 0, TAU); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(31, -27, 4, 0, TAU); ctx.fill();
    }
  }

  function drawEraUpgradeAccents(building) {
    if ((building.level || 1) <= 1) return;
    const level = building.level;
    ctx.strokeStyle = level >= 4 ? "#fff1a8" : "rgba(255,255,255,0.82)";
    ctx.lineWidth = 1.5 + level * 0.35;
    ctx.beginPath(); ctx.ellipse(0, 4, 26 + level * 3, 9 + level, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < level; i += 1) {
      const angle = state.time * 0.35 + i * TAU / level;
      const x = Math.cos(angle) * (27 + level * 2);
      const y = -18 + Math.sin(angle) * 8;
      ctx.fillStyle = i % 2 ? "#ffacd0" : "#fff0a0";
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
    }
    if ((building.eraStyle || 0) >= 7) {
      ctx.fillStyle = "rgba(137,233,224,0.55)";
      roundedRect(-18, -7, 36, 5, 2); ctx.fill();
    }
    const eraBadge = ["🔥", "🏺", "🌾", "⚒️", "👑", "📜", "⚙️", "⚡", "💾", "🚀"][clamp(building.eraStyle || 0, 0, 9)];
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath(); ctx.arc(24, -34, 9, 0, TAU); ctx.fill();
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(eraBadge, 24, -34);
    if (building.specialization) {
      const specializationBadge = { family: "♥", commons: "◎", abundance: "+", pantry: "▣", precision: "✦", cooperative: "⌁", service: "★", academy: "A", festival: "♪", sanctuary: "☾" }[building.specialization] || "✦";
      const specializationColor = { family: "#f59ab9", commons: "#8fc9a0", abundance: "#f4c76f", pantry: "#c99b72", precision: "#87b8d3", cooperative: "#83c3aa", service: "#e88eac", academy: "#987fd1", festival: "#dd91ce", sanctuary: "#91a8cf" }[building.specialization] || "#98c9ad";
      ctx.fillStyle = specializationColor;
      ctx.beginPath(); ctx.arc(-24, -34, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "900 9px Quicksand";
      ctx.fillText(specializationBadge, -24, -34);
    }
  }

  function drawWillow() {
    ctx.fillStyle = "#9a7555";
    roundedRect(-8, -42, 16, 49, 6);
    ctx.fill();
    ctx.strokeStyle = "#76533f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f7dda2";
    for (const x of [-18, 18]) {
      ctx.strokeStyle = "#725d4d";
      ctx.beginPath();
      ctx.moveTo(x * 0.45, -38);
      ctx.lineTo(x, -15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, -12, 3, 0, TAU);
      ctx.fill();
    }
    const leaves = [[0,-62,30],[24,-52,24],[-25,-51,25],[10,-39,26],[-15,-36,22]];
    for (const [x, y, radius] of leaves) {
      const gradient = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, radius);
      gradient.addColorStop(0, "#c9f0ae");
      gradient.addColorStop(1, "#62ad76");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.ellipse(-14, -65, 9, 4, -0.5, 0, TAU);
    ctx.fill();
  }

  function drawLily() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.7) * 1.2);
    const gradient = ctx.createRadialGradient(-7, -3, 2, 0, 0, 25);
    gradient.addColorStop(0, "#bcf0a8");
    gradient.addColorStop(1, "#55ad70");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "#e8ffe8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -2, 26, 12, 0, 0.08, TAU - 0.08);
    ctx.lineTo(3, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffb8d3";
    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate(i * TAU / 6);
      ctx.beginPath();
      ctx.ellipse(0, -9, 4, 8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#ffe491";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCottage() {
    drawHouseBase("#ffe4cd", "#e8b39c");
    ctx.fillStyle = "#ef8faf";
    ctx.strokeStyle = "#fff1f6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-29, -30);
    ctx.quadraticCurveTo(0, -66, 29, -30);
    ctx.lineTo(21, -15);
    ctx.quadraticCurveTo(0, -35, -23, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawDoorAndWindow();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(-10, -48, 8, 3, -0.4, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawHouseBase(front, side) {
    ctx.fillStyle = front;
    ctx.strokeStyle = "rgba(91,77,72,0.25)";
    ctx.lineWidth = 1.5;
    roundedRect(-23, -28, 46, 34, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(23, -25);
    ctx.lineTo(31, -30);
    ctx.lineTo(31, -1);
    ctx.lineTo(23, 6);
    ctx.closePath();
    ctx.fill();
  }

  function drawDoorAndWindow() {
    ctx.fillStyle = "#875f5b";
    roundedRect(-7, -13, 14, 19, 6);
    ctx.fill();
    ctx.fillStyle = "#c9f4f2";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-15, -15, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd889";
    ctx.beginPath();
    ctx.arc(3, -3, 1.5, 0, TAU);
    ctx.fill();
  }

  function drawBridge() {
    ctx.strokeStyle = "#7d6048";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-29, -4);
    ctx.quadraticCurveTo(0, -20, 29, -4);
    ctx.stroke();
    for (let i = -3; i <= 3; i += 1) {
      ctx.fillStyle = i % 2 ? "#d9b578" : "#e9c98c";
      ctx.save();
      ctx.translate(i * 8, -4 - (1 - Math.abs(i) / 3) * 8);
      ctx.rotate(i * 0.03);
      roundedRect(-5, -4, 10, 10, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFerry() {
    ctx.strokeStyle = "#765c4b";
    ctx.lineWidth = 3;
    for (const x of [-24, 22]) {
      ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, -26); ctx.stroke();
      ctx.fillStyle = "#f7d57f";
      ctx.beginPath(); ctx.arc(x, -28, 4, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#d9ad72";
    for (let i = -2; i <= 2; i += 1) {
      ctx.save(); ctx.translate(i * 10, -i * 2); ctx.rotate(-0.08);
      roundedRect(-6, -4, 12, 9, 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = "#78c7aa";
    ctx.beginPath(); ctx.moveTo(8, 3); ctx.quadraticCurveTo(26, 0, 31, 9); ctx.quadraticCurveTo(17, 17, 3, 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#effff5"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#f294b8";
    ctx.beginPath(); ctx.moveTo(18, 4); ctx.lineTo(18, -20); ctx.lineTo(31, -7); ctx.closePath(); ctx.fill();
  }

  function drawHouseboat() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.5) * 1.1);
    ctx.fillStyle = "#75b99c";
    ctx.beginPath(); ctx.moveTo(-31, 3); ctx.quadraticCurveTo(0, 17, 31, 3); ctx.lineTo(24, 13); ctx.quadraticCurveTo(0, 24, -24, 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#e9fff5"; ctx.lineWidth = 2; ctx.stroke();
    drawHouseBase("#ffe9ca", "#d5ad82");
    ctx.fillStyle = "#ef93b5";
    ctx.beginPath(); ctx.ellipse(0, -31, 30, 17, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.fillStyle = "#7a5a58";
    roundedRect(-6, -12, 12, 18, 5); ctx.fill();
    for (const x of [-15, 15]) {
      ctx.fillStyle = "#bfeee7"; ctx.beginPath(); ctx.arc(x, -15, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.stroke();
    }
    ctx.restore();
  }

  function drawBerryPatch() {
    for (let row = 0; row < 3; row += 1) {
      ctx.strokeStyle = "#6c9d68";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-24 + row * 4, -3 + row * 5);
      ctx.lineTo(18 + row * 4, -16 + row * 5);
      ctx.stroke();
      for (let i = 0; i < 5; i += 1) {
        const x = -20 + i * 10 + row * 4;
        const y = -5 - i * 3 + row * 5;
        ctx.fillStyle = "#5fa970";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#f06b9a";
        ctx.beginPath();
        ctx.arc(x + 1, y, 2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#f5d69d";
    roundedRect(-28, -2, 11, 8, 2);
    ctx.fill();
  }

  function drawReedNursery() {
    ctx.fillStyle = "#b88e61";
    ctx.beginPath();
    ctx.moveTo(-29, 1);
    ctx.lineTo(2, -10);
    ctx.lineTo(29, 1);
    ctx.lineTo(-2, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#efd59b";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const x = -19 + column * 9 + row * 2;
        const y = 1 - column * 2.2 + row * 5;
        const sway = Math.sin(state.time * 1.6 + column + row) * 1.5;
        ctx.strokeStyle = column % 2 ? "#7fa34d" : "#96b95e";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - 10, x + sway * 1.4, y - 20 - row * 2);
        ctx.stroke();
        ctx.fillStyle = "#c8db78";
        ctx.beginPath();
        ctx.ellipse(x + sway * 1.4, y - 21 - row * 2, 2.3, 5, -0.25, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#f6d98d";
    roundedRect(14, -3, 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = "#8f6d4d";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawFlyFarm() {
    ctx.fillStyle = "#9ccf9b";
    roundedRect(-24, -4, 48, 10, 4);
    ctx.fill();
    const gradient = ctx.createRadialGradient(-7, -24, 2, 0, -15, 28);
    gradient.addColorStop(0, "rgba(255,255,255,0.78)");
    gradient.addColorStop(1, "rgba(168,239,226,0.42)");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "#effffa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -6, 24, Math.PI, TAU);
    ctx.lineTo(24, -6);
    ctx.lineTo(-24, -6);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const angle = state.time * (0.8 + i * 0.08) + i;
      ctx.fillStyle = "#fff3a2";
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * (8 + i), -13 + Math.sin(angle * 1.4) * 8, 2, 0, TAU);
      ctx.fill();
    }
  }

  function drawDuckweedGarden() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.8) * 0.8);
    for (let row = 0; row < 3; row += 1) {
      ctx.fillStyle = row % 2 ? "#8dcf78" : "#6fbd79";
      ctx.beginPath();
      ctx.ellipse(-14 + row * 13, -2 + row * 3, 18, 8, -0.15, 0.08, TAU - 0.08);
      ctx.lineTo(-10 + row * 13, 0 + row * 3); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i % 2 ? "#f49ab9" : "#ffe08b";
        ctx.beginPath(); ctx.arc(-23 + row * 13 + i * 6, -5 + row * 3 + (i % 2) * 4, 2.2, 0, TAU); ctx.fill();
      }
    }
    ctx.strokeStyle = "#eee0a3"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 2, 34, 14, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function drawCafe() {
    drawHouseBase("#fff0dc", "#d9b8a0");
    ctx.fillStyle = "#d991b4";
    ctx.beginPath();
    ctx.ellipse(0, -31, 31, 16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff5d9";
    for (const x of [-15, 0, 15]) {
      ctx.beginPath();
      ctx.arc(x, -35 + Math.abs(x) * 0.1, 4, 0, TAU);
      ctx.fill();
    }
    drawDoorAndWindow();
    ctx.fillStyle = "#8d655e";
    roundedRect(20, -22, 15, 10, 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 7px Quicksand";
    ctx.fillText("TEA", 22, -15);
  }

  function drawMarket() {
    ctx.fillStyle = "#f9e6b5";
    roundedRect(-30, -17, 60, 23, 3);
    ctx.fill();
    const colors = ["#f08daf", "#f5d978", "#8ccfb0", "#a991e0"];
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(-31 + i * 15, -18);
      ctx.lineTo(-16 + i * 15, -18);
      ctx.lineTo(-20 + i * 15, -31);
      ctx.lineTo(-27 + i * 15, -31);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "#7e6654";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-26, -31); ctx.lineTo(-26, 6);
    ctx.moveTo(26, -31); ctx.lineTo(26, 6);
    ctx.stroke();
    ctx.fillStyle = "#f06f9e";
    for (const x of [-15, -5, 8, 18]) { ctx.beginPath(); ctx.arc(x, -8, 3, 0, TAU); ctx.fill(); }
  }

  function drawFloatingMarket() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.3) * 1.2);
    ctx.fillStyle = "#7db69d";
    ctx.beginPath(); ctx.moveTo(-34, 5); ctx.quadraticCurveTo(0, 20, 34, 5); ctx.lineTo(27, 15); ctx.quadraticCurveTo(0, 26, -27, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f4d89e"; roundedRect(-29, -17, 58, 23, 4); ctx.fill();
    const banners = ["#f18faf", "#f7d776", "#8ed3bc", "#a891e4"];
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = banners[i];
      ctx.beginPath(); ctx.moveTo(-30 + i * 15, -18); ctx.lineTo(-15 + i * 15, -18); ctx.lineTo(-18 + i * 15, -31); ctx.lineTo(-27 + i * 15, -31); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "#70584b"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-26, 5); ctx.lineTo(-26, -32); ctx.moveTo(26, 5); ctx.lineTo(26, -32); ctx.stroke();
    for (const x of [-22, 0, 22]) {
      ctx.fillStyle = "#fff19b"; ctx.beginPath(); ctx.arc(x, -36, 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawLibrary() {
    drawTallBuilding("#d7e9ff", "#98b9d8", "#7b6bc4");
    ctx.fillStyle = "#c4afea";
    ctx.beginPath();
    ctx.moveTo(-25, -48);
    ctx.lineTo(0, -67);
    ctx.lineTo(25, -48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff2a8";
    for (const x of [-13, 0, 13]) {
      roundedRect(x - 4, -35, 8, 13, 2);
      ctx.fill();
    }
    ctx.fillStyle = "#675588";
    roundedRect(-7, -15, 14, 21, 5);
    ctx.fill();
  }

  function drawFirehouse() {
    drawTallBuilding("#fff1e7", "#e4c3b6", "#ec6f83");
    ctx.fillStyle = "#ee6e80";
    ctx.beginPath(); ctx.moveTo(-28, -50); ctx.lineTo(0, -69); ctx.lineTo(28, -50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#678b78";
    for (const x of [-13, 13]) { ctx.beginPath(); ctx.arc(x, -39, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = "#678b78"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -35, 7, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = "#d95f72"; roundedRect(-17, -19, 34, 25, 5); ctx.fill();
    ctx.strokeStyle = "#fff5ed"; ctx.lineWidth = 2;
    for (const x of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x, 5); ctx.stroke(); }
    ctx.fillStyle = "#ffd36f"; ctx.beginPath(); ctx.arc(24, -58, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#a56a4f"; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawPoliceStation() {
    drawTallBuilding("#e6f4ff", "#b7d4e7", "#6d96c9");
    ctx.fillStyle = "#789fd0";
    ctx.beginPath(); ctx.moveTo(-27, -49); ctx.lineTo(0, -67); ctx.lineTo(27, -49); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#536f75";
    for (const x of [-13, 13]) { ctx.beginPath(); ctx.arc(x, -37, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = "#536f75"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -33, 7, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = "#f4d86e";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 ? 7 : 12;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(angle) * radius;
      const y = -15 + Math.sin(angle) * radius;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "900 8px Quicksand"; ctx.textAlign = "center"; ctx.fillText("F", 0, -12);
  }

  function drawObservatory() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.2) * 0.8);
    ctx.fillStyle = "#71bcae";
    ctx.beginPath(); ctx.ellipse(0, 4, 31, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#e7e5ff";
    ctx.beginPath(); ctx.arc(0, -13, 24, Math.PI, TAU); ctx.lineTo(24, 2); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = "#8a76bd"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-3, -15); ctx.lineTo(19, -38); ctx.stroke();
    ctx.fillStyle = "#bdaceb"; roundedRect(13, -44, 19, 10, 4); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    for (const [x, y] of [[-12,-14],[8,-7],[-4,-28]]) {
      ctx.fillStyle = "#f6d977"; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawLotusSpa() {
    ctx.save();
    ctx.translate(0, Math.sin(state.time * 1.4) * 1.1);
    ctx.fillStyle = "#71b99c";
    ctx.beginPath(); ctx.ellipse(0, 3, 32, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#bceee1";
    ctx.beginPath(); ctx.ellipse(0, -2, 24, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#f4ffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#f5a5c4";
    for (let i = 0; i < 8; i += 1) {
      ctx.save(); ctx.rotate(i * TAU / 8); ctx.beginPath(); ctx.ellipse(0, -15, 5, 11, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = "#ffe48a"; ctx.beginPath(); ctx.arc(0, -4, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.72)"; ctx.lineWidth = 2;
    for (const x of [-9, 1, 11]) {
      ctx.beginPath(); ctx.moveTo(x, -13); ctx.quadraticCurveTo(x - 5, -24, x, -33); ctx.stroke();
    }
    ctx.restore();
  }

  function drawTallBuilding(front, side, trim) {
    ctx.fillStyle = front;
    roundedRect(-25, -50, 50, 56, 5);
    ctx.fill();
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(25, -46); ctx.lineTo(33, -52); ctx.lineTo(33, 0); ctx.lineTo(25, 6); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = trim;
    roundedRect(-28, -51, 56, 8, 3);
    ctx.fill();
  }

  function drawWorkshop() {
    drawHouseBase("#e7d6b1", "#b9986c");
    ctx.fillStyle = "#7fb798";
    ctx.beginPath();
    ctx.moveTo(-27, -27); ctx.lineTo(0, -49); ctx.lineTo(29, -27); ctx.lineTo(20, -16); ctx.lineTo(-20, -16); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#805e4d";
    roundedRect(-8, -12, 16, 18, 3);
    ctx.fill();
    ctx.save();
    ctx.translate(22, -34);
    ctx.rotate(state.time * 0.45);
    ctx.strokeStyle = "#fff2d1";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -15); ctx.stroke(); }
    ctx.restore();
  }

  function drawClinic() {
    drawHouseBase("#f8f5ee", "#d9d6ce");
    ctx.fillStyle = "#9ad9ba";
    ctx.beginPath();
    ctx.moveTo(-28, -27); ctx.lineTo(0, -49); ctx.lineTo(28, -27); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f29abd";
    ctx.beginPath();
    ctx.arc(0, -24, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    roundedRect(-2, -31, 4, 14, 2); ctx.fill();
    roundedRect(-7, -26, 14, 4, 2); ctx.fill();
    drawDoorAndWindow();
  }

  function drawStage() {
    ctx.fillStyle = "#e8c695";
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 12, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#7d6553";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, -2); ctx.lineTo(-23, -43);
    ctx.moveTo(26, -2); ctx.lineTo(23, -43);
    ctx.stroke();
    const gradient = ctx.createLinearGradient(-25, -43, 25, -18);
    gradient.addColorStop(0, "#f08faf");
    gradient.addColorStop(0.5, "#a18add");
    gradient.addColorStop(1, "#7dc9ae");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-27, -43); ctx.quadraticCurveTo(0, -58, 27, -43); ctx.lineTo(21, -26); ctx.quadraticCurveTo(0, -37, -21, -26); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 7; i += 1) {
      ctx.fillStyle = "#fff2a6";
      ctx.beginPath();
      ctx.arc(-22 + i * 7.3, -39 + Math.sin(i) * 3, 2, 0, TAU);
      ctx.fill();
    }
  }

  function drawCastle() {
    ctx.fillStyle = "#eee8ff";
    roundedRect(-26, -54, 52, 60, 5);
    ctx.fill();
    ctx.fillStyle = "#c5b4e9";
    for (const x of [-30, 30]) {
      roundedRect(x - 10, -48, 20, 54, 4);
      ctx.fill();
      ctx.fillStyle = "#aa8fd8";
      ctx.beginPath();
      ctx.moveTo(x - 12, -48); ctx.lineTo(x, -66); ctx.lineTo(x + 12, -48); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c5b4e9";
    }
    ctx.fillStyle = "#a88dd8";
    ctx.beginPath();
    ctx.moveTo(-29, -54); ctx.lineTo(0, -76); ctx.lineTo(29, -54); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#6f5a88";
    roundedRect(-8, -19, 16, 25, 7);
    ctx.fill();
    ctx.fillStyle = "#fff0a0";
    for (const x of [-30, -13, 13, 30]) {
      ctx.beginPath(); ctx.arc(x, -35, 4, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#f2d36f";
    ctx.font = "900 18px Baloo 2";
    ctx.textAlign = "center";
    ctx.fillText("♛", 0, -48);
  }

  function drawGarden() {
    ctx.fillStyle = "rgba(102,165,105,0.28)";
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 11, 0, 0, TAU); ctx.fill();
    const colors = ["#f18eb6", "#f7d477", "#a78bdd", "#fff2f8", "#79cdb5"];
    for (let i = 0; i < 13; i += 1) {
      const angle = i * 2.4;
      const radius = 5 + (i % 4) * 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.35 - 3;
      ctx.strokeStyle = "#4f9e6a";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = colors[i % colors.length];
      for (let p = 0; p < 5; p += 1) {
        ctx.beginPath(); ctx.arc(x + Math.cos(p * TAU / 5) * 3, y + Math.sin(p * TAU / 5) * 3, 2, 0, TAU); ctx.fill();
      }
    }
  }

  function drawMossNest() {
    ctx.fillStyle = "#88bd79";
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 11, 0, 0, TAU); ctx.fill();
    const nest = ctx.createRadialGradient(-8, -24, 2, 0, -15, 34);
    nest.addColorStop(0, "#d8edaa"); nest.addColorStop(.48, "#8eb977"); nest.addColorStop(1, "#658b60");
    ctx.fillStyle = nest;
    ctx.beginPath(); ctx.ellipse(0, -14, 28, 27, 0, Math.PI, TAU); ctx.lineTo(28, 3); ctx.lineTo(-28, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#587654"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i += 1) { ctx.beginPath(); ctx.arc(0, -7, 12 + i * 2.3, Math.PI + .2, TAU - .2); ctx.stroke(); }
    ctx.fillStyle = "#674f48"; roundedRect(-7, -15, 14, 19, 7); ctx.fill();
    ctx.fillStyle = "#ffd5e5"; for (const p of [[-18,-22],[18,-18],[-12,-34],[10,-35]]) { ctx.beginPath(); ctx.arc(p[0],p[1],3,0,TAU); ctx.fill(); }
    ctx.strokeStyle = "#7f634f"; ctx.beginPath(); ctx.moveTo(24,-25); ctx.lineTo(30,-11); ctx.stroke();
    ctx.fillStyle = "#fff0a1"; ctx.beginPath(); ctx.arc(31,-9,4,0,TAU); ctx.fill();
  }

  function drawTreetopHamlet() {
    ctx.fillStyle = "#7b9c67"; roundedRect(-8, -45, 16, 50, 6); ctx.fill();
    ctx.strokeStyle = "#5f7654"; ctx.lineWidth = 2; ctx.stroke();
    const swaying = Math.sin(state.time * .7) * 1.5;
    for (const [x, y, color] of [[-24,-35,"#f4b3c8"],[22,-42,"#b9a3e6"],[0,-59,"#ffe3a1"]]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x + swaying, y, 18, 14, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.stroke();
      ctx.fillStyle = "#71596d"; roundedRect(x - 5 + swaying, y - 5, 10, 12, 5); ctx.fill();
    }
    ctx.strokeStyle = "#b58a69"; ctx.lineWidth = 3; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(-9,-38); ctx.quadraticCurveTo(0,-31,10,-42); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#79b977"; for (const p of [[-34,-48],[33,-52],[-15,-63],[16,-70]]) { ctx.beginPath(); ctx.arc(p[0],p[1],10,0,TAU); ctx.fill(); }
  }

  function drawBeautyLandmark(building) {
    const id = building.id;
    const shimmer = .5 + Math.sin(state.time * 1.4) * .2;
    if (id === "wildflower") {
      drawGarden();
      ctx.fillStyle = "#fff6bb";
      for (let i = 0; i < 5; i += 1) { const a = state.time * .35 + i * 1.7; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 24, -18 + Math.sin(a * 1.3) * 7, 3, 1.4, a, 0, TAU); ctx.fill(); }
      return;
    }
    if (id === "topiary") {
      ctx.fillStyle = "#a6cf81"; ctx.beginPath(); ctx.ellipse(0, 3, 38, 12, 0, 0, TAU); ctx.fill();
      for (const x of [-20, 20]) {
        ctx.fillStyle = "#6fab70"; ctx.beginPath(); ctx.ellipse(x, -21, 15, 18, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 8, -35, 7, 0, TAU); ctx.arc(x + 8, -35, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff0a6"; ctx.beginPath(); ctx.arc(x - 5, -23, 1.7, 0, TAU); ctx.arc(x + 5, -23, 1.7, 0, TAU); ctx.fill();
        ctx.fillStyle = "#f6a9c3"; for (const dx of [-11,11]) { ctx.beginPath(); ctx.arc(x + dx,-16,2.5,0,TAU); ctx.fill(); }
      }
      return;
    }
    if (id === "canalplaza") {
      ctx.fillStyle = "#d7d8e3"; ctx.beginPath(); ctx.ellipse(0, 2, 38, 14, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#94b5c1"; ctx.lineWidth = 1.5;
      for (const x of [-24,-8,8,24]) { ctx.beginPath(); ctx.moveTo(x,-9); ctx.lineTo(x,10); ctx.stroke(); }
      ctx.fillStyle = "#7cc9d1"; ctx.beginPath(); ctx.ellipse(0,-3,17,7,0,0,TAU); ctx.fill();
      ctx.fillStyle = "#c8b7d8"; roundedRect(-5,-34,10,35,4); ctx.fill();
      ctx.fillStyle = "#ffe994"; ctx.beginPath(); ctx.arc(0,-38,6,0,TAU); ctx.fill();
      return;
    }
    if (id === "rosegallery") {
      ctx.fillStyle = "#ead8dc"; roundedRect(-34,-38,68,43,5); ctx.fill();
      ctx.strokeStyle = "#fff8f3"; ctx.lineWidth = 3; ctx.stroke();
      for (const x of [-25,-8,8,25]) { ctx.fillStyle = "#d3c0ca"; roundedRect(x-3,-36,6,40,3); ctx.fill(); }
      ctx.fillStyle = "#9b7bb8"; ctx.beginPath(); ctx.moveTo(-38,-37); ctx.lineTo(0,-58); ctx.lineTo(38,-37); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f18eae"; for (let i=0;i<8;i+=1) { const a=i*TAU/8; ctx.beginPath(); ctx.arc(Math.cos(a)*28,-18+Math.sin(a)*12,3,0,TAU); ctx.fill(); }
      return;
    }
    if (id === "sculpturecourt") {
      ctx.fillStyle = "#b9d8bd"; ctx.beginPath(); ctx.ellipse(0,3,38,13,0,0,TAU); ctx.fill();
      for (const x of [-23,0,23]) {
        ctx.fillStyle = "#eee9f1"; roundedRect(x-7,-17,14,20,3); ctx.fill();
        ctx.beginPath(); ctx.arc(x,-27,9,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x-6,-35,4,0,TAU); ctx.arc(x+6,-35,4,0,TAU); ctx.fill();
        ctx.fillStyle = "#81788a"; ctx.beginPath(); ctx.arc(x-3,-27,1.2,0,TAU); ctx.arc(x+3,-27,1.2,0,TAU); ctx.fill();
      }
      return;
    }
    if (id === "carousel") {
      ctx.fillStyle = "#d79db5"; ctx.beginPath(); ctx.ellipse(0,3,36,12,0,0,TAU); ctx.fill();
      ctx.strokeStyle = "#876e8f"; ctx.lineWidth = 2; for (const x of [-23,-8,8,23]) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,-39); ctx.stroke(); }
      ctx.fillStyle = "#ffd59a"; ctx.beginPath(); ctx.moveTo(-38,-38); ctx.quadraticCurveTo(0,-65,38,-38); ctx.lineTo(29,-28); ctx.lineTo(-29,-28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#9a83d0"; for (const x of [-22,-7,8,23]) { ctx.beginPath(); ctx.ellipse(x,-10 + Math.sin(state.time*2+x)*2,8,5,0,0,TAU); ctx.fill(); }
      return;
    }
    if (id === "aurorapark") {
      ctx.fillStyle = "#79c99b"; ctx.beginPath(); ctx.ellipse(0,3,43,15,0,0,TAU); ctx.fill();
      for (let i=0;i<3;i+=1) { ctx.strokeStyle = ["#f493b8","#ffe38b","#8eddd0"][i]; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-2,20+i*7,Math.PI,TAU); ctx.stroke(); }
      ctx.fillStyle = "#fff"; for (const x of [-31,31]) { ctx.beginPath(); ctx.arc(x,-7,5,0,TAU); ctx.fill(); }
      return;
    }
    if (id === "hologarden") {
      ctx.fillStyle = "rgba(104,205,188,.55)"; ctx.beginPath(); ctx.ellipse(0,2,38,13,0,0,TAU); ctx.fill();
      ctx.globalAlpha = .68 + shimmer;
      for (let i=0;i<7;i+=1) { const x=-27+i*9; const h=18+(i%3)*8; ctx.fillStyle=i%2?"#c591e7":"#80ddd2"; ctx.beginPath(); ctx.moveTo(x,-2); ctx.lineTo(x+5,-h); ctx.lineTo(x+10,-2); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.strokeStyle="rgba(255,255,255,.8)"; ctx.beginPath(); ctx.ellipse(0,-20,31,8,state.time*.1,0,TAU); ctx.stroke();
      return;
    }
    ctx.fillStyle = "#7c88bd"; ctx.beginPath(); ctx.ellipse(0,3,42,14,0,0,TAU); ctx.fill();
    ctx.fillStyle = "rgba(181,226,244,.36)"; ctx.strokeStyle = "#c8f4ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,-4,37,Math.PI,TAU); ctx.lineTo(37,3); ctx.lineTo(-37,3); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i=0;i<8;i+=1) { const a=state.time*.22+i*TAU/8; ctx.fillStyle=i%2?"#fff2a7":"#f4a6d1"; ctx.beginPath(); ctx.arc(Math.cos(a)*27,-16+Math.sin(a)*12,3,0,TAU); ctx.fill(); }
    ctx.fillStyle="#81c58d"; ctx.beginPath(); ctx.ellipse(0,-5,15,6,0,0,TAU); ctx.fill();
  }

  function drawLantern() {
    ctx.strokeStyle = "#665544";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -34); ctx.quadraticCurveTo(10, -40, 15, -32); ctx.stroke();
    const glow = 0.7 + Math.sin(state.time * 2.6) * 0.15;
    ctx.shadowColor = "#fff0a6";
    ctx.shadowBlur = 18 * glow;
    ctx.fillStyle = "#ffe994";
    roundedRect(10, -34, 12, 15, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#866a51";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawShrine() {
    ctx.fillStyle = "#c7b4dd";
    ctx.beginPath(); ctx.ellipse(0, 1, 30, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#765d89";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-20, -36); ctx.lineTo(20, -36); ctx.lineTo(20, 0);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-27, -31); ctx.lineTo(0, -51); ctx.lineTo(27, -31); ctx.stroke();
    ctx.fillStyle = "#f5e58e";
    ctx.beginPath(); ctx.arc(0, -22, 10, 0.4, Math.PI * 1.6); ctx.arc(4, -24, 9, Math.PI * 1.55, 0.45, true); ctx.fill();
    ctx.fillStyle = "#8bd0c0";
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 5, 0, 0, TAU); ctx.fill();
  }

  function drawLogLodge() {
    ctx.save();
    ctx.rotate(-0.04);
    const wood = ctx.createLinearGradient(-34, -24, 34, 8);
    wood.addColorStop(0, "#b87955");
    wood.addColorStop(0.5, "#d99b69");
    wood.addColorStop(1, "#9a6249");
    ctx.fillStyle = wood;
    roundedRect(-35, -25, 70, 31, 14);
    ctx.fill();
    ctx.strokeStyle = "#70483c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#6f493a";
    ctx.beginPath();
    ctx.ellipse(34, -10, 13, 16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#dbac7c";
    for (const radius of [5, 9]) { ctx.beginPath(); ctx.ellipse(34, -10, radius, radius * 1.25, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = "#74506e";
    roundedRect(-8, -16, 16, 22, 8);
    ctx.fill();
    ctx.fillStyle = "#ffe6a8";
    ctx.beginPath(); ctx.arc(-20, -11, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff9dc"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#8cd38f";
    for (const x of [-25, -8, 11, 23]) { ctx.beginPath(); ctx.arc(x, -28 - Math.abs(x) * 0.04, 7, 0, TAU); ctx.fill(); }
    ctx.fillStyle = "#ffb4ce";
    for (const x of [-20, 5, 23]) { ctx.beginPath(); ctx.arc(x, -31, 2.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawApiary() {
    ctx.fillStyle = "#98c979";
    ctx.beginPath(); ctx.ellipse(0, 1, 27, 9, 0, 0, TAU); ctx.fill();
    for (const [x, color] of [[-13, "#ffd77d"], [12, "#ffb8ce"]]) {
      ctx.fillStyle = color;
      for (let level = 0; level < 3; level += 1) { roundedRect(x - 10 + level, -8 - level * 8, 20 - level * 2, 9, 4); ctx.fill(); }
      ctx.fillStyle = "#705568"; ctx.beginPath(); ctx.arc(x, -12, 2.5, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 4; i += 1) {
      const angle = state.time * 1.5 + i * TAU / 4;
      const x = Math.cos(angle) * 28;
      const y = -20 + Math.sin(angle) * 8;
      ctx.fillStyle = "#ffe082"; ctx.beginPath(); ctx.ellipse(x, y, 4, 2.5, angle, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#6e5b55"; ctx.beginPath(); ctx.moveTo(x - 1, y - 2); ctx.lineTo(x + 1, y + 2); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.ellipse(x, y - 3, 2, 3, 0, 0, TAU); ctx.fill();
    }
  }

  function drawBakery() {
    drawHouseBase("#ffd9c5", "#e7a8ad");
    ctx.fillStyle = "#c78a71";
    ctx.beginPath(); ctx.arc(0, -31, 25, 0.15, Math.PI - 0.15, true); ctx.lineTo(-20, -9); ctx.lineTo(21, -9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff0dc"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -30, 16, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -30, 9, 0, TAU); ctx.stroke();
    ctx.fillStyle = "#8f6571"; roundedRect(-7, -15, 14, 22, 7); ctx.fill();
    ctx.fillStyle = "#fff3bd"; roundedRect(-25, -19, 11, 9, 4); ctx.fill();
    ctx.fillStyle = "#7c645e"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.fillText("BUN", -19.5, -12);
    ctx.fillStyle = "rgba(255,255,255,.6)";
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(19 + i * 4, -48 - i * 7, 4 + i, 0, TAU); ctx.fill(); }
  }

  function drawTadpoleNursery() {
    ctx.save(); ctx.translate(0, Math.sin(state.time * 1.8) * 1.2);
    ctx.fillStyle = "#69bc83"; ctx.beginPath(); ctx.ellipse(0, 0, 31, 13, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#dfffe6"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#fff1c6"; roundedRect(-18, -19, 36, 17, 8); ctx.fill();
    ctx.strokeStyle = "#d9a8bf"; ctx.stroke();
    for (const x of [-10, 0, 10]) {
      ctx.fillStyle = x === 0 ? "#8fd99b" : "#a7c9ef";
      ctx.beginPath(); ctx.ellipse(x, -11, 4, 3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 3, -11); ctx.quadraticCurveTo(x - 8, -6, x - 5, -3); ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
    }
    ctx.fillStyle = "#ffb4d1"; for (let i = 0; i < 5; i += 1) { ctx.save(); ctx.rotate(i * TAU / 5); ctx.beginPath(); ctx.ellipse(0, -25, 4, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#ffe79b"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSchoolhouse() {
    drawHouseBase("#d8cdf6", "#a99bd8");
    ctx.fillStyle = "#f7b7ce";
    ctx.beginPath(); ctx.moveTo(-28, -19); ctx.lineTo(0, -49); ctx.lineTo(28, -19); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff1f7"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#fff0ad"; roundedRect(-7, -12, 14, 19, 6); ctx.fill();
    ctx.fillStyle = "#7e69a8"; roundedRect(-15, -40, 30, 9, 4); ctx.fill();
    ctx.fillStyle = "white"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.fillText("LILYBELL", 0, -33.5);
    ctx.fillStyle = "#ffe179"; ctx.beginPath(); ctx.arc(0, -54, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#7a668a"; ctx.beginPath(); ctx.moveTo(0, -49); ctx.lineTo(0, -43); ctx.stroke();
  }

  function drawPostOffice() {
    drawHouseBase("#bce8da", "#84c5b8");
    ctx.fillStyle = "#ffbdd0"; ctx.beginPath(); ctx.moveTo(-27, -18); ctx.lineTo(0, -43); ctx.lineTo(27, -18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff6d8"; roundedRect(-16, -27, 32, 20, 4); ctx.fill();
    ctx.strokeStyle = "#c897a9"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-15, -25); ctx.lineTo(0, -15); ctx.lineTo(15, -25); ctx.stroke();
    ctx.fillStyle = "#80617c"; roundedRect(-6, -6, 12, 14, 5); ctx.fill();
    ctx.strokeStyle = "#7c6b65"; ctx.beginPath(); ctx.arc(23, -10, 8, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(23, -10, 4, Math.PI, TAU); ctx.stroke();
  }

  function drawFrogFountain() {
    const water = ctx.createRadialGradient(0, 2, 3, 0, 2, 27);
    water.addColorStop(0, "#d8fbff"); water.addColorStop(1, "#75c9df");
    ctx.fillStyle = water; ctx.beginPath(); ctx.ellipse(0, 3, 28, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#f5ffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#b7c8c0"; roundedRect(-8, -13, 16, 18, 5); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -18, 10, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-7, -25, 4, 0, TAU); ctx.arc(7, -25, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = "#536c64"; ctx.beginPath(); ctx.arc(-4, -19, 1.4, 0, TAU); ctx.arc(4, -19, 1.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(191,241,255,.9)"; ctx.lineWidth = 2;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 5, -20); ctx.quadraticCurveTo(side * 25, -22, side * 22, 1); ctx.stroke(); }
  }

  function drawWaterStage() {
    ctx.fillStyle = "#69b67d"; ctx.beginPath(); ctx.ellipse(0, 2, 36, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffcfdf"; roundedRect(-27, -27, 54, 29, 8); ctx.fill();
    ctx.fillStyle = "#685479"; roundedRect(-20, -22, 40, 20, 5); ctx.fill();
    ctx.fillStyle = "#f38fb6"; roundedRect(-27, -28, 12, 31, 5); ctx.fill(); roundedRect(15, -28, 12, 31, 5); ctx.fill();
    ctx.fillStyle = "#ffe9a6"; for (const x of [-18, -6, 6, 18]) { ctx.beginPath(); ctx.arc(x, -31, 3, 0, TAU); ctx.fill(); }
    for (const x of [-8, 8]) {
      ctx.fillStyle = x < 0 ? "#8fd99b" : "#f4a9c7"; ctx.beginPath(); ctx.arc(x, -11, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#4d5e59"; ctx.beginPath(); ctx.arc(x - 2, -12, 1, 0, TAU); ctx.arc(x + 2, -12, 1, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#f4d7a3"; ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, -1); ctx.stroke();
    }
  }

  function drawSplashPark() {
    ctx.fillStyle = "#8cd3e2"; ctx.beginPath(); ctx.ellipse(0, 3, 32, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#e8ffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#ff9fc1"; roundedRect(-18, -26, 12, 29, 5); ctx.fill();
    ctx.fillStyle = "#ffe397"; ctx.beginPath(); ctx.moveTo(-23, -25); ctx.lineTo(-12, -40); ctx.lineTo(-1, -25); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#8c77be"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-7, -22); ctx.quadraticCurveTo(15, -17, 20, 2); ctx.stroke();
    ctx.strokeStyle = "#6e8f86"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(24, -18); ctx.lineTo(31, -3); ctx.stroke();
    ctx.fillStyle = "#b8a3e8"; roundedRect(10, -13, 18, 5, 3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.75)"; for (const p of [[-28,-4],[28,-6],[5,-25]]) { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.fill(); }
  }

  function drawFrog(frog) {
    const point = iso(frog.fx, frog.fy, Math.abs(Math.sin(frog.hop)) * (frog.target ? 8 : 1.5));
    const scale = view.zoom * 0.74;
    const blink = frog.blink < 0.12 ? 0.15 : 1;
    ctx.save();
    ctx.translate(point.x, point.y - 7 * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(35,73,52,0.2)";
    ctx.beginPath(); ctx.ellipse(0, 12, 16, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = frog.color;
    ctx.strokeStyle = "rgba(255,255,255,0.88)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(-10, 8, 8, 5, -0.3, 0, TAU); ctx.ellipse(10, 8, 8, 5, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    const body = ctx.createRadialGradient(-6, -8, 2, 0, 0, 20);
    body.addColorStop(0, "#efffe8");
    body.addColorStop(0.34, frog.color);
    body.addColorStop(1, shadeColor(frog.color, -18));
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = frog.color;
    ctx.beginPath(); ctx.arc(-9, -12, 7, 0, TAU); ctx.arc(9, -12, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3e5348";
    ctx.save(); ctx.translate(-9, -12); ctx.scale(1, blink); ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(9, -12); ctx.scale(1, blink); ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = "rgba(245,116,160,0.42)";
    ctx.beginPath(); ctx.ellipse(-11, -2, 4, 2.2, 0, 0, TAU); ctx.ellipse(11, -2, 4, 2.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#3e5348";
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, -3, 6, 0.18, Math.PI - 0.18); ctx.stroke();
    if (frog.role !== "Neighbor") {
      ctx.fillStyle = roleColor(frog.role);
      ctx.beginPath(); ctx.moveTo(-13, 6); ctx.lineTo(13, 6); ctx.lineTo(10, 14); ctx.lineTo(-10, 14); ctx.closePath(); ctx.fill();
    }
    drawRoleAccessory(frog.role);
    if (frog.title === "Crownkeeper") {
      ctx.fillStyle = "#ffe58c";
      ctx.strokeStyle = "#b88943";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-11, -23); ctx.lineTo(-8, -34); ctx.lineTo(-2, -27); ctx.lineTo(3, -35); ctx.lineTo(9, -26); ctx.lineTo(12, -34); ctx.lineTo(11, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (frog.title === "Moonpetal Heir") {
      ctx.fillStyle = "#d9c8ff";
      ctx.beginPath(); ctx.arc(0, -27, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(2, -29, 3.5, 0, TAU); ctx.fill();
    }
    if (frog.disposition === "chaotic" && !isDetained(frog)) {
      ctx.fillStyle = "#ffed83";
      ctx.strokeStyle = "#a87356";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(16, -23); ctx.lineTo(24, -10); ctx.lineTo(9, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#72534c"; ctx.font = "900 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", 16.5, -12);
    }
    if (isDetained(frog)) {
      ctx.strokeStyle = "rgba(100,107,126,.78)";
      ctx.lineWidth = 2;
      for (const x of [-11, -4, 4, 11]) { ctx.beginPath(); ctx.moveTo(x, -29); ctx.lineTo(x, 15); ctx.stroke(); }
    }
    if (frog.illness) {
      ctx.fillStyle = "rgba(255,245,248,.94)";
      roundedRect(-15, 3, 30, 7, 3); ctx.fill();
      ctx.fillStyle = "#ee8faa";
      ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(17, 14); ctx.lineTo(12, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(18, -27, 8, 0, TAU); ctx.fill();
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frog.illness.icon || "🤒", 18, -27);
    }
    if (frog.ageDays > frog.lifespanDays * 0.72) {
      ctx.strokeStyle = "#846d78";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(-9, -12, 4.5, 0, TAU); ctx.arc(9, -12, 4.5, 0, TAU); ctx.moveTo(-4.5, -12); ctx.lineTo(4.5, -12); ctx.stroke();
    }
    ctx.restore();

    if (frog.bubbleTimer > 0 && frog.bubble) drawSpeechBubble(point.x, point.y - 38 * scale, frog.bubble, scale);
    if (state.selected.type === "frog" && state.selected.value?.id === frog.id) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(point.x, point.y + 2, 20 * scale, 8 * scale, 0, 0, TAU); ctx.stroke();
    }
  }

  function drawRoleAccessory(role) {
    if (role.includes("Student") || role === "Young Frog") {
      ctx.fillStyle = role === "University Student" ? "#8e79d2" : role === "High School Student" ? "#69a9c8" : "#f0a5bd";
      ctx.beginPath(); ctx.moveTo(-13, -21); ctx.lineTo(0, -30); ctx.lineTo(13, -21); ctx.lineTo(0, -16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff0a8"; ctx.beginPath(); ctx.arc(12, -19, 2, 0, TAU); ctx.fill();
    } else if (["Programmer", "Roboticist", "Rocket Scientist", "Flight Director", "Food Scientist", "Aquaponic Engineer", "Lunar Botanist", "Climate Forecaster", "Fabrication Scientist", "Astro Dean"].includes(role)) {
      ctx.fillStyle = "rgba(170,245,235,.78)";
      roundedRect(-14, -18, 28, 8, 4); ctx.fill();
      ctx.strokeStyle = "#7372bd"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#fff0a2"; ctx.beginPath(); ctx.arc(9, -14, 1.5, 0, TAU); ctx.fill();
    } else if (["Firekeeper", "Constable", "Warden", "Magistrate", "Assembly Speaker", "Civic Minister", "Mailfrog", "Teacher", "Elementary Teacher", "High School Teacher", "Professor", "Caregiver", "Beekeeper", "Herbalist", "Healer", "Royal Healer", "Apothecary", "Doctor", "Epidemiologist", "Astro Medic"].includes(role)) {
      const colors = { Firekeeper: "#ec7181", Constable: "#6e99ce", Warden: "#7886a6", Magistrate: "#987fc1", "Assembly Speaker": "#7baa92", "Civic Minister": "#9c82c8", Mailfrog: "#d9a2c5", Teacher: "#9b83d4", Caregiver: "#7bc5a5", Beekeeper: "#f1ca62", Herbalist: "#76b97d", Healer: "#e49abb", "Royal Healer": "#9c83cf", Apothecary: "#cc8db6", Doctor: "#75aec9", Epidemiologist: "#8289d5", "Astro Medic": "#7ad5c4" };
      ctx.fillStyle = colors[role] || "#9b83d4";
      ctx.beginPath(); ctx.ellipse(0, -21, 13, 5, 0, Math.PI, TAU); ctx.fill();
      roundedRect(-9, -29, 18, 9, 4); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "900 7px Quicksand";
      ctx.textAlign = "center";
      ctx.fillText(({ Firekeeper: "F", Constable: "★", Warden: "W", Magistrate: "§", "Assembly Speaker": "A", "Civic Minister": "C", Mailfrog: "♥", Teacher: "A", "Elementary Teacher": "E", "High School Teacher": "H", Professor: "U", Caregiver: "+", Beekeeper: "B", Herbalist: "+", Healer: "+", "Royal Healer": "+", Apothecary: "+", Doctor: "+", Epidemiologist: "+", "Astro Medic": "+" })[role], 0, -22);
    } else if (["Community Cook", "Tea Keeper", "Royal Orchardist", "Hothouse Tender", "Reed Weaver", "Potter", "Carpenter", "Crown Jeweler", "Cartographer", "Reuse Engineer", "Storykeeper", "Archivist", "Union Steward"].includes(role)) {
      ctx.fillStyle = roleColor(role);
      ctx.beginPath(); ctx.ellipse(0, -22, 14, 5, 0, Math.PI, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(-7, -25, 7, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = "#fff0a5";
      ctx.beginPath(); ctx.arc(8, -24, 2.5, 0, TAU); ctx.fill();
    } else if (role === "Astronomer") {
      ctx.fillStyle = "#8d78c7";
      ctx.beginPath(); ctx.moveTo(-11, -20); ctx.lineTo(4, -38); ctx.lineTo(13, -19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffe78a"; ctx.beginPath(); ctx.arc(2, -27, 2, 0, TAU); ctx.fill();
    }
  }

  function drawTadpole(tadpole) {
    const bob = Math.sin(tadpole.wiggle) * 2;
    const point = iso(tadpole.fx, tadpole.fy, 2 + bob);
    const scale = view.zoom * 0.68;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);
    const tailWave = Math.sin(tadpole.wiggle * 1.4) * 5;
    ctx.fillStyle = "rgba(38,84,70,0.16)";
    ctx.beginPath(); ctx.ellipse(0, 7, 15, 4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = shadeColor(tadpole.color, -20);
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(20, -3 + tailWave, 27, 5 + tailWave); ctx.stroke();
    const body = ctx.createRadialGradient(-4, -5, 1, 0, 0, 14);
    body.addColorStop(0, "#f5fff0"); body.addColorStop(0.3, tadpole.color); body.addColorStop(1, shadeColor(tadpole.color, -18));
    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#43564d";
    ctx.beginPath(); ctx.arc(-5, -3, 1.7, 0, TAU); ctx.arc(5, -3, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#43564d"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = "rgba(245,118,162,0.45)";
    ctx.beginPath(); ctx.arc(-8, 2, 2, 0, TAU); ctx.arc(8, 2, 2, 0, TAU); ctx.fill();
    ctx.restore();
    if (tadpole.bubbleTimer > 0) drawSpeechBubble(point.x, point.y - 22 * scale, tadpole.bubble, scale);
    if (state.selected.type === "tadpole" && state.selected.value?.id === tadpole.id) {
      ctx.strokeStyle = "rgba(255,255,255,0.94)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(point.x, point.y + 3, 15 * scale, 6 * scale, 0, 0, TAU); ctx.stroke();
    }
  }

  function roleColor(role) {
    return ({ Gardener: "#f08caf", Reedkeeper: "#9ebf62", Rancher: "#78cfc0", Aquafarmer: "#66b69b", Beekeeper: "#e4bd58", Chef: "#f0bf70", "Community Cook": "#e5a36e", "Tea Keeper": "#c78ebc", "Royal Orchardist": "#d77f8d", "Hothouse Tender": "#78b890", Baker: "#d995a8", Merchant: "#a68add", "Boat Merchant": "#8b7cdc", Ferrymaster: "#5aa7b6", Scholar: "#769bd2", Storykeeper: "#d18f69", Archivist: "#8396aa", Cartographer: "#78a7ae", Teacher: "#8e79c9", Caregiver: "#72bb9b", Mailfrog: "#d89fbe", Astronomer: "#8f7bd0", Firekeeper: "#e86f7e", Constable: "#6e97c9", Warden: "#7586a5", Magistrate: "#957ec0", "Assembly Speaker": "#78a98f", "Civic Minister": "#9b81c7", "Civic Analyst": "#70b9bd", "Orbital Ambassador": "#7d9bd4", "Union Steward": "#bd8092", Artisan: "#b9986f", "Reed Weaver": "#b59566", Potter: "#c98369", Carpenter: "#a77f5e", "Crown Jeweler": "#a989d0", "Reuse Engineer": "#70ad8c", Herbalist: "#72b87a", Healer: "#eb9db7", "Royal Healer": "#987dcc", Apothecary: "#c884ae", Doctor: "#6ba9c7", Epidemiologist: "#7b82d1", "Astro Medic": "#6fcdbb", Musician: "#8d79d6" })[role] || "#7fb68e";
  }

  function drawSpeechBubble(x, y, text, scale) {
    ctx.save();
    ctx.font = `800 ${Math.max(8, 10 * scale)}px Quicksand`;
    const width = ctx.measureText(text).width + 12;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    roundedRect(x - width / 2, y - 15, width, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#52675c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y - 5);
    ctx.restore();
  }

  function drawWeather() {
    if (world.disaster?.type === "drought") {
      ctx.fillStyle = "rgba(255,218,145,0.14)";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(132,94,76,0.22)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 13; i += 1) {
        const x = (i * 127) % W;
        const y = H * 0.55 + (i * 47) % (H * 0.35);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 11, y + 7); ctx.lineTo(x + 5, y + 15); ctx.stroke();
      }
    }
    if (world.disaster?.type === "flood") {
      const flood = ctx.createLinearGradient(0, H * 0.55, 0, H);
      flood.addColorStop(0, "rgba(137,211,225,0)");
      flood.addColorStop(1, "rgba(93,184,207,0.3)");
      ctx.fillStyle = flood;
      ctx.fillRect(0, 0, W, H);
    }
    if (world.weather.type === "rain") {
      ctx.strokeStyle = "rgba(223,247,255,0.55)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 75; i += 1) {
        const x = (i * 91.7 + state.time * 190) % (W + 50) - 25;
        const y = (i * 53.3 + state.time * 300) % H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 15); ctx.stroke();
      }
    }
    if (world.weather.type === "mist") {
      const gradient = ctx.createLinearGradient(0, H * 0.35, 0, H);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(1, "rgba(236,247,242,0.42)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }
    if (world.weather.type === "fireflies" || nightAmount() > 0.4 || world.flags.festivalTimer > 0) {
      const amount = world.flags.festivalTimer > 0 ? 50 : 24;
      for (let i = 0; i < amount; i += 1) {
        const x = (i * 113 + Math.sin(state.time * 0.8 + i) * 30) % W;
        const y = H * 0.25 + (i * 67) % (H * 0.62) + Math.cos(state.time + i) * 14;
        ctx.globalAlpha = 0.28 + Math.sin(state.time * 3 + i) * 0.2;
        ctx.fillStyle = "#fff2a0";
        ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function placementValid(x, y) {
    const tile = tileAt(x, y);
    const definition = BUILDINGS.find((building) => building.id === state.selectedTool);
    if (!tile || !definition || !isTileUnlocked(x, y) || definition.era > currentEra()) return false;
    if (definition.removeTool) return Boolean(buildingAt(x, y) && buildingAt(x, y).id !== "willow");
    if (definition.terrainTool) return tile.terrain === "grass" && !buildingAt(x, y);
    return footprintCanFit(definition, x, y);
  }

  function polygon(points) {
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function shadeColor(hex, amount) {
    const number = Number.parseInt(hex.replace("#", ""), 16);
    return `rgb(${clamp((number >> 16) + amount, 0, 255)},${clamp(((number >> 8) & 255) + amount, 0, 255)},${clamp((number & 255) + amount, 0, 255)})`;
  }

  function choose(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);
  }

  function saveWorld(showMessage = true) {
    if (!world) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(world));
    if (showMessage) toast("Kingdom saved");
  }

  function loadWorld() {
    try {
      const loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!loaded || loaded.version !== 2 || !Array.isArray(loaded.tiles) || !Array.isArray(loaded.frogs)) return false;
      world = loaded;
      migrateWorldGrid();
      world.resources = { flies: 0, berries: 0, reeds: 0, knowledge: 0, lore: 0, clay: 0, grain: 0, iron: 0, crowns: 0, parchment: 0, steam: 0, energy: 0, data: 0, stardust: 0, ...world.resources };
      world.flags = { festival: false, palaceBuiltDay: null, palaceDay: false, ...world.flags };
      world.era = Number.isInteger(world.era) ? clamp(world.era, 0, ERAS.length - 1) : clamp(Math.floor((world.quest || 0) / 3), 0, 4);
      world.disaster ||= null;
      world.tradeHistory = Array.isArray(world.tradeHistory) ? world.tradeHistory : [];
      world.healthHistory = Array.isArray(world.healthHistory) ? world.healthHistory : [];
      world.actionCooldowns = { forage: 0, reeds: 0, clay: 0, ...world.actionCooldowns };
      world.government = { kind: "council", name: "Willow Circle", monarchId: null, heirId: null, dynastyName: "", legitimacy: 64, laws: [], cases: [], coronations: 0, ...world.government };
      world.government.laws = Array.isArray(world.government.laws) ? world.government.laws : [];
      world.government.cases = Array.isArray(world.government.cases) ? world.government.cases : [];
      world.justice = { incidents: [], totalIncidents: 0, rehabilitated: 0, ...world.justice };
      world.justice.incidents = Array.isArray(world.justice.incidents) ? world.justice.incidents : [];
      world.weather = world.weather || { type: "clear", timer: 50 };
      world.chronicle = world.chronicle || [];
      world.tadpoles = Array.isArray(world.tadpoles) ? world.tadpoles : [];
      world.nextTadpoleId = Math.max(world.nextTadpoleId || 1, 1, ...world.tadpoles.map((tadpole) => tadpole.id + 1));
      if (!Number.isInteger(world.expansion)) {
        let requiredLevel = 0;
        forEachTile((tile, x, y) => {
          if (tile.building) requiredLevel = Math.max(requiredLevel, expansionLevelForTile(x, y));
        });
        world.frogs.forEach((frog) => { requiredLevel = Math.max(requiredLevel, expansionLevelForTile(Math.floor(frog.fx), Math.floor(frog.fy))); });
        world.expansion = clamp(requiredLevel, 0, EXPANSIONS.length - 1);
      }
      const migratedFamilyNames = ["Pondskip Family", "Mossbell Family", "Moonhop Family", "Dewdrop Family", "Lilyleap Family"];
      world.frogs.forEach((frog, index) => {
        frog.friendships = frog.friendships || {};
        frog.bond = frog.bond || 0;
        if (!frog.familyId) {
          frog.familyId = Math.floor(index / 3) + 1;
          frog.familyName = migratedFamilyNames[Math.floor(index / 3) % migratedFamilyNames.length];
        }
        frog.familyName = frog.familyName || migratedFamilyNames[(frog.familyId - 1) % migratedFamilyNames.length];
        frog.thinkTimer = frog.thinkTimer || 1;
        const hadAttributes = Boolean(frog.attributes);
        frog.attributes = frog.attributes || randomAttributes();
        frog.ageDays = hadAttributes && Number.isFinite(frog.ageDays) ? frog.ageDays : 18 + Math.floor(Math.random() * 13);
        frog.lifespanDays = Math.max(Number.isFinite(frog.lifespanDays) ? frog.lifespanDays : 0, 58 + Math.floor(Math.random() * 24));
        frog.education ||= { elementary: true, highschool: frog.ageDays >= 18, university: false };
        frog.universityEligible ??= frog.attributes.intelligence >= 67 && frog.id % 4 !== 0;
        frog.task ||= "none";
        frog.taskProgress = Math.max(0, frog.taskProgress || 0);
        frog.taskMastery = frog.taskMastery && typeof frog.taskMastery === "object" ? frog.taskMastery : {};
        frog.disposition ||= Math.random() < 0.07 ? "chaotic" : "gentle";
        frog.infamy = Math.max(0, frog.infamy || 0);
        frog.detainedUntil = Math.max(0, frog.detainedUntil || 0);
        frog.sentenceReason ||= "";
        frog.title ||= "";
        frog.health = clamp(Number.isFinite(frog.health) ? frog.health : 96, 0, 100);
        frog.illness ||= null;
        frog.immunity = Math.max(0, frog.immunity || 0);
        frog.bubble = "";
        frog.bubbleTimer = 0;
      });
      world.nextFamilyId = Math.max(world.nextFamilyId || 1, ...world.frogs.map((frog) => frog.familyId + 1));
      forEachTile((tile) => {
        if (!tile.building) return;
        tile.building.level = clamp(tile.building.level || 1, 1, 5);
        tile.building.specialization ||= null;
        tile.building.eraStyle = Number.isInteger(tile.building.eraStyle) ? tile.building.eraStyle : Math.min(world.era, buildingDefinition(tile.building.id)?.era || 0);
      });
      migrateBuildingFootprints();
      assignHomesAndJobs();
      refreshGovernment();
      return true;
    } catch {
      return false;
    }
  }

  function migrateWorldGrid() {
    const oldHeight = world.tiles.length;
    const oldWidth = Math.max(0, ...world.tiles.map((row) => Array.isArray(row) ? row.length : 0));
    if (oldWidth === GRID_W && oldHeight === GRID_H) return;
    world.chronicle = world.chronicle || [];
    const offsetX = Math.max(0, Math.floor((GRID_W - oldWidth) / 2));
    const offsetY = Math.max(0, Math.floor((GRID_H - oldHeight) / 2));
    const expanded = [];
    for (let y = 0; y < GRID_H; y += 1) {
      const row = [];
      for (let x = 0; x < GRID_W; x += 1) {
        const pond = Math.pow((x - 15.2) / 5.1, 2) + Math.pow((y - 11.2) / 3.4, 2) < 1;
        row.push({ terrain: pond ? "water" : "grass", building: null, decor: Math.random(), ripple: Math.random() * TAU });
      }
      expanded.push(row);
    }
    world.tiles.forEach((row, y) => row.forEach((tile, x) => {
      const nx = x + offsetX;
      const ny = y + offsetY;
      if (nx >= GRID_W || ny >= GRID_H) return;
      expanded[ny][nx] = tile;
      if (tile.building) {
        tile.building.x = nx;
        tile.building.y = ny;
      }
    }));
    const shiftPoint = (point) => point ? { x: point.x + offsetX, y: point.y + offsetY } : point;
    world.frogs.forEach((frog) => {
      frog.x += offsetX;
      frog.y += offsetY;
      frog.fx += offsetX;
      frog.fy += offsetY;
      frog.target = shiftPoint(frog.target);
      frog.home = shiftPoint(frog.home);
      frog.workplace = shiftPoint(frog.workplace);
      if (frog.jobPreference && typeof frog.jobPreference === "object") frog.jobPreference = shiftPoint(frog.jobPreference);
    });
    (world.tadpoles || []).forEach((tadpole) => {
      tadpole.x += offsetX;
      tadpole.y += offsetY;
      tadpole.fx += offsetX;
      tadpole.fy += offsetY;
    });
    world.tiles = expanded;
    world.expansion = clamp(Number.isInteger(world.expansion) ? world.expansion : 0, 0, EXPANSIONS.length - 1);
    addChronicle("Mossbell surveyed wider shores", "Old homes and workplaces were carefully mapped into the kingdom's larger wetlands.");
  }

  function migrateBuildingFootprints() {
    const buildings = [];
    forEachTile((tile) => {
      tile.occupiedBy = null;
      if (tile.building) buildings.push(tile.building);
    });
    for (const building of buildings) {
      const definition = buildingDefinition(building.id);
      const desired = definition?.footprint || [1, 1];
      const candidate = { ...definition, footprint: desired };
      building.footprint = footprintCanFit(candidate, building.x, building.y, building) ? [...desired] : [1, 1];
      reserveBuildingFootprint(building);
    }
  }

  function beginGame(fresh) {
    unlockAudio();
    if (fresh || !loadWorld()) freshWorld();
    world.ruler = (ui.name.value.trim() || world.ruler || "Keeper of the Marsh").slice(0, 16);
    state.mode = "playing";
    state.lastTime = performance.now();
    state.selectedTool = null;
    state.category = "home";
    state.selected = { type: "willow", value: null };
    ui.start.classList.add("hide");
    ui.pause.classList.add("hide");
    ui.victory.classList.add("hide");
    renderBuildList();
    renderChronicle();
    updateDom();
    saveWorld(false);
  }

  function togglePause() {
    if (state.mode === "playing") {
      state.mode = "paused";
      ui.pause.classList.remove("hide");
    } else if (state.mode === "paused") {
      state.mode = "playing";
      state.lastTime = performance.now();
      ui.pause.classList.add("hide");
    }
  }

  function canvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  function selectAt(tileX, tileY) {
    let nearest = null;
    let nearestDistance = 0.9;
    for (const frog of world.frogs) {
      const distance = Math.hypot(frog.fx - (tileX + 0.5), frog.fy - (tileY + 0.5));
      if (distance < nearestDistance) { nearest = frog; nearestDistance = distance; }
    }
    if (nearest) {
      state.selected = { type: "frog", value: nearest };
      nearest.bubble = choose(["Ribbit!", "Hello!", "Nice weather", nearest.favorite + "!"]);
      nearest.bubbleTimer = 2.5;
      sound(180, 0.1, "sawtooth", 0.018, -60);
      return;
    }
    let nearestTadpole = null;
    let tadpoleDistance = 0.85;
    for (const tadpole of world.tadpoles) {
      const distance = Math.hypot(tadpole.fx - (tileX + 0.5), tadpole.fy - (tileY + 0.5));
      if (distance < tadpoleDistance) { nearestTadpole = tadpole; tadpoleDistance = distance; }
    }
    if (nearestTadpole) {
      selectTadpole(nearestTadpole);
      return;
    }
    const building = buildingAt(tileX, tileY);
    state.selected = building?.id === "willow" ? { type: "willow", value: null } : building ? { type: "building", value: building } : { type: "willow", value: null };
  }

  function unlockAudio() {
    if (state.audio) {
      if (state.audio.state === "suspended") state.audio.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audio = new AudioContext();
  }

  function sound(frequency, duration = 0.08, type = "sine", volume = 0.025, slide = 0) {
    if (!state.audio || state.muted) return;
    const now = state.audio.currentTime;
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function updateMusic() {
    if (!state.audio || state.muted || state.audio.currentTime < state.nextMusic) return;
    const scale = [261.63, 293.66, 329.63, 392, 440, 523.25];
    const note = scale[Math.floor(Math.random() * scale.length)] * (nightAmount() > 0.4 ? 0.5 : 1);
    sound(note, 0.7, "triangle", 0.012);
    if (Math.random() < 0.25) sound(note * 1.5, 0.5, "sine", 0.007);
    state.nextMusic = state.audio.currentTime + 0.55 + Math.random() * 0.7;
  }

  function bindEvents() {
    document.getElementById("btn-new").addEventListener("click", () => beginGame(true));
    ui.continueButton.addEventListener("click", () => beginGame(false));
    document.getElementById("btn-resume").addEventListener("click", togglePause);
    document.getElementById("btn-save").addEventListener("click", () => saveWorld(true));
    document.getElementById("btn-reset").addEventListener("click", () => {
      localStorage.removeItem(SAVE_KEY);
      freshWorld();
      state.mode = "playing";
      ui.pause.classList.add("hide");
      renderBuildList();
      renderChronicle();
      toast("A new Mossbell chapter begins");
    });
    document.getElementById("btn-keep-playing").addEventListener("click", () => {
      state.mode = "playing";
      ui.victory.classList.add("hide");
      state.lastTime = performance.now();
    });
    document.getElementById("pause-button").addEventListener("click", togglePause);
    document.getElementById("zoom-in").addEventListener("click", () => zoomAt(state.hoverPoint?.x || W / 2, state.hoverPoint?.y || H / 2, 0.16));
    document.getElementById("zoom-out").addEventListener("click", () => zoomAt(state.hoverPoint?.x || W / 2, state.hoverPoint?.y || H / 2, -0.16));
    document.getElementById("zoom-focus").addEventListener("click", focusSelection);
    document.getElementById("zoom-home").addEventListener("click", () => {
      view.x = view.targetX = 0;
      view.y = view.targetY = H > W ? -60 : -125;
      view.targetZoom = H > W ? 0.82 : 0.9;
    });
    ui.mute.addEventListener("click", () => {
      state.muted = !state.muted;
      ui.mute.textContent = state.muted ? "🔇" : "🔊";
    });
    ui.advanceEra.addEventListener("click", advanceEra);
    ui.marshActions.addEventListener("click", (event) => {
      const action = event.target.closest("[data-marsh-action]");
      if (action && !action.disabled) performMarshAction(action.dataset.marshAction);
    });
    document.getElementById("open-tasks").addEventListener("click", () => openCouncil("tasks"));
    document.getElementById("open-trade").addEventListener("click", () => openCouncil("trade"));
    document.getElementById("open-government").addEventListener("click", () => openCouncil("government"));
    document.getElementById("close-council").addEventListener("click", closeCouncil);
    ui.councilModal.addEventListener("click", (event) => {
      if (event.target === ui.councilModal) closeCouncil();
      const trade = event.target.closest("[data-trade]");
      if (trade && !trade.disabled) executeTrade(trade.dataset.trade);
      const frog = event.target.closest("[data-council-frog]");
      if (frog) {
        closeCouncil();
        selectFrog(world.frogs.find((citizen) => citizen.id === Number(frog.dataset.councilFrog)), true);
      }
      const law = event.target.closest("[data-law]");
      if (law && !law.disabled) enactLaw(law.dataset.law);
      const sentence = event.target.closest("[data-sentence]");
      if (sentence && !sentence.disabled) sentenceCitizen(sentence.dataset.sentence);
    });

    document.getElementById("build-tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      if (state.category === "expansion") {
        state.selectedTool = null;
        ui.hint.classList.add("hide");
      }
      document.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderBuildList();
    });
    ui.buildEraFilter.addEventListener("change", () => {
      state.buildEraFilter = ui.buildEraFilter.value;
      state.selectedTool = null;
      ui.hint.classList.add("hide");
      renderBuildList();
    });
    ui.buildList.addEventListener("click", (event) => {
      const expansion = event.target.closest("[data-expand-level]");
      if (expansion && !expansion.disabled) {
        buyExpansion();
        return;
      }
      const button = event.target.closest("[data-build]");
      if (!button || button.disabled) return;
      state.selectedTool = state.selectedTool === button.dataset.build ? null : button.dataset.build;
      const definition = BUILDINGS.find((building) => building.id === state.selectedTool);
      ui.hint.classList.toggle("hide", !definition);
      const footprint = definition?.footprint || [1, 1];
      ui.hint.textContent = definition ? `${definition.name}: choose an empty ${footprint[0]}×${footprint[1]} ${definition.terrain === "any" ? "built" : definition.terrain} site` : "";
      renderBuildList();
    });

    document.getElementById("selected-panel").addEventListener("click", (event) => {
      if (event.target.id === "host-festival") hostFestival();
      if (event.target.id === "assign-job") assignSelectedJob();
      if (event.target.id === "assign-task") assignSelectedTask();
      if (event.target.id === "assign-building-worker") assignBuildingWorker();
      if (event.target.id === "upgrade-building") upgradeSelectedBuilding();
      const specialization = event.target.closest("[data-specialization]");
      if (specialization && !specialization.disabled) chooseBuildingSpecialization(specialization.dataset.specialization);
      const citizen = event.target.closest("[data-frog-id]");
      if (citizen) selectFrog(world.frogs.find((frog) => frog.id === Number(citizen.dataset.frogId)), true);
      const tadpole = event.target.closest("[data-tadpole-id]");
      if (tadpole) selectTadpole(world.tadpoles.find((baby) => baby.id === Number(tadpole.dataset.tadpoleId)), true);
      const action = event.target.closest("[data-frog-action]");
      if (action && !action.disabled) interactWithFrog(action.dataset.frogAction);
    });
    document.getElementById("chronicle-toggle").addEventListener("click", () => ui.chronicle.classList.toggle("hide"));

    canvas.addEventListener("pointerdown", (event) => {
      if (state.mode !== "playing") return;
      canvas.setPointerCapture(event.pointerId);
      const point = canvasCoordinates(event);
      state.pointerDown = { ...point, viewX: view.x, viewY: view.y };
      state.dragging = false;
      unlockAudio();
    });
    canvas.addEventListener("pointermove", (event) => {
      const point = canvasCoordinates(event);
      state.hoverPoint = point;
      state.hoverTile = screenToTile(point.x, point.y);
      if (!state.pointerDown) return;
      const dx = point.x - state.pointerDown.x;
      const dy = point.y - state.pointerDown.y;
      if (Math.hypot(dx, dy) > 8 && (!state.selectedTool || event.pointerType === "touch")) {
        state.dragging = true;
        view.x = view.targetX = state.pointerDown.viewX + dx;
        view.y = view.targetY = state.pointerDown.viewY + dy;
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      if (!state.pointerDown) return;
      const point = canvasCoordinates(event);
      const tile = screenToTile(point.x, point.y);
      if (!state.dragging && tileAt(tile.x, tile.y)) {
        if (state.selectedTool) placeSelected(tile.x, tile.y);
        else if (isTileUnlocked(tile.x, tile.y)) selectAt(tile.x, tile.y);
        else toast("This district is waiting to be purchased");
      }
      state.pointerDown = null;
      state.dragging = false;
    });
    canvas.addEventListener("pointerleave", () => { state.hoverTile = null; state.hoverPoint = null; });
    canvas.addEventListener("dblclick", (event) => {
      const point = canvasCoordinates(event);
      const tile = screenToTile(point.x, point.y);
      if (!tileAt(tile.x, tile.y) || !isTileUnlocked(tile.x, tile.y)) return;
      if (!state.selectedTool) selectAt(tile.x, tile.y);
      const building = buildingAt(tile.x, tile.y);
      const [width, height] = footprintOf(building);
      focusMapPoint(building ? building.x + width * 0.5 : tile.x + 0.5, building ? building.y + height * 0.5 : tile.y + 0.5, 1.68);
      updateDom();
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = canvasCoordinates(event);
      zoomAt(point.x, point.y, -Math.sign(event.deltaY) * 0.12);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!ui.councilModal.classList.contains("hide")) closeCouncil();
        else if (state.selectedTool) {
          state.selectedTool = null;
          ui.hint.classList.add("hide");
          renderBuildList();
        } else togglePause();
      }
      if (event.key.toLowerCase() === "p") togglePause();
      if (event.key === "+" || event.key === "=") zoomAt(W / 2, H / 2, 0.14);
      if (event.key === "-") zoomAt(W / 2, H / 2, -0.14);
    });
    window.addEventListener("beforeunload", () => saveWorld(false));
    window.addEventListener("resize", fitCanvas);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  fitCanvas();
  bindEvents();
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
  ui.continueButton.classList.toggle("hide", !hasSave);
  if (hasSave) {
    try {
      const preview = JSON.parse(localStorage.getItem(SAVE_KEY));
      ui.name.value = preview.ruler || "";
    } catch {}
  }
  requestAnimationFrame(loop);
})();
