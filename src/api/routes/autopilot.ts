import { Router, Request, Response } from 'express';
import { autopilotEmitter } from '../dependencies';
import { runAutopilot } from '../../index';
import { config } from '../../shared/config';
import { AutopilotEvent } from '../../shared/types';

export function createAutopilotRouter(): Router {
  const router = Router();

  router.post('/run', async (req: Request, res: Response) => {
    console.log('autopilot triggered');
    const mode = req.body.mode || config.execution.defaultMode;
    const limit = req.body.limit ? parseInt(req.body.limit, 10) : undefined;

    res.json({ status: 'started', mode });

    runAutopilot({
      mode,
      limit,
      onProgress: (event: AutopilotEvent) => {
        autopilotEmitter.emit('event', event);
      },
    }).catch((err) => {
      console.error('Error during API triggered autopilot run:', err);
    });
  });

  router.get('/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

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
