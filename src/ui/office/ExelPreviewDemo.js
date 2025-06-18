// Demo Component showing all capabilities
import React from "react";
import ExcelPreview from "./ExcelPreview";

const ExcelPreviewDemo = () => {
    // Example data with different styling options
    const sampleData = [
        {
            name: "Sales Report",
            hasHeaders: true,
            headerStyle: "bg-blue-100 font-bold text-blue-800",
            tabStyle: "bg-blue-200 text-blue-800 hover:bg-blue-300",
            data: [
                ["Product", "Region", "Sales", "Status", "Priority"],
                ["Laptop", "North", 1500, { value: "Active", style: "bg-green-100 text-green-800 font-semibold" }, { value: "High", style: "bg-red-100 text-red-800 font-semibold" }],
                ["Mouse", "South", 25, { value: "Pending", style: "bg-yellow-100 text-yellow-800 font-semibold" }, { value: "Low", style: "bg-gray-100 text-gray-600" }],
                ["Keyboard", "East", 75, { value: "Active", style: "bg-green-100 text-green-800 font-semibold" }, { value: "Medium", style: "bg-blue-100 text-blue-800" }]
            ]
        },
        {
            name: "Customer Data",
            hasHeaders: true,
            headerStyle: "bg-purple-100 font-bold text-purple-800",
            tabStyle: "bg-purple-200 text-purple-800 hover:bg-purple-300",
            data: [
                ["ID", "Name", "Email", "Status"],
                ["001", "John Doe", "john@email.com", { value: "VIP", style: "bg-gold-100 text-yellow-600 font-bold" }],
                ["002", "Jane Smith", "jane@email.com", { value: "Regular", style: "bg-gray-100 text-gray-600" }]
            ]
        },
        {
            name: "Financial Summary",
            hasHeaders: true,
            headerStyle: "bg-green-100 font-bold text-green-800",
            tabStyle: "bg-green-200 text-green-800 hover:bg-green-300",
            data: [
                ["Metric", "Q1", "Q2", "Q3", "Q4"],
                ["Revenue", "$100K", "$120K", "$150K", "$180K"],
                ["Profit", "$20K", "$25K", "$35K", "$45K"]
            ]
        }
    ];

    const handleDownload = (data, activeSheet) => {
        console.log('Downloading:', data[activeSheet]);
        alert(`Downloading ${data[activeSheet].name}`);
    };

    const handleCellClick = (row, col, data, address) => {
        console.log(`Cell clicked: ${address}`, { row, col, data });
    };

    const handleSheetChange = (sheetIndex, sheetData) => {
        console.log(`Sheet changed to: ${sheetData.name}`);
    };

    const config = {
        showDownloadButton: true,
        showCellAddress: true,
        showSheetInfo: true,
        maxHeight: "32rem",
        cellWidth: "min-w-40",
        theme: {
            primary: "emerald",
            headerBg: "slate-100",
            cellBorder: "slate-300",
            selectedCell: "emerald-100",
            selectedBorder: "emerald-400"
        },
        styling: {
            enableCellColors: true,
            enableTabColors: true,
            enableHeaderColors: true,
            enableBorders: true,
            enableHover: true
        }
    };

    return (
        <div className="space-y-8 p-4">
            <h1 className="text-2xl font-bold text-gray-800">Excel Preview Component Demo</h1>

            <ExcelPreview
                data={sampleData}
                config={config}
                onDownload={handleDownload}
                onCellClick={handleCellClick}
                onSheetChange={handleSheetChange}
                className="mb-8"
            />

            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Usage Example:</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<ExcelPreview
  data={yourData}
  config={{
    theme: { primary: "blue" },
    styling: { enableCellColors: true }
  }}
  onDownload={handleDownload}
  onCellClick={handleCellClick}
/>`}
        </pre>
            </div>
        </div>
    );
};

export default ExcelPreviewDemo;