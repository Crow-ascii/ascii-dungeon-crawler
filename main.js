// ─── CONFIGURATION ───
const WIDTH      = 5;
const HEIGHT     = 5;
const ROOM_COUNT = 12;

const roomTypes = [
  "monster","monster","monster",
  "puzzle","puzzle",
  "trap","trap",
  "riddle",
  "treasure","treasure"
];

const asciiMap = {
  start:    "@",
  monster:  "(>_<)",
  puzzle:   "[?]",
  trap:     "/!\\",
  riddle:   "{?}",
  treasure: "($)"
};

// ─── PLAYER & MONSTERS ───
const player = { name:"You", hp:100, maxHp:100, atk:10, def:5, spd:8 };

const monsters = {
  goblin: {
    name: "Goblin",
    stats: { hp:30, atk:5, def:2, spd:8 },
    skills:[{ name:"Slash", type:"damage", power:6, cooldown:0 }]
  },
  skeleton_archer: {
    name: "Skeleton Archer",
    stats: { hp:40, atk:7, def:3, spd:6 },
    skills:[{ name:"Arrow Shot", type:"damage", power:8, cooldown:1 }]
  },
  ogre: {
    name: "Ogre",
    stats: { hp:100, atk:15, def:8, spd:3 },
    skills:[
      { name:"Smash", type:"damage", power:20, cooldown:2 },
      { name:"Stomp", type:"debuff", power:2, cooldown:3 }
    ]
  }
};

// ─── GLOBALS & HELPERS ───
let rooms = {}, currentRoom;
const mapDiv      = document.getElementById("map");
const roomContent = document.getElementById("room-content");

function key(x,y){ return `${x},${y}`; }

// ─── DUNGEON GENERATOR ───
function generateDungeon() {
  const visited = new Set();
  const stack   = [];

  const startX = 0, startY = Math.floor(HEIGHT/2);
  visited.add(key(startX,startY));
  stack.push([startX,startY]);

  while (visited.size < ROOM_COUNT && stack.length) {
    const idx = Math.floor(Math.random()*stack.length);
    const [x,y] = stack[idx];

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
      .sort(()=>Math.random()-0.5);

    let carved=false;
    for (let [dx,dy] of dirs) {
      const nx=x+dx, ny=y+dy, k=key(nx,ny);
      if (nx>=0 && nx<WIDTH && ny>=0 && ny<HEIGHT && !visited.has(k)) {
        visited.add(k);
        stack.push([nx,ny]);
        carved=true;
        break;
      }
    }
    if (!carved) stack.splice(idx,1);
  }

  rooms = {};
  for (let s of visited) {
    const [x,y] = s.split(",").map(Number);
    const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
      .map(([dx,dy])=>[x+dx,y+dy])
      .filter(([nx,ny])=>visited.has(key(nx,ny)))
      .map(([nx,ny])=>key(nx,ny));
    const type = (x===startX && y===startY)
      ? "start"
      : roomTypes[Math.floor(Math.random()*roomTypes.length)];
    rooms[s] = {
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
  currentRoom = key(startX,startY);
}

// ─── RENDER & NAVIGATION ───
function renderMap() {
  mapDiv.style.gridTemplateColumns = `repeat(${WIDTH}, 80px)`;
  mapDiv.style.gridTemplateRows    = `repeat(${HEIGHT}, 80px)`;
  mapDiv.innerHTML = "";

  for (let y=0; y<HEIGHT; y++) {
    for (let x=0; x<WIDTH; x++) {
      const coord = key(x,y);
      const cell  = document.createElement("div");
      cell.classList.add("cell");
      if (coord===currentRoom) {
        cell.classList.add("current");
        cell.textContent = asciiMap["start"];
      } else if (rooms[currentRoom].neighbors.includes(coord)) {
        cell.classList.add("neighbor");
        cell.addEventListener("click",()=>enterRoom(coord));
      } else {
        cell.classList.add("hidden");
      }
      mapDiv.appendChild(cell);
    }
  }
  roomContent.classList.add("hidden");
}

function enterRoom(coord) {
  const info = rooms[coord];
  if (info.type==="monster") {
    return startCombat(info.monsterId);
  }
  roomContent.innerHTML = `
    <pre style="font-size:2rem;">${info.ascii}</pre>
    <p>You entered a <strong>${info.type}</strong> room.</p>
    <button id="continue-btn">Continue</button>
  `;
  roomContent.classList.remove("hidden");
  document.getElementById("continue-btn")
    .addEventListener("click",()=>{
      currentRoom = coord;
      renderMap();
    });
}

// ─── COMBAT SYSTEM ───
function startCombat(monsterKey) {
  const tpl = monsters[monsterKey];
  const monster = { ...tpl, hp: tpl.stats.hp };

  roomContent.innerHTML = `
    <h2>Combat vs. ${monster.name}</h2>
    <pre style="font-size:2rem;">${asciiMap["monster"]}</pre>
    <div id="combat-log" style="min-height:4em;"></div>
    <div>
      Player HP: <span id="player-hp">${player.hp}</span> / ${player.maxHp}<br>
      Monster HP: <span id="monster-hp">${monster.hp}</span> / ${monster.stats.hp}
    </div>
    <button id="attack-btn">Attack</button>
  `;
  roomContent.classList.remove("hidden");
  document.getElementById("attack-btn")
    .addEventListener("click",()=>performRound(monster));
}

function performRound(monster) {
  const logDiv = document.getElementById("combat-log");
  logDiv.innerHTML = "";

  const pActs = Math.max(1, Math.floor(player.spd/monster.stats.spd));
  const mActs = Math.max(1, Math.floor(monster.stats.spd/player.spd));

  for (let i=0; i<pActs; i++) {
    const dmg = Math.max(1, player.atk - monster.stats.def);
    monster.hp -= dmg;
    logDiv.innerHTML += `<p>You hit for ${dmg} damage.</p>`;
    if (monster.hp<=0) break;
  }
  document.getElementById("monster-hp").textContent = Math.max(0,monster.hp);

  if (monster.hp<=0) {
    logDiv.innerHTML += `<p><strong>You defeated the ${monster.name}!</strong></p>`;
    logDiv.innerHTML += `<button id="loot-btn">Continue</button>`;
    return document.getElementById("loot-btn")
      .addEventListener("click",()=>{
        // TODO: award points
        renderMap();
      });
  }

  for (let i=0; i<mActs; i++) {
    const dmg = Math.max(1, monster.stats.atk - player.def);
    player.hp -= dmg;
    logDiv.innerHTML += `<p>${monster.name} hits you for ${dmg} damage.</p>`;
    if (player.hp<=0) break;
  }
  document.getElementById("player-hp").textContent = Math.max(0,player.hp);

  if (player.hp<=0) {
    logDiv.innerHTML += `<p><strong>You died…</strong></p>`;
    logDiv.innerHTML += `<button id="retry-btn">Retry</button>`;
    document.getElementById("retry-btn")
      .addEventListener("click",()=>location.reload());
  }
}

// ─── BOOTSTRAP ───
document.addEventListener("DOMContentLoaded",()=>{
  generateDungeon();
  renderMap();
});
