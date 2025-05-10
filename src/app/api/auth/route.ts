// app/api/auth/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import jwt from 'jsonwebtoken';
import {flushSession, getSession} from "@/lib/session";
import {adminAuth, adminFirestore as admin} from "@/lib/firebase/admin";
import {authService} from "@/services";
import Accounts from "@/lib/accounts";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequest {
    action: string;
    data: any;
}

interface CreateUserData {
    email: string;
    password: string;
    fname: string;
    lname: string;
    phone?: string;
    role: string;
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

// Get the current user from the token
async function getCurrentUser(request: NextRequest) {
    const token = await getSession("user");
    if (!token)
        return undefined
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userDoc = await admin.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        console.log("No such user");
        return undefined;
    }
    return userDoc.data();

}

// Map user data to a consistent format
function mapUser(user: any) {
    return {
        id: user.uid,
        email: user.email,
        name: user.username,
        role: user.role,
        performance: user.systemUser?.performance || 0,
        firstName: user.detail?.firstName || '',
        lastName: user.detail?.lastName || '',
        phone: user.detail?.phone || user.systemUser?.phone || '',
    };
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
            case 'register':
                return await register(data.data);
            case 'login':
                return await login(data.data);
            case 'user':
                return await getCurrentUserHandler(request);
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

// Register a new user
async function register(data: CreateUserData) {
    try {
        const {email, password, fname, lname, phone, role} = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {email}
        });

        if (existingUser) {
            return makeResponse({error: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const username = `${fname}_${lname}`;

        // Use a transaction to create the user and related records
        const user = await prisma.$transaction(async (tx) => {
            // Create the user
            const newUser = await tx.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    role: 'isp',
                }
            });

            // Create the system user
            await tx.systemUser.create({
                data: {
                    name: `${fname} ${lname}`,
                    phone: phone || '',
                    email,
                    role,
                    userId: newUser.id
                }
            });

            // Create user details
            await tx.detail.create({
                data: {
                    firstName: fname,
                    lastName: lname,
                    phone: phone || '',
                    userId: newUser.id
                }
            });

            return newUser;
        });

        // Generate token
        const token = jwt.sign({id: user.id}, JWT_SECRET, {expiresIn: '7d'});

        // Set the token in a cookie
        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        });

        return makeResponse({
            ok: true,
            message: 'User registered successfully',
            user: mapUser(user)
        });
    } catch (error) {
        return makeResponse({error: `Registration failed: ${error}`});
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

// Get the current user
async function getCurrentUserHandler(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return makeResponse({error: "Not authenticated"});
        }
        return makeResponse({
            ok: true,
            data: user
        });
    } catch (error) {
        return makeResponse({error: `Failed to get current user: ${error}`});
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
            return makeResponse({error: error.message})
        return makeResponse({ok: true})
    } catch (er) {
        console.log(er)
        return makeResponse({error: "Unable to update password"})
    }
}

// Update user
async function updateUser(request: NextRequest, data: UpdateUserData) {
    try {
        const currentUser = await getCurrentUser(request);

        if (!currentUser) {
            return makeResponse({error: "Not authenticated"});
        }

        const {id, email, password, fname, lname, phone, role} = data;

        // If id is provided and different from current user, check permissions
        if (id && id !== currentUser.id && currentUser.role !== 'admin') {
            return makeResponse({error: "Unauthorized"});
        }

        const userId = id || currentUser.id;

        // Start a transaction to update all related tables
        await prisma.$transaction(async (tx) => {
            // Update user table
            const updateData: any = {};

            if (email) updateData.email = email;
            if (password) updateData.password = await bcrypt.hash(password, 10);
            if (fname && lname) updateData.username = `${fname}_${lname}`;

            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: {id: userId},
                    data: updateData
                });
            }

            // Update detail table
            const detailData: any = {};

            if (fname) detailData.firstName = fname;
            if (lname) detailData.lastName = lname;
            if (phone) detailData.phone = phone;

            if (Object.keys(detailData).length > 0) {
                await tx.detail.upsert({
                    where: {userId},
                    update: detailData,
                    create: {
                        ...detailData,
                        userId
                    }
                });
            }

            // Update system user table
            const systemUserData: any = {};

            if (role) systemUserData.role = role;
            if (phone) systemUserData.phone = phone;
            if (email) systemUserData.email = email;
            if (fname && lname) systemUserData.name = `${fname} ${lname}`;

            if (Object.keys(systemUserData).length > 0) {
                await tx.systemUser.upsert({
                    where: {userId},
                    update: systemUserData,
                    create: {
                        ...systemUserData,
                        name: systemUserData.name || `${currentUser.detail?.firstName || ''} ${currentUser.detail?.lastName || ''}`,
                        email: systemUserData.email || currentUser.email,
                        phone: systemUserData.phone || '',
                        role: systemUserData.role || 'user',
                        userId
                    }
                });
            }
        });

        // Get updated user
        const updatedUser = await prisma.user.findUnique({
            where: {id: userId},
            include: {
                detail: true,
                systemUser: true
            }
        });

        return makeResponse({
            ok: true,
            message: 'User updated successfully',
            user: mapUser(updatedUser)
        });
    } catch (error) {
        return makeResponse({error: `Failed to update user: ${error}`});
    }
}

// Logout user
async function logout() {
    await flushSession()
    return makeResponse({
        ok: true,
        message: 'Logged out successfully'
    });
}