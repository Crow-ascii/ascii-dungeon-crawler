// main.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("[DEBUG] DOM loaded");
  const mainMenu  = document.getElementById("main-menu");
  const startBtn  = document.getElementById("start-btn");
  const mapDiv    = document.getElementById("map");
  const searchBtn = document.getElementById("search-btn");
  const roomPanel = document.getElementById("room-content");

  // Configuration
  const WIDTH      = 5;
  const HEIGHT     = 5;
  const ROOM_COUNT = 9;
  const roomTypes  = ["monster","puzzle","trap","treasure"];
  const asciiMap   = {
    start:    "@",
    monster:  "(>_<)",
    puzzle:   "[?]",
    trap:     "[!]",
    treasure: "($)",
    boss:     "(#)"
  };

  const player   = { hp:100, maxHp:100, atk:10, def:5, spd:8 };
  const monsters = { goblin:{ name:"Goblin", stats:{hp:30,atk:5,def:2,spd:8} } };

  let rooms = {}, currentRoom, visited = new Set(), bossCoord;
  const key = (x,y) => `${x},${y}`;

  function generateDungeon() {
    console.log("[DEBUG] generateDungeon");
    const carved = new Set();
    const stack  = [];
    const sx = 0, sy = Math.floor(HEIGHT/2);

    carved.add(key(sx,sy));
    stack.push([sx,sy]);

    while (carved.size < ROOM_COUNT && stack.length) {
      const i = Math.floor(Math.random()*stack.length);
      const [x,y] = stack[i];
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
      let done = false;
      for (let [dx,dy] of dirs) {
        const nx = x+dx, ny = y+dy, k = key(nx,ny);
        if (nx>=0 && nx<WIDTH && ny>=0 && ny<HEIGHT && !carved.has(k)) {
          carved.add(k);
          stack.push([nx,ny]);
          done = true;
          break;
        }
      }
      if (!done) stack.splice(i,1);
    }

    bossCoord = Array.from(carved).pop();

    rooms = {};
    visited.clear();
    carved.forEach(c => {
      const [x,y] = c.split(",").map(Number);
      const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
        .map(d=>key(x+d[0],y+d[1]))
        .filter(k=>carved.has(k));
      let type = (c === bossCoord) ? "boss"
               : (x===0 && y===Math.floor(HEIGHT/2)) ? "start"
               : roomTypes[Math.floor(Math.random()*roomTypes.length)];
      rooms[c] = { type, ascii: asciiMap[type], neighbors: neigh };
    });

    currentRoom = key(0,Math.floor(HEIGHT/2));
    visited.add(currentRoom);
  }

  function renderMap() {
    console.log("[DEBUG] renderMap", currentRoom);
    mapDiv.innerHTML = "";
    mapDiv.style.gridTemplateColumns = `repeat(${WIDTH},60px)`;
    mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT},60px)`;

    for (let y=0; y<HEIGHT; y++) {
      for (let x=0; x<WIDTH; x++) {
        const c = key(x,y);
        const cell = document.createElement("div");
        cell.className = "cell";

        if (c === currentRoom) {
          cell.classList.add("current");
          cell.textContent = asciiMap.start;
        }
        else if (visited.has(c)) {
          cell.classList.add("explored");
          cell.textContent = rooms[c].ascii;
        }
        else if (rooms[currentRoom].neighbors.includes(c)) {
          cell.classList.add("neighbor");
          cell.onclick = () => enterRoom(c);
        } else {
          cell.classList.add("hidden");
        }

        mapDiv.appendChild(cell);
      }
    }

    mapDiv.classList.remove("hidden");
    roomPanel.classList.add("hidden");
  }

  function enterRoom(c) {
    console.log("[DEBUG] enterRoom", c);
    mapDiv.classList.add("hidden");
    searchBtn.classList.add("hidden");
    roomPanel.innerHTML = `
      <pre style="font-size:2rem;">${rooms[c].ascii}</pre>
      <p>You entered a ${rooms[c].type}</p>
      <button id="clr">Clear</button>
    `;
    roomPanel.classList.remove("hidden");
    document.getElementById("clr").onclick = () => {
      visited.add(c);
      currentRoom = c;
      renderMap();
    };
  }

  startBtn.onclick = () => {
    console.log("[DEBUG] Start clicked");
    mainMenu.classList.add("hidden");
    generateDungeon();
    renderMap();
    console.log("[DEBUG] Dungeon visible");
  };
});
