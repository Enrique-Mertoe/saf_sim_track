'use client';

import {useEffect, useState} from 'react';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import {SIMCard, Team, User} from '@/models';
import {Button} from '@/ui/components/Button';
import * as XLSX from 'xlsx';


interface TeamSummary {
    team: string;
    activations: {
        '1-9': SIMCard[];
        '10-16': SIMCard[];
        '17-30': SIMCard[];
    };
}

export default function ExcelReportPage() {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<TeamSummary[] | null>(null);
    const [range] = useState({
        from: '2025-03-01',
        to: '2025-03-30',
    });

    const fetchData = async () => {
        setLoading(true);
        const {data: simCards, error} = await supabase
            .from('sim_cards')
            .select('*')
            .gte('sale_date', range.from)
            .lte('sale_date', range.to);

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const grouped: Record<string, TeamSummary> = {};

        simCards?.forEach((sim) => {
            const team = sim.team_id || 'Unknown';
            const date = new Date(sim.activation_date);
            const day = date.getDate();
            let segment: '1-9' | '10-16' | '17-30' =
                day <= 9 ? '1-9' : day <= 16 ? '10-16' : '17-30';

            if (!grouped[team]) {
                grouped[team] = {
                    team,
                    activations: {
                        '1-9': [],
                        '10-16': [],
                        '17-30': [],
                    },
                };
            }

            grouped[team].activations[segment].push(sim);
        });

        setPreviewData(Object.values(grouped));
        setLoading(false);
    };

    const generateExcel = () => {
        if (!previewData) return;

        const wb = XLSX.utils.book_new();

        // Raw data
        const rawSheet = XLSX.utils.json_to_sheet(
            previewData.flatMap((group) =>
                Object.entries(group.activations).flatMap(([segment, sims]) =>
                    sims.map((sim) => ({
                        Serial: sim.serial_number,
                        Team: group.team,
                        ActivationDate: sim.activation_date,
                        TopUpDate: sim.top_up_date,
                        TopUpAmount: sim.top_up_amount,
                        BundlePurchaseDate: sim.bundle_purchase_date,
                        BundleAmount: sim.bundle_amount,
                        Usage: sim.first_usage_amount,
                        MobigoMSISDN: sim.customer_msisdn,
                        BAMSIDN: sim.agent_msisdn,
                    }))
                )
            )
        );
        XLSX.utils.book_append_sheet(wb, rawSheet, 'Raw data');

        // Performance sheet
        const perfSheetData: any[][] = [
            [
                'Team',
                'Total activation (1-9)',
                'Quality (1-9)',
                'Percentage performance (1-9)',
                'Total activation (10-16)',
                'Quality (10-16)',
                'Percentage performance (10-16)',
                'Total activation (17-30)',
                'Quality (17-30)',
                'Percentage performance (17-30)',
                'Comment',
            ],
        ];

        previewData.forEach((team) => {
            const row = [
                team.team,
                team.activations['1-9'].length,
                team.activations['1-9'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length,
                team.activations['1-9'].length
                    ? (
                        (team.activations['1-9'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length /
                            team.activations['1-9'].length) *
                        100
                    ).toFixed(6)
                    : '0.000000',
                team.activations['10-16'].length,
                team.activations['10-16'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length,
                team.activations['10-16'].length
                    ? (
                        (team.activations['10-16'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length /
                            team.activations['10-16'].length) *
                        100
                    ).toFixed(6)
                    : '0.000000',
                team.activations['17-30'].length,
                team.activations['17-30'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length,
                team.activations['17-30'].length
                    ? (
                        (team.activations['17-30'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length /
                            team.activations['17-30'].length) *
                        100
                    ).toFixed(6)
                    : '0.000000',
                '',
            ];
            perfSheetData.push(row);
        });

        // Add Monthly summary
        perfSheetData.push([]);
        perfSheetData.push(['Monthly Performance']);
        perfSheetData.push(['Team', 'Total activation', 'Quality', 'Percentage performance']);
        previewData.forEach((team) => {
            const all = [
                ...team.activations['1-9'],
                ...team.activations['10-16'],
                ...team.activations['17-30'],
            ];
            const quality = all.filter((s) => s.first_usage_amount && s.first_usage_amount >= 50);
            perfSheetData.push([
                team.team,
                all.length,
                quality.length,
                all.length ? ((quality.length / all.length) * 100).toFixed(6) : '0.000000',
            ]);
        });

        const perfSheet = XLSX.utils.aoa_to_sheet(perfSheetData);
        XLSX.utils.book_append_sheet(wb, perfSheet, 'Performance');

        // const blob = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
        // const buffer = new ArrayBuffer(blob.length);
        // const view = new Uint8Array(buffer);
        // for (let i = 0; i < blob.length; i++) view[i] = blob.charCodeAt(i) & 0xff;
        // const file = new Blob([buffer], { type: 'application/octet-stream' });
        // // saveAs(file, `SIM_Report_${range.from}_to_${range.to}.xlsx`);
        const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
        const blob = new Blob([wbout], {type: 'application/octet-stream'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `SIM_Report_${range.from}_to_${range.to}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 dark:bg-gray-800 dark:text-white">
            <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">SIM Report Generator</h1>

            <Button onClick={fetchData} disabled={loading}
                    className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                {loading ? 'Loading...' : 'Preview Report Data'}
            </Button>

            {previewData && (
                <>
                    <div className="mt-6 border p-4 bg-white rounded shadow dark:bg-gray-700 dark:border-gray-600">
                        <h2 className="text-xl font-semibold mb-3 dark:text-gray-100">Summary Preview</h2>
                        <table className="table-auto w-full border dark:border-gray-600">
                            <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Serial</th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Team</th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Activation
                                    Date
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Top Up Date
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Top Up Amount
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Bundle Purchase
                                    Date
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Bundle Amount
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Usage</th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Till/Mobigo
                                    MSISDN
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">BA MSISDN</th>
                            </tr>
                            </thead>
                            <tbody>
                            {previewData.map((team) => {
                                const total1 = team.activations['1-9'].length;
                                const qual1 = team.activations['1-9'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length;
                                const perf1 = total1 ? ((qual1 / total1) * 100).toFixed(6) : '0.000000';

                                const total2 = team.activations['10-16'].length;
                                const qual2 = team.activations['10-16'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length;
                                const perf2 = total2 ? ((qual2 / total2) * 100).toFixed(6) : '0.000000';

                                const total3 = team.activations['17-30'].length;
                                const qual3 = team.activations['17-30'].filter((s) => s.first_usage_amount && s.first_usage_amount >= 50).length;
                                const perf3 = total3 ? ((qual3 / total3) * 100).toFixed(6) : '0.000000';

                                return (
                                    <tr key={team.team} className="dark:hover:bg-gray-750">
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{team.team}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{total1}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{qual1}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{perf1}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{total2}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{qual2}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{perf2}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{total3}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{qual3}</td>
                                        <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">{perf3}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Button onClick={generateExcel}
                                className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">Generate Excel
                            Report</Button>
                    </div>
                </>
            )}
        </div>
    );
}
