// Call this at the top of main.js, instead of hard-coding `rooms`:
let rooms = {};
let currentRoom;

// CONFIG  
const WIDTH      = 5;     // grid width  
const HEIGHT     = 5;     // grid height  
const ROOM_COUNT = 12;    // how many rooms to carve  
const roomTypes  = [      // weighted list of room types
  "monster","monster","monster","puzzle","puzzle",
  "trap","trap","riddle","treasure","treasure"
];

// Utility to turn x,y into a key
function key(x,y){ return `${x},${y}`; }

// Generate the dungeon layout
function generateDungeon() {
  const visited = new Set();
  const stack   = [];

  // Start in the middle row on the left edge
  const startX = 0, startY = Math.floor(HEIGHT/2);
  visited.add(key(startX,startY));
  stack.push([startX,startY]);

  // Carve rooms until we hit ROOM_COUNT
  while (visited.size < ROOM_COUNT && stack.length) {
    // Pick a random room from the carved ones
    const [x,y] = stack[Math.floor(Math.random()*stack.length)];
    // Shuffle directions
    const dirs = [
      [1,0],[-1,0],[0,1],[0,-1]
    ].sort(() => Math.random()-0.5);

    // Try each direction until we find a new cell to carve
    let carved = false;
    for (let [dx,dy] of dirs) {
      const nx = x+dx, ny = y+dy;
      const k  = key(nx,ny);
      if (nx>=0 && nx<WIDTH && ny>=0 && ny<HEIGHT && !visited.has(k)) {
        visited.add(k);
        stack.push([nx,ny]);
        carved = true;
        break;
      }
    }
    // If this room has no expansions left, remove from stack
    if (!carved) stack.splice(stack.indexOf([x,y]),1);
  }

  // Now build room objects with neighbor lists
  rooms = {};
  for (let s of visited) {
    const [x,y] = s.split(",").map(Number);
    // Find carved neighbors
    const neigh = [[1,0],[-1,0],[0,1],[0,-1]]
      .map(([dx,dy])=>[x+dx,y+dy])
      .filter(([nx,ny])=>visited.has(key(nx,ny)))
      .map(([nx,ny])=>key(nx,ny));

    // Randomly pick a type (start stays “start”)
    const type = (x===startX && y===startY)
      ? "start"
      : roomTypes[Math.floor(Math.random()*roomTypes.length)];

    // Fill ascii placeholder (you can override these later per type)
    const asciiMap = {
      start:    "@",
      monster:  "(>_<)",
      puzzle:   "[?]",
      trap:     "/!\\",
      riddle:   "{?}",
      treasure: "($)"
    };

    rooms[s] = {
      type,
      ascii: asciiMap[type] || "[ ]",
      neighbors: neigh
    };
  }

  // Set the player’s starting room
  currentRoom = key(startX,startY);
}

// Call it!
generateDungeon();

// At the bottom of your file, replace any static renderMap() calls
// with the one that uses the newly populated `rooms` object.
renderMap();
