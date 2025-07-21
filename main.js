document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
  const mainMenu  = document.getElementById("main-menu");
  const startBtn  = document.getElementById("start-btn");
  const mapDiv    = document.getElementById("map");
  const searchBtn = document.getElementById("search-btn");
  const roomPanel = document.getElementById("room-content");

  // Config & data
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

  const player = { hp:100, maxHp:100, atk:10, def:5, spd:8 };
  const monsters = {
    goblin:{ name:"Goblin", stats:{hp:30,atk:5,def:2,spd:8} }
  };

  // State
  let rooms = {}, currentRoom, visited = new Set(), bossCoord;
  const key = (x,y) => `${x},${y}`;

  // Build a simple spanning‐tree dungeon + boss at the end
  function generateDungeon() {
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
        if (nx>=0&&nx<WIDTH&&ny>=0&&ny<HEIGHT&&!carved.has(k)) {
          carved.add(k);
          stack.push([nx,ny]);
          done = true;
          break;
        }
      }
      if (!done) stack.splice(i,1);
    }

    // Last carved becomes boss
    bossCoord = Array.from(carved).pop();

    rooms = {};
    visited.clear();
    for (let c of carved) {
      const [x,y] = c.split(",").map(Number);
      const neighbors = [[1,0],[-1,0],[0,1],[-0,-1]]
        .map(d=>key(x+d[0],y+d[1]))
        .filter(k=>carved.has(k));
      let type = (c===bossCoord) ? "boss"
               : (x===sx&&y===sy)  ? "start"
               : roomTypes[Math.floor(Math.random()*roomTypes.length)];
      rooms[c] = { type, ascii: asciiMap[type], neighbors };
    }

    currentRoom = key(sx,sy);
    visited.add(currentRoom);
  }

  function renderMap() {
    // Guard: if somehow currentRoom isn't in rooms, reset to start
    if (!rooms[currentRoom]) {
      console.warn("Invalid currentRoom, resetting to first room");
      currentRoom = Object.keys(rooms)[0];
    }

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
    mapDiv.classList.add("hidden");
    searchBtn.classList.add("hidden");
    const info = rooms[c];

    roomPanel.innerHTML = `
      <pre style="font-size:2rem;">${info.ascii}</pre>
      <p>You entered a <strong>${info.type}</strong> room.</p>
      <button id="clear-btn">Clear Room</button>
    `;
    roomPanel.classList.remove("hidden");
    document.getElementById("clear-btn").onclick = () => {
      visited.add(c);
      currentRoom = c;
      renderMap();
    };
  }

  // Start button: hide menu, build & show dungeon
  startBtn.onclick = () => {
    mainMenu.classList.add("hidden");
    generateDungeon();
    renderMap();
  };
});
