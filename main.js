document.addEventListener("DOMContentLoaded", () => {
  // ─── DOM NODES ───
  const mainMenu    = document.getElementById("main-menu");
  const startBtn    = document.getElementById("start-btn");
  const hud         = document.getElementById("hud");
  const mapDiv      = document.getElementById("map");
  const mapBtn      = document.getElementById("map-btn");
  const searchBtn   = document.getElementById("search-btn");
  const roomPanel   = document.getElementById("room-content");
  const overlay     = document.getElementById("explored-map");
  const overlayGrid = document.getElementById("overlay-grid");
  const closeMapBtn = document.getElementById("close-map-btn");

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

  const player = { name:"You", hp:100, maxHp:100, atk:10, def:5, spd:8 };
  const monsters = {
    goblin: { name:"Goblin", stats:{hp:30,atk:5,def:2,spd:8}, skills:[{name:"Slash",type:"damage",power:6,cooldown:0}] },
    skeleton_archer: { name:"Skeleton Archer", stats:{hp:40,atk:7,def:3,spd:6}, skills:[{name:"Arrow Shot",type:"damage",power:8,cooldown:1}] },
    ogre: { name:"Ogre", stats:{hp:100,atk:15,def:8,spd:3}, skills:[
      {name:"Smash",type:"damage",power:20,cooldown:2},
      {name:"Stomp",type:"debuff",power:2,cooldown:3}
    ]}
  };

  // ─── STATE & HELPERS ───
  let rooms = {}, currentRoom, visited = new Set();
  const key = (x,y) => `${x},${y}`;

  // ─── DUNGEON GENERATION ───
  function generateDungeon() {
    const carved = new Set();
    const stack = [];

    const sx = 0, sy = Math.floor(HEIGHT/2);
    carved.add(key(sx,sy));
    stack.push([sx,sy]);

    while (carved.size < ROOM_COUNT && stack.length) {
      const idx = Math.floor(Math.random()*stack.length);
      const [x,y] = stack[idx];
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
      let did = false;
      for (let [dx,dy] of dirs) {
        const nx = x+dx, ny = y+dy, k = key(nx,ny);
        if (nx>=0&&nx<WIDTH&&ny>=0&&ny<HEIGHT&&!carved.has(k)) {
          carved.add(k);
          stack.push([nx,ny]);
          did = true;
          break;
        }
      }
      if (!did) stack.splice(idx,1);
    }

    rooms = {};
    for (let c of carved) {
      const [x,y] = c.split(",").map(Number);
      const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>key(x+dx,y+dy))
        .filter(k=>carved.has(k));
      const type = (x===sx&&y===sy)
        ? "start"
        : roomTypes[Math.floor(Math.random()*roomTypes.length)];
      rooms[c] = {
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

    currentRoom = key(sx,sy);
    visited.clear();
    visited.add(currentRoom);
  }

  // ─── RENDER MAP ───
  function renderMap() {
    mapDiv.innerHTML = "";
    mapDiv.style.gridTemplateColumns = `repeat(${WIDTH},80px)`;
    mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT},80px)`;

    for (let y=0;y<HEIGHT;y++){
      for (let x=0;x<WIDTH;x++){
        const c = key(x,y);
        const cell = document.createElement("div");
        cell.classList.add("cell");

        if (c===currentRoom) {
          cell.classList.add("current");
          cell.textContent = asciiMap.start;
        }
        else if (visited.has(c)) {
          cell.classList.add("explored");
          cell.textContent = rooms[c].ascii;
        }
        else if (rooms[currentRoom].neighbors.includes(c)) {
          cell.classList.add("neighbor");
          cell.addEventListener("click",()=>enterRoom(c));
        } else {
          cell.classList.add("hidden");
        }
        mapDiv.appendChild(cell);
      }
    }

    // Show search if any neighbors remain unvisited
    const hasUnvisited = rooms[currentRoom].neighbors.some(n=>!visited.has(n));
    searchBtn.classList.toggle("hidden", !hasUnvisited);

    hud.classList.remove("hidden");
    mapDiv.classList.remove("hidden");
    roomPanel.classList.add("hidden");
  }

  // ─── ENTER ROOM ───
  function enterRoom(coord) {
    hud.classList.add("hidden");
    mapDiv.classList.add("hidden");
    searchBtn.classList.add("hidden");

    const info = rooms[coord];
    if (info.type==="monster") {
      return startCombat(info.monsterId);
    }

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

    Object.keys(rooms).forEach(c=>{
      const cell = document.createElement("div");
      cell.classList.add("overlay-cell");
      if (visited.has(c)) cell.textContent = rooms[c].ascii;
      overlayGrid.appendChild(cell);
    });

    overlay.classList.remove("hidden");
  });

  closeMapBtn.addEventListener("click", ()=>{
    overlay.classList.add("hidden");
  });

  // ─── START GAME ───
  startBtn.addEventListener("click", ()=>{
    mainMenu.classList.add("hidden");
    generateDungeon();
    renderMap();
  });

  // ─── COMBAT SYSTEM ───
  // (Paste your existing startCombat() & performRound() implementations here.)

});
