// ─── CONFIG & DATA ───
const WIDTH      = 5;
const HEIGHT     = 5;
const ROOM_COUNT = 12;
const roomTypes  = ["monster","puzzle","trap","riddle","treasure"];
const asciiMap   = {
  start:    "@",
  monster:  "(>_<)",
  puzzle:   "[?]",
  trap:     "/!\\",
  riddle:   "{?}",
  treasure: "($)"
};

// Player & monster templates (same as before)
const player = { name:"You", hp:100, maxHp:100, atk:10, def:5, spd:8 };
const monsters = {
  goblin: {
    name:"Goblin",
    stats:{hp:30,atk:5,def:2,spd:8},
    skills:[{name:"Slash",type:"damage",power:6,cooldown:0}]
  },
  skeleton_archer: {
    name:"Skeleton Archer",
    stats:{hp:40,atk:7,def:3,spd:6},
    skills:[{name:"Arrow Shot",type:"damage",power:8,cooldown:1}]
  },
  ogre: {
    name:"Ogre",
    stats:{hp:100,atk:15,def:8,spd:3},
    skills:[
      {name:"Smash",type:"damage",power:20,cooldown:2},
      {name:"Stomp",type:"debuff",power:2,cooldown:3}
    ]
  }
};

// DOM references
const mainMenu   = document.getElementById("main-menu");
const startBtn   = document.getElementById("start-btn");
const hud        = document.getElementById("hud");
const mapDiv     = document.getElementById("map");
const mapBtn     = document.getElementById("map-btn");
const searchBtn  = document.getElementById("search-btn");
const roomPanel  = document.getElementById("room-content");
const overlay    = document.getElementById("explored-map");
const overlayGrid= document.getElementById("overlay-grid");
const closeMapBtn= document.getElementById("close-map-btn");

// Game state
let rooms = {}, currentRoom, visited = new Set();

// Utility
function key(x,y){ return `${x},${y}`; }

// ─── DUNGEON GENERATION ───
function generateDungeon() {
  const visitedCells = new Set();
  const stack = [];

  // Start at left-center
  const startX=0, startY=Math.floor(HEIGHT/2);
  visitedCells.add(key(startX,startY));
  stack.push([startX,startY]);

  // Carve out a tree
  while (visitedCells.size < ROOM_COUNT && stack.length) {
    const idx = Math.floor(Math.random()*stack.length);
    const [x,y] = stack[idx];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
    let carved=false;
    for (const [dx,dy] of dirs) {
      const nx=x+dx, ny=y+dy, k=key(nx,ny);
      if (nx>=0 && nx<WIDTH && ny>=0 && ny<HEIGHT && !visitedCells.has(k)) {
        visitedCells.add(k);
        stack.push([nx,ny]);
        carved=true; break;
      }
    }
    if (!carved) stack.splice(idx,1);
  }

  // Build room objects
  rooms={};
  for (const coord of visitedCells) {
    const [x,y] = coord.split(",").map(Number);
    const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
      .map(([dx,dy])=>key(x+dx,y+dy))
      .filter(k=>visitedCells.has(k));
    const type = (x===startX && y===startY)
      ? "start"
      : roomTypes[Math.floor(Math.random()*roomTypes.length)];
    rooms[coord] = {
      type,
      ascii: asciiMap[type],
      neighbors: neigh,
      ...(type==="monster" && {
        monsterId: Object.keys(monsters)[
          Math.floor(Math.random()*Object.keys(monsters).length)
        ]
      })
    };
  }

  // Init state
  currentRoom = key(startX,startY);
  visited.clear();
  visited.add(currentRoom);
}

// ─── RENDERING ───
function renderMap() {
  // show grid
  mapDiv.innerHTML = "";
  mapDiv.style.gridTemplateColumns = `repeat(${WIDTH},80px)`;
  mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT},80px)`;

  for (let y=0; y<HEIGHT; y++) {
    for (let x=0; x<WIDTH; x++) {
      const c = key(x,y);
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (c === currentRoom) {
        cell.classList.add("current");
        cell.textContent = asciiMap["start"];
      }
      else if (visited.has(c)) {
        cell.classList.add("explored");
        cell.textContent = rooms[c].ascii;
      }
      else if (rooms[currentRoom].neighbors.includes(c)) {
        cell.classList.add("neighbor");
        cell.addEventListener("click", ()=>enterRoom(c));
      } else {
        cell.classList.add("hidden");
      }

      mapDiv.appendChild(cell);
    }
  }

  // search button appears if any neighbors are secret (not in visited but in neighbors)
  searchBtn.classList.toggle(
    "hidden",
    !rooms[currentRoom].neighbors.some(n=>!visited.has(n))
  );

  // ensure HUD and map are visible
  hud.classList.remove("hidden");
  mapDiv.classList.remove("hidden");
  roomPanel.classList.add("hidden");
}

// ─── ROOM NAVIGATION ───
function enterRoom(coord) {
  // hide map HUD
  mapDiv.classList.add("hidden");
  searchBtn.classList.add("hidden");
  hud.classList.add("hidden");

  const info = rooms[coord];
  // monster room?
  if (info.type==="monster") {
    startCombat(info.monsterId);
    return;
  }

  // non-monster room
  roomPanel.innerHTML = `
    <pre style="font-size:2rem;">${info.ascii}</pre>
    <p>You entered a <strong>${info.type}</strong> room.</p>
    <button id="clear-btn">Clear Room</button>
  `;
  roomPanel.classList.remove("hidden");
  document.getElementById("clear-btn").addEventListener("click", ()=>{
    visited.add(coord);
    currentRoom = coord;
    renderMap();
  });
}

// ─── EXPLORED MAP OVERLAY ───
mapBtn.addEventListener("click", ()=>{
  overlayGrid.innerHTML = "";
  overlayGrid.style.gridTemplateColumns = `repeat(${WIDTH},60px)`;
  overlayGrid.style.gridTemplateRows    = `repeat(${HEIGHT},60px)`;

  // show explored
  Object.keys(rooms).forEach(c => {
    const cell = document.createElement("div");
    cell.classList.add("overlay-cell");
    if (visited.has(c)) {
      cell.textContent = rooms[c].ascii;
    }
    overlayGrid.appendChild(cell);
  });

  overlay.classList.remove("hidden");
});
closeMapBtn.addEventListener("click", ()=>{
  overlay.classList.add("hidden");
});

// ─── START / RESET ───
startBtn.addEventListener("click", ()=>{
  mainMenu.classList.add("hidden");
  generateDungeon();
  renderMap();
});

// ─── COMBAT SYSTEM (unchanged) ───
// ... your existing startCombat() and performRound() functions go here ...
