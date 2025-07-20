// Define rooms with positions (x,y), type, ascii art, and which neighbors they connect to.
const rooms = {
  "1,1": { type: "start",    ascii: "[@]",      neighbors: ["1,0","2,1","1,2"] },
  "1,0": { type: "monster",  ascii: "(>_<)",    neighbors: ["1,1"] },
  "2,1": { type: "puzzle",   ascii: "[?]",      neighbors: ["1,1"] },
  "1,2": { type: "treasure", ascii: "($)",      neighbors: ["1,1"] }
};

let currentRoom = "1,1";  // Start in the center

const mapDiv        = document.getElementById("map");
const roomContent   = document.getElementById("room-content");

// Draw the 3×3 grid of cells, showing only current+neighbors.
function renderMap() {
  mapDiv.innerHTML = "";

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const coord = `${x},${y}`;
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (coord === currentRoom) {
        cell.classList.add("current");
        cell.textContent = "@";  // marker for the player
      } else if (rooms[currentRoom].neighbors.includes(coord)) {
        cell.classList.add("neighbor");
        // leave blank so it’s a mystery until clicked
        cell.addEventListener("click", () => enterRoom(coord));
      } else {
        cell.classList.add("hidden");
      }
      mapDiv.appendChild(cell);
    }
  }

  // Hide any room-content panel if we're back on the map
  roomContent.classList.add("hidden");
}

// When you click a neighbor, show its ASCII & type.
function enterRoom(coord) {
  const info = rooms[coord];
  roomContent.innerHTML = `
    <pre style="font-size:2rem; line-height:1.2;">${info.ascii}</pre>
    <p>You entered a <strong>${info.type}</strong> room.</p>
    <button id="continue-btn">Continue</button>
  `;
  roomContent.classList.remove("hidden");

  document
    .getElementById("continue-btn")
    .addEventListener("click", () => {
      // Move into that room and re-render the map
      currentRoom = coord;
      renderMap();
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", renderMap);
