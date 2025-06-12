import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import {getSession} from "@/lib/session";
import Accounts from "@/lib/accounts";

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getSession('sb-access-token');
    const refreshToken = await getSession('sb-refresh-token');

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }


    // Verify the session
    // const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.getSession();
    //
    // if (sessionError || !sessionData.session) {
    //   return NextResponse.json({ user: null }, { status: 401 });
    // }


    // Get user data
    // const { data: userData, error: userError } = await supabaseAdmin
    //   .from('users')
    //   .select('id, email, full_name, role')
    //   .eq('id', sessionData.session.user.id)
    //   .single();

    const userData:any = await getSession("session-user");
    if (!userData) {
      return NextResponse.json({ user: null }, { status: 404 });
    }



    // Check if user is an admin
    if ((userData.role as any) !== 'supa-admin') {
      return NextResponse.json({ user: null }, { status: 403 });
    }

    return NextResponse.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name
      } 
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}