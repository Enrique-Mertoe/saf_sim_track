import { Input } from "@/ui/components/Input";
import { Label } from "@/ui/components/Label";
import { Select } from "@/ui/components/Select";
import { Controller } from "react-hook-form";

// @ts-ignore
export const AgentInfo = ({control, errors, teams}) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="agent_msisdn">Agent MSISDN*</Label>
                <Controller
                    name="agent_msisdn"
                    control={control}
                    rules={{
                        required: 'Agent phone number is required',
                        pattern: {
                            value: /^[0-9]{10,12}$/,
                            message: 'Please enter a valid phone number'
                        }
                    }}
                    render={({field}) => (
                        <Input
                            id="agent_msisdn"
                            placeholder="e.g., 254722XXXXXX"
                            {...field}
                            className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.agent_msisdn ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                        />
                    )}
                />
                {errors.agent_msisdn &&
                    <p className="text-red-500 dark:text-red-400 text-sm">{errors.agent_msisdn.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="team_id">Team*</Label>
                <Controller
                    name="team_id"
                    control={control}
                    rules={{required: 'Team is required'}}
                    render={({field}) => (
                        <Select
                            id="team_id"
                            value={field.value}
                            //@ts-ignore
                            onValueChange={field.onChange}
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        >
                            <option value="">Select team</option>

                            {
                                //@ts-ignore
                                teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                        </Select>
                    )}
                />
                {errors.team_id && <p className="text-red-500 dark:text-red-400 text-sm">{errors.team_id.message}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="region">Region*</Label>
                <Controller
                    name="region"
                    control={control}
                    rules={{required: 'Region is required'}}
                    render={({field}) => (
                        <Input
                            id="region"
                            placeholder="Enter region"
                            {...field}
                            className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.region ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                        />
                    )}
                />
                {errors.region && <p className="text-red-500 dark:text-red-400 text-sm">{errors.region.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="top_up_amount">Initial Top-up Amount (Optional)</Label>
                <Controller
                    name="top_up_amount"
                    control={control}
                    render={({field}) => (
                        <Input
                            id="top_up_amount"
                            type="number"
                            placeholder="Enter top-up amount"
                            {...field}
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                    )}
                />
            </div>
        </div>
    </div>
);