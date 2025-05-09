import {createSupabaseClient} from "@/lib/supabase";

export const storageService = {
  // Upload ID front image
  async uploadIdFrontImage(userId: string, file: File) {
    const supabase = createSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/id_front.${fileExt}`;

    const { data, error } = await supabase
      .storage
      .from('id_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('id_documents')
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  },

  // Upload ID back image
  async uploadIdBackImage(userId: string, file: File) {
    const supabase = createSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/id_back.${fileExt}`;

    const { data, error } = await supabase
      .storage
      .from('id_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('id_documents')
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  },

  // Upload customer ID images for SIM registration
  async uploadCustomerIdImages(simId: string, frontFile: File, backFile: File) {
    const supabase = createSupabaseClient();

    // Upload front image
    const frontFileExt = frontFile.name.split('.').pop();
    const frontFileName = `${simId}/front.${frontFileExt}`;

    const { data: frontData, error: frontError } = await supabase
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

    const { data: backData, error: backError } = await supabase
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
    const { data: { publicUrl: frontUrl } } = supabase
      .storage
      .from('customer_documents')
      .getPublicUrl(frontData.path);

    const { data: { publicUrl: backUrl } } = supabase
      .storage
      .from('customer_documents')
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
};