import React, {useCallback, useState} from 'react';
import {ArrowLeft, Calendar, Check, Download, FileText, Loader2, Users, X} from 'lucide-react';
import {teamService} from "@/services";
import Theme from "@/ui/Theme";
import {DateTime} from "luxon";
import {showModal} from "@/ui/shortcuts";
import ReportDateRangeTemplate from "@/ui/components/ReportDateModal";
import {formatLocalDate} from "@/helper";
import {format, isToday, isYesterday} from "date-fns";
import ClientApi from "@/lib/utils/ClientApi";

export default function ExportToExelComponent({
                                                  onClose,
                                                  onProcess,
                                                  user,
                                                  selectedPeriod: p1,
                                                  startDate: d1,
                                                  endDate: d2
                                              }) {
    const [step, setStep] = useState('select');
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [processingTeams, setProcessingTeams] = useState([]);
    const [completedTeams, setCompletedTeams] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(p1 ?? 'last-30-days');
    const [startDate, setStartDate] = useState(d1 ?? DateTime.now().minus({days: 30}).toISODate());
    const [endDate, setEndDate] = useState(d2 ?? DateTime.now().toISODate());

    const loadTeams = async () => {
        setLoadingTeams(true);
        const {data: teams} = await teamService.getAllTeams(user);
        setTeams(teams ?? []);
        setLoadingTeams(false);
    };

    const handleExportAll = async () => {
        setStep('processing');
        try {
            const dateFilters = getDateFilters();

            const {data, error} = await new Promise((resolve, reject) => {
                ClientApi.of("report").get()
                    .generate_excel_report({
                        startDate: dateFilters.startDate,
                        endDate: dateFilters.endDate,
                        user
                    })
                    .then(res => {
                        if (res.ok)
                            resolve({error: null, data: res.data})
                        else
                            resolve({error: res.error, data: null})
                    }).catch(err => {
                    resolve({error: err.message, data: null})
                });
            });
            if (error) throw new Error(error);
            const buffer = data.buffer;
            const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with date range
            const dateRange = formatDateRangeForDisplay().replace(/\s/g, '_');
            link.download = `All_Teams_Report_${dateRange}.xlsx`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating Excel report:', error);
        }

        onClose();
    };
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else {
            return format(date, "MMM d yyyy");
        }
    };

    const formatDateRangeForDisplay = () => {
        if (selectedPeriod === 'custom') {
            const formattedStartDate = formatDateForDisplay(startDate);
            const formattedEndDate = formatDateForDisplay(endDate);

            if (formattedStartDate === formattedEndDate) {
                return formattedStartDate;
            } else {
                return `${formattedStartDate} - ${formattedEndDate}`;
            }
        } else {
            // For predefined periods, use the period name
            switch (selectedPeriod) {
                case 'last-7-days':
                    return 'Last 7 days';
                case 'last-90-days':
                    return 'Last 90 days';
                case 'last-30-days':
                default:
                    return 'Last 30 days';
            }
        }
    };
    const getDateFilters = useCallback(() => {
        const now = DateTime.now().setZone("Africa/Nairobi");
        let start, end;

        if (selectedPeriod === 'custom') {
            // Use the custom date range
            start = DateTime.fromISO(startDate).startOf('day');
            end = DateTime.fromISO(endDate).endOf('day');
        } else {
            // Use predefined periods
            switch (selectedPeriod) {
                case 'last-7-days':
                    start = now.minus({days: 7}).startOf('day');
                    break;
                case 'last-90-days':
                    start = now.minus({days: 90}).startOf('day');
                    break;
                case 'last-30-days':
                default:
                    start = now.minus({days: 30}).startOf('day');
                    break;
            }
            end = now.endOf('day');
        }
        // start = start.setZone('utc');
        // end = end.setZone('utc')
        return {
            startDate: start.toISO(),
            endDate: end.toISO()
        };
    }, [selectedPeriod, startDate, endDate]);

    const handleExportTeams = async () => {
        if (selectedTeams.length === 0) return;

        setStep('processing');
        setProcessingTeams([...selectedTeams]);

        const dateFilters = getDateFilters();

        // Process each selected team
        for (let i = 0; i < selectedTeams.length; i++) {
            const team = selectedTeams[i];

            try {
                // Call server-side API to generate team-specific report
                const {data, error} = await new Promise((resolve, reject) => {
                    ClientApi.of("report").get()
                        .generate_team_excel_report({
                            startDate: dateFilters.startDate,
                            endDate: dateFilters.endDate,
                            userId: user.id,
                            teamId: team.id,
                            teamName: team.name
                        })
                        .then(res => {
                            if (res.ok)
                                resolve({error: null, data: res.data})
                            else
                                resolve({error: res.error, data: null})
                        }).catch(err => {
                        resolve({error: err.message, data: null})
                    });
                });

                if (error) throw new Error(error);

                // Create a Blob from the buffer
                const buffer = data.buffer;
                const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

                // Create a download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                // Generate filename with team name and date range
                const dateRange = formatDateRangeForDisplay().replace(/\s/g, '_');
                const safeTeamName = team.name.toLowerCase().replace(/\s+/g, '-');
                link.download = `${safeTeamName}_Report_${dateRange}.xlsx`;

                // Trigger download
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);

                // Update UI state
                setProcessingTeams(prev => prev.filter(t => t.id !== team.id));
                setCompletedTeams(prev => [...prev, team]);
            } catch (error) {
                console.error(`Error generating Excel report for team ${team.name}:`, error);
                // Continue with next team even if one fails
                setProcessingTeams(prev => prev.filter(t => t.id !== team.id));
            }
        }

        // Wait a bit before closing to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));
        onClose();
    };

    const toggleTeamSelection = (team) => {
        setSelectedTeams(prev => {
            const exists = prev.find(t => t.id === team.id);
            if (exists) {
                return prev.filter(t => t.id !== team.id);
            } else {
                return [...prev, team];
            }
        });
    };

    const selectAllTeams = () => {
        setSelectedTeams([...teams]);
    };

    const clearSelection = () => {
        setSelectedTeams([]);
    };

    return (
        <>
            <div
                className="bg-white md:rounded-2xl flex flex-col md:shadow-2xl w-full overflow-hidden max-sm:h-screen md:max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FileText className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Export to Excel</h2>
                                <p className="text-green-100 text-sm">Generate comprehensive reports</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-6 flex-1 overflow-y-auto">
                    {step === 'select' && (
                        <div className="space-y-6 p-4">
                            <div className="flex flex-col md:flex-row justify-between">
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Export Option</h3>
                                    <p className="text-gray-600">Select how you'd like to export your data</p>
                                </div>
                                <div className="flex flex-col">
                                    <div>
                                        <button
                                            onClick={() => {
                                                showModal({
                                                    content: onClose => (<ReportDateRangeTemplate
                                                        onConfirm={selection => {
                                                            if (selection.type === 'range' && selection.range.startDate && selection.range.endDate) {
                                                                // Convert Date objects to ISO strings for our date state
                                                                const newStartDate = formatLocalDate(selection.range.startDate);
                                                                const newEndDate = formatLocalDate(selection.range.endDate);
                                                                // Update state with the selected dates
                                                                setStartDate(newStartDate);
                                                                setEndDate(newEndDate);
                                                                setSelectedPeriod('custom');

                                                                // Fetch data with the new date range
                                                                // fetchData(true);
                                                            } else if (selection.type === 'single' && selection.single) {
                                                                // Handle single date selection
                                                                const newDate = selection.single.toISOString().split('T')[0];
                                                                setStartDate(newDate);
                                                                setEndDate(newDate);
                                                                setSelectedPeriod('custom');

                                                                // Fetch data with the new date
                                                                // fetchData(true);
                                                            }
                                                            onClose();
                                                        }}
                                                        onClose={() => onClose()}/>),
                                                    size: "lg",
                                                });
                                            }}
                                            className={`${Theme.Button} gap-2 !py-2 !text-sm`}
                                        >
                                            <Calendar className="h-4 w-4"/>
                                            <span>{formatDateRangeForDisplay()}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-2">
                                {/* Export All Option */}
                                <button
                                    onClick={handleExportAll}
                                    className="group relative bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-400 rounded-xl p-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
                                >
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <div
                                            className="bg-green-600 p-3 rounded-full group-hover:bg-green-700 transition-colors">
                                            <Download className="w-8 h-8 text-white"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Export All</h4>
                                            <p className="text-sm text-gray-600">Download complete dataset in one
                                                file</p>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"></div>
                                </button>

                                {/* Export Per Team Option */}
                                <button
                                    onClick={() => {
                                        setStep('teams');
                                        loadTeams().then();
                                    }}
                                    className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
                                >
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <div
                                            className="bg-blue-600 p-3 rounded-full group-hover:bg-blue-700 transition-colors">
                                            <Users className="w-8 h-8 text-white"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Export Per Team</h4>
                                            <p className="text-sm text-gray-600">Select specific teams to export</p>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'teams' && (
                        <div className="space-y-6 bg-white dark:bg-gray-800">
                            <div className="flex px-4 flex-col md:flex-row md:items-center gap-2 md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Select Teams</h3>
                                    <p className="text-gray-600">Choose teams to export individually</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={selectAllTeams}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors"
                                    >
                                        Select All
                                    </button>
                                    {
                                        selectedTeams.length > 0 && (
                                            <button
                                                onClick={clearSelection}
                                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )
                                    }

                                </div>
                            </div>

                            {loadingTeams ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3"/>
                                    <p className="text-gray-600">Loading teams...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-1 px-4">
                                    {teams.map((team) => {
                                        const isSelected = selectedTeams.find(t => t.id === team.id);
                                        return (
                                            <div
                                                key={team.id}
                                                onClick={() => toggleTeamSelection(team)}
                                                className={`flex relative items-center justify-between p-2 rounded-lg border-2 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-green-400 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }
                                                `}
                                            >
                                                <div className="flex items-center">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">{team.name}</h4>
                                                        <p className="text-sm text-gray-600 line-clamp-2">By {team.users?.full_name}</p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check
                                                        className="w-5 h-5 absolute ring-2 ring-green-600 rounded-full top-0 right-0 m-2 text-green-600"/>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div
                                className="flex sticky bottom-0 pb-4 px-4 bg-inherit justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setStep('select')}
                                    className={`${Theme.Button} gap-2`}
                                >
                                    <ArrowLeft size={20}/>
                                    Back
                                </button>
                                <button
                                    onClick={handleExportTeams}
                                    disabled={selectedTeams.length === 0}
                                    className={`${Theme.Button} gap-2 ${
                                        selectedTeams.length > 0
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Export {selectedTeams.length} Team{selectedTeams.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Export</h3>
                                <p className="text-gray-600">Please wait while we prepare your files</p>
                            </div>

                            <div className="space-y-4">
                                {processingTeams.map((team) => (
                                    <div key={team.id}
                                         className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin"/>
                                        <span className="text-gray-700">Processing {team.name}...</span>
                                    </div>
                                ))}

                                {completedTeams.map((team) => (
                                    <div key={team.id}
                                         className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <Check className="w-5 h-5 text-green-600"/>
                                        <span className="text-gray-700">{team.name} exported successfully</span>
                                    </div>
                                ))}

                                {processingTeams.length === 0 && completedTeams.length === 0 && (
                                    <div className="flex items-center justify-center space-x-3 p-6">
                                        <Loader2 className="w-6 h-6 text-green-600 animate-spin"/>
                                        <span className="text-gray-700">Preparing export...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
