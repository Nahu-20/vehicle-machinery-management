import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { networkInterfaces } from 'os';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MiB limit
});

// Initialize Firebase Admin SDK if service account or default credentials exist
if (!getApps().length) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'oromia-agriculture-dev';
    const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
    
    initializeApp({
      projectId,
      storageBucket,
    });
    console.log(`[Firebase Admin] Initialized for project '${projectId}' with bucket '${storageBucket}'`);
  } catch (err) {
    console.warn('[Firebase Admin] Initialization warning:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve static GIS candidate assets directly via Express to ensure fast streaming without Vite middleware buffering
  app.use('/data/gis', express.static(path.join(process.cwd(), 'public', 'data', 'gis'), {
    maxAge: '1d',
    immutable: false,
    setHeaders: (res) => {
      res.setHeader('Content-Type', 'application/geo+json');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  }));

  // Trusted Backend Endpoint: Investment CMS Mutations & Authoritative Audit Logging
  app.post('/api/investment/mutate', async (req: Request, res: Response) => {
    const { handleInvestmentMutation } = await import('./src/server/investmentApi.js');
    return handleInvestmentMutation(req, res);
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Local IP check for QR codes
  app.get('/api/local-ip', (req: Request, res: Response) => {
    const nets = networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal && name.toLowerCase().includes('wi-fi')) {
          localIp = net.address;
        }
      }
    }
    // Fallback if Wi-Fi not found
    if (localIp === 'localhost') {
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
          }
        }
      }
    }
    res.json({ ip: localIp });
  });

  // Media Processing Trigger Endpoint
  app.post('/api/media/process', async (req: Request, res: Response) => {
    try {
      const { mediaId, ownerUid, sourceStoragePath, forceRetry } = req.body;
      if (!mediaId || !ownerUid || !sourceStoragePath) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
      }

      const { processNewsMediaStaging } = await import('./src/services/mediaProcessingService.js');
      const asset = await processNewsMediaStaging({
        mediaId,
        ownerUid,
        sourceStoragePath,
        forceRetry: Boolean(forceRetry),
      });

      return res.json({ success: true, asset });
    } catch (err: any) {
      console.error('[MediaProcessEndpoint] Error processing media:', err);
      return res.status(400).json({ success: false, error: err.message || 'Image processing failed' });
    }
  });

  // Direct / Fallback Media Upload Endpoint
  app.post('/api/media/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const ownerUid = (req.body.ownerUid as string) || 'system_admin';
      const mediaId = (req.body.mediaId as string) || crypto.randomUUID();
      const storagePath = `media/staging/${ownerUid}/${mediaId}`;

      const { processNewsMediaStaging, localStagingStore } = await import('./src/services/mediaProcessingService.js');

      // Store in memory for sharp pipeline
      localStagingStore.stagingBuffers.set(mediaId, {
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
      });

      // Attempt GCP Storage upload if available
      try {
        const storage = getStorage();
        const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID || 'oromia-agriculture-dev'}.appspot.com`;
        const bucket = storage.bucket(bucketName);
        const stagingFile = bucket.file(storagePath);
        await stagingFile.save(req.file.buffer, {
          contentType: req.file.mimetype,
          metadata: {
            metadata: {
              mediaId,
              ownerUid,
              module: 'news',
              purpose: 'featured-image',
              originalFileName: req.file.originalname,
            },
          },
        });
      } catch (gcpErr: any) {
        console.warn('[MediaUploadEndpoint] GCP Storage save warning (using localStagingStore fallback):', gcpErr?.message);
      }

      // Process image variants
      const asset = await processNewsMediaStaging({
        mediaId,
        ownerUid,
        sourceStoragePath: storagePath,
        forceRetry: true,
      });

      return res.json({
        success: true,
        mediaId,
        ownerUid,
        storagePath,
        asset,
      });
    } catch (err: any) {
      console.error('[MediaUploadEndpoint] Error uploading media:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Media upload failed' });
    }
  });

  // Fetch Media Asset Document Endpoint
  app.get('/api/media/asset/:mediaId', async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    try {
      const { localMediaStore } = await import('./src/services/mediaProcessingService.js');
      const localAsset = localMediaStore.assets.get(mediaId);
      if (localAsset) {
        return res.json({ success: true, asset: localAsset });
      }

      const db = getFirestore();
      const docSnap = await db.collection('mediaAssets').doc(mediaId).get();
      if (docSnap.exists) {
        return res.json({ success: true, asset: docSnap.data() });
      }

      return res.status(404).json({ success: false, error: 'Asset not found' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error fetching asset' });
    }
  });

  // Trusted Backend Endpoint: Permanent Delete Achievement (Super Admin only, status == 'trashed')
  app.post('/api/achievements/delete', async (req: Request, res: Response) => {
    try {
      const { slug, staffUid, expectedVersion } = req.body;
      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ success: false, code: 'INVALID_SLUG', error: 'Missing or invalid achievement slug' });
      }

      const cleanSlug = slug.trim().toLowerCase();

      // Resolve actor UID from Bearer token or request body
      let actorUid: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const { getAuth } = await import('firebase-admin/auth');
          const decoded = await getAuth().verifyIdToken(idToken);
          actorUid = decoded.uid;
        } catch (authErr) {
          console.warn('[AchievementDeleteApi] Token verification warning:', authErr);
        }
      }

      if (!actorUid && staffUid && typeof staffUid === 'string') {
        actorUid = staffUid;
      }

      if (!actorUid) {
        return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', error: 'Authentication required' });
      }

      // Read staffUser profile from Firestore staffUsers/{actorUid}
      const db = getFirestore();
      const staffSnap = await db.collection('staffUsers').doc(actorUid).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ success: false, code: 'STAFF_NOT_FOUND', error: 'Staff user profile not found' });
      }

      const staffData = staffSnap.data() || {};
      if (staffData.active !== true) {
        return res.status(403).json({ success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive' });
      }

      const isSuperAdmin = staffData.role === 'superAdmin';
      const hasDeletePermission = Array.isArray(staffData.permissions) && staffData.permissions.includes('achievement.delete');

      if (!isSuperAdmin && !hasDeletePermission) {
        return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Permanent deletion is strictly reserved for Super Administrators.' });
      }

      const docRef = db.collection('achievements').doc(cleanSlug);
      const docSnap = await docRef.get();

      // Idempotency: if doc does not exist, return success
      if (!docSnap.exists) {
        return res.json({ success: true, message: 'Achievement already deleted', code: 'IDEMPOTENT_SUCCESS' });
      }

      const existingData = docSnap.data() || {};

      // Require status == 'trashed'
      if (existingData.status !== 'trashed') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_STATUS_TRANSITION',
          error: 'Only achievements currently in Trash can be permanently deleted.',
        });
      }

      // Validate expectedVersion if provided
      if (typeof expectedVersion === 'number' && existingData.version !== undefined && existingData.version !== expectedVersion) {
        return res.status(409).json({
          success: false,
          code: 'VERSION_CONFLICT',
          error: `Version conflict: Expected version ${expectedVersion}, but document is at version ${existingData.version}`,
        });
      }

      // Perform deletion
      await docRef.delete();

      // Authoritative audit log in adminAuditLogs
      const auditDocId = `evt_del_ach_${cleanSlug}_${Date.now()}`;
      await db.collection('adminAuditLogs').doc(auditDocId).set({
        actorUid,
        actorEmail: staffData.email || 'staff@oromiaagri.gov.et',
        actorDisplayName: staffData.displayName || 'Super Admin',
        actorRole: staffData.role || 'superAdmin',
        module: 'achievements',
        action: 'permanently_deleted',
        result: 'success',
        targetType: 'achievement',
        targetId: cleanSlug,
        targetLabel: existingData.title?.om || cleanSlug,
        source: 'trusted_backend_api',
        previousStatus: 'trashed',
        newStatus: null,
        versionBefore: existingData.version || 1,
        versionAfter: null,
        occurredAt: new Date().toISOString(),
      });

      return res.json({ success: true, deletedSlug: cleanSlug });
    } catch (err: any) {
      console.error('[AchievementDeleteApi] Server error:', err);
      return res.status(500).json({ success: false, code: 'SERVER_ERROR', error: err?.message || 'Server error during deletion' });
    }
  });

  // Trusted Backend Endpoint: Permanent Delete Alert (Super Admin / alert.delete, status == 'trashed')
  app.post('/api/alerts/delete', async (req: Request, res: Response) => {
    try {
      const { slug, staffUid, expectedVersion } = req.body;
      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ success: false, code: 'INVALID_SLUG', error: 'Missing or invalid alert slug' });
      }

      const cleanSlug = slug.trim().toLowerCase();

      // Resolve actor UID from Bearer token or request body
      let actorUid: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const { getAuth } = await import('firebase-admin/auth');
          const decoded = await getAuth().verifyIdToken(idToken);
          actorUid = decoded.uid;
        } catch (authErr) {
          console.warn('[AlertDeleteApi] Token verification warning:', authErr);
        }
      }

      if (!actorUid && staffUid && typeof staffUid === 'string') {
        actorUid = staffUid;
      }

      if (!actorUid) {
        return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', error: 'Authentication required' });
      }

      // Read staffUser profile from Firestore staffUsers/{actorUid}
      const db = getFirestore();
      const staffSnap = await db.collection('staffUsers').doc(actorUid).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ success: false, code: 'STAFF_NOT_FOUND', error: 'Staff user profile not found' });
      }

      const staffData = staffSnap.data() || {};
      if (staffData.active !== true) {
        return res.status(403).json({ success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive' });
      }

      const isSuperAdmin = staffData.role === 'superAdmin';
      const hasDeletePermission = Array.isArray(staffData.permissions) && staffData.permissions.includes('alert.delete');

      if (!isSuperAdmin && !hasDeletePermission) {
        return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Permanent deletion is strictly reserved for Super Administrators or authorized alert managers.' });
      }

      const docRef = db.collection('agriculturalAlerts').doc(cleanSlug);
      const docSnap = await docRef.get();

      // Idempotency: if doc does not exist, return success
      if (!docSnap.exists) {
        return res.json({ success: true, message: 'Alert already deleted', code: 'IDEMPOTENT_SUCCESS' });
      }

      const existingData = docSnap.data() || {};

      // Require status == 'trashed'
      if (existingData.status !== 'trashed') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_STATUS_TRANSITION',
          error: 'Only alerts currently in Trash can be permanently deleted.',
        });
      }

      // Validate expectedVersion if provided
      if (typeof expectedVersion === 'number' && existingData.version !== undefined && existingData.version !== expectedVersion) {
        return res.status(409).json({
          success: false,
          code: 'VERSION_CONFLICT',
          error: `Version conflict: Expected version ${expectedVersion}, but document is at version ${existingData.version}`,
        });
      }

      // Perform deletion
      await docRef.delete();

      // Authoritative audit log in adminAuditLogs
      const auditDocId = `evt_del_alt_${cleanSlug}_${Date.now()}`;
      await db.collection('adminAuditLogs').doc(auditDocId).set({
        actorUid,
        actorEmail: staffData.email || 'staff@oromiaagri.gov.et',
        actorDisplayName: staffData.displayName || 'Super Admin',
        actorRole: staffData.role || 'superAdmin',
        module: 'alerts',
        action: 'permanently_deleted',
        result: 'success',
        targetType: 'alert',
        targetId: cleanSlug,
        targetLabel: existingData.title?.om || cleanSlug,
        source: 'trusted_backend_api',
        previousStatus: 'trashed',
        newStatus: null,
        versionBefore: existingData.version || 1,
        versionAfter: null,
        occurredAt: new Date().toISOString(),
      });

      return res.json({ success: true, deletedSlug: cleanSlug });
    } catch (err: any) {
      console.error('[AlertDeleteApi] Server error:', err);
      return res.status(500).json({ success: false, code: 'SERVER_ERROR', error: err?.message || 'Server error during deletion' });
    }
  });

  // PART 11: Public Media Delivery Endpoint
  // Route: /api/media/news/:mediaId/:variant and /media/news/:mediaId/:variant
  const handlePublicMedia = async (req: Request, res: Response) => {
    const { mediaId, variant } = req.params;

    // 1. Accept ONLY GET and HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Method Not Allowed');
    }

    // 2. Validate UUID v4 mediaId
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      mediaId
    );
    if (!isUuid) {
      return res.status(400).send('Bad Request: Invalid mediaId format');
    }

    // 3. Validate variant against allowlist
    const allowedVariants = ['hero', 'card', 'thumbnail'];
    if (!allowedVariants.includes(variant)) {
      return res.status(400).send('Bad Request: Unsupported image variant');
    }

    try {
      let mediaData: any = null;
      try {
        const db = getFirestore();
        const docSnap = await db.collection('mediaAssets').doc(mediaId).get();
        if (docSnap.exists) {
          mediaData = docSnap.data();
        }
      } catch (dbErr) {
        // Fallback to localMediaStore if Admin SDK Firestore read fails or permission denied
      }

      if (!mediaData) {
        const { localMediaStore } = await import('./src/services/mediaProcessingService.js');
        mediaData = localMediaStore.assets.get(mediaId);
      }

      if (!mediaData) {
        return res.status(404).send('Not Found');
      }

      // 5. Require status == 'public' (or 'ready' for authorized preview)
      if (mediaData.status !== 'public' && mediaData.status !== 'ready') {
        return res.status(404).send('Not Found');
      }

      // 6. Resolve trusted Storage path
      let storagePath = '';
      if (mediaData.status === 'public' && mediaData.articleSlug) {
        storagePath = `media/public/news/${mediaData.articleSlug}/${mediaId}/${variant}.webp`;
      } else {
        storagePath = `media/processed/news/${mediaId}/${variant}.webp`;
      }

      try {
        const storage = getStorage();
        const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`;
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(storagePath);

        const [exists] = await file.getMetadata().then(() => [true]).catch(() => [false]);
        if (exists) {
          return streamStorageFile(file, req, res, mediaId, variant);
        }

        const processedFile = bucket.file(`media/processed/news/${mediaId}/${variant}.webp`);
        const [procExists] = await processedFile.getMetadata().then(() => [true]).catch(() => [false]);
        if (procExists) {
          return streamStorageFile(processedFile, req, res, mediaId, variant);
        }
      } catch (storageErr) {
        // Fallback to localMediaStore buffer below
      }

      // Check localMediaStore buffer fallback
      const { localMediaStore } = await import('./src/services/mediaProcessingService.js');
      const localBuf = localMediaStore.variants.get(`${mediaId}:${variant}`);
      if (localBuf) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Content-Length', localBuf.length);
        res.setHeader('ETag', `"${mediaId}-${variant}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'HEAD') {
          return res.status(200).end();
        }
        return res.status(200).send(localBuf);
      }

      return res.status(404).send('Not Found');
    } catch (err) {
      console.error(`[PublicMediaDelivery] Error serving ${mediaId}/${variant}:`, err);
      return res.status(404).send('Not Found');
    }
  };

  const streamStorageFile = async (
    file: any,
    req: Request,
    res: Response,
    mediaId: string,
    variant: string
  ) => {
    try {
      const [meta] = await file.getMetadata();
      const etag = meta.etag || `"${mediaId}-${variant}-${meta.updated}"`;
      const size = meta.size;

      // Security and caching headers
      res.setHeader('Content-Type', 'image/webp');
      if (size) res.setHeader('Content-Length', size);
      res.setHeader('ETag', etag);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Handle ETag Conditional Request (304 Not Modified)
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      file.createReadStream().pipe(res);
    } catch (err) {
      console.error('[PublicMediaDelivery] Streaming error:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  app.get('/api/media/news/:mediaId/:variant', handlePublicMedia);
  app.get('/media/news/:mediaId/:variant', handlePublicMedia);
  app.get('/api/media/alert/:mediaId/:variant', handlePublicMedia);
  app.get('/media/alert/:mediaId/:variant', handlePublicMedia);
  app.get('/api/media/achievement/:mediaId/:variant', handlePublicMedia);
  app.get('/media/achievement/:mediaId/:variant', handlePublicMedia);

  // --- Blockchain API Bridge ---
  app.post('/api/blockchain/batch', async (req: Request, res: Response) => {
    try {
      const { batchId, origin, variety } = req.body;
      const { getBlockchainSigner } = await import('./src/lib/blockchain');
      const contract = getBlockchainSigner();
      
      const tx = await contract.createBatch(batchId, origin, variety);
      const receipt = await tx.wait();
      
      res.json({ success: true, txHash: receipt.hash });
    } catch (err: any) {
      console.error('[Blockchain API] Error creating batch:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to create batch' });
    }
  });

  app.post('/api/blockchain/attest', async (req: Request, res: Response) => {
    try {
      const { batchId, stage, actor, location, description, ipfsHash = "" } = req.body;
      const { getBlockchainSigner } = await import('./src/lib/blockchain');
      const contract = getBlockchainSigner();

      let tx;
      if (stage === 'cultivation') {
        tx = await contract.logCultivation(batchId, actor, location, description, ipfsHash);
      } else if (stage === 'processing') {
        tx = await contract.logProcessing(batchId, actor, location, description, ipfsHash);
      } else if (stage === 'quality') {
        tx = await contract.logQuality(batchId, actor, location, description, ipfsHash);
      } else if (stage === 'export') {
        tx = await contract.logExport(batchId, actor, location, description, ipfsHash);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid stage' });
      }

      const receipt = await tx.wait();
      res.json({ success: true, txHash: receipt.hash });
    } catch (err: any) {
      console.error('[Blockchain API] Error logging attestation:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to log attestation' });
    }
  });

  app.get('/api/blockchain/history/:batchId', async (req: Request, res: Response) => {
    try {
      const { batchId } = req.params;
      const { getBlockchainReader } = await import('./src/lib/blockchain');
      const contract = getBlockchainReader();

      const details = await contract.getBatchDetails(batchId);
      const history = await contract.getBatchHistory(batchId);

      // Convert BigInts from ethers v6 response to strings/numbers for JSON serialization
      const formattedHistory = history.map((event: any) => ({
        stage: Number(event.stage),
        timestamp: Number(event.timestamp) * 1000, // Convert to JS ms
        actor: event.actor,
        location: event.location,
        description: event.description,
        ipfsHash: event.ipfsHash
      }));

      res.json({
        success: true,
        batch: {
          batchId: details.batchId,
          origin: details.origin,
          variety: details.variety,
          isInitialized: details.isInitialized,
          isExported: details.isExported
        },
        history: formattedHistory
      });
    } catch (err: any) {
      console.error('[Blockchain API] Error fetching history:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch history' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
