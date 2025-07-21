document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
  const mainMenu  = document.getElementById("main-menu");
  const startBtn  = document.getElementById("start-btn");
  const mapDiv    = document.getElementById("map");
  const roomPanel = document.getElementById("room-content");

  // Config
  const WIDTH      = 6;
  const HEIGHT     = 6;
  const ROOM_COUNT = 12;
  const roomTypes  = ["monster","puzzle","trap","riddle","treasure"];
  const asciiMap   = {
    start:    "@",
    monster:  "(>_<)",
    puzzle:   "[?]",
    trap:     "[!]",
    riddle:   "{?}",
    treasure: "($)",
    boss:     "(#)"
  };

  // State
  let rooms = {}, currentRoom, visited = new Set(), bossCoord;
  const key = (x,y) => `${x},${y}`;

  // 1) Dungeon generation with boss at end
  function generateDungeon() {
    const carved = new Set();
    const stack  = [];
    const sx = 0, sy = Math.floor(HEIGHT/2);

    carved.add(key(sx,sy));
    stack.push([sx,sy]);

    while (carved.size < ROOM_COUNT && stack.length) {
      const idx = Math.floor(Math.random()*stack.length);
      const [x,y] = stack[idx];
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(() => Math.random()-0.5);
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
      if (!done) stack.splice(idx,1);
    }

    // Last carved = boss
    bossCoord = Array.from(carved).pop();

    rooms = {};
    visited.clear();
    carved.forEach(c => {
      const [x,y] = c.split(",").map(Number);
      const neighbors = [[1,0],[-1,0],[0,1],[0,-1]]
        .map(d => key(x+d[0], y+d[1]))
        .filter(k => carved.has(k));
      let type = (c === bossCoord)
        ? "boss"
        : (x===sx && y===sy)
          ? "start"
          : roomTypes[Math.floor(Math.random()*roomTypes.length)];
      rooms[c] = { type, ascii: asciiMap[type], neighbors };
    });

    currentRoom = key(sx,sy);
    visited.add(currentRoom);
  }

  // 2) Render map: current, neighbors, explored backtracking
  function renderMap() {
    if (!rooms[currentRoom]) {
      currentRoom = Object.keys(rooms)[0];
    }
    mapDiv.innerHTML = "";
    mapDiv.style.gridTemplateColumns = `repeat(${WIDTH}, 60px)`;
    mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT}, 60px)`;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const c = key(x,y);
        const cell = document.createElement("div");
        cell.className = "cell";

        if (c === currentRoom) {
          cell.classList.add("current");
          cell.textContent = asciiMap.start;
        }
        else if (rooms[currentRoom].neighbors.includes(c)) {
          // Unexplored neighbor
          cell.classList.add("neighbor");
          cell.onclick = () => enterRoom(c);
        }
        else if (visited.has(c)) {
          // Explored (backtrack)
          cell.classList.add("explored");
          cell.textContent = rooms[c].ascii;
          cell.onclick = () => {
            currentRoom = c;
            renderMap();
          };
        } else {
          cell.classList.add("hidden");
        }

        mapDiv.appendChild(cell);
      }
    }

    mapDiv.classList.remove("hidden");
    roomPanel.classList.add("hidden");
  }

  // 3) Enter a room → show ASCII monster/name/HP bar
  function enterRoom(c) {
    mapDiv.classList.add("hidden");
    const info = rooms[c];

    // Build combat UI if monster or boss, else simple panel
    if (info.type === "monster" || info.type === "boss") {
      roomPanel.innerHTML = `
        <div class="combat-container">
          <h2 class="monster-name">${info.type === "boss" ? "Boss" : "Monster"}</h2>
          <pre class="monster-ascii">${asciiMap.monster}</pre>
          <div class="hp-bar"><div id="hp-fill" class="hp-fill"></div></div>
          <button id="attack-btn">Attack</button>
          <div id="combat-log"></div>
        </div>
      `;
      roomPanel.classList.remove("hidden");

      // initialize HP bar
      const hpFill = document.getElementById("hp-fill");
      let hp = 100; // example static HP; wire in real stats here
      hpFill.style.width = "100%";

      document.getElementById("attack-btn").onclick = () => {
        // dummy damage for illustration
        hp = Math.max(0, hp - 20);
        hpFill.style.width = (hp / 100 * 100) + "%";
        if (hp === 0) {
          document.getElementById("combat-log").textContent =
            info.type === "boss"
              ? "You defeated the Boss! Dungeon cleared!"
              : "You defeated the monster!";
        }
      };
    } else {
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
  }

  // 4) Start Game
  startBtn.onclick = () => {
    mainMenu.classList.add("hidden");
    generateDungeon();
    renderMap();
  };
});
