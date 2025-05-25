import {NextRequest, NextResponse} from 'next/server';
import {adminAuth} from '@/lib/firebase/admin';
import {getSession, setSession} from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data) {
            return NextResponse.json({error: 'data required'}, {status: 401});
        }

        let users = JSON.parse(((await getSession("local-users")) || "[]") as string) as any[];
        if (!users || !Array.isArray(users)) {
            users = []
        }

        // Check if user already exists in the list
        const existingUserIndex = users.findIndex((user: any) => user.id === data.id);

        if (existingUserIndex !== -1) {
            // Update existing user
            users[existingUserIndex] = {
                ...users[existingUserIndex],
                ...data,
                lastLogin: new Date().toISOString()
            };
        } else {
            // Add new user
            users.push(data);
        }

        await setSession("local-users", JSON.stringify(users));
        return NextResponse.json({success: true});
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}

export async function GET() {
    try {
        console.log(await getSession("local-users"))
        let users: any[] = JSON.parse(((await getSession("local-users")) || "[]") as string) as any[];
        if (!users || !Array.isArray(users)) {
            users = []
        }
        return NextResponse.json(users);
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}
