import {makeResponse} from "@/helper";
import {supabaseAdmin} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";
import {SIMCardCreate} from "@/models";

class SimActions {
    static async create_sim_card_batch(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const { simCardsData, batchSize = 50, progressCallback } = data;

            // Implementation directly using supabaseAdmin
            let successCount = 0;
            const errors: any[] = [];

            try {
                // Process all chunks
                for (let i = 0; i < simCardsData.length; i += batchSize) {
                    const chunk = simCardsData.slice(i, i + batchSize);

                    // Clean up data before sending
                    const cleanedData = chunk.map((card: SIMCardCreate) => ({
                        ...card,
                        sold_by_user_id: card.sold_by_user_id === '' ? null : card.sold_by_user_id
                    }));

                    const {error} = await supabaseAdmin.from('sim_cards').insert(cleanedData);

                    if (error) {
                        console.error(`Error inserting chunk ${Math.floor(i / batchSize) + 1}/${Math.ceil(simCardsData.length / batchSize)}:`, error);
                        errors.push(error);
                        // Stop processing and throw error to trigger rollback
                        throw error;
                    } else {
                        successCount += chunk.length;
                    }

                    // Calculate progress
                    const percent = Math.min(100, Math.round(((i + chunk.length) / simCardsData.length) * 100));

                    // Call the progress callback if provided
                    if (typeof progressCallback === 'function') {
                        progressCallback(percent, successCount, chunk, errors);
                    } else {
                        // Otherwise just log the progress
                        console.log(`Progress: ${percent}%, Uploaded: ${successCount}/${simCardsData.length}`);
                    }
                }

                const result = {
                    success: successCount,
                    failed: 0,
                    errors: []
                };

                return makeResponse({
                    ok: true,
                    data: result,
                    message: `Successfully uploaded ${successCount} SIM cards`
                });
            } catch (error) {
                console.error('Transaction failed:', error);

                // If there was an error, we need to clean up any records that were inserted
                if (successCount > 0) {
                    try {
                        // Get the batch_id from the first record to identify all records in this batch
                        const batchId = simCardsData[0].batch_id;
                        if (batchId) {
                            // Delete all records with this batch_id
                            await supabaseAdmin.from('sim_cards').delete().eq('batch_id', batchId);
                            console.log(`Rolled back ${successCount} records for batch ${batchId}`);
                        }
                    } catch (cleanupError) {
                        console.error('Error during rollback:', cleanupError);
                        errors.push(cleanupError);
                    }
                }

                return makeResponse({
                    ok: false,
                    data: {
                        success: 0,
                        failed: simCardsData.length,
                        errors: errors.length > 0 ? errors : [error]
                    },
                    error: (error as Error).message
                });
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    static async builder(target: string, data: any) {
        try {
            const action = (SimActions as any)[target];
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

export default SimActions;
