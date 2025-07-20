const rooms = [
  { id: 'r1', type: 'monster', name: 'Monster Room',   ascii: '(>_<)' },
  { id: 'r2', type: 'puzzle',  name: 'Puzzle Room',    ascii: '[?]'  },
  { id: 'r3', type: 'treasure',name: 'Treasure Room',  ascii: '($)'  }
];

const roomSelectionDiv = document.getElementById('room-selection');
const roomContentDiv   = document.getElementById('room-content');

function renderRoomOptions() {
  roomSelectionDiv.style.display = 'block';
  roomContentDiv.style.display   = 'none';
  roomSelectionDiv.innerHTML     = '<h2>Choose a room:</h2>';

  rooms.forEach(room => {
    const btn = document.createElement('button');
    btn.textContent = room.name;
    btn.addEventListener('click', () => enterRoom(room));
    roomSelectionDiv.appendChild(btn);
  });
}

function enterRoom(room) {
  roomSelectionDiv.style.display = 'none';
  roomContentDiv.style.display   = 'block';
  roomContentDiv.innerHTML = `
    <pre style="font-size:2rem; line-height:1.2;">${room.ascii}</pre>
    <p>You entered a <strong>${room.name}</strong> (<em>${room.type}</em>).</p>
    <button onclick="renderRoomOptions()">Back to map</button>
  `;
}

document.addEventListener('DOMContentLoaded', renderRoomOptions);
