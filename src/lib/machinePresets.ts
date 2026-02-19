export interface MachinePreset {
  id: string;
  machineType: string;
  brand: string;
  model: string;
  displayName: string;
  categoryHints: string[];
  imageUrl: string;
  imageSourceUrl: string;
}

// Sources checked on 2026-02-16:
// - Construction Briefing Yellow Table 2024 (top global OEMs): https://www.constructionbriefing.com/news/caterpillar-retains-top-position-in-yellow-table-for-2023/8035414.article
// - KHL top manufacturers context: https://www.khl.com/news/the-top-ten-construction-equipment-manufacturers/1141737.article
// - United Rentals popular equipment list (common rental machine types/models): https://www.unitedrentals.com/marketplace/equipment
export const POPULAR_MACHINE_BRANDS = [
  'Caterpillar',
  'Komatsu',
  'XCMG',
  'John Deere',
  'SANY',
  'Volvo',
  'Hitachi',
  'Liebherr',
  'JCB',
  'Zoomlion',
  'Bobcat',
  'Toyota',
  'Genie',
  'JLG',
  'Skyjack',
] as const;

export const COMMON_MACHINE_TYPES = [
  'Excavator',
  'Forklift',
  'Wheel Loader',
  'Telehandler',
  'Scissor Lift',
  'Boom Lift',
  'Dozer',
  'Crane',
  'Compressor',
  'Generator',
] as const;

export const MACHINE_PRESETS: MachinePreset[] = [
  {
    id: 'bobcat-e26',
    machineType: 'Excavator',
    brand: 'Bobcat',
    model: 'E26',
    displayName: 'Bobcat E26 Mini Excavator',
    categoryHints: ['Excavator'],
    imageUrl:
      'https://www.unitedrentals.com/sites/default/files/styles/small_square_1x1/public/2025-01/02-BOBCAT_E26_907-0062_NB2_1.jpg.webp',
    imageSourceUrl: 'https://www.unitedrentals.com/marketplace/equipment/earthmoving-equipment/excavators/mini-excavators',
  },
  {
    id: 'komatsu-pc210lc',
    machineType: 'Excavator',
    brand: 'Komatsu',
    model: 'PC210LC',
    displayName: 'Komatsu PC210LC Excavator',
    categoryHints: ['Excavator'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Excavator_Postiguet_Beach_2.jpg/330px-Excavator_Postiguet_Beach_2.jpg',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Excavator',
  },
  {
    id: 'toyota-8fgu30',
    machineType: 'Forklift',
    brand: 'Toyota',
    model: '8FGU30',
    displayName: 'Toyota 8FGU30 Forklift',
    categoryHints: ['Forklift'],
    imageUrl:
      'https://www.unitedrentals.com/sites/default/files/styles/small_square_1x1/public/2024-01/TOYOTA_8FGU30_231-1250_NB1-1.jpg.webp',
    imageSourceUrl: 'https://www.unitedrentals.com/marketplace/equipment/forklifts/warehouse-forklifts/cushion-tire-forklifts',
  },
  {
    id: 'john-deere-624l',
    machineType: 'Wheel Loader',
    brand: 'John Deere',
    model: '624L',
    displayName: 'John Deere 624L Loader',
    categoryHints: ['Loader'],
    imageUrl:
      'https://www.unitedrentals.com/sites/default/files/styles/small_square_1x1/public/2024-01/JOHNDEERE_624L_904-2035_NB1.jpg.webp',
    imageSourceUrl: 'https://www.unitedrentals.com/marketplace/equipment/earthmoving-equipment/wheel-loaders',
  },
  {
    id: 'jcb-506-36',
    machineType: 'Telehandler',
    brand: 'JCB',
    model: '506-36',
    displayName: 'JCB 506-36 Telehandler',
    categoryHints: ['Telehandler'],
    imageUrl:
      'https://www.unitedrentals.com/sites/default/files/styles/small_square_1x1/public/2024-02/JCB_506-36_233-1160_NB.jpg.webp',
    imageSourceUrl: 'https://www.unitedrentals.com/marketplace/equipment/forklifts/telehandlers',
  },
  {
    id: 'genie-z40-23n',
    machineType: 'Boom Lift',
    brand: 'Genie',
    model: 'Z-40/23N RJ',
    displayName: 'Genie Z-40/23N RJ Boom Lift',
    categoryHints: ['Boom Lift'],
    imageUrl:
      'https://www.unitedrentals.com/sites/default/files/styles/small_square_1x1/public/2024-02/GENIE_Z-40-23N_RJ_310-4050_NB1.jpg.webp',
    imageSourceUrl: 'https://www.unitedrentals.com/marketplace/equipment/aerial-work-platforms/boom-lifts',
  },
  {
    id: 'skyjack-sj3219',
    machineType: 'Scissor Lift',
    brand: 'Skyjack',
    model: 'SJ3219',
    displayName: 'Skyjack SJ3219 Scissor Lift',
    categoryHints: ['Scissor Lift'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Replacing_an_advertising_poster_in_London_using_an_articulated_platform_02.JPG/330px-Replacing_an_advertising_poster_in_London_using_an_articulated_platform_02.JPG',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Aerial_work_platform',
  },
  {
    id: 'caterpillar-d9',
    machineType: 'Dozer',
    brand: 'Caterpillar',
    model: 'D9',
    displayName: 'Caterpillar D9 Dozer',
    categoryHints: ['Dozer'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/CatD9T.jpg/330px-CatD9T.jpg',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Bulldozer',
  },
  {
    id: 'liebherr-ltm-1050',
    machineType: 'Crane',
    brand: 'Liebherr',
    model: 'LTM 1050',
    displayName: 'Liebherr LTM 1050 Crane',
    categoryHints: ['Crane'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Crane_machine_slewing_platform.svg/330px-Crane_machine_slewing_platform.svg.png',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Crane_(machine)',
  },
  {
    id: 'atlas-copco-xas',
    machineType: 'Compressor',
    brand: 'Atlas Copco',
    model: 'XAS',
    displayName: 'Atlas Copco XAS Compressor',
    categoryHints: ['Compressor'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/AirCompressorHusky.JPG/330px-AirCompressorHusky.JPG',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Air_compressor',
  },
  {
    id: 'caterpillar-c9-genset',
    machineType: 'Generator',
    brand: 'Caterpillar',
    model: 'C9 Genset',
    displayName: 'Caterpillar C9 Generator',
    categoryHints: ['Generator'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Modern_Steam_Turbine_Generator.jpg/330px-Modern_Steam_Turbine_Generator.jpg',
    imageSourceUrl: 'https://en.wikipedia.org/wiki/Electric_generator',
  },
];
