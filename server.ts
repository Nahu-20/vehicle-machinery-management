import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
