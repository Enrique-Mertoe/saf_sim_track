import {SerialNumber} from "@/app/dashboard/pick/types";

type SerialWithLot = { serial: string, lot: string };

export function extractSerialsWithLots(text: string): SerialWithLot[] {
    const serialsWithLots: Array<{ serial: string, lot: string }> = [];

    // Split by lot number pattern - this creates sections where each section starts with a lot
    // const sections = text.split(/<<\s*(\d+\s*_[A-Z0-9\-]+)\s*>>/i);
    // const sections = text.split(/<<\s*(\d+[-_][A-Z0-9\-]+)\s*>>/i);
    const sections = text.split(/<<\s*(\d+\s*[-_][A-Z0-9\-]+)\s*>>/i);


    // Process sections in pairs (lot number, content)
    for (let i = 1; i < sections.length; i += 2) {
        const lotNumber = sections[i].trim(); // The captured lot number

        const content = sections[i + 1] || '';
        const serialsToParse = content
            .split(/[\s,;]+/)
            .filter(Boolean)
            .map(s => s.trim())
            .filter(serial => serial.length >= 16 && !isNaN(Number(serial)))
            .map(serial => ({serial, lot: lotNumber}));
        serialsWithLots.push(...serialsToParse);
    }
    return serialsWithLots;
}

export function groupSerialsByLot(serials: SerialNumber[]) {
    const grouped: Record<string, string[]> = {};
    // Group serials by lot
    for (const {value: serial, lot} of serials) {
        if (!grouped[lot]) grouped[lot] = [];
        grouped[lot].push(serial);
    }

    return Object.entries(grouped).map(([lot, serialList]) => {
        const sorted = serialList.sort();
        return {
            lot,
            boxNumber: "lot-" + lot,
            startRange: sorted[0],
            endRange: sorted[sorted.length - 1],
            count: sorted.length,
            serials: sorted,
        };
    });
}
