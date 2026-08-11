import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { UserRole } from '@whatshub/shared';

export interface AuthenticatedRequest extends Request {
  user?: any;
  workspaceId?: string;
  userRole?: UserRole;
}

/**
 * Validates Supabase JWT Bearer token.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Bearer authorization header.' },
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session token is invalid or expired.' },
    });
  }

  req.user = user;
  next();
}

/**
 * Enforces workspace isolation by checking x-workspace-id header & membership.
 */
export async function requireWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const workspaceId = (req.headers['x-workspace-id'] as string) || (req.query.workspace_id as string);

  if (!workspaceId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_WORKSPACE', message: 'x-workspace-id header is required.' },
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User context missing.' },
    });
  }

  // Verify workspace membership
  const { data: membership, error } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !membership) {
    return res.status(403).json({
      success: false,
      error: { code: 'WORKSPACE_FORBIDDEN', message: 'User does not have permission to access this workspace.' },
    });
  }

  req.workspaceId = workspaceId;
  req.userRole = membership.role as UserRole;
  next();
}

/**
 * Role-Based Access Control Guard.
 */
export function checkRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'ROLE_FORBIDDEN', message: 'Insufficient role permissions for this action.' },
      });
    }
    next();
  };
}
