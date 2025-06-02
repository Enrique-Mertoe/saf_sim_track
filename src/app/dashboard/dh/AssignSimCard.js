import MaterialSelect from "@/ui/components/MaterialSelect";
import alert from "@/ui/alert";
import {SIMStatus, UserRole} from "@/models";
import {now} from "@/helper";
import {Loader2} from "lucide-react";
import React, {useEffect, useState} from "react";
import {createSupabaseClient} from "@/lib/supabase/client";

const supabase = createSupabaseClient();
export default function AssignSimCard({
                                          onClose, simCards,user
                                      }) {
    const [selectedMember, setSelectedMember] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [staffMembers, setStaffMembers] = useState([]);
    useEffect(() => {
        async function load() {
            const {data: staffData, error: staffError} = await supabase
                .from('users')
                .select('*')
                .eq('role', UserRole.STAFF)
                .eq('team_id', user.team_id);

            if (staffError) throw staffError;
            setStaffMembers(staffData || []);
        }

        load().then()
    }, [user.team_id]);

    return (
        <div className="bg-white overflow-y-auto rounded-lg p-6 w-full">
            <h3 className="text-lg font-semibold mb-4">Assign SIMs to Team Member</h3>
            <p className="text-sm text-gray-600 mb-4">
                You're about to assign {simCards.length} SIM cards.
            </p>
            <MaterialSelect
                className={"mb-4"}
                options={staffMembers}
                valueKey={"id"}
                displayKey={"full_name"}
                placeholder="Select a team member"
                onChange={v => {
                   setSelectedMember(v)
                }}
            />
            <div className="flex space-x-3">
                <button
                    onClick={() => {
                        onClose()
                        setSelectedMember('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={isAssigning}
                >
                    Cancel
                </button>
                <button
                    onClick={async () => {
                        if (!selectedMember || simCards.length === 0) {
                            alert.info("Please select both staff member and SIM cards");
                            return;
                        }

                        setIsAssigning(true);
                        try {
                            const {error} = await supabase
                                .from('sim_cards')
                                .update({
                                    assigned_to_user_id: selectedMember,
                                    status: SIMStatus.ASSIGNED,// Use local variable
                                    assigned_on: now()
                                })
                                .in('id', simCards);

                            if (error) throw error;

                            alert.success(`Successfully assigned ${simCards.length} SIM cards`);
                            setSelectedMember('');
                            onClose()
                        } catch (error) {
                            console.error("Error assigning SIMs:", error);
                            alert.error("Failed to assign SIM cards. Please try again.");
                        } finally {
                            setIsAssigning(false);
                        }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                    {isAssigning ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            Assigning...
                        </>
                    ) : (
                        'Assign SIMs'
                    )}
                </button>
            </div>
        </div>
    )

}
