const toolRegistry = require('./tool-registry');

class ToolExecutor {
    constructor() {
        this.registry = toolRegistry;
        this.executionHistory = [];
        this.maxHistory = 100;
    }

    validateParameters(toolName, params = {}) {
        const tool = this.registry.getTool(toolName);
        if (!tool) {
            return {
                valid: false,
                error: `Tool "${toolName}" not found`
            };
        }

        const paramSchema = tool.parameters;
        if (!paramSchema || !paramSchema.properties) {
            return { valid: true, params: {} };
        }

        const errors = [];
        const validatedParams = {};

        for (const [paramName, schema] of Object.entries(paramSchema.properties)) {
            const value = params[paramName];

            if (value === undefined) {
                if (paramSchema.required && paramSchema.required.includes(paramName)) {
                    errors.push(`Missing required parameter: ${paramName}`);
                }
                continue;
            }

            const type = schema.type;
            if (type === 'integer' || type === 'number') {
                const num = Number(value);
                if (!Number.isFinite(num)) {
                    errors.push(`Parameter "${paramName}" must be a number`);
                    continue;
                }

                if (schema.minimum !== undefined && num < schema.minimum) {
                    errors.push(`Parameter "${paramName}" must be >= ${schema.minimum}`);
                }
                if (schema.maximum !== undefined && num > schema.maximum) {
                    errors.push(`Parameter "${paramName}" must be <= ${schema.maximum}`);
                }

                validatedParams[paramName] = type === 'integer' ? Math.round(num) : num;
            } else if (type === 'string') {
                if (typeof value !== 'string') {
                    errors.push(`Parameter "${paramName}" must be a string`);
                    continue;
                }

                if (schema.enum && !schema.enum.includes(value)) {
                    errors.push(`Parameter "${paramName}" must be one of: ${schema.enum.join(', ')}`);
                }

                validatedParams[paramName] = value;
            } else if (type === 'boolean') {
                validatedParams[paramName] = Boolean(value);
            } else if (type === 'array') {
                if (!Array.isArray(value)) {
                    errors.push(`Parameter "${paramName}" must be an array`);
                    continue;
                }

                if (schema.items && schema.items.enum) {
                    for (const item of value) {
                        if (!schema.items.enum.includes(item)) {
                            errors.push(`Array element "${item}" must be one of: ${schema.items.enum.join(', ')}`);
                        }
                    }
                }

                validatedParams[paramName] = value;
            } else {
                validatedParams[paramName] = value;
            }
        }

        if (errors.length > 0) {
            return {
                valid: false,
                errors: errors
            };
        }

        for (const paramName of Object.keys(params)) {
            if (paramName !== 'tool_name' && !(paramName in validatedParams) &&
                !paramSchema.additionalProperties && paramSchema.additionalProperties !== true) {

                const knownProps = Object.keys(paramSchema.properties);
                if (!knownProps.includes(paramName)) {
                    console.log(`[ToolExecutor] Warning: Unknown parameter "${paramName}" will be passed through`);
                }
            }
        }

        return {
            valid: true,
            params: { ...validatedParams, ...params }
        };
    }

    async execute(toolName, rawParams = {}) {
        const tool = this.registry.getTool(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool "${toolName}" not found`,
                availableTools: this.registry.getToolNames()
            };
        }

        const validation = this.validateParameters(toolName, rawParams);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Parameter validation failed',
                errors: validation.errors
            };
        }

        const startTime = Date.now();
        try {
            const result = await tool.execute(validation.params);

            const executionTime = Date.now() - startTime;

            this.executionHistory.push({
                tool: toolName,
                params: validation.params,
                result: result,
                time: executionTime,
                timestamp: new Date().toISOString()
            });

            if (this.executionHistory.length > this.maxHistory) {
                this.executionHistory.shift();
            }

            return {
                success: result.success !== false,
                ...result,
                _executionTime: executionTime,
                _tool: toolName
            };
        } catch (e) {
            const executionTime = Date.now() - startTime;

            return {
                success: false,
                error: e.message,
                stack: e.stack,
                _executionTime: executionTime,
                _tool: toolName
            };
        }
    }

    async executeWithRetry(toolName, params = {}, maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.execute(toolName, params);

            if (result.success) {
                return {
                    ...result,
                    attempts: attempt,
                    succeeded: true
                };
            }

            lastError = result.error;
            console.log(`[ToolExecutor] Attempt ${attempt}/${maxRetries} failed for ${toolName}: ${lastError}`);

            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }

        return {
            success: false,
            error: lastError,
            attempts: maxRetries,
            succeeded: false
        };
    }

    getExecutionHistory(toolName = null, limit = 10) {
        let history = this.executionHistory;

        if (toolName) {
            history = history.filter(h => h.tool === toolName);
        }

        return history.slice(-limit);
    }

    getToolSchema(toolName) {
        const tool = this.registry.getTool(toolName);
        if (!tool) {
            return null;
        }

        return {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        };
    }

    getAllSchemas() {
        return this.registry.getToolSchemas();
    }

    getAvailableTools() {
        return this.registry.getToolNames();
    }
}

module.exports = new ToolExecutor();