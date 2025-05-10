import {useState, useEffect, useRef} from "react";
import {Check, ChevronDown, Users, Globe, UserCircle, Loader2, X} from "lucide-react";
import {teamService} from "@/services";
import {TeamCreate, User} from "@/models";
import {useDialog} from "@/app/_providers/dialog";

export default function Create({onDismiss}) {
    const [formData, setFormData] = useState<TeamCreate>({
        leader_id: "",
        name: "",
        region: "",
        territory: "",
        van_location: "",
        van_number_plate: ""
    });

    const [leaders, setLeaders] = useState<User[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [regionDropdownPosition, setRegionDropdownPosition] = useState("bottom");
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Africa", "Middle East"];
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

    // Handle clicks outside of dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && leaderDropdownRef.current && !leaderDropdownRef.current.contains(event.target) &&
                !leaderButtonRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }

            if (regionDropdownOpen && regionDropdownRef.current && !regionDropdownRef.current.contains(event.target) &&
                !regionButtonRef.current.contains(event.target)) {
                setRegionDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [dropdownOpen, regionDropdownOpen]);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            leader_id: "",
            region: "",
        });
    };

    const handleCreateTeam = async () => {
        setIsLoading(true);
        try {
            const {error} = await teamService.createTeam(formData)
            if (error)
                return alert(error.message)
            setIsSuccess(true);
            setTimeout(() => {
                resetForm();
                setIsSuccess(false);
                onDismiss();
            }, 1500);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const selectLeader = (id, name) => {
        setFormData(prev => ({...prev, leader_id: id}));
        setDropdownOpen(false);
    };

    const selectRegion = (region) => {
        setFormData(prev => ({...prev, region: region}));
        setRegionDropdownOpen(false);
    };

    const getSelectedLeaderName = () => {
        const leader = leaders.find(l => l.id === formData.leader_id);
        return leader ? leader.full_name : "Select a team leader";
    };

    const isFormValid = formData.name && formData.leader_id && formData.region;
    const dialog = useDialog();

    return (
        <div className="bg-white rounded-xl  p-6 w-full relative  animate-fadeIn">
            {/* Success overlay */}
            {isSuccess && (
                <div className="absolute inset-0 bg-green-50 flex items-center justify-center z-20 animate-fadeIn">
                    <div className="flex flex-col items-center">
                        <div className="bg-green-100 p-3 rounded-full">
                            <Check className="text-green-600 h-8 w-8"/>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-green-800">Team Created Successfully!</h3>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-green-600"/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Create New Team</h2>
                </div>
                <button
                    onClick={onDismiss}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="h-5 w-5 text-gray-500"/>
                </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {/* Team Name */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Team Name</label>
                        <div
                            className={`relative border ${focusedField === 'name' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg transition-all duration-200`}>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-4 py-3 rounded-lg focus:outline-none bg-transparent"
                                placeholder="Enter team name"
                                required
                            />
                        </div>
                    </div>
                    {/* Team Name */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Team Territory</label>
                        <div
                            className={`relative border ${focusedField === 'territory' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg transition-all duration-200`}>
                            <input
                                type="text"
                                name="territory"
                                value={formData.territory}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('territory')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-4 py-3 rounded-lg focus:outline-none bg-transparent"
                                placeholder="Enter team territory"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="grid gril-cols-1 md:grid-cols-2 gap-1">
                    {/* Van number */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Van number plate</label>
                        <div
                            className={`relative border ${focusedField === 'van_number_plate' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg transition-all duration-200`}>
                            <input
                                type="text"
                                name="van_number_plate"
                                value={formData.van_number_plate}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('van_number_plate')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-4 py-3 rounded-lg focus:outline-none bg-transparent"
                                placeholder="Enter Van Number Plate"
                                required
                            />
                        </div>
                    </div>
                    {/* Van location */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Van Location</label>
                        <div
                            className={`relative border ${focusedField === 'van_location' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg transition-all duration-200`}>
                            <input
                                type="text"
                                name="van_location"
                                value={formData.van_location}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('van_location')}
                                onBlur={() => setFocusedField(null)}
                                className="block w-full px-4 py-3 rounded-lg focus:outline-none bg-transparent"
                                placeholder="Enter Van Location"
                                required
                            />
                        </div>
                    </div>
                </div>
                {/* Team Leader Custom Dropdown */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Team Leader</label>
                    <div className="relative">
                        <button
                            ref={leaderButtonRef}
                            type="button"
                            onClick={() => {
                                // Calculate position before opening
                                if (leaderButtonRef.current) {
                                    const buttonRect = leaderButtonRef.current.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - buttonRect.bottom;
                                    const spaceAbove = buttonRect.top;
                                    const dropdownHeight = 240; // Approximate max height of dropdown

                                    setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
                                }
                                setDropdownOpen(!dropdownOpen);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 border ${focusedField === 'leader' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg bg-white text-left focus:outline-none transition-all duration-200`}
                            onFocus={() => setFocusedField('leader')}
                            onBlur={() => setTimeout(() => setFocusedField(null), 100)}
                        >
                            <div className="flex items-center">
                                <UserCircle className="h-5 w-5 text-gray-400 mr-2"/>
                                <span className={formData.leader_id ? "text-gray-900" : "text-gray-500"}>
                  {getSelectedLeaderName()}
                </span>
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>

                        {dropdownOpen && (
                            <div
                                ref={leaderDropdownRef}
                                className={`
      absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-auto
      ${dropdownPosition === "top"
                                    ? "bottom-full mb-1 origin-bottom animate-slideUp"
                                    : "top-full mt-1 origin-top animate-slideDown"}
    `}
                                style={{maxHeight: "240px"}}
                            >
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                        <p className="mt-3 text-gray-500 text-sm font-medium">Loading team
                                            leaders...</p>
                                    </div>
                                ) : leaders.length > 0 ? (
                                    leaders.map(leader => (
                                        <div
                                            key={leader.id}
                                            onClick={() => selectLeader(leader.id, leader.full_name)}
                                            className={`
            flex items-center px-4 py-3 cursor-pointer transition-all
            ${formData.leader_id === leader.id
                                                ? "bg-green-50 hover:bg-green-100"
                                                : "hover:bg-gray-50"}
          `}
                                        >
                                            <div className="flex items-center flex-1">
                                                <UserCircle className="h-5 w-5 text-gray-400 mr-2"/>
                                                <span className="block truncate">{leader.full_name}</span>
                                            </div>
                                            {formData.leader_id === leader.id && (
                                                <div className="ml-auto animate-fadeIn">
                                                    <Check className="h-5 w-5 text-green-600"/>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="mb-3 p-2 rounded-full bg-gray-100">
                                            <UserCircle className="h-6 w-6 text-gray-400"/>
                                        </div>
                                        <p className="mb-4 text-gray-500 text-sm font-medium">No team leaders
                                            available</p>
                                        <button
                                            onClick={() => {
                                                const d = dialog.create({
                                                    content: <div>content here</div>,
                                                    size:"xl"
                                                });
                                            }}
                                            type="button"
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Create Team Leader
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Region Custom Dropdown */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Region</label>
                    <div className="relative">
                        <button
                            ref={regionButtonRef}
                            type="button"
                            onClick={() => {
                                // Calculate position before opening
                                if (regionButtonRef.current) {
                                    // @ts-ignore
                                    const buttonRect = regionButtonRef.current.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - buttonRect.bottom;
                                    const spaceAbove = buttonRect.top;
                                    const dropdownHeight = 240; // Approximate max height of dropdown

                                    setRegionDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
                                }
                                setRegionDropdownOpen(!regionDropdownOpen);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 border ${focusedField === 'region' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} rounded-lg bg-white text-left focus:outline-none transition-all duration-200`}
                            onFocus={() => setFocusedField('region')}
                            onBlur={() => setTimeout(() => setFocusedField(null), 100)}
                        >
                            <div className="flex items-center">
                                <Globe className="h-5 w-5 text-gray-400 mr-2"/>
                                <span className={formData.region ? "text-gray-900" : "text-gray-500"}>
                  {formData.region || "Select a region"}
                </span>
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>

                        {regionDropdownOpen && (
                            <div
                                ref={regionDropdownRef}
                                className={`${
                                    regionDropdownPosition === "top"
                                        ? "bottom-full mb-1 origin-bottom"
                                        : "top-full mt-1 origin-top"
                                } absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-auto ${
                                    regionDropdownPosition === "top" ? "animate-slideUp" : "animate-slideDown"
                                }`}
                                style={{maxHeight: "240px"}}
                            >
                                {regions.map(region => (
                                    <div
                                        key={region}
                                        onClick={() => selectRegion(region)}
                                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <Globe className="h-5 w-5 text-gray-400 mr-2"/>
                                        <span className="block truncate">{region}</span>
                                        {formData.region === region && (
                                            <Check className="h-5 w-5 text-green-600 ml-auto"/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
                <button
                    onClick={onDismiss}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreateTeam}
                    disabled={!isFormValid || isLoading}
                    className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center justify-center min-w-24 transition-all duration-300 ${
                        isFormValid
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1"/>
                    ) : (
                        <>Create Team</>
                    )}
                </button>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideDown {
                    from {
                        transform: translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                .animate-slideDown {
                    animation: slideDown 0.2s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}