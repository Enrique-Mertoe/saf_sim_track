import {useEffect, useRef, useState} from "react";
import {Check, ChevronDown, Globe, Loader2, UserCircle, Users, X} from "lucide-react";
import {teamService, userService} from "@/services";
import {Team, TeamUpdate, User, UserRole} from "@/models";
import {AnimatePresence, motion} from "framer-motion";
import alert from "@/ui/alert";
import useApp from "@/ui/provider/AppProvider";

export default function Edit({ team, onDismiss }: {
    team: Team;
    onDismiss: () => void;
}) {
    const [formData, setFormData] = useState<TeamUpdate>({
        leader_id: team.leader_id || "",
        name: team.name || "",
        region: team.region || "",
        territory: team.territory || "",
        van_location: team.van_location || "",
        van_number_plate: team.van_number_plate || ""
    });

    const [leaders, setLeaders] = useState<User[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isTeamLoading, setTeamLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [regionDropdownPosition, setRegionDropdownPosition] = useState("bottom");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const { user } = useApp();

    const regions = ["Northern", "Western", "Central", "Eastern", "Coastal"];
    const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

    const leaderButtonRef = useRef<HTMLElement | null>(null);
    const leaderDropdownRef = useRef(null);
    const regionButtonRef = useRef<HTMLElement | null>(null);
    const regionDropdownRef = useRef<HTMLElement | null>(null);

    // Determine dropdown positions based on viewport
    useEffect(() => {
        const handlePositioning = () => {
            if (leaderButtonRef.current) {
                const buttonRect = leaderButtonRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = 240; // Approximate max height of dropdown

                setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
            }

            if (regionButtonRef.current) {
                const buttonRect = regionButtonRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = 240; // Approximate max height of dropdown

                setRegionDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
            }
        };

        handlePositioning();
        window.addEventListener("resize", handlePositioning);
        window.addEventListener("scroll", handlePositioning);

        return () => {
            window.removeEventListener("resize", handlePositioning);
            window.removeEventListener("scroll", handlePositioning);
        };
    }, [dropdownOpen, regionDropdownOpen]);

    const handleUpdateTeam = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await teamService.updateTeam(team.id, formData);
            if (error) throw new Error(error.message);

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onDismiss();
            }, 1500);
        } catch (err: any) {
            alert.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const selectLeader = (id: string) => {
        setFormData(prev => ({ ...prev, leader_id: id }));
        setDropdownOpen(false);
    };

    const selectRegion = (region: string) => {
        setFormData(prev => ({ ...prev, region: region }));
        setRegionDropdownOpen(false);
    };

    const getSelectedLeaderName = () => {
        const leader = leaders.find(l => l.id === formData.leader_id);
        return leader ? leader.full_name : "Select a team leader";
    };

    const isFormValid = formData.name && formData.leader_id && formData.region;

    async function loadTeams() {
        if (!user) return;

        const { data } = await userService.getUsersByRole(UserRole.TEAM_LEADER, user);
        setLeaders(data as User[]);
        setTeamLoading(false);
    }

    useEffect(() => {
        if (!dropdownOpen || leaders.length)
            return;
        loadTeams().then();
    }, [dropdownOpen]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full relative">
            {/* Success overlay */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        className="absolute inset-0 bg-green-50 dark:bg-green-900 flex items-center justify-center z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-green-100 dark:bg-green-700 p-2 sm:p-3 rounded-full">
                                <Check className="text-green-600 dark:text-green-300 h-6 w-6 sm:h-8 sm:w-8" />
                            </div>
                            <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-green-800 dark:text-green-200">
                                Team Updated Successfully!
                            </h3>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-700 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Edit Team</h2>
                </div>
                <motion.button
                    onClick={onDismiss}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
            </div>

            {/* Form */}
            <div className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2">
                    {/* Team Name */}
                    <div className="space-y-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                        <div
                            className={`relative border ${
                                focusedField === 'name'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg transition-all duration-200`}
                        >
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Enter team name"
                                required
                            />
                        </div>
                    </div>
                    {/* Team Territory */}
                    <div className="space-y-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Team Territory</label>
                        <div
                            className={`relative border ${
                                focusedField === 'territory'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg transition-all duration-200`}
                        >
                            <input
                                type="text"
                                name="territory"
                                value={formData.territory}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('territory')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Enter team territory"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2">
                    {/* Van number */}
                    <div className="space-y-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Van number plate</label>
                        <div
                            className={`relative border ${
                                focusedField === 'van_number_plate'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg transition-all duration-200`}
                        >
                            <input
                                type="text"
                                name="van_number_plate"
                                value={formData.van_number_plate}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('van_number_plate')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Enter Van Number Plate"
                                required
                            />
                        </div>
                    </div>
                    {/* Van location */}
                    <div className="space-y-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Van Location</label>
                        <div
                            className={`relative border ${
                                focusedField === 'van_location'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg transition-all duration-200`}
                        >
                            <input
                                type="text"
                                name="van_location"
                                value={formData.van_location}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('van_location')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Enter Van Location"
                                required
                            />
                        </div>
                    </div>
                </div>
                {/* Team Leader Custom Dropdown */}
                <div className="space-y-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Team Leader</label>
                    <div className="relative">
                        <button
                            //@ts-ignore
                            ref={leaderButtonRef}
                            type="button"
                            onClick={() => {
                                if (leaderButtonRef.current) {
                                    const buttonRect = leaderButtonRef.current.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - buttonRect.bottom;
                                    const spaceAbove = buttonRect.top;
                                    const dropdownHeight = 240;

                                    setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
                                }
                                setDropdownOpen(!dropdownOpen);
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 sm:px-4 sm:py-3 border ${
                                focusedField === 'leader'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg bg-white dark:bg-gray-800 text-left focus:outline-none transition-all duration-200`}
                            onFocus={() => setFocusedField('leader')}
                            onBlur={() => setTimeout(() => setFocusedField(null), 100)}
                        >
                            <div className="flex items-center">
                                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-1.5 sm:mr-2" />
                                <span className={`text-sm ${formData.leader_id ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                                    {getSelectedLeaderName()}
                                </span>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    ref={leaderDropdownRef}
                                    className={`
                                        absolute w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                        rounded-lg shadow-lg z-10 overflow-auto
                                        ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"}
                                    `}
                                    style={{ maxHeight: "240px" }}
                                    initial={{ opacity: 0, y: dropdownPosition === "top" ? 10 : -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: dropdownPosition === "top" ? 10 : -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isTeamLoading ? (
                                        <div className="flex flex-col items-center justify-center py-4 sm:py-8">
                                            <motion.div
                                                className="rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-500 dark:border-green-400"
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            ></motion.div>
                                            <p className="mt-2 sm:mt-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                                                Loading team leaders...
                                            </p>
                                        </div>
                                    ) : leaders.length > 0 ? (
                                        leaders.map(leader => (
                                            <motion.div
                                                key={leader.id}
                                                onClick={() => selectLeader(leader.id)}
                                                className={`
                                                    flex items-center px-3 py-2 sm:px-4 sm:py-3 cursor-pointer transition-all
                                                    ${formData.leader_id === leader.id
                                                        ? "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                                                `}
                                                whileHover={{ backgroundColor: formData.leader_id === leader.id ? "#dcfce7" : "#f9fafb" }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center flex-1">
                                                    <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-1.5 sm:mr-2" />
                                                    <span className="block truncate text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                        {leader.full_name}
                                                    </span>
                                                </div>
                                                {formData.leader_id === leader.id && (
                                                    <motion.div
                                                        className="ml-auto"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                    >
                                                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4 sm:py-8">
                                            <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="mb-3 sm:mb-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                                                No team leaders available
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Region Custom Dropdown */}
                <div className="space-y-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                    <div className="relative">
                        <button
                            //@ts-ignore
                            ref={regionButtonRef}
                            type="button"
                            onClick={() => {
                                if (regionButtonRef.current) {
                                    const buttonRect = regionButtonRef.current.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - buttonRect.bottom;
                                    const spaceAbove = buttonRect.top;
                                    const dropdownHeight = 240;

                                    setRegionDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
                                }
                                setRegionDropdownOpen(!regionDropdownOpen);
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 sm:px-4 sm:py-3 border ${
                                focusedField === 'region'
                                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-500 dark:ring-green-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg bg-white dark:bg-gray-800 text-left focus:outline-none transition-all duration-200`}
                            onFocus={() => setFocusedField('region')}
                            onBlur={() => setTimeout(() => setFocusedField(null), 100)}
                        >
                            <div className="flex items-center">
                                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-1.5 sm:mr-2" />
                                <span className={`text-sm ${formData.region ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                                    {formData.region || "Select a region"}
                                </span>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {regionDropdownOpen && (
                                <motion.div
                                    //@ts-ignore
                                    ref={regionDropdownRef}
                                    className={`
                                        absolute w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                        rounded-lg shadow-lg z-10 overflow-auto
                                        ${regionDropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"}
                                    `}
                                    style={{ maxHeight: "240px" }}
                                    initial={{ opacity: 0, y: regionDropdownPosition === "top" ? 10 : -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: regionDropdownPosition === "top" ? 10 : -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {regions.map(region => (
                                        <motion.div
                                            key={region}
                                            onClick={() => selectRegion(region)}
                                            className="flex items-center px-3 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                            whileHover={{ backgroundColor: formData.region === region ? "#dcfce7" : "#f9fafb" }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-1.5 sm:mr-2" />
                                            <span className="block truncate text-xs sm:text-sm text-gray-800 dark:text-gray-200">{region}</span>
                                            {formData.region === region && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                >
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 ml-auto" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex justify-end space-x-2 sm:space-x-3">
                <motion.button
                    onClick={onDismiss}
                    className="px-3 py-1.5 sm:px-5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Cancel
                </motion.button>
                <motion.button
                    onClick={handleUpdateTeam}
                    disabled={!isFormValid || isLoading}
                    className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center min-w-16 sm:min-w-24 transition-all duration-300 ${
                        isFormValid
                            ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={isFormValid ? { scale: 1.02 } : {}}
                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                >
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        </motion.div>
                    ) : (
                        <>Update Team</>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
