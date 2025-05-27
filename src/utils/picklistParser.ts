import {BatchMetadataCreate} from "@/models";

/**
 * Extracts metadata from picklist text
 * @param text The picklist text to parse
 * @param batchId The batch ID to associate with the metadata
 * @param teamId The team ID to associate with the metadata
 * @param userId The user ID of the creator
 * @returns BatchMetadataCreate object with extracted metadata
 */
export function parsePicklistText(
    text: string,
    batchId: string,
    teamId: string,
    userId: string
): BatchMetadataCreate {
    // Initialize the metadata object
    const metadata: BatchMetadataCreate = {
        batch_id: batchId,
        team_id: teamId,
        created_by_user_id: userId,
        lot_numbers: []
    };

    // Clean up the text
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    
    // Extract order number
    const orderNoMatch = cleanText.match(/Order No\s*:?\s*(\d+)/i);
    if (orderNoMatch && orderNoMatch[1]) {
        metadata.order_number = orderNoMatch[1].trim();
    }
    
    // Extract requisition number
    const reqNoMatch = cleanText.match(/Requisition No\s*:?\s*(\d+)/i);
    if (reqNoMatch && reqNoMatch[1]) {
        metadata.requisition_number = reqNoMatch[1].trim();
    }
    
    // Extract company name
    const companyMatch = cleanText.match(/Requisition No\s*:?\s*\d+\s+([A-Z\s]+LIMITED)/i);
    if (companyMatch && companyMatch[1]) {
        metadata.company_name = companyMatch[1].trim();
    }
    
    // Extract collection point
    const collectionMatch = cleanText.match(/Collection Point\s*:?\s*([A-Z0-9\s]+)/i);
    if (collectionMatch && collectionMatch[1]) {
        metadata.collection_point = collectionMatch[1].trim();
    }
    
    // Extract move order number
    const moveOrderMatch = cleanText.match(/Move Order Number\s*:?\s*(\d+)/i);
    if (moveOrderMatch && moveOrderMatch[1]) {
        metadata.move_order_number = moveOrderMatch[1].trim();
    }
    
    // Extract date created
    const dateMatch = cleanText.match(/Date Created\s*:?\s*(\d{2}-[A-Z]{3}-\d{2})/i);
    if (dateMatch && dateMatch[1]) {
        metadata.date_created = dateMatch[1].trim();
    }
    
    // Extract lot numbers
    const lotMatches = cleanText.matchAll(/<<(\d+\s*_[A-Z0-9]+)>>/g);
    for (const match of lotMatches) {
        if (match[1]) {
            metadata.lot_numbers!.push(match[1].trim());
        }
    }
    
    // Extract item description
    const descMatch = cleanText.match(/Description\s*:?\s*([A-Z0-9\s]+Safaricom[A-Z0-9\s]+)/i);
    if (descMatch && descMatch[1]) {
        metadata.item_description = descMatch[1].trim();
    }
    
    // Extract quantity
    const quantityMatch = cleanText.match(/Quantity\s*:?\s*(\d+\.?\d*)/i);
    if (quantityMatch && quantityMatch[1]) {
        metadata.quantity = parseFloat(quantityMatch[1].trim());
    }
    
    return metadata;
}

/**
 * Attempts to detect if the provided text is a picklist
 * @param text The text to check
 * @returns true if the text appears to be a picklist, false otherwise
 */
export function isPicklist(text: string): boolean {
    // Check for key picklist indicators
    const indicators = [
        /Order No\s*:?\s*\d+/i,
        /Requisition No\s*:?\s*\d+/i,
        /Collection Point/i,
        /Move Order Number/i,
        /Date Created/i,
        /<<Lot>>/i,
        /Serial Numbers/i
    ];
    
    // Count how many indicators are present
    let matchCount = 0;
    for (const regex of indicators) {
        if (regex.test(text)) {
            matchCount++;
        }
    }
    
    // If at least 3 indicators are present, consider it a picklist
    return matchCount >= 3;
}

/**
 * Counts the number of serial numbers in the picklist text
 * @param text The picklist text
 * @returns The estimated number of serial numbers
 */
export function countSerialNumbers(text: string): number {
    // Look for patterns that look like serial numbers (16+ digit numbers)
    const serialMatches = text.match(/\b\d{16,}\b/g);
    return serialMatches ? serialMatches.length : 0;
}

export default {
    parsePicklistText,
    isPicklist,
    countSerialNumbers
};