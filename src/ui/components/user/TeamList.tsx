import {motion} from "framer-motion";
import {
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Loader2,
    Users,
    Zap,
    BarChart4
} from "lucide-react";
import {useEffect, useState} from "react";
import {SIMCard, Team} from "@/models";

const SIMStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    SOLD: "SOLD",
};

export default function TeamList({teams,simCards, loading,onClick}: {
    teams: Team[], onClick: (team: Team) => void,simCards:SIMCard[],loading:boolean
}) {
    const [teamSimCounts, setTeamSimCounts] = useState({});
    const [teamQualityScores, setTeamQualityScores] = useState({});

    useEffect(() => {
        // Calculate counts and quality scores for each team
        const counts = {};
        const qualityScores = {};

        teams.forEach(team => {
            //@ts-ignore
            counts[team.id] = 0;
            //@ts-ignore
            qualityScores[team.id] = {total: 0, count: 0};
        });

        simCards.forEach(sim => {
            //@ts-ignore
            if (sim.team_id && counts[sim.team_id] !== undefined) {
                //@ts-ignore
                if (sim.status === SIMStatus.SOLD) {
                    //@ts-ignore
                    counts[sim.team_id]++;
                }

                if (sim.quality_score) {
                    //@ts-ignore
                    qualityScores[sim.team_id].total += sim.quality_score;
                    //@ts-ignore
                    qualityScores[sim.team_id].count++;
                }
            }
        });

        // Calculate average quality scores
        const averageScores = {};
        Object.entries(qualityScores).forEach(([teamId, data]) => {
            //@ts-ignore
            averageScores[teamId] = data.count > 0 ? Math.round(data.total / data.count) : 0;
        });

        setTeamSimCounts(counts);
        setTeamQualityScores(averageScores);
    }, [simCards, teams]);


    const getQualityColor = (score:number) => {
        if (score >= 90) return "text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
        if (score >= 75) return "text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
        if (score >= 60) return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
    };

    return (
        <>
            {loading ? (
                <div className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <motion.div
                        animate={{rotate: 360}}
                        transition={{duration: 1.5, repeat: Infinity, ease: "linear"}}
                    >
                        <Loader2 size={48} className="text-green-600 dark:text-green-500 mb-4"/>
                    </motion.div>
                    <p>Loading teams data...</p>
                </div>
            ) : (
                <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                >
                    {teams.map((team, index) => (
                        <motion.div
                            key={team.id}
                            className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 cursor-pointer"
                            onClick={() => onClick(team)}
                            whileHover={{scale: 1.01}}
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: index * 0.1}}
                        >
                            <motion.div
                                className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 flex justify-between items-center">
                                <div className="flex items-center">
                                    <motion.div
                                        className="bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 p-2 rounded-full mr-3"
                                        whileHover={{scale: 1.1}}
                                        whileTap={{scale: 0.9}}
                                    >
                                        <Users size={20}/>
                                    </motion.div>
                                    <div>
                                        <span className="font-medium dark:text-gray-200">{team.name}</span>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Region: {team.region || "N/A"}
                                            {team.territory && ` • Territory: ${team.territory}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        className="bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-sm flex items-center">
                                        <CreditCard size={14} className="mr-1"/>
                                        {
                                            //@ts-ignore
                                            teamSimCounts[team.id] || 0} Sold
                                    </motion.div>

                                    <motion.div
                                        className={`rounded-full px-3 py-1 text-sm flex items-center ${
                                            //@ts-ignore
                                            getQualityColor(teamQualityScores[team.id] || 0)}`}
                                    >
                                        <BarChart4 size={14} className="mr-1"/>
                                        Quality: {
                                        //@ts-ignore
                                        teamQualityScores[team.id] || 0}%
                                    </motion.div>

                                    <motion.div className={`rounded-full px-3 py-1 text-sm flex items-center 
                    ${team.is_active
                                        ? "bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}`}
                                    >
                                        {team.is_active
                                            ? <CheckCircle size={14} className="mr-1"/>
                                            : <AlertTriangle size={14} className="mr-1"/>}
                                        {team.is_active ? "Active" : "Inactive"}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}

                    {teams.length === 0 && (
                        <motion.div
                            className="p-16 text-center text-gray-500 dark:text-gray-400 border rounded-lg flex flex-col items-center"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                        >
                            <Users size={48} className="text-gray-400 mb-4"/>
                            <p>No teams found</p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </>
    );
}