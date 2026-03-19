import type { Request, Response } from 'express';
import { coldStartService } from '../services/cold-start-service.js';

export async function getColdStart(_req: Request, res: Response): Promise<void> {
  try {
    const snapshot = await coldStartService.getSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve cold-start snapshot',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
