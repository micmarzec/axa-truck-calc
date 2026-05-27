const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/index.ts');
let code = fs.readFileSync(indexPath, 'utf-8');

// Add imports
if (!code.includes('swagger-ui-express')) {
    code = code.replace("import JSZip from 'jszip';", "import JSZip from 'jszip';\nimport swaggerUi from 'swagger-ui-express';\nimport swaggerJsdoc from 'swagger-jsdoc';");
}

// Add swagger setup
if (!code.includes('/api/docs')) {
    const setupBlock = `
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Antigravity API',
            version: '1.0.0',
            description: 'API Documentation'
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ['./src/index.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
`;
    code = code.replace("app.use(express.json({ limit: '10mb' }));", "app.use(express.json({ limit: '10mb' }));\n" + setupBlock);
}

const routes = [
    { method: 'post', path: '/api/auth/login', summary: 'Logowanie użytkownika', noAuth: true },
    { method: 'get', path: '/api/users/agents', summary: 'Lista agentów (tylko Admin/Rozliczenia)' },
    { method: 'get', path: '/api/users', summary: 'Pobierz wszystkich użytkowników (tylko Admin)' },
    { method: 'post', path: '/api/users', summary: 'Stwórz użytkownika (tylko Admin)' },
    { method: 'delete', path: '/api/users/:id', summary: 'Usuń użytkownika (tylko Admin)' },
    { method: 'post', path: '/api/users/:id/password', summary: 'Zmień hasło użytkownika (tylko Admin)' },
    { method: 'post', path: '/api/users/change-password', summary: 'Zmień własne hasło' },
    { method: 'post', path: '/api/users/:id/signature', summary: 'Wgraj podpis (tylko Admin)' },
    { method: 'post', path: '/api/calculate', summary: 'Kalkulator składki' },
    { method: 'get', path: '/api/certificates', summary: 'Pobierz listę certyfikatów' },
    { method: 'post', path: '/api/certificates', summary: 'Wygeneruj nowy certyfikat' },
    { method: 'post', path: '/api/download-xml', summary: 'Pobierz XML dla certyfikatu' },
    { method: 'post', path: '/api/send-xml', summary: 'Wyślij XML na SFTP' },
    { method: 'post', path: '/api/certificates/bulk-xml', summary: 'Zbiorcze pobranie XML w archiwum ZIP' },
    { method: 'post', path: '/api/certificates/bulk-send-sftp', summary: 'Zbiorcza wysyłka XML na SFTP' },
    { method: 'post', path: '/api/certificates/download-xml', summary: 'Pobierz XML z bazy po ID' }
];

for (const r of routes) {
    const searchStr = `app.${r.method}('${r.path}'`;
    if (!code.includes(`@swagger\n * ${r.path}`)) {
        const authBlock = r.noAuth ? ` *     security:\n *       - []` : '';
        const annotation = `
/**
 * @swagger
 * ${r.path}:
 *   ${r.method}:
 *     summary: ${r.summary}
 *     tags: [${r.path.split('/')[2] || 'Default'}]${authBlock ? '\n' + authBlock : ''}
 *     responses:
 *       200:
 *         description: Sukces
 */
`;
        code = code.replace(searchStr, annotation.trim() + '\n' + searchStr);
    }
}

fs.writeFileSync(indexPath, code, 'utf-8');
console.log('Swagger setup and annotations added.');
