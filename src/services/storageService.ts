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
    ,
    /**
     * Get temporary download URL for a file (with expiry)
     * @param {string} fileUrl - Path to the file in storage
     * @param {number} expirySeconds - Seconds until the URL expires (default: 60)
     * @returns {Promise<string>} - Temporary URL for the file
     */
    async getDataImage(
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
    },
    /**
     * Upload ID document to storage
     * @param {File} file - The file to upload
     * @param {string} userId - User ID to use in the path
     * @param {string} documentType - Either 'front' or 'back'
     * @returns {Promise<string>} - URL of the uploaded file
     */
    async uploadIdDocument(file: File, userId: string, documentType: any) {
        try {
            const supabase = createSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}_${documentType}_id.${fileExt}`;
            const filePath = `id_documents/${userId}/${fileName}`;

            const {data, error} = await supabase
                .storage
                .from('sim-management')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Overwrite if exists
                });

            if (error) {
                console.error("Error uploading ID document:", error);
                throw new Error(`Failed to upload ID document: ${error.message}`);
            }

            // Get public URL for the file
            const {data: urlData} = supabase
                .storage
                .from('sim-management')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error in uploadIdDocument:", error);
            throw error;
        }
    },
    /**
     * Upload CSV/Excel file for bulk SIM import
     * @param {File} file - The file to upload
     * @param {string} uploaderId - ID of the user uploading the file
     * @returns {Promise<{ filePath: string, publicUrl: string }>} - Path and URL of the uploaded file
     */
    async uploadBulkSimFile(file: File, uploaderId: string) {
        try {
            const supabase = createSupabaseClient();
            const timestamp = new Date().getTime();
            const fileName = `bulk_import_${uploaderId}_${timestamp}.${file.name.split('.').pop()}`;
            const filePath = `sim_imports/${fileName}`;

            const {data, error} = await supabase
                .storage
                .from('sim-management')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Don't overwrite existing files
                });

            if (error) {
                console.error("Error uploading bulk SIM file:", error);
                throw new Error(`Failed to upload bulk SIM file: ${error.message}`);
            }

            // Get public URL for the file
            const {data: urlData} = supabase
                .storage
                .from('sim-management')
                .getPublicUrl(filePath);

            return {
                filePath,
                publicUrl: urlData.publicUrl
            };
        } catch (error) {
            console.error("Error in uploadBulkSimFile:", error);
            throw error;
        }
    },


    /**
     * Upload a report file (PDF/Excel)
     * @param {File} file - The report file to upload
     * @param {string} reportType - Type of report
     * @param {string} period - Time period for the report (e.g., '2025-03')
     * @returns {Promise<string>} - URL of the uploaded report
     */
    async uploadReportFile(file: File, reportType: any, period: any) {
        try {
            const supabase = createSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const timestamp = new Date().toISOString().split('T')[0];
            const fileName = `${reportType}_${period}_${timestamp}.${fileExt}`;
            const filePath = `reports/${reportType}/${fileName}`;

            const {data, error} = await supabase
                .storage
                .from('sim-management')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error("Error uploading report file:", error);
                throw new Error(`Failed to upload report file: ${error.message}`);
            }

            // Get public URL for the file
            const {data: urlData} = supabase
                .storage
                .from('sim-management')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error in uploadReportFile:", error);
            throw error;
        }
    },
    /**
     * List all reports of a specific type
     * @param {string} reportType - Type of reports to list
     * @returns {Promise<Array>} - List of report files
     */
    async listReports(reportType: any) {
        try {
            const supabase = createSupabaseClient();

            const {data, error} = await supabase
                .storage
                .from('sim-management')
                .list(`reports/${reportType}`);

            if (error) {
                console.error("Error listing reports:", error);
                throw new Error(`Failed to list reports: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error("Error in listReports:", error);
            throw error;
        }
    },
    /**
     * Initialize storage buckets and policies (typically called during app setup)
     * @returns {Promise<void>}
     */
    async initializeStorage() {
        try {
            const supabase = createSupabaseClient();

            // Create buckets if they don't exist
            // Note: This would typically be done during initial setup
            // and might require admin credentials

            // Check if bucket exists
            const {data: buckets, error: listError} = await supabase
                .storage
                .listBuckets();

            if (listError) {
                console.error("Error listing buckets:", listError);
                return;
            }

            // Create bucket if it doesn't exist
            if (!buckets.find(b => b.name === 'sim-management')) {
                const {error: createError} = await supabase
                    .storage
                    .createBucket('sim-management', {
                        public: false,
                        fileSizeLimit: 10485760, // 10MB limit
                    });

                if (createError) {
                    console.error("Error creating bucket:", createError);
                }
            }
        } catch (error) {
            console.error("Error in initializeStorage:", error);
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

/**
 * Get the download URL for the Android app APK
 * @returns {Promise<string>} - URL to download the app
 */
export async function getAppDownloadUrl(): Promise<string | null> {
    try {
        const supabase = createSupabaseClient();
        const filePath = 'apps/ssm.apk';
        const bucket = 'sim-management';

        // Create a signed URL with longer expiry for app download
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(filePath, 86400); // 24 hours expiry

        if (error || !data) {
            console.error('❌ Failed to create signed URL for app download:', error?.message);
            return null;
        }

        return data.signedUrl;
    } catch (err) {
        console.error('❌ Error getting app download URL:', err);
        return null;
    }
}
