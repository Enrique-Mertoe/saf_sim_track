import {createSupabaseClient} from "@/lib/supabase/client";

export const storageService = {
    // Upload ID front image
    async uploadIdFrontImage(userId: string, file: File) {
        const supabase = createSupabaseClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/id_front.${fileExt}`;

        const {data, error} = await supabase
            .storage
            .from('id-documents')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            return {url: null, error};
        }

        const {data: {publicUrl}} = supabase
            .storage
            .from('id-documents')
            .getPublicUrl(data.path);

        return {url: publicUrl, error: null};
    },

    // Upload ID back image
    async uploadIdBackImage(userId: string, file: File) {
        const supabase = createSupabaseClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/id_back.${fileExt}`;

        const {data, error} = await supabase
            .storage
            .from('id-documents')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            return {url: null, error};
        }

        const {data: {publicUrl}} = supabase
            .storage
            .from('id-documents')
            .getPublicUrl(data.path);

        return {url: publicUrl, error: null};
    },

    // Upload customer ID images for SIM registration
    async uploadCustomerIdImages(simId: string, frontFile: File, backFile: File) {
        const supabase = createSupabaseClient();

        // Upload front image
        const frontFileExt = frontFile.name.split('.').pop();
        const frontFileName = `${simId}/front.${frontFileExt}`;

        const {data: frontData, error: frontError} = await supabase
            .storage
            .from('customer_documents')
            .upload(frontFileName, frontFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (frontError) {
            return {
                frontUrl: null,
                backUrl: null,
                error: frontError
            };
        }

        // Upload back image
        const backFileExt = backFile.name.split('.').pop();
        const backFileName = `${simId}/back.${backFileExt}`;

        const {data: backData, error: backError} = await supabase
            .storage
            .from('customer_documents')
            .upload(backFileName, backFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (backError) {
            return {
                frontUrl: null,
                backUrl: null,
                error: backError
            };
        }

        // Get public URLs
        const {data: {publicUrl: frontUrl}} = supabase
            .storage
            .from('customer-documents')
            .getPublicUrl(frontData.path);

        const {data: {publicUrl: backUrl}} = supabase
            .storage
            .from('customer-documents')
            .getPublicUrl(backData.path);

        return {
            frontUrl,
            backUrl,
            error: null
        };
    },

    // Delete files when no longer needed
    async deleteFiles(bucket: string, paths: string[]) {
        const supabase = createSupabaseClient();
        return await supabase
            .storage
            .from(bucket)
            .remove(paths);
    }
    , async getDataImage(
        fileUrl: string,
        expirySeconds: number = 3600
    ): Promise<string | null> {
        // Extract bucket and path from public URL
        const regex = /storage\/v1\/object\/public\/([^/]+)\/(.+)/
        const match = fileUrl.match(regex)

        if (!match) {
            console.error('❌ Invalid Supabase Storage URL')
            return null
        }

        const bucket = match[1]
        const filePath = match[2]

        // Create signed URL
        const {data, error} = await createSupabaseClient()
            .storage
            .from(bucket)
            .createSignedUrl(filePath, expirySeconds)

        if (error || !data) {
            console.error('❌ Failed to create signed URL:', error?.message)
            return null
        }

        try {
            // Fetch the image as blob
            const response = await fetch(data.signedUrl)
            if (!response.ok) {
                console.error('❌ Failed to fetch image blob')
                return null
            }

            const blob = await response.blob()
            const mimeType = blob.type || 'image/jpeg'

            // Convert blob to base64 data URL
            return await blobToDataURL(blob, mimeType)
        } catch (err) {
            console.error('❌ Error during fetch or conversion:', err)
            return null
        }
    }


};

function blobToDataURL(blob: Blob, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1]
                resolve(`data:${mimeType};base64,${base64}`)
            } else {
                reject('❌ Failed to read blob as data URL')
            }
        }
        reader.onerror = () => reject('❌ FileReader error')
        reader.readAsDataURL(blob)
    })
}