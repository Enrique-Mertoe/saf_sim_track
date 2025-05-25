// app/api/auth/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import jwt from 'jsonwebtoken';
import {flushSession, getSession, removeSession, removeSessionKeys} from "@/lib/session";
import {adminAuth, adminFirestore as admin} from "@/lib/firebase/admin";
import {authService} from "@/services";
import Accounts from "@/lib/accounts";


interface AuthRequest {
    action: string;
    data: any;
}


interface UpdateUserData {
    id: string;
    email?: string;
    password?: string;
    fname?: string;
    lname?: string;
    phone?: string;
    role?: string;
}

interface LoginData {
    email: string;
    password: string;
}

// Helper function to create responses
function makeResponse(data: { error?: string; [key: string]: any }) {
    if (data.error) {
        return NextResponse.json({error: data.error}, {status: 400});
    }
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        const data: AuthRequest = await request.json();
        if (!data) {
            return makeResponse({error: "No data found!"});
        }

        const {action} = data;

        if (!action) {
            return makeResponse({error: "Invalid action"});
        }

        switch (action) {
            case 'login':
                return await login(data.data);
            case 'updateUser':
                return await updateUser(request, data.data);
            case 'logout':
                return await logout();
            case 'recover':
                return await recover(request, data.data);
            default:
                return makeResponse({error: "Unknown action"});
        }
    } catch (error) {
        return makeResponse({error: `Something went wrong: ${error}`});
    }
}


// Login user
async function login(data: any) {
    try {
        await Accounts.session(data)
        return makeResponse({
            ok: true,
            message: 'Login successful',
        });
    } catch (error) {
        return makeResponse({error: `Login failed: ${error}`});
    }
}



// Update user
async function recover(request: NextRequest, data: UpdateUserData) {
    try {
        const {password} = data;
        if (!password)
            return makeResponse({error: "Invalid parameters"})
        const {error} = await authService.changePassword(password);
        if (error)
            return makeResponse({error: (error as any).message})
        return makeResponse({ok: true})
    } catch (er) {
        console.log(er)
        return makeResponse({error: "Unable to update password"})
    }
}

// Update user
async function updateUser(request: NextRequest, data: UpdateUserData) {
    // try {
    //     const currentUser = await getCurrentUser(request);
    //
    //     if (!currentUser) {
    //         return makeResponse({error: "Not authenticated"});
    //     }
    //
    //     const {id, email, password, fname, lname, phone, role} = data;
    //
    //     // If id is provided and different from current user, check permissions
    //     if (id && id !== currentUser.id && currentUser.role !== 'admin') {
    //         return makeResponse({error: "Unauthorized"});
    //     }
    //
    //     const userId = id || currentUser.id;

        // Start a transaction to update all related tables
        // await prisma.$transaction(async (tx) => {
        //     // Update user table
        //     const updateData: any = {};
        //
        //     if (email) updateData.email = email;
        //     if (password) updateData.password = await bcrypt.hash(password, 10);
        //     if (fname && lname) updateData.username = `${fname}_${lname}`;
        //
        //     if (Object.keys(updateData).length > 0) {
        //         await tx.user.update({
        //             where: {id: userId},
        //             data: updateData
        //         });
        //     }
        //
        //     // Update detail table
        //     const detailData: any = {};
        //
        //     if (fname) detailData.firstName = fname;
        //     if (lname) detailData.lastName = lname;
        //     if (phone) detailData.phone = phone;
        //
        //     if (Object.keys(detailData).length > 0) {
        //         await tx.detail.upsert({
        //             where: {userId},
        //             update: detailData,
        //             create: {
        //                 ...detailData,
        //                 userId
        //             }
        //         });
        //     }
        //
        //     // Update system user table
        //     const systemUserData: any = {};
        //
        //     if (role) systemUserData.role = role;
        //     if (phone) systemUserData.phone = phone;
        //     if (email) systemUserData.email = email;
        //     if (fname && lname) systemUserData.name = `${fname} ${lname}`;
        //
        //     if (Object.keys(systemUserData).length > 0) {
        //         await tx.systemUser.upsert({
        //             where: {userId},
        //             update: systemUserData,
        //             create: {
        //                 ...systemUserData,
        //                 name: systemUserData.name || `${currentUser.detail?.firstName || ''} ${currentUser.detail?.lastName || ''}`,
        //                 email: systemUserData.email || currentUser.email,
        //                 phone: systemUserData.phone || '',
        //                 role: systemUserData.role || 'user',
        //                 userId
        //             }
        //         });
        //     }
        // });

        // Get updated user
        // const updatedUser = await prisma.user.findUnique({
        //     where: {id: userId},
        //     include: {
        //         detail: true,
        //         systemUser: true
        //     }
        // });

    //     return makeResponse({
    //         ok: true,
    //         message: 'User updated successfully',
    //         // user: mapUser(updatedUser)
    //     });
    // } catch (error) {
    //     return makeResponse({error: `Failed to update user: ${error}`});
    // }
}

// Logout user
async function logout() {
    await removeSessionKeys(["user"])
    return makeResponse({
        ok: true,
        message: 'Logged out successfully'
    });
}