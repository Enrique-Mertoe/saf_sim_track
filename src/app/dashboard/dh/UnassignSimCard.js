import alert from "@/ui/alert";
import {SIMStatus} from "@/models";
import {Loader2} from "lucide-react";
import React, {useState} from "react";
import {createSupabaseClient} from "@/lib/supabase/client";

const supabase = createSupabaseClient();

export default function UnassignSimCard({
    onClose, simCards
}) {
    const [isUnassigning, setIsUnassigning] = useState(false);

    return (
        <div className="bg-white overflow-y-auto rounded-lg p-6 w-full">
            <h3 className="text-lg font-semibold mb-4">Unassign SIM Cards</h3>
            <p className="text-sm text-gray-600 mb-4">
                You're about to unassign {simCards.length} SIM card{simCards.length !== 1 ? 's' : ''}.
                This will make them available for assignment to other team members.
            </p>
            
            <div className="flex space-x-3">
                <button
                    onClick={() => {
                        onClose()
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={isUnassigning}
                >
                    Cancel
                </button>
                <button
                    onClick={async () => {
                        if (simCards.length === 0) {
                            alert.info("No SIM cards selected for unassignment");
                            return;
                        }

                        setIsUnassigning(true);
                        try {
                            const {error} = await supabase
                                .from('sim_cards')
                                .update({
                                    assigned_to_user_id: null,
                                    status: SIMStatus.PENDING, // Change status back to REGISTERED
                                    assigned_on: null
                                })
                                .in('id', simCards);

                            if (error) throw error;

                            alert.success(`Successfully unassigned ${simCards.length} SIM card${simCards.length !== 1 ? 's' : ''}`);
                            onClose()
                        } catch (error) {
                            console.error("Error unassigning SIMs:", error);
                            alert.error("Failed to unassign SIM cards. Please try again.");
                        } finally {
                            setIsUnassigning(false);
                        }
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
                >
                    {isUnassigning ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            Unassigning...
                        </>
                    ) : (
                        'Unassign SIMs'
                    )}
                </button>
            </div>
        </div>
    )
}