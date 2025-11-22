import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UserFromHeaderMiddleware implements NestMiddleware {
  use(
    req: Request & { userId?: string | null },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const raw = req.headers['x-user'] ?? req.headers['X-User'];
      if (!raw) {
        req.userId = null;
        return next();
      }

      let parsed: any = raw;
      if (typeof raw === 'string') {
        // header may be already a quoted JSON string like "{\"id\":\"auth0|...\"}"
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          // if parse fails, try to strip surrounding quotes
          const trimmed = raw.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            try {
              parsed = JSON.parse(trimmed.slice(1, -1));
            } catch (_) {
              parsed = trimmed;
            }
          } else {
            parsed = trimmed;
          }
        }
      }

      // parsed can be object { id } or string "auth0|..."
      if (typeof parsed === 'object' && parsed !== null) {
        req.userId = (parsed.id ?? parsed.sub ?? null) as string | null;
      } else if (typeof parsed === 'string') {
        req.userId = parsed;
      } else {
        req.userId = null;
      }
    } catch (err) {
      req.userId = null;
    }
    return next();
  }
}
