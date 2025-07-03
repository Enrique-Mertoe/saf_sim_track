import {makeResponse, parseDateToYMD} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMStatus, User} from "@/models";
import {DateTime} from "luxon";
import simService from "@/services/simService";
import {supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";
import {DatabaseRecord, SafaricomRecord} from "@/app/dashboard/report/types";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";

class SimplifiedReportActions {
  /**
   * Process a single chunk synchronously (no background tasks)
   * This is called by the frontend processor for each chunk
   */
  static async sync_single_chunk(data: { 
    simSerialNumbers: string[], 
    records: SafaricomRecord[] 
  }) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      const { simSerialNumbers, records } = data;

      // Validate chunk size (keep it reasonable for sync processing)
      if (simSerialNumbers.length > 200) {
        return makeResponse({ 
          error: "Chunk too large. Maximum 200 records per chunk." 
        });
      }

      console.log(`Processing sync chunk: ${simSerialNumbers.length} serials, ${records.length} records`);

      // Create records map for fast lookup
      const recordMap = new Map(
        records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
      );

      // Fetch database records for this chunk
      const databaseRecords = await SimplifiedReportActions.fetchDatabaseChunk(
        user, 
        simSerialNumbers
      );

      let processedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each record in the chunk
      for (const dbRecord of databaseRecords) {
        const sourceRecord = recordMap.get(dbRecord.simSerialNumber);
        if (!sourceRecord) {
          processedCount++;
          continue;
        }

        try {
          const success = await SimplifiedReportActions.updateSingleRecord(
            dbRecord, 
            sourceRecord, 
            user
          );
          
          if (success) {
            processedCount++;
          } else {
            errorCount++;
            errors.push(`Failed to update ${dbRecord.simSerialNumber}`);
          }
        } catch (error) {
          errorCount++;
          //@ts-ignore
          errors.push(`Error processing ${dbRecord.simSerialNumber}: ${error.message}`);
          console.error(`Error processing record ${dbRecord.simSerialNumber}:`, error);
        }
      }

      // Handle unmatched serials (those not found in database)
      const matchedSerials = new Set(databaseRecords.map(r => r.simSerialNumber));
      const unmatchedCount = simSerialNumbers.filter(serial => !matchedSerials.has(serial)).length;
      processedCount += unmatchedCount;

      return makeResponse({
        ok: true,
        data: {
          processedCount,
          errorCount,
          errors: errors.slice(0, 10), // Limit error list
          totalInChunk: simSerialNumbers.length,
          matchedRecords: databaseRecords.length,
          unmatchedRecords: unmatchedCount
        },
        message: `Chunk processed: ${processedCount}/${simSerialNumbers.length} records`
      });

    } catch (error) {
      console.error("Chunk processing error:", error);
      return makeResponse({
        //@ts-ignore
        error: `Chunk processing failed: ${error.message}` 
      });
    }
  }

  /**
   * Fetch database records for a chunk of serial numbers
   */
  private static async fetchDatabaseChunk(
    user: User, 
    simSerialNumbers: string[]
  ): Promise<DatabaseRecord[]> {
    try {
      const { data, error } = await simService.getSimCardsBySerialBatch(
        user, 
        simSerialNumbers, 
        supabaseAdmin
      );

      if (error || !data) {
        console.warn(`Database fetch failed:`, error);
        return [];
      }

      const simData = data as any[];
      return simData.map((sim) => ({
        simSerialNumber: sim.serial_number,
        simId: sim.id,
        team: sim.team_id?.name || 'Unknown',
        uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
        createdAt: new Date(sim.created_at).toISOString(),
      }));

    } catch (error) {
      console.error(`Error fetching database chunk:`, error);
      return [];
    }
  }

  /**
   * Update a single SIM record
   */
  private static async updateSingleRecord(
    dbRecord: DatabaseRecord,
    sourceRecord: SafaricomRecord,
    user: User
  ): Promise<boolean> {
    try {
      const isQuality = sourceRecord.quality === "Y";
      const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;

      // Fetch current SIM state
      const { data: existingSim, error: fetchError } = await simService.DB
        .from('sim_cards')
        .select('status, activation_date, registered_on, usage')
        .eq('id', dbRecord.simId)
        .single();

      if (fetchError || !existingSim) {
        console.warn(`Failed to fetch SIM ${dbRecord.simId}:`, fetchError);
        return false;
      }

      // Prepare update fields
      const updateFields: any = {
        match: SIMStatus.MATCH,
        quality: qualityStatus,
        top_up_amount: +sourceRecord.topUpAmount || null,
        usage: +sourceRecord.cumulativeUsage || null
      };

      const parsedDate = parseDateToYMD(sourceRecord.dateId);

      if (!existingSim.activation_date) {
        updateFields.activation_date = parsedDate;
      }

      if (!existingSim.registered_on && sourceRecord.tmDate) {
        const date = new Date(sourceRecord.tmDate);
        updateFields.registered_on = date.toISOString().split('T')[0];
      }

      if (existingSim.status !== SIMStatus.ACTIVATED) {
        updateFields.status = SIMStatus.ACTIVATED;
      }

      // Update the SIM record if there are changes
      if (Object.keys(updateFields).length > 0) {
        await simService.updateSIMCard(dbRecord.simId, updateFields, user);
      }

      return true;

    } catch (error) {
      console.error(`Error updating SIM ${dbRecord.simId}:`, error);
      return false;
    }
  }

  /**
   * Generate Excel report (existing functionality, no changes needed)
   */
  static async generate_excel_report(data: any) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      const { startDate, endDate } = data;

      // Fetch SIM cards data with date filters
      const simCards = await SimplifiedReportActions.fetchSimCards(user, startDate, endDate);

      // Process the data for the report
      const processedReport = await SimplifiedReportActions.processReportData(simCards, user);
      
      const cols = [
        { header: 'Serial', key: 'simSerialNumber', width: 25 },
        { header: 'Team', key: 'team', width: 25 },
        { header: 'Activation Date', key: 'activationDate', width: 18 },
        { header: 'Top Up Date', key: 'topUpDate', width: 15 },
        { header: 'Top Up Amount', key: 'topUpAmount', width: 15 },
        { header: 'Usage', key: 'cumulativeUsage', width: 15 },
        { header: 'BA', key: 'ba', width: 15 },
        { header: 'Till/Mobigo', key: 'mobigo', width: 15 },
        { header: 'Quality', key: 'quality', width: 15 },
      ];
      
      const report = await generateTeamReports(processedReport as any, cols);
      
      return makeResponse({
        ok: true,
        data: {
          buffer: Buffer.from(report.rawData).toString('base64'),
          summary: {
            totalRecords: processedReport.matchedCount,
            qualityCount: processedReport.qualityCount,
            teamCount: processedReport.teamReports.length
          }
        },
        message: "Excel report generated successfully"
      });
    } catch (error) {
      console.error("Error generating Excel report:", error);
      return makeResponse({ error: (error as Error).message });
    }
  }

  /**
   * Fetch database records for final UI display (used after sync completion)
   */
  static async fetch_database_records(data: { simSerialNumbers: string[] }) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      const { simSerialNumbers } = data;
      const batchSize = 500;
      const results: DatabaseRecord[] = [];
      const totalBatches = Math.ceil(simSerialNumbers.length / batchSize);

      console.log(`Fetching ${simSerialNumbers.length} database records in ${totalBatches} batches`);

      for (let i = 0; i < simSerialNumbers.length; i += batchSize) {
        const batchIndex = Math.floor(i / batchSize);
        const batch = simSerialNumbers.slice(i, i + batchSize);

        try {
          const { data, error } = await simService.getSimCardsBySerialBatch(
            user, 
            batch, 
            supabaseAdmin
          );
          
          if (error || !data) {
            console.warn(`Batch ${batchIndex} failed:`, error);
            continue;
          }
          
          const simData = data as any[];
          const batchMatches = simData.map((sim) => ({
            simSerialNumber: sim.serial_number,
            simId: sim.id,
            team: sim.team_id?.name || 'Unknown',
            uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
            createdAt: new Date(sim.created_at).toISOString(),
          }));

          results.push(...batchMatches);
          
          // Small delay between batches
          if (batchIndex < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error processing batch ${batchIndex}:`, error);
        }
      }

      return makeResponse({
        ok: true,
        data: { databaseRecords: results },
        message: "Database records fetched successfully"
      });

    } catch (e) {
      console.error("Database fetch error:", e);
      return makeResponse({ error: (e as Error).message });
    }
  }

  /**
   * Health check endpoint to verify API is working
   */
  static async health_check() {
    return makeResponse({
      ok: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0-simplified'
      },
      message: "API is healthy"
    });
  }

  // Helper methods (same as before but simplified)
  private static async fetchSimCards(user: User, startDate: string, endDate: string, filters: any[] = []) {
    const dateStart = DateTime.fromISO(startDate).startOf('day');
    const dateEnd = DateTime.fromISO(endDate).endOf('day');

    return await new Promise<any[]>((resolve) => {
      const cards: any = [];
      simService.streamChunks(user, (simCards, end) => {
        cards.push(...simCards);
        if (end) {
          resolve(cards.map((sim: any) => ({
            simSerialNumber: sim.serial_number,
            dateId: sim.created_at,
            topUpAmount: sim.top_up_amount,
            bundleAmount: '-',
            bundlePurchaseDate: '-',
            agentMSISDN: '-',
            ba: sim.ba_msisdn,
            mobigo: sim.mobigo,
            team_id: sim.team_id,
            cumulativeUsage: parseFloat(sim.usage ?? '') || 0,
            quality: sim.quality === SIMStatus.QUALITY ? 'Y' : 'N',
          })));
        }
      }, {
        filters: [
          ["activation_date", "not", "is", null],
          ["status", SIMStatus.ACTIVATED],
          ["activation_date", "gte", dateStart.toISO()],
          ["activation_date", "lte", dateEnd.toISO()],
          ...filters
        ]
      });
    });
  }

  private static async processReportData(simCards: any[], user: User) {
    const teamGroups: { [teamName: string]: { quality: any[]; nonQuality: any[] } } = {};
    const unknownSims: any[] = [];

    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('*, users!leader_id(*)')
      .eq('admin_id', await admin_id(user));

    const teamMap = new Map<string, string>();
    for (const team of teams ?? []) {
      teamMap.set(team.id, team.name);
    }

    for (const sim of simCards) {
      const teamName = teamMap.get(sim.team_id) || 'Unknown';
      sim.team = teamName;

      if (teamName === 'Unknown') {
        unknownSims.push(sim);
      } else {
        if (!teamGroups[teamName]) {
          teamGroups[teamName] = { quality: [], nonQuality: [] };
        }

        if (sim.quality === SIMStatus.QUALITY) {
          teamGroups[teamName].quality.push(sim);
        } else {
          teamGroups[teamName].nonQuality.push(sim);
        }
      }
    }

    const teamReports = Object.entries(teamGroups).map(([teamName, data]) => {
      const qualityCount = data.quality.length;
      const nonQualityCount = data.nonQuality.length;
      const totalCount = qualityCount + nonQualityCount;

      return {
        teamName,
        records: [...data.quality, ...data.nonQuality].filter(r => r.quality == "N"),
        qualityCount,
        matchedCount: totalCount
      };
    });

    if (unknownSims.length > 0) {
      teamReports.push({
        teamName: 'Unknown',
        records: unknownSims,
        qualityCount: 0,
        matchedCount: unknownSims.length
      });
    }

    const totalQualityCount = teamReports.reduce((sum, team) => sum + team.qualityCount, 0);
    const totalMatchedCount = teamReports.reduce((sum, team) => sum + team.matchedCount, 0);

    return {
      rawRecords: simCards,
      teamReports,
      qualityCount: totalQualityCount,
      matchedCount: totalMatchedCount
    };
  }

  static async builder(target: string, data: any) {
    try {
      const action = (SimplifiedReportActions as any)[target];
      if (typeof action === 'function') {
        return await action(data);
      } else {
        throw new Error(`Action '${target}' is not a function`);
      }
    } catch (error) {
      return makeResponse({ error: (error as Error).message });
    }
  }
}

export default SimplifiedReportActions;