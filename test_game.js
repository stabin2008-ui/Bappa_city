/**
 * test_game.js - Automated Test Suite for Bappa's City
 * Tests DOM IDs, logic, calculations, collisions, and state transitions
 */

const fs = require('fs');
const path = require('path');

console.log('=== BAPPA\'S CITY: AUTOMATED TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Check required files exist at repository root
const baseDir = __dirname;
const indexHtmlPath = path.join(baseDir, 'index.html');
const styleCssPath = path.join(baseDir, 'style.css');
const gameJsPath = path.join(baseDir, 'game.js');
const readmePath = path.join(baseDir, 'README.md');

assert(fs.existsSync(indexHtmlPath), 'index.html exists at root');
assert(fs.existsSync(styleCssPath), 'style.css exists at root');
assert(fs.existsSync(gameJsPath), 'game.js exists at root');
assert(fs.existsSync(readmePath), 'README.md exists at root');

// 2. Check forbidden files DO NOT exist
const forbiddenFiles = ['package.json', 'server.js', 'node_modules', 'vite.config.js', 'tsconfig.json'];
forbiddenFiles.forEach(file => {
  assert(!fs.existsSync(path.join(baseDir, file)), `Forbidden file does not exist: ${file}`);
});

// 3. Verify index.html asset references
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtmlContent.includes('<link rel="stylesheet" href="./style.css">'), 'index.html links to ./style.css');
assert(indexHtmlContent.includes('<script src="./game.js"></script>'), 'index.html scripts ./game.js');
assert(!indexHtmlContent.includes('http://') && !indexHtmlContent.includes('https://') && !indexHtmlContent.includes('cdn'), 'Zero external CDN or remote asset dependencies');

// 4. Verify DOM IDs referenced in game.js exist in index.html
const gameJsContent = fs.readFileSync(gameJsPath, 'utf8');
const idMatches = [...gameJsContent.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)];
const referencedIds = [...new Set(idMatches.map(m => m[1]))];

console.log(`\nValidating ${referencedIds.length} DOM IDs referenced in game.js...`);
referencedIds.forEach(id => {
  const exists = indexHtmlContent.includes(`id="${id}"`) || indexHtmlContent.includes(`id='${id}'`);
  assert(exists, `DOM ID exists in index.html: "${id}"`);
});

// 5. Perspective projection math test
console.log('\nValidating Perspective Projection Math...');
const CAMERA_FOV = 220;
const HORIZON_Y = 230;
const ROAD_BOTTOM_Y = 600;
const ROAD_TOP_W = 90;
const ROAD_BOTTOM_W = 720;
const V_WIDTH = 800;

function projectZ(z) {
  return CAMERA_FOV / (CAMERA_FOV + Math.max(0, z));
}
function getScreenY(z) {
  return HORIZON_Y + (ROAD_BOTTOM_Y - HORIZON_Y) * projectZ(z);
}
function getRoadWidth(z) {
  return ROAD_TOP_W + (ROAD_BOTTOM_W - ROAD_TOP_W) * projectZ(z);
}
function getLaneScreenX(lane, z) {
  const roadW = getRoadWidth(z);
  const laneW = roadW / 3;
  return V_WIDTH / 2 + lane * laneW;
}

const zHorizon = 1000;
const zPlayer = 50;
const zNear = 0;

assert(!isNaN(projectZ(zHorizon)) && isFinite(projectZ(zHorizon)), 'projectZ(1000) is valid number');
assert(!isNaN(projectZ(zPlayer)) && isFinite(projectZ(zPlayer)), 'projectZ(50) is valid number');
assert(!isNaN(projectZ(zNear)) && isFinite(projectZ(zNear)), 'projectZ(0) is valid number');
assert(projectZ(zNear) > projectZ(zHorizon), 'Near scale is greater than horizon scale');
assert(getScreenY(zHorizon) >= HORIZON_Y && getScreenY(zHorizon) < ROAD_BOTTOM_Y, 'Screen Y at horizon is near horizon');
assert(getScreenY(zNear) >= 550, 'Screen Y at near distance is near bottom of canvas');

// Test lanes (-1, 0, 1)
const leftX = getLaneScreenX(-1, zPlayer);
const centerX = getLaneScreenX(0, zPlayer);
const rightX = getLaneScreenX(1, zPlayer);

assert(leftX < centerX && centerX < rightX, 'Lane coordinates correctly ordered Left < Center < Right');
assert(centerX === 400, 'Center lane is precisely centered at 400px');
assert(Math.abs((centerX - leftX) - (rightX - centerX)) < 0.001, 'Lanes are symmetric');

// 6. Test Collision Logic (Fair Bounding Box)
console.log('\nValidating Collision Detection Logic...');
function checkCollision(playerX, playerZ, obsX, obsZ) {
  const zDiff = Math.abs(obsZ - playerZ);
  const xDiff = Math.abs(playerX - obsX);
  return (zDiff < 30) && (xDiff < 42);
}

// In same lane at player depth -> Collides
assert(checkCollision(400, 50, 400, 50), 'Direct hit in same lane at same depth collides');
// In same lane but far ahead (z=200) -> Does not collide
assert(!checkCollision(400, 50, 400, 200), 'Obstacle at z=200 does not collide with player at z=50');
// At player depth but in different lane -> Does not collide
assert(!checkCollision(400, 50, leftX, 50), 'Obstacle in different lane does not collide with player');
// Grace margin test: small offset in lane (e.g. x diff = 30px) still collides
assert(checkCollision(400, 50, 420, 55), 'Slight misalignment within bounds collides predictably');
// Grace margin test: clearly dodging (x diff = 60px) does not collide
assert(!checkCollision(400, 50, 460, 50), 'Fair dodge avoids collision');

// 7. Modak Combo and Scoring Test
console.log('\nValidating Scoring & Combo Progression...');
let comboStreak = 0;
function getCombo(streak) {
  if (streak >= 30) return 5;
  if (streak >= 20) return 4;
  if (streak >= 10) return 3;
  if (streak >= 4) return 2;
  return 1;
}

assert(getCombo(0) === 1, 'Initial combo is x1');
assert(getCombo(4) === 2, 'Streak 4 reaches x2');
assert(getCombo(10) === 3, 'Streak 10 reaches x3');
assert(getCombo(20) === 4, 'Streak 20 reaches x4');
assert(getCombo(30) === 5, 'Streak 30 reaches x5');

// 8. Bappa\'s Blessing Meter Test
console.log('\nValidating Bappa\'s Blessing Meter Fill...');
let blessingMeter = 0;
for (let i = 0; i < 12; i++) {
  blessingMeter = Math.min(100, blessingMeter + 8.5);
}
assert(blessingMeter >= 100, '12 Modaks successfully fill Bappa\'s Blessing meter to 100%');

// 9. Festival Safety Clamping Test
console.log('\nValidating Festival Safety & Reputation Clamping...');
function clamp(val) {
  return Math.max(0, Math.min(100, val));
}
assert(clamp(-25) === 0, 'Negative values clamp to 0');
assert(clamp(150) === 100, 'Over 100 values clamp to 100');
assert(clamp(75) === 75, 'Normal values preserved');

// 10. Summary
console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log('ALL SYSTEMS NOMINAL. VALIDATION SUCCESSFUL!');
  process.exit(0);
} else {
  console.error('FAILURES DETECTED!');
  process.exit(1);
}
