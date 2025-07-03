"use client"

interface Directive {
  name: string;
  type: 'query' | 'display' | 'navigation' | 'action' | 'automation';
  value: string;
  caption: string;
  model?: string;
  filters?: Record<string, any>;
  columns?: string[];
  params?: Record<string, any>;
}

interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

class DirectiveEngine {
  private supabase: any;
  private router: any;

  constructor(supabase: any, router: any) {
    this.supabase = supabase;
    this.router = router;
  }

  async executeDirective(directive: Directive): Promise<ExecutionResult> {
    try {
      switch (directive.type) {
        case 'query':
          return await this.executeQuery(directive);
        case 'display':
          return await this.executeDisplay(directive);
        case 'navigation':
          return await this.executeNavigation(directive);
        case 'action':
          return await this.executeAction(directive);
        case 'automation':
          return await this.executeAutomation(directive);
        default:
          throw new Error(`Unknown directive type: ${directive.type}`);
      }
    } catch (error) {
      console.error('Directive execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async executeQuery(directive: Directive): Promise<ExecutionResult> {
    if (!directive.model) {
      throw new Error('Model is required for query directives');
    }

    let query = this.supabase.from(directive.model);

    // Apply filters
    if (directive.filters) {
      Object.entries(directive.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle range queries, like { gte: 100, lte: 1000 }
          Object.entries(value).forEach(([operator, operatorValue]) => {
            query = query[operator](key, operatorValue);
          });
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Select specific columns
    if (directive.columns && directive.columns.length > 0) {
      query = query.select(directive.columns.join(','));
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      success: true,
      data,
      metadata: {
        model: directive.model,
        filters: directive.filters,
        columns: directive.columns,
        recordCount: data?.length || 0
      }
    };
  }

  private async executeDisplay(directive: Directive): Promise<ExecutionResult> {
    // Display directives are typically handled by the UI components
    // This method could trigger UI state updates or prepare data for display
    
    return {
      success: true,
      data: {
        displayType: directive.params?.type || 'table',
        content: directive.value,
        params: directive.params
      },
      metadata: {
        displayDirective: true
      }
    };
  }

  private async executeNavigation(directive: Directive): Promise<ExecutionResult> {
    const route = directive.params?.route || directive.value;
    
    if (!route) {
      throw new Error('Route is required for navigation directives');
    }

    // Use Next.js router for navigation
    if (this.router) {
      this.router.push(route);
    }

    return {
      success: true,
      data: { navigatedTo: route },
      metadata: {
        navigationType: 'client-side',
        route
      }
    };
  }

  private async executeAction(directive: Directive): Promise<ExecutionResult> {
    const action = directive.params?.action;
    const target = directive.params?.target;
    const data = directive.params?.data;

    if (!action || !target) {
      throw new Error('Action and target are required for action directives');
    }

    let result;

    switch (action) {
      case 'create':
        result = await this.supabase.from(target).insert(data);
        break;
      case 'update':
        const updateFilters = directive.params?.where || {};
        result = await this.supabase.from(target).update(data).match(updateFilters);
        break;
      case 'delete':
        const deleteFilters = directive.params?.where || {};
        result = await this.supabase.from(target).delete().match(deleteFilters);
        break;
      case 'approve':
      case 'reject':
        result = await this.supabase
          .from(target)
          .update({ status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
          .match(directive.params?.where || {});
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (result.error) {
      throw new Error(`Action failed: ${result.error.message}`);
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        action,
        target,
        affectedRecords: result.data?.length || 0
      }
    };
  }

  private async executeAutomation(directive: Directive): Promise<ExecutionResult> {
    const element = directive.params?.element;
    const value = directive.value || directive.params?.value;

    if (!element) {
      throw new Error('Element selector is required for automation directives');
    }

    // Find the element and fill it with the value
    const targetElement = document.querySelector(element) as HTMLInputElement;
    
    if (!targetElement) {
      throw new Error(`Element not found: ${element}`);
    }

    // Fill the element based on its type
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
      targetElement.value = value;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      targetElement.dispatchEvent(event);
    } else if (targetElement.tagName === 'SELECT') {
      //@ts-ignore
      (targetElement as HTMLSelectElement).value = value;
      
      const event = new Event('change', { bubbles: true });
      targetElement.dispatchEvent(event);
    }

    return {
      success: true,
      data: {
        element,
        value,
        filled: true
      },
      metadata: {
        automationType: 'form-fill',
        element,
        value
      }
    };
  }

  // Batch execute multiple directives
  async executeDirectives(directives: Directive[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const directive of directives) {
      const result = await this.executeDirective(directive);
      results.push(result);
      
      // If a directive fails and it's critical, stop execution
      if (!result.success && directive.params?.critical) {
        break;
      }
    }

    return results;
  }

  // Utility method to validate directive structure
  validateDirective(directive: Directive): boolean {
    const requiredFields = ['name', 'type', 'caption'];
    
    for (const field of requiredFields) {
      if (!directive[field as keyof Directive]) {
        return false;
      }
    }

    // Type-specific validation
    switch (directive.type) {
      case 'query':
        return !!directive.model;
      case 'navigation':
        return !!(directive.value || directive.params?.route);
      case 'action':
        return !!(directive.params?.action && directive.params?.target);
      case 'automation':
        return !!directive.params?.element;
      default:
        return true;
    }
  }
}

export default DirectiveEngine;
export type { Directive, ExecutionResult };