import React, {useEffect, useState} from 'react';
import {Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import simService from "@/services/simService";
import {teamService} from "@/services";


const CustomLegend = ({payload}) => {
    return (
        <div className="flex items-center gap-6 mb-6">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{backgroundColor: entry.color}}
                    />
                    <span className="text-sm text-gray-700 font-medium">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const CustomTooltip = ({active, payload, label}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-semibold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: entry.color}}
                        />
                        <span className="text-sm text-gray-700">
              {entry.name}: {Math.round(entry.value)}%
            </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function TeamAnalysisGraph({user, dateFilters}) {
    const [data, sD] = useState(null)

    useEffect(() => {
        fetchMetrics().then()
    }, [user, dateFilters]);

    const fetchMetrics = async () => {
        if (!user) return
        let {data: teams} = await teamService.getAllTeams(user)

        // Create date filter conditions for API queries
        const dateConditions = [];
        if (dateFilters && dateFilters.startDate) {
            dateConditions.push(["registered_on", "gte", dateFilters.startDate]);
        }
        if (dateFilters && dateFilters.endDate) {
            dateConditions.push(["registered_on", "lte", dateFilters.endDate]);
        }

        teams = await Promise.all(
            (teams || []).map(async t => {
                const teamId = t.id;

                const [reg, qlty, act] = await Promise.all([
                    simService.countReg(user, teamId, dateConditions),
                    simService.countQuality(user, teamId, [
                        ["registered_on", "not", "is", null],
                        ...(dateConditions || [])
                    ]),
                    simService.countQuery(user, teamId, [
                        ["activated_on", "not", "is", null],
                        ...(dateConditions || [])
                    ]),
                ]);

                const totalRegistered = reg.count ?? 0;
                const quality = totalRegistered ? ((qlty.count ?? 0) / totalRegistered) * 100 : 0;
                const activated = totalRegistered ? ((act.count ?? 0) / totalRegistered) * 100 : 0;

                return {
                    team: t.name,
                    totalRegistered, quality, activated
                };
            })
        );
       sD(teams)
    }
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Team Performance Chart</h2>

            <div className="w-full overflow-x-auto">
                <div style={{minWidth: '800px', height: '400px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{top: 20, right: 30, left: 20, bottom: 5}}
                            barGap={8}
                        >
                            <XAxis
                                dataKey="team"
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#6B7280'}}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#6B7280'}}
                                domain={[0, 100]}
                                label={{value: 'Percentage (%)', angle: -90, position: 'insideLeft'}}
                            />
                            <Tooltip content={<CustomTooltip/>}/>
                            <Legend
                                content={<CustomLegend/>}
                                wrapperStyle={{paddingBottom: '20px'}}
                            />

                            {/* Safaricom Green Color Palette */}


                            <Bar
                                dataKey="activated"
                                stackId="a"
                                fill="#81C784"
                                radius={[2, 2, 0, 0]}
                                name="Activated"
                            />
                            <Bar
                                dataKey="quality"
                                stackId="a"
                                fill="#00A651"
                                radius={[0, 0, 0, 0]}
                                name="Quality"
                            />
                            <Bar
                                dataKey="totalRegistered"
                                stackId="a"
                                fill="#4CAF50"
                                radius={[0, 0, 0, 0]}
                                name="Total Registered"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
