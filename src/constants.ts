const WIDTH = 800;
const HEIGHT = 600;
const TOTAL_CHICKENS = 10;
const MAX_CHICKENS = 100;
const WANDER_SPEED_MIN = 30;
const WANDER_SPEED_MAX = 65;
const HERD_SPEED = 340;
const UNCLICKED_TIMEOUT = 10000; // мс до перетворення на квочку
const BROODING_DURATION = 10000; // мс висиджування
const GRASS_COUNT = 46;
const EAT_RADIUS = 28;
const TIME_LIMIT_MS = 120000; // треба протриматись 2 хвилини
const NET_UNLOCK_COUNT = 10; // після стількох курчат у загоні відкривається сітка
const NET_RADIUS = 95; // радіус дії сітки навколо кліку

const HEN_SPEED_MULT = 2; // квочка бігає вдвічі швидше за курча
const HEN_EAT_MULT = 2;   // і їсть траву вдвічі швидше
const HEN_CLICKS_NEEDED = 2; // щоб загнати квочку, треба 2 кліки

const TURKEY_SPEED_MULT = 3;
const TURKEY_EAT_MULT = 3;
const TURKEY_CLICKS_NEEDED = 3;
const TURKEY_SPAWN_INTERVAL = 20000;
const TURKEY_POINTS = 3;

const BUSH_COUNT = 5;
const HIDE_RADIUS = 34; // відстань від куща, на якій курча вважається схованим
const BUSH_CAPACITY = 2; // максимум курчат/квочок в одному кущі
const BUSH_SLOT_OFFSETS = [{ x: -9, y: 4 }, { x: 9, y: 4 }]; // фіксовані місця всередині куща
const HEAD_SLOT_OFFSETS = [{ x: -9, y: -3 }, { x: 9, y: -3 }]; // голова лишається всередині силуету куща

// Межі поля, де курчата вільно блукають (без зони загону)
const FIELD_BOUNDS = { minX: 30, maxX: 560, minY: 30, maxY: 560 };

// Зона загону (прямокутник, всередину якого треба заганяти курчат)
const PEN_ZONE = { x: 600, y: 420, width: 170, height: 150 };
const PEN_CENTER = { x: PEN_ZONE.x + PEN_ZONE.width / 2, y: PEN_ZONE.y + PEN_ZONE.height / 2 };
