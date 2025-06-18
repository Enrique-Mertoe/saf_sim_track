#!/bin/bash

# Security Module Structure Generator
# This script creates the complete folder structure and files for a Next.js security module

echo "Creating security module structure..."

# Create main directories
mkdir -p src/app/security/{dashboard,incidents/{[id],new},analytics/{threats,performance},settings/{rules,alerts,integrations}}
mkdir -p src/app/api/security/{dashboard,analytics/{threats,geographic,timeline,export},monitoring/{realtime,stream,health},threats/{detect,classify,response},incidents/{[id],timeline},blocking/{ip,batch,whitelist},alerts/{webhooks,notifications},reports/{generate,scheduled,export}}
mkdir -p src/components/security/{dashboard,analytics,incidents,monitoring,blocking,alerts,reports,common}
mkdir -p src/lib/security/{core,detection,monitoring,analysis,response,integration,storage,utils}
mkdir -p src/hooks/security
mkdir -p src/types/security
mkdir -p src/middleware/security
mkdir -p src/config/security

echo "Creating app pages and layouts..."

# App pages and layouts
touch src/app/security/dashboard/{page.tsx,loading.tsx,error.tsx,layout.tsx}
touch src/app/security/incidents/{page.tsx,[id]/page.tsx,new/page.tsx}
touch src/app/security/analytics/{page.tsx,threats/page.tsx,performance/page.tsx}
touch src/app/security/settings/{page.tsx,rules/page.tsx,alerts/page.tsx,integrations/page.tsx}

echo "Creating API routes..."

# API routes
touch src/app/api/security/dashboard/route.ts
touch src/app/api/security/analytics/{threats/route.ts,geographic/route.ts,timeline/route.ts,export/route.ts}
touch src/app/api/security/monitoring/{realtime/route.ts,stream/route.ts,health/route.ts}
touch src/app/api/security/threats/{detect/route.ts,classify/route.ts,response/route.ts}
touch src/app/api/security/incidents/{route.ts,[id]/route.ts,timeline/route.ts}
touch src/app/api/security/blocking/{ip/route.ts,batch/route.ts,whitelist/route.ts}
touch src/app/api/security/alerts/{route.ts,webhooks/route.ts,notifications/route.ts}
touch src/app/api/security/reports/{generate/route.ts,scheduled/route.ts,export/route.ts}

echo "Creating dashboard components..."

# Dashboard components
touch src/components/security/dashboard/{SecurityOverview.tsx,ThreatMap.tsx,RealTimeMonitor.tsx,SecurityMetrics.tsx,ThreatTimeline.tsx,AlertsPanel.tsx,QuickActions.tsx,SystemHealth.tsx}

echo "Creating analytics components..."

# Analytics components
touch src/components/security/analytics/{ThreatAnalytics.tsx,TrafficAnalytics.tsx,PerformanceCharts.tsx,GeographicAnalysis.tsx,TrendAnalysis.tsx,AttackVectorAnalysis.tsx}

echo "Creating incident components..."

# Incident components
touch src/components/security/incidents/{IncidentList.tsx,IncidentDetails.tsx,IncidentForm.tsx,IncidentTimeline.tsx,IncidentWorkflow.tsx}

echo "Creating monitoring components..."

# Monitoring components
touch src/components/security/monitoring/{LiveEventStream.tsx,RequestAnalyzer.tsx,ThreatClassifier.tsx,PatternDetector.tsx,AnomalyDetector.tsx}

echo "Creating blocking components..."

# Blocking components
touch src/components/security/blocking/{IPManager.tsx,BlockingRules.tsx,WhitelistManager.tsx,BatchOperations.tsx}

echo "Creating alert components..."

# Alert components
touch src/components/security/alerts/{AlertManager.tsx,NotificationCenter.tsx,AlertRules.tsx,EscalationMatrix.tsx}

echo "Creating report components..."

# Report components
touch src/components/security/reports/{ReportBuilder.tsx,ScheduledReports.tsx,ExportManager.tsx,ReportTemplates.tsx}

echo "Creating common components..."

# Common components
touch src/components/security/common/{SecurityCard.tsx,ThreatBadge.tsx,SecurityChart.tsx,DataTable.tsx,FilterPanel.tsx,LoadingStates.tsx,ErrorBoundary.tsx}

echo "Creating core library files..."

# Core library
touch src/lib/security/core/{threat-engine.ts,pattern-matcher.ts,anomaly-detector.ts,risk-calculator.ts,response-engine.ts}

echo "Creating detection library files..."

# Detection library
touch src/lib/security/detection/{signatures.ts,behavioral.ts,ml-models.ts,reputation.ts,geolocation.ts}

echo "Creating monitoring library files..."

# Monitoring library
touch src/lib/security/monitoring/{request-logger.ts,metrics-collector.ts,event-streamer.ts,health-monitor.ts,performance-tracker.ts}

echo "Creating analysis library files..."

# Analysis library
touch src/lib/security/analysis/{traffic-analyzer.ts,trend-detector.ts,correlation-engine.ts,forecasting.ts,benchmarking.ts}

echo "Creating response library files..."

# Response library
touch src/lib/security/response/{blocking-engine.ts,rate-limiter.ts,challenge-system.ts,traffic-shaper.ts,incident-manager.ts}

echo "Creating integration library files..."

# Integration library
touch src/lib/security/integration/{webhook-manager.ts,slack-notifier.ts,email-alerts.ts,sms-alerts.ts,external-apis.ts}

echo "Creating storage library files..."

# Storage library
touch src/lib/security/storage/{supabase-client.ts,cache-manager.ts,data-retention.ts,backup-system.ts,encryption.ts}

echo "Creating utility library files..."

# Utils library
touch src/lib/security/utils/{validators.ts,sanitizers.ts,formatters.ts,exporters.ts,helpers.ts}

echo "Creating custom hooks..."

# Hooks
touch src/hooks/security/{useSecurityData.ts,useRealTimeEvents.ts,useThreatAnalytics.ts,useIncidentManager.ts,useSecurityMetrics.ts,useAlertSystem.ts,useExportData.ts,useSecuritySettings.ts}

echo "Creating type definitions..."

# Types
touch src/types/security/{core.ts,threats.ts,incidents.ts,analytics.ts,alerts.ts,monitoring.ts,api.ts}

echo "Creating middleware..."

# Middleware
touch src/middleware/security/{request-interceptor.ts,threat-detector.ts,rate-limiter.ts,ip-blocker.ts,logger.ts}

echo "Creating configuration files..."

# Config
touch src/config/security/{detection-rules.ts,response-policies.ts,alert-templates.ts,integration-config.ts,performance-thresholds.ts}

echo ""
echo "✅ Security module structure created successfully!"
echo ""
echo "📁 Created directories:"
echo "   - App pages and API routes"
echo "   - React components organized by feature"
echo "   - Core security libraries"
echo "   - Custom hooks for data management"
echo "   - TypeScript type definitions"
echo "   - Security middleware"
echo "   - Configuration files"
echo ""
echo "📄 Total files created: $(find src -name "*.ts" -o -name "*.tsx" | wc -l)"
echo ""
echo "🚀 Ready to start implementing your security module!"