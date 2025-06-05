import React from "react";
import {Legend, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer,} from "recharts";

const data = [
    {
        name: "Brand A",
        value: 65,
        fill: "#d1d5db", // light gray
    },
    {
        name: "Brand B",
        value: 72,
        fill: "#0ea5e9", // blue
    },
    {
        name: "Brand C",
        value: 51,
        fill: "#6b7280", // dark gray
    },
    {
        name: "Brand D",
        value: 63,
        fill: "#10b981", // green
    },
];

const style = {
    top: "50%",
    right: 0,
    transform: "translate(0, -50%)",
    lineHeight: "24px",
};

export default function BrandPerformanceChart() {
    return (
        <div className="w-full h-96 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    barSize={15}
                    data={data}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    {data.map((entry, index) => (
                        <RadialBar
                            key={index}
                            background
                            clockWise
                            dataKey="value"
                            data={[entry]}
                            cornerRadius={10}
                        />
                    ))}
                    <Legend
                        iconSize={10}
                        layout="vertical"
                        verticalAlign="middle"
                        wrapperStyle={style}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
}
