document.addEventListener("DOMContentLoaded", () => {
  // ─── DOM NODES ───
  const mainMenu    = document.getElementById("main-menu");
  const startBtn    = document.getElementById("start-btn");
  const mapDiv      = document.getElementById("map");
  const searchBtn   = document.getElementById("search-btn");
  const roomPanel   = document.getElementById("room-content");

  // ─── CONFIG & DATA ───
  const WIDTH      = 6;
  const HEIGHT     = 6;
  const ROOM_COUNT = 14;
  const roomTypes  = ["monster","puzzle","trap","riddle","treasure"];
  const asciiMap   = {
    start:    "@",
    monster:  "(>_<)",
    puzzle:   "[?]",
    trap:     "/!\\",
    riddle:   "{?}",
    treasure: "($)",
    boss:     "(#)"
  };

  const player = { name:"You", hp:100, maxHp:100, atk:10, def:5, spd:8 };
  const monsters = {
    goblin: {
      name:  "Goblin",
      stats: { hp:30, atk:5,  def:2, spd:8 },
      skills:[{ name:"Slash", type:"dmg", power:6, cooldown:0 }]
    },
    skeleton: {
      name:  "Skeleton",
      stats: { hp:40, atk:7,  def:3, spd:6 },
      skills:[{ name:"Arrow", type:"dmg", power:8, cooldown:1 }]
    },
    ogre: {
      name:  "Ogre",
      stats: { hp:100, atk:15, def:8, spd:3 },
      skills:[
        { name:"Smash", type:"dmg", power:20, cooldown:2 },
        { name:"Stomp", type:"debuff", power:2, cooldown:3 }
      ]
    }
  };

  // ─── STATE & HELPERS ───
  let rooms = {}, currentRoom, visited = new Set(), bossCoord;
  const key = (x,y) => `${x},${y}`;

  // ─── DUNGEON GENERATION ───
  function generateDungeon() {
    const carved = new Set();
    const stack  = [];

    // carve a spanning tree
    const sx = 0, sy = Math.floor(HEIGHT/2);
    carved.add(key(sx,sy)); stack.push([sx,sy]);

    while (carved.size < ROOM_COUNT && stack.length) {
      const idx = Math.floor(Math.random()*stack.length);
      const [x,y] = stack[idx];
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
      let done = false;
      for (const [dx,dy] of dirs) {
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

    // mark the last carved as boss
    bossCoord = Array.from(carved).pop();

    // build rooms data
    rooms = {};
    visited.clear();
    carved.forEach(c => {
      const [x,y] = c.split(",").map(Number);
      const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>key(x+dx,y+dy))
        .filter(k=>carved.has(k));
      let type = (c === bossCoord)
        ? "boss"
        : (x===sx && y===sy)
          ? "start"
          : roomTypes[Math.floor(Math.random()*roomTypes.length)];

      rooms[c] = {
        type,
        ascii: asciiMap[type],
        neighbors: neigh,
        ...(type === "monster" || type === "boss"
          ? { monsterId:
              Object.keys(monsters)[
                Math.floor(Math.random()*Object.keys(monsters).length)
              ]
            }
          : {}
        )
      };
    });

    currentRoom = key(sx,sy);
    visited.add(currentRoom);
  }

  // ─── RENDER MAP ───
  function renderMap() {
    mapDiv.innerHTML = "";
    mapDiv.style.gridTemplateColumns = `repeat(${WIDTH},60px)`;
    mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT},60px)`;

    for (let y=0; y<HEIGHT; y++) {
      for (let x=0; x<WIDTH; x++) {
        const c = key(x,y);
        const cell = document.createElement("div");
        cell.classList.add("cell");

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
          cell.addEventListener("click", () => enterRoom(c));
        } else {
          cell.classList.add("hidden");
        }

        // visually link paths by removing borders
        const [cx,cy] = c.split(",").map(Number);
        if (rooms[c].neighbors.includes(key(cx+1,cy))) cell.style.borderRight = "none";
        if (rooms[c].neighbors.includes(key(cx-1,cy))) cell.style.borderLeft  = "none";
        if (rooms[c].neighbors.includes(key(cx,cy+1))) cell.style.borderBottom= "none";
        if (rooms[c].neighbors.includes(key(cx,cy-1))) cell.style.borderTop   = "none";

        mapDiv.appendChild(cell);
      }
    }

    mapDiv.classList.remove("hidden");
    searchBtn.classList.toggle(
      "hidden",
      !rooms[currentRoom].neighbors.some(n => !visited.has(n))
    );
    roomPanel.classList.add("hidden");
  }

  // ─── ENTER ROOM ───
  function enterRoom(c) {
    mapDiv.classList.add("hidden");
    searchBtn.classList.add("hidden");

    const info = rooms[c];
    if (info.type === "monster" || info.type === "boss") {
      return startCombat(info.monsterId, info.type === "boss");
    }

    roomPanel.innerHTML = `
      <pre style="font-size:2rem;">${info.ascii}</pre>
      <p>You entered a <strong>${info.type}</strong> room.</p>
      <button id="clear-btn">Clear Room</button>
    `;
    roomPanel.classList.remove("hidden");
    document.getElementById("clear-btn").addEventListener("click", () => {
      visited.add(c);
      currentRoom = c;
      renderMap();
    });
  }

  // ─── COMBAT SYSTEM ───
  function startCombat(monsterKey, isBoss=false) {
    const tpl = monsters[monsterKey];
    const monster = { ...tpl, hp: tpl.stats.hp };

    roomPanel.innerHTML = `
      <h2>${isBoss ? "Boss Fight!" : "Combat vs."} ${monster.name}</h2>
      <pre style="font-size:2rem;">${asciiMap.monster}</pre>
      <div id="log" style="min-height:4em;"></div>
      <div>
        Player HP: <span id="php">${player.hp}</span> / ${player.maxHp}<br>
        Monster HP: <span id="mhp">${monster.hp}</span> / ${monster.stats.hp}
      </div>
      <button id="atk">Attack</button>
    `;
    roomPanel.classList.remove("hidden");

    document.getElementById("atk").addEventListener("click", () => {
      const log = document.getElementById("log");
      log.innerHTML = "";

      // player actions
      const pActs = Math.max(1, Math.floor(player.spd / monster.stats.spd));
      for (let i = 0; i < pActs; i++) {
        const dmg = Math.max(1, player.atk - monster.stats.def);
        monster.hp -= dmg;
        log.innerHTML += `<p>You hit for ${dmg} damage.</p>`;
        if (monster.hp <= 0) break;
      }
      document.getElementById("mhp").textContent = Math.max(0, monster.hp);

      // monster defeated?
      if (monster.hp <= 0) {
        log.innerHTML += `<p><strong>${
          isBoss ? "You defeated the Boss! Dungeon Cleared!" : `You defeated ${monster.name}!`
        }</strong></p>
        <button id="cont">${isBoss ? "Finish" : "Continue"}</button>`;
        document.getElementById("cont").addEventListener("click", () => {
          if (isBoss) location.reload();
          else {
            visited.add(currentRoom);
            renderMap();
          }
        });
        return;
      }

      // monster actions
      const mActs = Math.max(1, Math.floor(monster.stats.spd / player.spd));
      for (let i = 0; i < mActs; i++) {
        const dmg = Math.max(1, monster.stats.atk - player.def);
        player.hp -= dmg;
        log.innerHTML += `<p>${monster.name} hits you for ${dmg} damage.</p>`;
        if (player.hp <= 0) break;
      }
      document.getElementById("php").textContent = Math.max(0, player.hp);

      // player died?
      if (player.hp <= 0) {
        log.innerHTML += `<p><strong>You died…</strong></p>
        <button id="retry">Retry</button>`;
        document.getElementById("retry").addEventListener("click", () => location.reload());
      }
    });
  }

  // ─── SEARCH FOR SECRET ROOMS ───
  searchBtn.addEventListener("click", () => {
    rooms[currentRoom].neighbors.push(
      ...rooms[currentRoom].neighbors.filter(n => !visited.has(n))
    );
    renderMap();
  });

  // ─── START GAME ───
  startBtn.addEventListener("click", () => {
    mainMenu.classList.add("hidden");
    generateDungeon();
    renderMap();
  });
});
