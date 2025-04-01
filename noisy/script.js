// Import SimplexNoise from CDN
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";
const simplex = new SimplexNoise();

// Configuration variables
let lineCount = 10;
let mirrorLines = true;

// Canvas setup
const c = document.querySelector("canvas");
const ctx = c.getContext("2d");

const cSize = 500;
c.width = cSize;
c.height = cSize;

// Animation function
function render() {
  // Apply semi-transparent black rectangle for trail effect
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, cSize, cSize);

  // Generate values using simplex noise for smooth random movement
  const t = performance.now() * 0.0005
  const a = (simplex.noise2D(0, t * 0.5) + 1) / 2;
  const y = (simplex.noise2D(1, t) + 1) / 2 * cSize * 0.5;

  // Draw each dot/line
  for (let i = 0; i < lineCount; i++) {
    const angle = a + i * (1/lineCount);
    const hue = i * (360/lineCount);
    const dir = mirrorLines ? (i % 2) * 2 - 1 : 1;
    drawDot(angle, y, hue, dir);
  }
  
  // Helper function to draw a colored dot
  function drawDot(ta, td, hue, dir) {
    const tx = (cSize / 2) + Math.cos(ta * 2 * Math.PI) * td;
    const ty = (cSize / 2) + Math.sin(ta * 2 * Math.PI) * td * dir;

    ctx.beginPath();
    ctx.arc(tx, ty, 10, 0, 2 * Math.PI);      
    ctx.fillStyle = `hsl(${hue} 100% 70%)`;
    ctx.fill();
  }
  
  // Continue animation loop
  requestAnimationFrame(render);
}

// Start the animation
render();

// Event listeners for controls
document.querySelector('#count').addEventListener('change', e => {
  ctx.clearRect(0, 0, cSize, cSize);
  lineCount = Math.min(8, Math.max(1, Math.round(e.target.value / 2))) * 2; 
});

document.querySelector('#mirror').addEventListener('change', e => {
  ctx.clearRect(0, 0, cSize, cSize);
  mirrorLines = e.target.checked;
});
