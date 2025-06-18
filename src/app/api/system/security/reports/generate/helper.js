// // =============================================
// // THREAT INTELLIGENCE ANALYSIS FUNCTIONS
// // =============================================
//
// // =============================================
// // TOP THREATS ANALYSIS
// // =============================================
//
// export async function getTopThreats(startDate: string) {
//     try {
//         const endDate = new Date().toISOString();
//
//         // Get comprehensive threat data
//         const { data: threatData } = await supabaseAdmin
//             .from('security_request_logs')
//             .select(`
//         ip_address,
//         country,
//         threat_level,
//         risk_score,
//         signature_matches,
//         behavioral_flags,
//         threat_categories,
//         user_agent,
//         path,
//         created_at,
//         blocked
//       `)
//             .gte('created_at', startDate)
//             .lte('created_at', endDate)
//             .in('threat_level', ['medium', 'high', 'critical'])
//             .order('risk_score', { ascending: false });
//
//         if (!threatData || threatData.length === 0) {
//             return {
//                 overview: 'No significant threats detected during this period.',
//                 topThreatIPs: [],
//                 threatsByCategory: [],
//                 emergingThreats: [],
//                 threatEvolution: [],
//                 recommendations: ['Continue monitoring for potential threats']
//             };
//         }
//
//         // Analyze top threat IPs
//         const ipThreatMap = new Map();
//         threatData.forEach(threat => {
//             const ip = threat.ip_address;
//             if (!ipThreatMap.has(ip)) {
//                 ipThreatMap.set(ip, {
//                     ip_address: ip,
//                     country: threat.country,
//                     total_requests: 0,
//                     max_risk_score: 0,
//                     threat_categories: new Set(),
//                     signature_matches: new Set(),
//                     behavioral_flags: new Set(),
//                     user_agents: new Set(),
//                     target_paths: new Set(),
//                     first_seen: threat.created_at,
//                     last_seen: threat.created_at,
//                     blocked_count: 0,
//                     threat_levels: { low: 0, medium: 0, high: 0, critical: 0 }
//                 });
//             }
//
//             const threatInfo = ipThreatMap.get(ip);
//             threatInfo.total_requests++;
//             threatInfo.max_risk_score = Math.max(threatInfo.max_risk_score, threat.risk_score || 0);
//
//             // Collect threat indicators
//             (threat.threat_categories || []).forEach(cat => threatInfo.threat_categories.add(cat));
//             (threat.signature_matches || []).forEach(sig => threatInfo.signature_matches.add(sig));
//             (threat.behavioral_flags || []).forEach(flag => threatInfo.behavioral_flags.add(flag));
//
//             threatInfo.user_agents.add(threat.user_agent);
//             threatInfo.target_paths.add(threat.path);
//
//             if (new Date(threat.created_at) < new Date(threatInfo.first_seen)) {
//                 threatInfo.first_seen = threat.created_at;
//             }
//             if (new Date(threat.created_at) > new Date(threatInfo.last_seen)) {
//                 threatInfo.last_seen = threat.created_at;
//             }
//
//             if (threat.blocked) threatInfo.blocked_count++;
//             threatInfo.threat_levels[threat.threat_level]++;
//         });
//
//         // Convert sets to arrays and sort by risk
//         const topThreatIPs = Array.from(ipThreatMap.values())
//             .map(threat => ({
//                 ...threat,
//                 threat_categories: Array.from(threat.threat_categories),
//                 signature_matches: Array.from(threat.signature_matches),
//                 behavioral_flags: Array.from(threat.behavioral_flags),
//                 user_agents: Array.from(threat.user_agents),
//                 target_paths: Array.from(threat.target_paths),
//                 threat_diversity: threat.threat_categories.size + threat.signature_matches.size,
//                 persistence_score: calculatePersistenceScore(threat),
//                 sophistication_score: calculateSophisticationScore(threat)
//             }))
//             .sort((a, b) => b.max_risk_score - a.max_risk_score)
//             .slice(0, 20);
//
//         // Analyze threats by category
//         const categoryMap = new Map();
//         threatData.forEach(threat => {
//             (threat.threat_categories || ['unknown']).forEach(category => {
//                 if (!categoryMap.has(category)) {
//                     categoryMap.set(category, {
//                         category,
//                         count: 0,
//                         unique_ips: new Set(),
//                         avg_risk_score: 0,
//                         countries: new Set(),
//                         total_risk: 0,
//                         blocked_count: 0,
//                         recent_increase: false
//                     });
//                 }
//
//                 const catInfo = categoryMap.get(category);
//                 catInfo.count++;
//                 catInfo.unique_ips.add(threat.ip_address);
//                 catInfo.countries.add(threat.country);
//                 catInfo.total_risk += (threat.risk_score || 0);
//                 if (threat.blocked) catInfo.blocked_count++;
//             });
//         });
//
//         const threatsByCategory = Array.from(categoryMap.values())
//             .map(cat => ({
//                 ...cat,
//                 unique_ips: cat.unique_ips.size,
//                 countries: Array.from(cat.countries),
//                 avg_risk_score: Math.round(cat.total_risk / cat.count),
//                 block_rate: ((cat.blocked_count / cat.count) * 100).toFixed(1),
//                 geographic_spread: cat.countries.size
//             }))
//             .sort((a, b) => b.count - a.count);
//
//         // Identify emerging threats
//         const emergingThreats = await identifyEmergingThreats(threatData, startDate);
//
//         // Threat evolution analysis
//         const threatEvolution = await analyzeThreatEvolution(threatData, startDate);
//
//         return {
//             overview: generateThreatOverview(topThreatIPs, threatsByCategory),
//             topThreatIPs: topThreatIPs.slice(0, 10),
//             threatsByCategory,
//             emergingThreats,
//             threatEvolution,
//             totalThreats: threatData.length,
//             uniqueThreatIPs: ipThreatMap.size,
//             recommendations: generateThreatRecommendations(topThreatIPs, threatsByCategory, emergingThreats)
//         };
//
//     } catch (error) {
//         console.error('Failed to get top threats:', error);
//         throw new Error('Top threats analysis failed');
//     }
// }
//
// // =============================================
// // GEOGRAPHIC THREAT ANALYSIS
// // =============================================
//
// export async function getGeographicThreatAnalysis(startDate: string) {
//     try {
//         const endDate = new Date().toISOString();
//
//         // Get geographic threat data with IP intelligence
//         const { data: geoData } = await supabaseAdmin
//             .from('security_request_logs')
//             .select(`
//         ip_address,
//         country,
//         region,
//         city,
//         threat_level,
//         risk_score,
//         threat_categories,
//         blocked,
//         created_at
//       `)
//             .gte('created_at', startDate)
//             .lte('created_at', endDate)
//             .not('country', 'is', null);
//
//         if (!geoData || geoData.length === 0) {
//             return {
//                 overview: 'Insufficient geographic data for analysis.',
//                 countryAnalysis: [],
//                 regionAnalysis: [],
//                 threatMigration: [],
//                 riskAssessment: {}
//             };
//         }
//
//         // Analyze by country
//         const countryMap = new Map();
//         geoData.forEach(record => {
//             const country = record.country;
//             if (!countryMap.has(country)) {
//                 countryMap.set(country, {
//                     country,
//                     country_name: getCountryName(country),
//                     total_requests: 0,
//                     threat_requests: 0,
//                     unique_ips: new Set(),
//                     unique_cities: new Set(),
//                     risk_scores: [],
//                     threat_categories: new Set(),
//                     blocked_requests: 0,
//                     first_seen: record.created_at,
//                     last_seen: record.created_at,
//                     threat_levels: { low: 0, medium: 0, high: 0, critical: 0 }
//                 });
//             }
//
//             const countryInfo = countryMap.get(country);
//             countryInfo.total_requests++;
//
//             if (['medium', 'high', 'critical'].includes(record.threat_level)) {
//                 countryInfo.threat_requests++;
//                 countryInfo.threat_levels[record.threat_level]++;
//             }
//
//             countryInfo.unique_ips.add(record.ip_address);
//             if (record.city) countryInfo.unique_cities.add(record.city);
//             if (record.risk_score) countryInfo.risk_scores.push(record.risk_score);
//             (record.threat_categories || []).forEach(cat => countryInfo.threat_categories.add(cat));
//
//             if (record.blocked) countryInfo.blocked_requests++;
//
//             if (new Date(record.created_at) < new Date(countryInfo.first_seen)) {
//                 countryInfo.first_seen = record.created_at;
//             }
//             if (new Date(record.created_at) > new Date(countryInfo.last_seen)) {
//                 countryInfo.last_seen = record.created_at;
//             }
//         });
//
//         // Process country analysis
//         const countryAnalysis = Array.from(countryMap.values())
//             .map(country => ({
//                 ...country,
//                 unique_ips: country.unique_ips.size,
//                 unique_cities: country.unique_cities.size,
//                 threat_categories: Array.from(country.threat_categories),
//                 threat_density: (country.threat_requests / country.total_requests * 100).toFixed(2),
//                 avg_risk_score: country.risk_scores.length > 0 ?
//                     Math.round(country.risk_scores.reduce((a, b) => a + b, 0) / country.risk_scores.length) : 0,
//                 max_risk_score: country.risk_scores.length > 0 ? Math.max(...country.risk_scores) : 0,
//                 block_rate: (country.blocked_requests / country.total_requests * 100).toFixed(2),
//                 threat_sophistication: calculateThreatSophistication(country),
//                 coordinates: getCountryCoordinates(country.country)
//             }))
//             .sort((a, b) => b.threat_requests - a.threat_requests);
//
//         // Regional analysis
//         const regionMap = new Map();
//         geoData.forEach(record => {
//             if (!record.region) return;
//
//             const regionKey = `${record.country}-${record.region}`;
//             if (!regionMap.has(regionKey)) {
//                 regionMap.set(regionKey, {
//                     country: record.country,
//                     region: record.region,
//                     threat_requests: 0,
//                     unique_ips: new Set(),
//                     risk_scores: []
//                 });
//             }
//
//             const regionInfo = regionMap.get(regionKey);
//             if (['medium', 'high', 'critical'].includes(record.threat_level)) {
//                 regionInfo.threat_requests++;
//             }
//             regionInfo.unique_ips.add(record.ip_address);
//             if (record.risk_score) regionInfo.risk_scores.push(record.risk_score);
//         });
//
//         const regionAnalysis = Array.from(regionMap.values())
//             .map(region => ({
//                 ...region,
//                 unique_ips: region.unique_ips.size,
//                 avg_risk_score: region.risk_scores.length > 0 ?
//                     Math.round(region.risk_scores.reduce((a, b) => a + b, 0) / region.risk_scores.length) : 0
//             }))
//             .sort((a, b) => b.threat_requests - a.threat_requests)
//             .slice(0, 20);
//
//         // Threat migration analysis
//         const threatMigration = await analyzeThreatMigration(geoData, startDate);
//
//         // Risk assessment by geographic factors
//         const riskAssessment = {
//             highRiskCountries: countryAnalysis.filter(c => parseFloat(c.threat_density) > 10).slice(0, 10),
//             emergingRiskRegions: regionAnalysis.filter(r => r.avg_risk_score > 70).slice(0, 5),
//             globalThreatDistribution: calculateGlobalDistribution(countryAnalysis),
//             geopoliticalFactors: await assessGeopoliticalFactors(countryAnalysis)
//         };
//
//         return {
//             overview: generateGeographicOverview(countryAnalysis, riskAssessment),
//             countryAnalysis: countryAnalysis.slice(0, 30),
//             regionAnalysis,
//             threatMigration,
//             riskAssessment,
//             totalCountries: countryMap.size,
//             totalRegions: regionMap.size,
//             recommendations: generateGeographicRecommendations(countryAnalysis, riskAssessment)
//         };
//
//     } catch (error) {
//         console.error('Failed to get geographic threat analysis:', error);
//         throw new Error('Geographic threat analysis failed');
//     }
// }
//
// // =============================================
// // ATTACK PATTERN ANALYSIS
// // =============================================
//
// export async function getAttackPatternAnalysis(startDate: string) {
//     try {
//         const endDate = new Date().toISOString();
//
//         // Get attack pattern data
//         const { data: patternData } = await supabaseAdmin
//             .from('security_request_logs')
//             .select(`
//         ip_address,
//         user_agent,
//         path,
//         method,
//         threat_level,
//         signature_matches,
//         behavioral_flags,
//         threat_categories,
//         created_at,
//         response_status,
//         blocked
//       `)
//             .gte('created_at', startDate)
//             .lte('created_at', endDate)
//             .in('threat_level', ['low', 'medium', 'high', 'critical']);
//
//         if (!patternData || patternData.length === 0) {
//             return {
//                 overview: 'No attack patterns detected during this period.',
//                 attackSequences: [],
//                 methodologyAnalysis: [],
//                 temporalPatterns: [],
//                 targetingPatterns: []
//             };
//         }
//
//         // Analyze attack sequences
//         const attackSequences = await analyzeAttackSequences(patternData);
//
//         // Methodology analysis
//         const methodologyAnalysis = analyzeAttackMethodologies(patternData);
//
//         // Temporal patterns
//         const temporalPatterns = analyzeTemporalPatterns(patternData, startDate);
//
//         // Targeting patterns
//         const targetingPatterns = analyzeTargetingPatterns(patternData);
//
//         // Advanced pattern recognition
//         const advancedPatterns = await detectAdvancedPatterns(patternData);
//
//         return {
//             overview: generateAttackPatternOverview(attackSequences, methodologyAnalysis),
//             attackSequences: attackSequences.slice(0, 20),
//             methodologyAnalysis,
//             temporalPatterns,
//             targetingPatterns,
//             advancedPatterns,
//             totalAttacks: patternData.length,
//             uniqueAttackers: new Set(patternData.map(p => p.ip_address)).size,
//             recommendations: generateAttackPatternRecommendations(methodologyAnalysis, temporalPatterns)
//         };
//
//     } catch (error) {
//         console.error('Failed to analyze attack patterns:', error);
//         throw new Error('Attack pattern analysis failed');
//     }
// }
//
// // =============================================
// // INDICATORS OF COMPROMISE (IOC)
// // =============================================
//
// export async function getIndicatorsOfCompromise(startDate: string) {
//     try {
//         const endDate = new Date().toISOString();
//
//         // Get IOC data
//         const { data: iocData } = await supabaseAdmin
//             .from('security_request_logs')
//             .select(`
//         ip_address,
//         user_agent,
//         path,
//         method,
//         threat_level,
//         signature_matches,
//         threat_categories,
//         created_at,
//         blocked,
//         country
//       `)
//             .gte('created_at', startDate)
//             .lte('created_at', endDate)
//             .in('threat_level', ['high', 'critical']);
//
//         if (!iocData || iocData.length === 0) {
//             return {
//                 overview: 'No indicators of compromise detected.',
//                 ipIndicators: [],
//                 userAgentIndicators: [],
//                 pathIndicators: [],
//                 signatureIndicators: [],
//                 networkIndicators: []
//             };
//         }
//
//         // IP-based IOCs
//         const ipIndicators = await generateIPIndicators(iocData);
//
//         // User Agent IOCs
//         const userAgentIndicators = generateUserAgentIndicators(iocData);
//
//         // Path/URL IOCs
//         const pathIndicators = generatePathIndicators(iocData);
//
//         // Signature-based IOCs
//         const signatureIndicators = generateSignatureIndicators(iocData);
//
//         // Network behavior IOCs
//         const networkIndicators = await generateNetworkIndicators(iocData);
//
//         // IOC validation and scoring
//         const validatedIOCs = await validateIOCs({
//             ipIndicators,
//             userAgentIndicators,
//             pathIndicators,
//             signatureIndicators,
//             networkIndicators
//         });
//
//         return {
//             overview: generateIOCOverview(validatedIOCs),
//             ...validatedIOCs,
//             totalIOCs: Object.values(validatedIOCs).reduce((total, indicators) => total + indicators.length, 0),
//             highConfidenceIOCs: Object.values(validatedIOCs)
//                 .flat()
//                 .filter((ioc: any) => ioc.confidence >= 0.8).length,
//             recommendations: generateIOCRecommendations(validatedIOCs)
//         };
//
//     } catch (error) {
//         console.error('Failed to get indicators of compromise:', error);
//         throw new Error('IOC analysis failed');
//     }
// }
//
// // =============================================
// // HELPER FUNCTIONS FOR THREAT ANALYSIS
// // =============================================
//
// function calculatePersistenceScore(threat: any): number {
//     const timeSpan = new Date(threat.last_seen).getTime() - new Date(threat.first_seen).getTime();
//     const days = timeSpan / (1000 * 60 * 60 * 24);
//     const requestFrequency = threat.total_requests / Math.max(days, 1);
//
//     // Score based on persistence over time and request frequency
//     return Math.min(Math.round((days * 2) + (requestFrequency * 5)), 100);
// }
//
// function calculateSophisticationScore(threat: any): number {
//     let score = 0;
//
//     // Multiple attack vectors
//     score += threat.threat_categories.size * 10;
//
//     // Different user agents (evasion)
//     score += Math.min(threat.user_agents.size * 5, 25);
//
//     // Target diversity
//     score += Math.min(threat.target_paths.size * 2, 20);
//
//     // Advanced signatures
//     score += threat.signature_matches.size * 15;
//
//     // Behavioral complexity
//     score += threat.behavioral_flags.size * 10;
//
//     return Math.min(score, 100);
// }
//
// async function identifyEmergingThreats(threatData: any[], startDate: string): Promise<any[]> {
//     // Compare current period with previous period
//     const currentPeriodStart = new Date(startDate);
//     const periodLength = Date.now() - currentPeriodStart.getTime();
//     const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
//
//     try {
//         const { data: previousData } = await supabaseAdmin
//             .from('security_request_logs')
//             .select('threat_categories, signature_matches, ip_address')
//             .gte('created_at', previousPeriodStart.toISOString())
//             .lt('created_at', startDate)
//             .in('threat_level', ['medium', 'high', 'critical']);
//
//         // Find new threat patterns
//         const currentPatterns = new Set();
//         const currentIPs = new Set();
//
//         threatData.forEach(threat => {
//             (threat.threat_categories || []).forEach(cat => currentPatterns.add(cat));
//             (threat.signature_matches || []).forEach(sig => currentPatterns.add(sig));
//             currentIPs.add(threat.ip_address);
//         });
//
//         const previousPatterns = new Set();
//         const previousIPs = new Set();
//
//         (previousData || []).forEach(threat => {
//             (threat.threat_categories || []).forEach(cat => previousPatterns.add(cat));
//             (threat.signature_matches || []).forEach(sig => previousPatterns.add(sig));
//             previousIPs.add(threat.ip_address);
//         });
//
//         const emergingPatterns = Array.from(currentPatterns).filter(pattern =>
//             !previousPatterns.has(pattern)
//         );
//
//         const emergingIPs = Array.from(currentIPs).filter(ip =>
//             !previousIPs.has(ip)
//         );
//
//         return [
//             ...emergingPatterns.map(pattern => ({
//                 type: 'pattern',
//                 indicator: pattern,
//                 first_seen: startDate,
//                 confidence: 0.7,
//                 description: `New attack pattern detected: ${pattern}`
//             })),
//             ...emergingIPs.slice(0, 10).map(ip => ({
//                 type: 'ip',
//                 indicator: ip,
//                 first_seen: startDate,
//                 confidence: 0.6,
//                 description: `New threat IP detected: ${ip}`
//             }))
//         ];
//     } catch (error) {
//         return [];
//     }
// }
//
// async function analyzeThreatEvolution(threatData: any[], startDate: string): Promise<any[]> {
//     // Group threats by time periods
//     const timeWindows = groupByTimeWindows(threatData, startDate, 'day');
//
//     return Object.entries(timeWindows).map(([date, threats]) => ({
//         date,
//         total_threats: threats.length,
//         unique_ips: new Set(threats.map(t => t.ip_address)).size,
//         avg_risk_score: threats.reduce((sum, t) => sum + (t.risk_score || 0), 0) / threats.length,
//         top_categories: getTopCategories(threats, 3),
//         severity_distribution: {
//             low: threats.filter(t => t.threat_level === 'low').length,
//             medium: threats.filter(t => t.threat_level === 'medium').length,
//             high: threats.filter(t => t.threat_level === 'high').length,
//             critical: threats.filter(t => t.threat_level === 'critical').length
//         }
//     }));
// }
//
// function generateThreatOverview(topIPs: any[], categories: any[]): string {
//     const totalThreats = topIPs.reduce((sum, ip) => sum + ip.total_requests, 0);
//     const topCategory = categories[0];
//     const avgRisk = Math.round(topIPs.reduce((sum, ip) => sum + ip.max_risk_score, 0) / topIPs.length);
//
//     return `Threat analysis reveals ${totalThreats.toLocaleString()} malicious requests from ${topIPs.length} high-risk IP addresses.
// Primary attack vector: ${topCategory?.category || 'Mixed'} (${topCategory?.count || 0} incidents).
// Average risk score: ${avgRisk}/100. Most persistent attacker: ${topIPs[0]?.ip_address || 'N/A'}
// with ${topIPs[0]?.total_requests || 0} requests over ${calculateDurationDays(topIPs[0])} days.`;
// }
//
// function generateThreatRecommendations(topIPs: any[], categories: any[], emergingThreats: any[]): string[] {
//     const recommendations = [];
//
//     // IP-based recommendations
//     if (topIPs.length > 0) {
//         const persistentIPs = topIPs.filter(ip => ip.persistence_score > 50);
//         if (persistentIPs.length > 0) {
//             recommendations.push(`Block ${persistentIPs.length} persistent threat IPs immediately`);
//         }
//
//         const sophisticatedAttackers = topIPs.filter(ip => ip.sophistication_score > 70);
//         if (sophisticatedAttackers.length > 0) {
//             recommendations.push(`Enhanced monitoring for ${sophisticatedAttackers.length} sophisticated attackers`);
//         }
//     }
//
//     // Category-based recommendations
//     if (categories.length > 0) {
//         const topCategory = categories[0];
//         recommendations.push(`Strengthen defenses against ${topCategory.category} attacks (${topCategory.count} incidents)`);
//
//         if (categories.some(cat => cat.block_rate < 50)) {
//             recommendations.push('Improve blocking effectiveness for low-block-rate attack categories');
//         }
//     }
//
//     // Emerging threat recommendations
//     if (emergingThreats.length > 0) {
//         recommendations.push(`Investigate ${emergingThreats.length} emerging threat patterns`);
//     }
//
//     return recommendations;
// }
//
// // Geographic analysis helpers
// function getCountryName(countryCode: string): string {
//     const countryNames: Record<string, string> = {
//         'US': 'United States', 'CN': 'China', 'RU': 'Russia', 'DE': 'Germany',
//         'GB': 'United Kingdom', 'FR': 'France', 'JP': 'Japan', 'KR': 'South Korea',
//         'IN': 'India', 'BR': 'Brazil', 'CA': 'Canada', 'AU': 'Australia',
//         'NL': 'Netherlands', 'IT': 'Italy', 'ES': 'Spain', 'SE': 'Sweden'
//     };
//     return countryNames[countryCode] || countryCode;
// }
//
// function getCountryCoordinates(countryCode: string): { lat: number; lng: number } {
//     const coordinates: Record<string, { lat: number; lng: number }> = {
//         'US': { lat: 39.8283, lng: -98.5795 },
//         'CN': { lat: 35.8617, lng: 104.1954 },
//         'RU': { lat: 61.5240, lng: 105.3188 },
//         'DE': { lat: 51.1657, lng: 10.4515 },
//         'GB': { lat: 55.3781, lng: -3.4360 },
//         'FR': { lat: 46.2276, lng: 2.2137 },
//         'JP': { lat: 36.2048, lng: 138.2529 },
//         'IN': { lat: 20.5937, lng: 78.9629 }
//     };
//     return coordinates[countryCode] || { lat: 0, lng: 0 };
// }
//
// function calculateThreatSophistication(country: any): number {
//     let score = 0;
//
//     // Category diversity
//     score += country.threat_categories.size * 15;
//
//     // Geographic spread within country
//     score += country.unique_cities * 5;
//
//     // IP diversity
//     score += Math.min(country.unique_ips * 2, 30);
//
//     // Evasion (lower block rate = higher sophistication)
//     const blockRate = parseFloat(country.block_rate);
//     score += (100 - blockRate) * 0.3;
//
//     return Math.min(Math.round(score), 100);
// }
//
// async function analyzeThreatMigration(geoData: any[], startDate: string): Promise<any[]> {
//     // Group by time periods and analyze geographic shifts
//     const timeWindows = groupByTimeWindows(geoData, startDate, 'hour');
//     const migration = [];
//
//     const windows = Object.keys(timeWindows).sort();
//     for (let i = 1; i < windows.length; i++) {
//         const prevWindow = timeWindows[windows[i-1]];
//         const currWindow = timeWindows[windows[i]];
//
//         const prevCountries = new Set(prevWindow.map(r => r.country));
//         const currCountries = new Set(currWindow.map(r => r.country));
//
//         const newCountries = Array.from(currCountries).filter(c => !prevCountries.has(c));
//         const lostCountries = Array.from(prevCountries).filter(c => !currCountries.has(c));
//
//         if (newCountries.length > 0 || lostCountries.length > 0) {
//             migration.push({
//                 timeWindow: windows[i],
//                 newCountries,
//                 lostCountries,
//                 migrationScore: newCountries.length + lostCountries.length
//             });
//         }
//     }
//
//     return migration.slice(0, 20);
// }
//
// function calculateGlobalDistribution(countryAnalysis: any[]): any {
//     const total = countryAnalysis.reduce((sum, country) => sum + country.threat_requests, 0);
//
//     return {
//         concentration: countryAnalysis.slice(0, 5).reduce((sum, country) => sum + country.threat_requests, 0) / total,
//         diversity: countryAnalysis.length,
//         topContributor: countryAnalysis[0],
//         distribution: countryAnalysis.map(country => ({
//             country: country.country,
//             percentage: (country.threat_requests / total * 100).toFixed(2)
//         })).slice(0, 10)
//     };
// }
//
// async function assessGeopoliticalFactors(countryAnalysis: any[]): Promise<any> {
//     // Basic geopolitical risk assessment
//     const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
//     const sanctionedCountries = ['RU', 'IR', 'KP'];
//
//     const geopoliticalRisks = countryAnalysis
//         .filter(country => highRiskCountries.includes(country.country))
//         .map(country => ({
//             country: country.country,
//             threat_requests: country.threat_requests,
//             risk_level: sanctionedCountries.includes(country.country) ? 'high' : 'medium',
//             concerns: generateGeopoliticalConcerns(country.country)
//         }));
//
//     return {
//         highRiskActivity: geopoliticalRisks,
//         totalHighRiskRequests: geopoliticalRisks.reduce((sum, risk) => sum + risk.threat_requests, 0),
//         recommendations: geopoliticalRisks.length > 0 ? [
//             'Consider enhanced monitoring for geopolitically sensitive regions',
//             'Implement country-specific blocking policies',
//             'Report suspicious activity from high-risk nations'
//         ] : []
//     };
// }
//
// function generateGeopoliticalConcerns(countryCode: string): string[] {
//     const concerns: Record<string, string[]> = {
//         'CN': ['State-sponsored activity', 'IP theft', 'Economic espionage'],
//         'RU': ['Cyber warfare', 'Ransomware operations', 'Infrastructure targeting'],
//         'KP': ['Limited internet access', 'State-controlled activity'],
//         'IR': ['Regional conflict', 'Sanctions evasion']
//     };
//     return concerns[countryCode] || [];
// }
//
// // Attack pattern analysis helpers
// async function analyzeAttackSequences(patternData: any[]): Promise<any[]> {
//     // Group by IP and analyze request sequences
//     const ipSequences = new Map();
//
//     patternData.forEach(attack => {
//         const ip = attack.ip_address;
//         if (!ipSequences.has(ip)) {
//             ipSequences.set(ip, []);
//         }
//         ipSequences.get(ip).push(attack);
//     });
//
//     const sequences = [];
//     for (const [ip, attacks] of ipSequences) {
//         if (attacks.length < 3) continue; // Need minimum sequence length
//
//         attacks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//
//         const sequence = {
//             ip_address: ip,
//             attack_count: attacks.length,
//             duration_minutes: (new Date(attacks[attacks.length - 1].created_at).getTime() -
//                 new Date(attacks[0].created_at).getTime()) / (1000 * 60),
//             sequence_pattern: attacks.map(a => `${a.method}:${a.path.split('/')[1] || 'root'}`),
//             escalation_detected: detectEscalation(attacks),
//             persistence_score: calculateSequencePersistence(attacks),
//             techniques: [...new Set(attacks.flatMap(a => a.threat_categories || []))]
//         };
//
//         sequences.push(sequence);
//     }
//
//     return sequences.sort((a, b) => b.persistence_score - a.persistence_score);
// }
//
// function analyzeAttackMethodologies(patternData: any[]): any[] {
//     const methodologies = new Map();
//
//     patternData.forEach(attack => {
//         (attack.threat_categories || []).forEach(category => {
//             if (!methodologies.has(category)) {
//                 methodologies.set(category, {
//                     methodology: category,
//                     total_attempts: 0,
//                     unique_ips: new Set(),
//                     common_paths: new Map(),
//                     user_agents: new Set(),
//                     success_indicators: 0,
//                     blocked_attempts: 0
//                 });
//             }
//
//             const method = methodologies.get(category);
//             method.total_attempts++;
//             method.unique_ips.add(attack.ip_address);
//             method.user_agents.add(attack.user_agent);
//
//             const path = attack.path;
//             method.common_paths.set(path, (method.common_paths.get(path) || 0) + 1);
//
//             if (attack.response_status && [200, 301, 302].includes(attack.response_status)) {
//                 method.success_indicators++;
//             }
//
//             if (attack.blocked) {
//                 method.blocked_attempts++;
//             }
//         });
//     });
//
//     return Array.from(methodologies.values()).map(method => ({
//         ...method,
//         unique_ips: method.unique_ips.size,
//         user_agents: method.user_agents.size,
//         common_paths: Array.from(method.common_paths.entries())
//             .sort(([,a], [,b]) => b - a)
//             .slice(0, 5)
//             .map(([path, count]) => ({ path, count })),
//         success_rate: (method.success_indicators / method.total_attempts * 100).toFixed(2),
//         block_rate: (method.blocked_attempts / method.total_attempts * 100).toFixed(2)
//     })).sort((a, b) => b.total_attempts - a.total_attempts);
// }
//
// function analyzeTemporalPatterns(patternData: any[], startDate: string): any {
//     const hourlyDistribution = new Array(24).fill(0);
//     const dailyDistribution = new Array(7).fill(0);
//     const weeklyTrends = new Map();
//
//     patternData.forEach(attack => {
//         const date = new Date(attack.created_at);
//         const hour = date.getHours();
//         const dayOfWeek = date.getDay();
//         const week = getWeekNumber(date);
//
//         hourlyDistribution[hour]++;
//         dailyDistribution[dayOfWeek]++;
//         weeklyTrends.set(week, (weeklyTrends.get(week) || 0) + 1);
//     });
//
//     const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
//     const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));
//
//     return {
//         hourlyDistribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
//         dailyDistribution: dailyDistribution.map((count, day) => ({
//             day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
//             count
//         })),
//         peakActivity: {
//             hour: peakHour,
//             day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][peakDay]
//         },
//         weeklyTrends: Array.from(weeklyTrends.entries()).map(([week, count]) => ({ week, count })),
//         insights: generateTemporalInsights(hourlyDistribution, dailyDistribution)
//     };
// }
//
// function analyzeTargetingPatterns(patternData: any[]): any {
//     const pathTargets = new Map();
//     const endpointCategories = new Map();
//
//     patternData.forEach(attack => {
//         const path = attack.path;
//         pathTargets.set(path, (pathTargets.get(path) || 0) + 1);
//
//         // Categorize endpoints
//         const category = categorizeEndpoint(path);
//         endpointCategories.set(category, (endpointCategories.get(category) || 0) + 1);
//     });
//
//     return {
//         topTargets: Array.from(pathTargets.entries())
//             .sort(([,a], [,b]) => b - a)
//             .slice(0, 20)
//             .map(([path, count]) => ({ path, count, category: categorizeEndpoint(path) })),
//
//         categoryDistribution: Array.from(endpointCategories.entries())
//             .sort(([,a], [,b]) => b - a)
//             .map(([category, count]) => ({ category, count })),
//
//         insights: generateTargetingInsights(pathTargets, endpointCategories)
//     };
// }
//
// async function detectAdvancedPatterns(patternData: any[]): Promise<any[]> {
//     const advancedPatterns = [];
//
//     // Detect coordinated attacks
//     const coordinatedAttacks = detectCoordinatedAttacks(patternData);
//     if (coordinatedAttacks.length > 0) {
//         advancedPatterns.push({
//             type: 'coordinated_attack',
//             pattern: 'Multiple IPs targeting same endpoints simultaneously',
//             indicators: coordinatedAttacks,
//             severity: 'high'
//         });
//     }
//
//     // Detect slow-burn attacks
//     const slowBurnAttacks = detectSlowBurnAttacks(patternData);
//     if (slowBurnAttacks.length > 0) {
//         advancedPatterns.push({
//             type: 'slow_burn',
//             pattern: 'Low-frequency persistent attacks to avoid detection',
//             indicators: slowBurnAttacks,
//             severity: 'medium'
//         });
//     }
//
//     // Detect polymorphic attacks
//     const polymorphicAttacks = detectPolymorphicAttacks(patternData);
//     if (polymorphicAttacks.length > 0) {
//         advancedPatterns.push({
//             type: 'polymorphic',
//             pattern: 'Rapidly changing attack signatures',
//             indicators: polymorphicAttacks,
//             severity: 'high'
//         });
//     }
//
//     return advancedPatterns;
// }
//
// // IOC generation helpers
// async function generateIPIndicators(iocData: any[]): Promise<any[]> {
//     const ipMap = new Map();
//
//     iocData.forEach(record => {
//         const ip = record.ip_address;
//         if (!ipMap.has(ip)) {
//             ipMap.set(ip, {
//                 indicator: ip,
//                 type: 'ip',
//                 threat_count: 0,
//                 countries: new Set(),
//                 first_seen: record.created_at,
//                 last_seen: record.created_at,
//                 threat_categories: new Set(),
//                 confidence: 0
//             });
//         }
//
//         const indicator = ipMap.get(ip);
//         indicator.threat_count++;
//         indicator.countries.add(record.country);
//         indicator.threat_categories.add(...(record.threat_categories || []));
//
//         if (new Date(record.created_at) > new Date(indicator.last_seen)) {
//             indicator.last_seen = record.created_at;
//         }
//     });
//
//     return Array.from(ipMap.values()).map(indicator => ({
//         ...indicator,
//         countries: Array.from(indicator.countries),
//         threat_categories: Array.from(indicator.threat_categories),
//         confidence: calculateIOCConfidence(indicator, 'ip'),
//         description: `Malicious IP with ${indicator.threat_count} threat events`
//     })).filter(ioc => ioc.confidence >= 0.5);
// }
//
// function generateUserAgentIndicators(iocData: any[]): any[] {
//     const userAgentMap = new Map();
//
//     iocData.forEach(record => {
//         const ua = record.user_agent;
//         if (!ua || ua.length < 10) return; // Skip short/empty user agents
//
//         if (!userAgentMap.has(ua)) {
//             userAgentMap.set(ua, {
//                 indicator: ua,
//                 type: 'user_agent',
//                 threat_count: 0,
//                 unique_ips: new Set(),
//                 threat_categories: new Set()
//             });
//         }
//
//         const indicator = userAgentMap.get(ua);
//         indicator.threat_count++;
//         indicator.unique_ips.add(record.ip_address);
//         indicator.threat_categories.add(...(record.threat_categories || []));
//     });
//
//     return Array.from(userAgentMap.values())
//         .map(indicator => ({
//             ...indicator,
//             unique_ips: indicator.unique_ips.size,
//             threat_categories: Array.from(indicator.threat_categories),
//             confidence: calculateIOCConfidence(indicator, 'user_agent'),
//             description: `Suspicious user agent used in ${indicator.threat_count} attacks`
//         }))
//         .filter(ioc => ioc.confidence >= 0.6)
//         .sort((a, b) => b.confidence - a.confidence)
//         .slice(0, 50);
// }
//
// function generatePathIndicators(iocData: any[]): any[] {
//     const pathMap = new Map();
//
//     iocData.forEach(record => {
//         const path = record.path;
//         if (!pathMap.has(path)) {
//             pathMap.set(path, {
//                 indicator: path,
//                 type: 'path',
//                 threat_count: 0,
//                 unique_ips: new Set(),
//                 methods: new Set(),
//                 threat_categories: new Set()
//             });
//         }
//
//         const indicator = pathMap.get(path);
//         indicator.threat_count++;
//         indicator.unique_ips.add(record.ip_address);
//         indicator.methods.add(record.method);
//         indicator.threat_categories.add(...(record.threat_categories || []));
//     });
//
//     return Array.from(pathMap.values())
//         .map(indicator => ({
//             ...indicator,
//             unique_ips: indicator.unique_ips.size,
//             methods: Array.from(indicator.methods),
//             threat_categories: Array.from(indicator.threat_categories),
//             confidence: calculateIOCConfidence(indicator, 'path'),
//             description: `Malicious path targeted by ${indicator.unique_ips} IPs`
//         }))
//         .filter(ioc => ioc.confidence >= 0.7)
//         .sort((a, b) => b.threat_count - a.threat_count)
//         .slice(0, 30);
// }
//
// function generateSignatureIndicators(iocData: any[]): any[] {
//     const signatureMap = new Map();
//
//     iocData.forEach(record => {
//         (record.signature_matches || []).forEach(signature => {
//             if (!signatureMap.has(signature)) {
//                 signatureMap.set(signature, {
//                     indicator: signature,
//                     type: 'signature',
//                     match_count: 0,
//                     unique_ips: new Set(),
//                     threat_categories: new Set()
//                 });
//             }
//
//             const indicator = signatureMap.get(signature);
//             indicator.match_count++;
//             indicator.unique_ips.add(record.ip_address);
//             indicator.threat_categories.add(...(record.threat_categories || []));
//         });
//     });
//
//     return Array.from(signatureMap.values())
//         .map(indicator => ({
//             ...indicator,
//             unique_ips: indicator.unique_ips.size,
//             threat_categories: Array.from(indicator.threat_categories),
//             confidence: 0.95, // Signatures are high confidence
//             description: `Threat signature detected ${indicator.match_count} times`
//         }))
//         .sort((a, b) => b.match_count - a.match_count);
// }
//
// async function generateNetworkIndicators(iocData: any[]): Promise<any[]> {
//     // Analyze network behavior patterns
//     const networkPatterns = [];
//
//     // High-frequency bursts
//     const ipTimestamps = new Map();
//     iocData.forEach(record => {
//         const ip = record.ip_address;
//         if (!ipTimestamps.has(ip)) {
//             ipTimestamps.set(ip, []);
//         }
//         ipTimestamps.get(ip).push(new Date(record.created_at).getTime());
//     });
//
//     for (const [ip, timestamps] of ipTimestamps) {
//         if (timestamps.length < 10) continue;
//
//         timestamps.sort((a, b) => a - b);
//         const bursts = detectBurstPattern(timestamps);
//
//         if (bursts.length > 0) {
//             networkPatterns.push({
//                 indicator: ip,
//                 type: 'network_behavior',
//                 pattern: 'high_frequency_burst',
//                 burst_count: bursts.length,
//                 max_frequency: Math.max(...bursts.map(b => b.frequency)),
//                 confidence: 0.8,
//                 description: `IP exhibiting ${bursts.length} high-frequency attack bursts`
//             });
//         }
//     }
//
//     return networkPatterns.slice(0, 20);
// }
//
// async function validateIOCs(iocs: any): Promise<any> {
//     // Additional validation and confidence scoring
//     const validated = {};
//
//     for (const [category, indicators] of Object.entries(iocs)) {
//         validated[category] = indicators.filter((ioc: any) => ioc.confidence >= 0.5);
//     }
//
//     return validated;
// }
//
// // Additional helper functions
// function groupByTimeWindows(data: any[], startDate: string, granularity: 'hour' | 'day'): Record<string, any[]> {
//     const windows: Record<string, any[]> = {};
//
//     data.forEach(item => {
//         const date = new Date(item.created_at);
//         let key: string;
//
//         if (granularity === 'hour') {
//             key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
//         } else {
//             key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
//         }
//
//         if (!windows[key]) {
//             windows[key] = [];
//         }
//         windows[key].push(item);
//     });
//
//     return windows;
// }
//
// function getTopCategories(threats: any[], limit: number): string[] {
//     const categoryCount = new Map();
//
//     threats.forEach(threat => {
//         (threat.threat_categories || []).forEach(category => {
//             categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
//         });
//     });
//
//     return Array.from(categoryCount.entries())
//         .sort(([,a], [,b]) => b - a)
//         .slice(0, limit)
//         .map(([category]) => category);
// }
//
// function calculateDurationDays(threat: any): number {
//     if (!threat || !threat.first_seen || !threat.last_seen) return 0;
//
//     const start = new Date(threat.first_seen).getTime();
//     const end = new Date(threat.last_seen).getTime();
//     return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
// }
//
// function getWeekNumber(date: Date): number {
//     const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
//     const dayNum = d.getUTCDay() || 7;
//     d.setUTCDate(d.getUTCDate() + 4 - dayNum);
//     const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
//     return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
// }
//
// function calculateIOCConfidence(indicator: any, type: string): number {
//     let confidence = 0;
//
//     switch (type) {
//         case 'ip':
//             confidence = Math.min(0.3 + (indicator.threat_count * 0.1), 1.0);
//             if (indicator.countries.size > 3) confidence += 0.1; // Multiple countries suspicious
//             break;
//         case 'user_agent':
//             confidence = Math.min(0.4 + (indicator.unique_ips * 0.05), 1.0);
//             if (indicator.indicator.toLowerCase().includes('bot') ||
//                 indicator.indicator.toLowerCase().includes('crawler')) {
//                 confidence += 0.2;
//             }
//             break;
//         case 'path':
//             confidence = Math.min(0.5 + (indicator.unique_ips * 0.03), 1.0);
//             if (indicator.indicator.includes('..') || indicator.indicator.includes('%')) {
//                 confidence += 0.2;
//             }
//             break;
//     }
//
//     return Math.min(confidence, 1.0);
// }
//
// // Pattern detection functions
// function detectEscalation(attacks: any[]): boolean {
//     if (attacks.length < 3) return false;
//
//     const riskScores = attacks.map(a => a.risk_score || 0);
//     const increasing = riskScores.slice(1).every((score, i) => score >= riskScores[i]);
//
//     return increasing && (riskScores[riskScores.length - 1] - riskScores[0]) > 30;
// }
//
// function calculateSequencePersistence(attacks: any[]): number {
//     const timeSpan = new Date(attacks[attacks.length - 1].created_at).getTime() -
//         new Date(attacks[0].created_at).getTime();
//     const hours = timeSpan / (1000 * 60 * 60);
//     const attacksPerHour = attacks.length / Math.max(hours, 1);
//
//     return Math.min(Math.round(attacksPerHour * 10 + (attacks.length * 2)), 100);
// }
//
// function categorizeEndpoint(path: string): string {
//     if (path.includes('/api/')) return 'API';
//     if (path.includes('/admin')) return 'Admin';
//     if (path.includes('/login') || path.includes('/auth')) return 'Authentication';
//     if (path.includes('/upload') || path.includes('/file')) return 'File Operations';
//     if (path.includes('/.') || path.includes('..')) return 'System Files';
//     if (path.includes('/wp-') || path.includes('/wordpress')) return 'WordPress';
//     return 'Other';
// }
//
// export function detectCoordinatedAttacks(patternData: any[]): any[] {
//     // Simple coordinated attack detection
//     const timeWindows = groupByTimeWindows(patternData, '', 'hour');
//     const coordinated = [];
//
//     Object.entries(timeWindows).forEach(([window, attacks]) => {
//         if (attacks.length < 10) return;
//
//         const uniqueIPs = new Set(attacks.map(a => a.ip_address));
//         const targetPaths = new Set(attacks.map(a => a.path));
//
//         if (uniqueIPs.size >= 5 && targetPaths.size <= 3) {
//             coordinated.push({
//                 timeWindow: window,
//                 attackerCount: uniqueIPs.size,
//                 targetCount: targetPaths.size,
//                 totalAttacks: attacks.length
//             });
//         }
//     });
//
//     return coordinated;
// }
//
// export function detectSlowBurnAttacks(patternData: any[]): any[] {
//     // Detect persistent low-frequency attacks
//     const ipAttacks = new Map();
//
//     patternData.forEach(attack => {
//         const ip = attack.ip_address;
//         if (!ipAttacks.has(ip)) {
//             ipAttacks.set(ip, []);
//         }
//         ipAttacks.get(ip).push(attack);
//     });
//
//     const slowBurn = [];
//     for (const [ip, attacks] of ipAttacks) {
//         if (attacks.length < 5 || attacks.length > 50) continue;
//
//         attacks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//
//         const timeSpan = new Date(attacks[attacks.length - 1].created_at).getTime() -
//             new Date(attacks[0].created_at).getTime();
//         const hours = timeSpan / (1000 * 60 * 60);
//
//         if (hours > 24 && attacks.length / hours < 1) { // Less than 1 attack per hour over 24+ hours
//             slowBurn.push({
//                 ip_address: ip,
//                 duration_hours: Math.round(hours),
//                 attack_count: attacks.length,
//                 frequency: attacks.length / hours
//             });
//         }
//     }
//
//     return slowBurn;
// }
//
// export function detectPolymorphicAttacks(patternData: any[]): any[] {
//     // Detect rapidly changing attack signatures
//     const ipSignatures = new Map();
//
//     patternData.forEach(attack => {
//         const ip = attack.ip_address;
//         if (!ipSignatures.has(ip)) {
//             ipSignatures.set(ip, new Set());
//         }
//         (attack.signature_matches || []).forEach(sig => {
//             ipSignatures.get(ip).add(sig);
//         });
//     });
//
//     const polymorphic = [];
//     for (const [ip, signatures] of ipSignatures) {
//         if (signatures.size >= 5) { // 5+ different signatures
//             polymorphic.push({
//                 ip_address: ip,
//                 signature_variety: signatures.size,
//                 signatures: Array.from(signatures)
//             });
//         }
//     }
//
//     return polymorphic;
// }
//
// export function detectBurstPattern(timestamps: number[]): any[] {
//     const bursts = [];
//     const windowSize = 5 * 60 * 1000; // 5 minutes
//
//     for (let i = 0; i < timestamps.length; i++) {
//         const windowStart = timestamps[i];
//         const windowEnd = windowStart + windowSize;
//         const windowRequests = timestamps.filter(t => t >= windowStart && t <= windowEnd);
//
//         if (windowRequests.length >= 20) { // 20+ requests in 5 minutes
//             bursts.push({
//                 start: windowStart,
//                 end: windowEnd,
//                 frequency: windowRequests.length
//             });
//         }
//     }
//
//     return bursts;
// }
//
// export function generateGeographicOverview(countryAnalysis: any[], riskAssessment: any): string {
//     const totalCountries = countryAnalysis.length;
//     const topThreat = countryAnalysis[0];
//     const highRiskCount = riskAssessment.highRiskCountries?.length || 0;
//
//     return `Geographic analysis reveals threat activity from ${totalCountries} countries.
// Primary threat source: ${topThreat?.country_name || 'Unknown'} with ${topThreat?.threat_requests || 0} malicious requests
// (${topThreat?.threat_density || 0}% threat density). ${highRiskCount} countries classified as high-risk based on
// geopolitical factors and attack sophistication. Global threat distribution shows
// ${riskAssessment.globalThreatDistribution?.concentration ?
//         `${(riskAssessment.globalThreatDistribution.concentration * 100).toFixed(1)}% concentration` : 'distributed pattern'}
// in top 5 source countries.`;
// }
//
// export function generateGeographicRecommendations(countryAnalysis: any[], riskAssessment: any): string[] {
//     const recommendations = [];
//
//     if (riskAssessment.highRiskCountries?.length > 0) {
//         recommendations.push(`Consider geo-blocking or enhanced monitoring for ${riskAssessment.highRiskCountries.length} high-risk countries`);
//     }
//
//     const highDensityCountries = countryAnalysis.filter(c => parseFloat(c.threat_density) > 20);
//     if (highDensityCountries.length > 0) {
//         recommendations.push(`Implement stricter controls for ${highDensityCountries.length} countries with >20% threat density`);
//     }
//
//     if (riskAssessment.globalThreatDistribution?.concentration > 0.7) {
//         recommendations.push('Threats are highly concentrated - consider targeted blocking of top source countries');
//     }
//
//     recommendations.push(
//         'Regularly update geographic threat intelligence feeds',
//         'Monitor for unusual geographic patterns that may indicate new campaigns',
//         'Correlate geographic data with threat intelligence reports'
//     );
//
//     return recommendations;
// }
//
// export function generateAttackPatternOverview(sequences: any[], methodologies: any[]): string {
//     const totalSequences = sequences.length;
//     const topMethod = methodologies[0];
//     const avgPersistence = sequences.reduce((sum, seq) => sum + seq.persistence_score, 0) / totalSequences || 0;
//
//     return `Attack pattern analysis identified ${totalSequences} distinct attack sequences with average persistence score of ${Math.round(avgPersistence)}.
// Primary attack methodology: ${topMethod?.methodology || 'Mixed'} with ${topMethod?.total_attempts || 0} attempts
// and ${topMethod?.success_rate || 0}% apparent success rate. Most persistent sequence: ${sequences[0]?.duration_minutes || 0} minutes
// with ${sequences[0]?.attack_count || 0} coordinated attempts.`;
// }
//
// export function generateAttackPatternRecommendations(methodologies: any[], temporalPatterns: any): string[] {
//     const recommendations = [];
//
//     if (methodologies.length > 0) {
//         const topMethod = methodologies[0];
//         if (parseFloat(topMethod.success_rate) > 10) {
//             recommendations.push(`Address ${topMethod.methodology} attacks - showing ${topMethod.success_rate}% success rate`);
//         }
//     }
//
//     if (temporalPatterns.peakActivity) {
//         recommendations.push(`Increase monitoring during peak attack hours (${temporalPatterns.peakActivity.hour}:00 on ${temporalPatterns.peakActivity.day}s)`);
//     }
//
//     recommendations.push(
//         'Implement sequence-based detection rules for persistent attackers',
//         'Correlate attack patterns with threat intelligence feeds',
//         'Develop automated response for detected attack sequences'
//     );
//
//     return recommendations;
// }
//
// export function generateTemporalInsights(hourlyDist: number[], dailyDist: number[]): string[] {
//     const insights = [];
//
//     const nightHours = hourlyDist.slice(0, 6).reduce((a, b) => a + b, 0);
//     const dayHours = hourlyDist.slice(6, 18).reduce((a, b) => a + b, 0);
//
//     if (nightHours > dayHours * 1.5) {
//         insights.push('Attacks predominantly occur during night hours (00:00-06:00)');
//     }
//
//     const weekdays = dailyDist.slice(1, 6).reduce((a, b) => a + b, 0);
//     const weekends = dailyDist[0] + dailyDist[6];
//
//     if (weekends > weekdays) {
//         insights.push('Higher attack volume during weekends');
//     } else if (weekdays > weekends * 2) {
//         insights.push('Attacks primarily target business hours and weekdays');
//     }
//
//     return insights;
// }
//
// export function generateTargetingInsights(pathTargets: Map<string, number>, categories: Map<string, number>): string[] {
//     const insights = [];
//
//     const apiTargets = Array.from(pathTargets.keys()).filter(path => path.includes('/api/')).length;
//     const adminTargets = Array.from(pathTargets.keys()).filter(path => path.includes('/admin')).length;
//
//     if (apiTargets > pathTargets.size * 0.3) {
//         insights.push('API endpoints are primary attack targets');
//     }
//
//     if (adminTargets > 0) {
//         insights.push('Administrative interfaces under active attack');
//     }
//
//     const topCategory = Array.from(categories.entries()).sort(([,a], [,b]) => b - a)[0];
//     if (topCategory && topCategory[1] > Array.from(categories.values()).reduce((a, b) => a + b, 0) * 0.4) {
//         insights.push(`${topCategory[0]} endpoints heavily targeted`);
//     }
//
//     return insights;
// }
//
// export function generateIOCOverview(iocs: any): string {
//     const totalIOCs = Object.values(iocs).reduce((total: number, indicators: any) => total + indicators.length, 0);
//     const highConfidence = Object.values(iocs)
//         .flat()
//         .filter((ioc: any) => ioc.confidence >= 0.8).length;
//
//     return `Indicators of Compromise analysis identified ${totalIOCs} distinct IOCs with ${highConfidence} high-confidence indicators.
// IP indicators: ${iocs.ipIndicators?.length || 0}, User-Agent patterns: ${iocs.userAgentIndicators?.length || 0},
// Malicious paths: ${iocs.pathIndicators?.length || 0}, Attack signatures: ${iocs.signatureIndicators?.length || 0}.
// These IOCs can be used for proactive blocking and threat hunting.`;
// }
//
// function generateIOCRecommendations(iocs: any): string[] {
//     const recommendations = [];
//
//     if (iocs.ipIndicators?.length > 0) {
//         recommendations.push(`Add ${iocs.ipIndicators.length} malicious IPs to blocklist`);
//     }
//
//     if (iocs.userAgentIndicators?.length > 0) {
//         recommendations.push(`Update WAF rules to block ${iocs.userAgentIndicators.length} suspicious user agents`);
//     }
//
//     if (iocs.pathIndicators?.length > 0) {
//         recommendations.push(`Implement path-based blocking for ${iocs.pathIndicators.length} malicious endpoints`);
//     }
//
//     recommendations.push(
//         'Share IOCs with threat intelligence platforms',
//         'Implement automated IOC ingestion and blocking',
//         'Regular IOC validation and cleanup procedures'
//     );
//
//     return recommendations;
// }