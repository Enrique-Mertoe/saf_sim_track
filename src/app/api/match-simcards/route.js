// app/api/match-simcards/route.js
import {NextResponse} from 'next/server';
// Import your database connection/ORM here
// import { db } from '@/lib/database';

export async function POST(request) {
    try {
        const {serials} = await request.json();

        if (!serials || !Array.isArray(serials)) {
            return NextResponse.json({error: 'Invalid serials array'}, {status: 400});
        }

        // Query database to match serials
        // Replace this with your actual database query
        const matchedSimCards = []

        // Separate matched and unmatched serials
        const matchedSerials = matchedSimCards.map(card => card.serialNumber);
        const unmatchedSerials = serials.filter(serial => !matchedSerials.includes(serial));

        // Check which ones can be assigned (not already assigned)
        const availableForAssignment = matchedSimCards.filter(card => !card.assignedTo);
        const alreadyAssigned = matchedSimCards.filter(card => card.assignedTo);

        return NextResponse.json({
            success: true,
            matched: matchedSimCards,
            availableForAssignment,
            alreadyAssigned,
            unmatched: unmatchedSerials,
            summary: {
                total: serials.length,
                matched: matchedSimCards.length,
                available: availableForAssignment.length,
                assigned: alreadyAssigned.length,
                unmatched: unmatchedSerials.length
            }
        });

    } catch (error) {
        console.error('Error matching SIM cards:', error);
        return NextResponse.json(
            {error: 'Failed to match SIM cards'},
            {status: 500}
        );
    }
}