import { Router, Request, Response } from 'express';
import { autopilotEmitter } from '../dependencies';
import { runAutopilot } from '../../index';
import { config } from '../../shared/config';
import { AutopilotEvent } from '../../shared/types';

let isAutopilotRunning = false;

export function createAutopilotRouter(): Router {
  const router = Router();

  router.post('/run', async (req: Request, res: Response): Promise<any> => {
    console.log("autopilot triggered")
    if (isAutopilotRunning) {
      return res.status(409).json({
        status: 'busy',
        message: 'An Autopilot run is already actively executing',
      });
    }

    console.log('autopilot triggered');
    const mode = req.body.mode || config.execution.defaultMode;
    const limit = req.body.limit ? parseInt(req.body.limit, 10) : undefined;

    isAutopilotRunning = true;
    res.json({ status: 'started', mode });

    runAutopilot({
      mode,
      limit,
      onProgress: (event: AutopilotEvent) => {
        autopilotEmitter.emit('event', event);
      },
    })
      .catch((err) => {
        console.error('Error during API triggered autopilot run:', err);
      })
      .finally(() => {
        isAutopilotRunning = false;
      });
  });

  router.get('/events', (req: Request, res: Response) => {
    console.log('[Autopilot SSE] Client connected to events stream');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();
    res.write(': connected\n\n');

    const listener = (event: AutopilotEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    autopilotEmitter.on('event', listener);

    req.on('close', () => {
      autopilotEmitter.off('event', listener);
    });
  });

  return router;
}
