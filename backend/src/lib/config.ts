// Central configuration file for the application

export const AppConfig = {
    // Database connection details
    // Note: Prisma natively uses the DATABASE_URL from the .env file, 
    // but we expose the environment variable here for manual queries or API usage if needed.
    database: {
        url: process.env.DATABASE_URL || 'sqlserver://localhost:1433;database=AntigravityDB;user=sa;password=Password123!;encrypt=true;trustServerCertificate=true',
        provider: 'sqlserver',
    },

    // Insurance product mappings and configurations
    products: {
        'Basic': {
            code: '01',
            name: 'Basic'
        },
        'Top': {
            code: '02',
            name: 'Top'
        },
        'Best+': {
            code: '03',
            name: 'Best+'
        }
    },

    // Tariff types
    tariffs: {
        T6Z: 'T6Z',
        T10Z: 'T10Z'
    }
};
