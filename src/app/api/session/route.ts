import {NextResponse} from 'next/server';
import {getPreviousAccounts, storeUserAccount} from '@/app/actions/sessionActions';

// API route to get previous accounts
export async function GET() {
  try {
    const accounts = await getPreviousAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error getting previous accounts:', error);
    return NextResponse.json({ error: 'Failed to get previous accounts' }, { status: 500 });
  }
}

// API route to store user account
export async function POST(request: Request) {
  try {
    const userData = await request.json();
    await storeUserAccount(userData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing user account:', error);
    return NextResponse.json({ error: 'Failed to store user account' }, { status: 500 });
  }
}