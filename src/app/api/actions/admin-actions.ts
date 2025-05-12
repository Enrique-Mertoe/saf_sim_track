import {NextResponse} from "next/server";
import {UserCreate} from "@/models";
import {createSuperClient} from "@/lib/supabase/server";
import {SendEmailOptions, SendEmailResult} from "@/types/mail.sendgrid";
import sgMail from '@sendgrid/mail';
import {join} from "path";
import {readFileSync} from "node:fs";

export async function createUser(userData: UserCreate) {
    const serverSupabase = await createSuperClient();

    try {
        // First create the auth user
        const {data: authData, error: authError} = await serverSupabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
        });
        if (authError) {
            return {data: null, error: authError};
        }
        try {
            // Then create the profile record
            const {data, error} = await serverSupabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    auth_user_id: authData.user.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    id_number: userData.id_number,
                    id_front_url: userData.id_front_url,
                    id_back_url: userData.id_back_url,
                    phone_number: userData.phone_number,
                    mobigo_number: userData.mobigo_number,
                    role: userData.role,
                    team_id: userData.team_id,
                    staff_type: userData.staff_type,
                })
                .select()
                .single();

            if (error) {
                // If profile creation fails, delete the auth user to maintain consistency
                await serverSupabase.auth.admin.deleteUser(authData.user.id);
                return {data: null, error};
            }

            return {data, error: null};
        } catch (profileError) {
            // Clean up auth user if any exception occurs during profile creation
            await serverSupabase.auth.admin.deleteUser(authData.user.id);
            return {data: null, error: profileError};
        }
    } catch (error) {
        return {data: null, error};
    }
}

const getEmailTemplate = (templateName: string): string => {
    const filePath = join(process.cwd(), 'emails', `${templateName}.html`);
    return readFileSync(filePath, 'utf-8');
};

const generateWelcomeEmailTemplate = (templateData: any
) => {
    const welcomeEmailTemplate = getEmailTemplate('invite');
    return welcomeEmailTemplate
        .replace('{{user.fullName}}', templateData.fullName)
        .replace('{{user.role}}', templateData.role)
        .replace('{{user.team.teamName}}', templateData.team)
        .replace('{{user.phoneNumber}}', templateData.phoneNumber)
        .replace('{{user.idNumber}}', templateData.idNumber)
        .replace('{{invitedBy.fullName}}', templateData.invitedBy)
        .replace('{{signUpUrl}}', templateData.resetPasswordUrl);
};
export const sendEmail = async ({
                                    to,
                                    subject,
                                    html,
                                }: SendEmailOptions): Promise<SendEmailResult> => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

    const msg = {
        to,
        from: 'info@lomtechnology.com',
        subject,
        html,
    };

    try {
        await sgMail.send(msg);
        return {success: true};
    } catch (error) {
        console.error('Email sending error:', error);
        return {error};
    }
};

async function sendInvite(options: any) {
    const supabase = await createSuperClient();
    console.log(`${process.env.NEXT_PUBLIC_APP_URL}/accounts/welcome`)
    try {
        const {data, error} = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: options.email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accounts/welcome`,
            },
        });

        if (error) {
            return {error, data: null};
        }
        const resetPasswordUrl = data.properties.action_link;
        // const {data: userData} = await supabase.auth.admin.getUserById(options.id);

        await sendEmail({
            to: options.email,
            subject: "Welcome to SIM Card Management System",
            html: generateWelcomeEmailTemplate({
                fullName: options.full_name,
                role: options.role || 'staff',
                team: options.teams?.name,
                phoneNumber: options.phone_number,
                idNumber: options.id_number,
                invitedBy: options.requestedBy?.full_name,
                resetPasswordUrl: resetPasswordUrl,
            }),
        });

        return {success: true, error: null};
    } catch (error) {
        return {data: null, error};
    }
}

function makeResponse(data: { error?: string; [key: string]: any }) {
    if (data.error) {
        return NextResponse.json({error: data.error}, {status: 400});
    }
    return NextResponse.json(data);
}

class AdminActions {
    static async create_user(data: any) {
        const {error} = await createUser(data)
        console.log(error)
        if (error) {
            return makeResponse({error: (error as any).message})
        }
        return makeResponse({ok: true})
    }

    static async send_invite(data: any) {
        const {error} = await sendInvite(data);
        console.log(error)
        if (error) {
            return makeResponse({error: (error as any).message})
        }
        return makeResponse({ok: true})
    }

    static async builder(target: string, data: any) {
        try {
            const action = (AdminActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default AdminActions

class LogActions {
    static async supabase() {
        return await createSuperClient();
    }

    static async create_log(data: any) {
        const {error} = await (await this.supabase()).from('activity_logs')
            .insert(data);
        console.log(error)
        if (error) {
            return makeResponse({error: (error as any).message})
        }
        return makeResponse({ok: true})
    }

    static async builder(target: string, data: any) {
        try {
            const action = (LogActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export const Logs = LogActions;