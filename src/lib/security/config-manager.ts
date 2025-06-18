import {supabaseAdmin} from '@/lib/security/supabase-client';
// =============================================
// CONFIGURATION MANAGEMENT SYSTEM
// =============================================

// lib/security/config-manager.ts
export class SecurityConfigManager {
    private static instance: SecurityConfigManager;
    private configCache = new Map<string, any>();
    private cacheExpiry = new Map<string, number>();

    static getInstance(): SecurityConfigManager {
        if (!SecurityConfigManager.instance) {
            SecurityConfigManager.instance = new SecurityConfigManager();
        }
        return SecurityConfigManager.instance;
    }

    async getConfig(key: string, defaultValue?: any): Promise<any> {
        // Check cache first
        if (this.configCache.has(key) && Date.now() < (this.cacheExpiry.get(key) || 0)) {
            return this.configCache.get(key);
        }

        try {
            const { data, error } = await supabaseAdmin
                .from('security_config')
                .select('value')
                .eq('key', key)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found is OK
                throw error;
            }

            const value = data?.value || defaultValue;

            // Cache for 5 minutes
            this.configCache.set(key, value);
            this.cacheExpiry.set(key, Date.now() + 300000);

            return value;
        } catch (error) {
            console.error(`Failed to get config ${key}:`, error);
            return defaultValue;
        }
    }

    async setConfig(key: string, value: any, description?: string, category?: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin
                .from('security_config')
                .upsert({
                    key,
                    value,
                    description,
                    category,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Update cache
            this.configCache.set(key, value);
            this.cacheExpiry.set(key, Date.now() + 300000);
        } catch (error) {
            console.error(`Failed to set config ${key}:`, error);
            throw error;
        }
    }

    async getAllConfig(category?: string): Promise<Record<string, any>> {
        try {
            let query = supabaseAdmin.from('security_config').select('key, value, description, category');

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) throw error;

            const config: Record<string, any> = {};
            data?.forEach(item => {
                config[item.key] = item.value;
            });

            return config;
        } catch (error) {
            console.error('Failed to get all config:', error);
            return {};
        }
    }

    async resetToDefaults(): Promise<void> {
        const defaultConfigs = [
            {
                key: 'global.rate_limit.requests_per_minute',
                value: 60,
                description: 'Global rate limit per IP',
                category: 'rate_limiting'
            },
            {
                key: 'global.rate_limit.burst_size',
                value: 10,
                description: 'Burst allowance',
                category: 'rate_limiting'
            },
            {
                key: 'blocking.auto_block_threshold',
                value: 10,
                description: 'Auto-block after X high-threat requests',
                category: 'blocking'
            },
            {
                key: 'blocking.default_block_duration_hours',
                value: 24,
                description: 'Default block duration',
                category: 'blocking'
            },
            {
                key: 'alerts.email_enabled',
                value: true,
                description: 'Enable email notifications',
                category: 'alerting'
            },
            {
                key: 'monitoring.retention_days',
                value: 90,
                description: 'Data retention period',
                category: 'monitoring'
            }
        ];

        for (const config of defaultConfigs) {
            await this.setConfig(config.key, config.value, config.description, config.category);
        }

        // Clear cache
        this.configCache.clear();
        this.cacheExpiry.clear();
    }
}

export const configManager = SecurityConfigManager.getInstance();
