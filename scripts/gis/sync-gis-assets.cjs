const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROCESSED_PATH = path.join(__dirname, '../../gis/processed/oromia-zones-candidate.geojson');
const RUNTIME_PATH = path.join(__dirname, '../../public/data/gis/oromia-zones-candidate.geojson');
const EXPECTED_HASH = 'edfe7b6427c70d3b17250b9d9adf35a218dc9697b47a43599e4d8f86719a2088';

function syncAndValidate() {
  console.log('[GIS Sync] Verifying processed GIS asset on disk...');
  if (!fs.existsSync(PROCESSED_PATH)) {
    throw new Error(`[GIS Sync] Processed file missing: ${PROCESSED_PATH}`);
  }

  const procBuf = fs.readFileSync(PROCESSED_PATH);
  const procHash = crypto.createHash('sha256').update(procBuf).digest('hex');

  if (procHash !== EXPECTED_HASH) {
    throw new Error(`[GIS Sync] Processed asset checksum mismatch! Expected ${EXPECTED_HASH}, got ${procHash}`);
  }

  console.log('[GIS Sync] Copying processed asset to public runtime directory...');
  fs.copyFileSync(PROCESSED_PATH, RUNTIME_PATH);

  const runBuf = fs.readFileSync(RUNTIME_PATH);
  const runHash = crypto.createHash('sha256').update(runBuf).digest('hex');

  if (runHash !== procHash) {
    throw new Error(`[GIS Sync] Runtime copy checksum mismatch! Processed=${procHash}, Runtime=${runHash}`);
  }

  if (procBuf.length !== runBuf.length) {
    throw new Error(`[GIS Sync] Runtime copy size mismatch! Processed=${procBuf.length}, Runtime=${runBuf.length}`);
  }

  const jsonStr = runBuf.toString('utf-8');
  const data = JSON.parse(jsonStr);

  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('[GIS Sync] Invalid GeoJSON structure!');
  }

  if (data.features.length !== 22) {
    throw new Error(`[GIS Sync] Feature count mismatch! Expected 22, got ${data.features.length}`);
  }

  console.log(`[GIS Sync] SUCCESS: Runtime GIS asset verified (${runBuf.length} bytes, SHA-256=${runHash}, 22 features)`);
}

if (require.main === module) {
  try {
    syncAndValidate();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { syncAndValidate };
