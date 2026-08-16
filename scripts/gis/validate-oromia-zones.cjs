const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Target paths
const PROCESSED_PATH = path.join(__dirname, '../../gis/processed/oromia-zones-candidate.geojson');
const RUNTIME_PATH = path.join(__dirname, '../../public/data/gis/oromia-zones-candidate.geojson');
const ARTIFACT_PATH = path.join(__dirname, '../../gis/metadata/validation-result.json');
const REPORT_PATH = path.join(__dirname, '../../gis/metadata/validation-report.md');
const CROSSWALK_PATH = path.join(__dirname, '../../gis/metadata/legacy-crosswalk.json');

const EXPECTED_HASH = 'edfe7b6427c70d3b17250b9d9adf35a218dc9697b47a43599e4d8f86719a2088';

function runM3BValidation() {
  console.log('====================================================');
  console.log('RUNNING MILESTONE M3B INDEPENDENT GIS FOUNDATION AUDIT');
  console.log('====================================================\n');

  // 1. Checksums before Python engine
  console.log('[1/4] Verifying Candidate GeoJSON SHA-256 Checksums (Before Audit)...');
  const procBuf1 = fs.readFileSync(PROCESSED_PATH);
  const runBuf1 = fs.readFileSync(RUNTIME_PATH);
  const hashProc1 = crypto.createHash('sha256').update(procBuf1).digest('hex');
  const hashRun1 = crypto.createHash('sha256').update(runBuf1).digest('hex');

  if (hashProc1 !== EXPECTED_HASH || hashRun1 !== EXPECTED_HASH) {
    throw new Error(`Checksum Mismatch Before Audit! Expected ${EXPECTED_HASH}, got processed=${hashProc1}, runtime=${hashRun1}`);
  }

  // 2. Execute Independent Python GEOS / PyProj Audit Generator
  console.log('[2/4] Executing Development Independent Shapely/GEOS Audit Generator...');
  const pythonScript = path.join(__dirname, 'm3b_generator.py');
  const pythonOut = execSync(`python3 ${pythonScript}`, { encoding: 'utf-8' });
  console.log(pythonOut);

  // 3. Checksums after Python engine
  console.log('[3/4] Verifying Candidate GeoJSON SHA-256 Checksums (After Audit)...');
  const procBuf2 = fs.readFileSync(PROCESSED_PATH);
  const runBuf2 = fs.readFileSync(RUNTIME_PATH);
  const hashProc2 = crypto.createHash('sha256').update(procBuf2).digest('hex');
  const hashRun2 = crypto.createHash('sha256').update(runBuf2).digest('hex');

  if (hashProc2 !== EXPECTED_HASH || hashRun2 !== EXPECTED_HASH) {
    throw new Error(`Checksum Mismatch After Audit! Candidate files were mutated! Expected ${EXPECTED_HASH}`);
  }

  // 4. Verify Generated Artifacts and Reconciled Assertions
  console.log('[4/4] Verifying Generated Metadata Artifacts & Schema Assertions...');
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf-8'));
  const crosswalk = JSON.parse(fs.readFileSync(CROSSWALK_PATH, 'utf-8'));
  const report = fs.readFileSync(REPORT_PATH, 'utf-8');

  // Assertions
  if (artifact.datasetChecksum !== EXPECTED_HASH) throw new Error('Artifact datasetChecksum mismatch');
  if (artifact.featureCount !== 22) throw new Error('Artifact featureCount != 22');

  const inv = artifact.geometryInventory;
  if (inv.polygonFeatureCount !== 21) throw new Error('Polygon feature count != 21');
  if (inv.multiPolygonFeatureCount !== 1) throw new Error('MultiPolygon feature count != 1');
  if (inv.polygonMemberCount !== 23) throw new Error('Polygon member count != 23');
  if (inv.exteriorRingCount !== 23) throw new Error('Exterior ring count != 23');
  if (inv.interiorRingCount !== 2) throw new Error('Interior ring count != 2');
  if (inv.totalRingCount !== 25) throw new Error('Total ring count != 25');
  if (inv.coordinateTupleCountIncludingClosure !== 82590) throw new Error('Coordinate tuple count != 82590');
  if (inv.vertexCountExcludingClosure !== 82565) throw new Error('Vertex count != 82565');

  if (artifact.independentGISValidation.validCount !== 22) throw new Error('GEOS valid count != 22');
  if (artifact.independentGISValidation.invalidCount !== 0) throw new Error('GEOS invalid count != 0');
  if (artifact.independentGISValidation.result !== 'PASS') throw new Error('GEOS validation != PASS');

  if (artifact.legacyCrosswalkValidation.actualLegacyRecordCount !== 21) throw new Error('Actual legacy record count != 21');
  if (crosswalk.length !== 22) throw new Error('Legacy crosswalk entries != 22');

  console.log('\n====================================================');
  console.log('MILESTONE M3B AUDIT PASSED — ALL ASSERTIONS VERIFIED');
  console.log('====================================================\n');
}

runM3BValidation();
