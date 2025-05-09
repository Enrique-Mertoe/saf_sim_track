"use client"
import Dashboard from "@/ui/components/dash/Dashboard";
import TeamManagement from "@/app/dashboard/team_management/page.view";

export default function Page() {
    return (
        <>
            <Dashboard>
                <TeamManagement/>
            </Dashboard>
        </>
    )
}