import {NextRequest, NextResponse} from 'next/server';
import {staffAuthService} from '@/services/staffAuthService';

/**
 * POST /api/auth/staff
 * 
 * Handles staff authentication requests
 * 
 * Request body:
 * {
 *   "action": "login" | "refresh",
 *   "data": {
 *     // For login
 *     "identifier": string, // email, phone, or username
 *     "password": string,
 *     
 *     // For refresh
 *     "refreshToken": string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body || !body.action) {
      return NextResponse.json(
        { success: false, message: 'Invalid request' },
        { status: 400 }
      );
    }
    
    const { action, data } = body;
    
    switch (action) {
      case 'login':
        return await handleLogin(data);
      case 'refresh':
        return await handleRefresh(data);
      default:
        return NextResponse.json(
          { success: false, message: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Staff auth API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle staff login requests
 */
async function handleLogin(data: any) {
  if (!data || !data.identifier || !data.password) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  const { identifier, password } = data;
  const result = await staffAuthService.authenticate(identifier, password);
  
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 }
    );
  }
  
  return NextResponse.json(result);
}

/**
 * Handle token refresh requests
 */
async function handleRefresh(data: any) {
  if (!data || !data.refreshToken) {
    return NextResponse.json(
      { success: false, message: 'Missing refresh token' },
      { status: 400 }
    );
  }
  
  const { refreshToken } = data;
  const result = await staffAuthService.refreshToken(refreshToken);
  
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 }
    );
  }
  
  return NextResponse.json(result);
}