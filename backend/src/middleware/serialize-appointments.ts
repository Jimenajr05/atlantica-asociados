import { Request, Response, NextFunction, RequestHandler } from 'express';

let pending: Promise<void> = Promise.resolve();

// Serializa la comprobaci?n y escritura de reservas dentro de un proceso backend.
export function serializeAppointments(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    const previous = pending;
    let release!: () => void;
    pending = new Promise<void>((resolve) => { release = resolve; });
    void previous.then(async () => {
      try {
        if (!res.destroyed) await handler(req, res, next);
      } catch (error) { next(error); }
      finally { release(); }
    });
  };
}
