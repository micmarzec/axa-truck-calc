"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("./lib/prisma");
const xml_generator_1 = require("./lib/xml-generator");
const crypto_1 = __importDefault(require("crypto"));
const sftp_client_1 = require("./lib/sftp-client");
const calculator_1 = require("./lib/calculator");
const auth_1 = require("./middleware/auth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jszip_1 = __importDefault(require("jszip"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Set up multer for document uploads
const documentsDir = path_1.default.join(__dirname, '..', 'uploads', 'documents');
if (!fs_1.default.existsSync(documentsDir)) {
    fs_1.default.mkdirSync(documentsDir, { recursive: true });
}
const documentStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, documentsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const uploadDocument = (0, multer_1.default)({ storage: documentStorage });
// Serve documents
app.use('/uploads/documents', express_1.default.static(documentsDir));
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Truck-Calc API',
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_truckcalc';
const signaturesDir = path_1.default.join(__dirname, '../public/signatures');
if (!fs_1.default.existsSync(signaturesDir)) {
    fs_1.default.mkdirSync(signaturesDir, { recursive: true });
}
app.use('/signatures', express_1.default.static(signaturesDir, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', '*');
    }
}));
// --- SEED DATA ---
async function seedData() {
    try {
        const adminUser = await prisma_1.prisma.user.findUnique({ where: { username: 'mmarzec' } });
        if (!adminUser) {
            const hashedPassword = await bcrypt_1.default.hash('admin', 10);
            await prisma_1.prisma.user.create({
                data: {
                    username: 'mmarzec',
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log('Utworzono domyślnego administratora: mmarzec');
        }
        // Seed Products
        const productsCount = await prisma_1.prisma.product.count();
        if (productsCount === 0) {
            await prisma_1.prisma.product.createMany({
                data: [
                    { name: 'Basic', code: '01', priceT6Z: 535, priceT10Z: 535, commissionT6Z: 0, commissionT10Z: 0 },
                    { name: 'Top', code: '02', priceT6Z: 2490, priceT10Z: 3155, commissionT6Z: 0, commissionT10Z: 0 },
                    { name: 'Best+', code: '03', priceT6Z: 3050, priceT10Z: 4130, commissionT6Z: 0, commissionT10Z: 0 }
                ]
            });
            console.log('Utworzono domyślne pakiety ubezpieczeniowe.');
        }
    }
    catch (e) {
        console.error('Błąd podczas inicjalizacji bazy:', e);
    }
}
seedData();
// --- AUTHENTICATION ROUTES ---
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [auth]
 *     security:
 *       - []
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { username } });
        if (!user)
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword)
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { username: user.username, role: user.role } });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Błąd logowania' });
    }
});
// --- PRODUCT MANAGEMENT ROUTES ---
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lista produktów ubezpieczeniowych
 *     tags: [products]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma_1.prisma.product.findMany({ orderBy: { id: 'asc' } });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
/**
 * @swagger
 * /api/products/:id:
 *   put:
 *     summary: Aktualizacja produktu (tylko Admin)
 *     tags: [products]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.put('/api/products/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { priceT6Z, priceT10Z, commissionT6Z, commissionT10Z, active } = req.body;
        const updated = await prisma_1.prisma.product.update({
            where: { id },
            data: {
                priceT6Z: parseFloat(priceT6Z),
                priceT10Z: parseFloat(priceT10Z),
                commissionT6Z: parseFloat(commissionT6Z),
                commissionT10Z: parseFloat(commissionT10Z),
                active: Boolean(active)
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});
// --- DOCUMENTS ENDPOINTS ---
app.post('/api/products/:id/documents', auth_1.authenticateToken, auth_1.requireAdmin, uploadDocument.single('file'), async (req, res) => {
    try {
        const { type, validFrom } = req.body;
        const productId = parseInt(req.params.id);
        if (!req.file || !type || !validFrom) {
            return res.status(400).json({ error: 'Missing data' });
        }
        const doc = await prisma_1.prisma.productDocument.create({
            data: {
                productId,
                type,
                validFrom: new Date(validFrom),
                fileUrl: `/uploads/documents/${req.file.filename}`
            }
        });
        res.json(doc);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Upload failed' });
    }
});
app.get('/api/products/:id/documents', auth_1.authenticateToken, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const docs = await prisma_1.prisma.productDocument.findMany({
            where: { productId },
            orderBy: { validFrom: 'desc' }
        });
        res.json(docs);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
app.delete('/api/products/documents/:docId', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.docId);
        const doc = await prisma_1.prisma.productDocument.findUnique({ where: { id } });
        if (doc) {
            const filepath = path_1.default.join(__dirname, '..', doc.fileUrl);
            if (fs_1.default.existsSync(filepath))
                fs_1.default.unlinkSync(filepath);
            await prisma_1.prisma.productDocument.delete({ where: { id } });
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});
// --- EMAIL / SMS MOCKS ---
app.post('/api/sms/send', auth_1.authenticateToken, async (req, res) => {
    const { telefon } = req.body;
    console.log(`[MOCK SMS] Wysłano kod: 0000 na numer: ${telefon}`);
    res.json({ success: true });
});
app.post('/api/email/send', auth_1.authenticateToken, async (req, res) => {
    const { email, calcId } = req.body;
    console.log(`[MOCK EMAIL] Wysłano maila do: ${email} dla kalkulacji/certyfikatu: ${calcId}`);
    console.log(`[MOCK EMAIL] Załączniki (OWU, IPID, Deklaracja/Certyfikat) zostały zabezpieczone hasłem: 0000`);
    res.json({ success: true });
});
// --- USER MANAGEMENT ROUTES (ADMIN ONLY) ---
/**
 * @swagger
 * /api/users/agents:
 *   get:
 *     summary: Lista agentów (tylko Admin/Rozliczenia)
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.get('/api/users/agents', auth_1.authenticateToken, async (req, res) => {
    try {
        const isAdminOrBilling = req.user?.role === 'ADMIN' || req.user?.role === 'ROZLICZENIA';
        if (!isAdminOrBilling)
            return res.status(403).json({ error: 'Brak dostępu' });
        const users = await prisma_1.prisma.user.findMany({
            where: { certificates: { some: {} } },
            select: { id: true, username: true }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
app.get('/api/users', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({ select: { id: true, username: true, role: true, signatureUrl: true, createdAt: true } });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/api/users', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'Wymagany login i hasło' });
        const existing = await prisma_1.prisma.user.findUnique({ where: { username } });
        if (existing)
            return res.status(400).json({ error: 'Użytkownik o takiej nazwie już istnieje' });
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: ['ADMIN', 'ROZLICZENIA'].includes(role) ? role : 'USER'
            },
            select: { id: true, username: true, role: true }
        });
        res.json(newUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});
/**
 * @swagger
 * /api/users/:id:
 *   delete:
 *     summary: Usuń użytkownika (tylko Admin)
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.delete('/api/users/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (userId === req.user?.id) {
            return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
        }
        await prisma_1.prisma.user.delete({ where: { id: userId } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Nie udało się usunąć użytkownika' });
    }
});
/**
 * @swagger
 * /api/users/:id/password:
 *   post:
 *     summary: Zmień hasło użytkownika (tylko Admin)
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/users/:id/password', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { newPassword } = req.body;
        if (!newPassword)
            return res.status(400).json({ error: 'Brakujące hasło' });
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin Password Change Error:', error);
        res.status(500).json({ error: 'Nie udało się zmienić hasła' });
    }
});
/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Zmień własne hasło
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/users/change-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            return res.status(400).json({ error: 'Brakujące dane' });
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Brak autoryzacji' });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'Użytkownik nie istnieje' });
        const validPassword = await bcrypt_1.default.compare(oldPassword, user.password);
        if (!validPassword)
            return res.status(400).json({ error: 'Obecne hasło jest nieprawidłowe' });
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).json({ error: 'Nie udało się zmienić hasła' });
    }
});
/**
 * @swagger
 * /api/users/:id/signature:
 *   post:
 *     summary: Wgraj podpis (tylko Admin)
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/users/:id/signature', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { base64Image } = req.body;
        if (!base64Image) {
            return res.status(400).json({ error: 'Brak pliku obrazu' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'Użytkownik nie istnieje' });
        // Strip the data:image/png;base64, prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `user_${userId}_${Date.now()}.png`;
        const filePath = path_1.default.join(signaturesDir, fileName);
        fs_1.default.writeFileSync(filePath, buffer);
        const signatureUrl = `/signatures/${fileName}`;
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { signatureUrl }
        });
        res.json({ success: true, signatureUrl });
    }
    catch (error) {
        console.error('Signature upload error:', error);
        res.status(500).json({ error: 'Nie udało się wgrać podpisu' });
    }
});
// POST /api/calculate
/**
 * @swagger
 * /api/calculate:
 *   post:
 *     summary: Kalkulator składki
 *     tags: [calculate]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/calculate', async (req, res) => {
    try {
        const { wiekPojazdu, opcja, dataOd, dataDo } = req.body;
        if (wiekPojazdu == null || !opcja || !dataOd || !dataDo) {
            return res.status(400).json({ error: 'Missing calculation parameters' });
        }
        const product = await prisma_1.prisma.product.findUnique({ where: { name: opcja } });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        const result = (0, calculator_1.calculatePremium)(wiekPojazdu, product.priceT6Z, product.priceT10Z, new Date(dataOd), new Date(dataDo));
        res.json(result);
    }
    catch (error) {
        console.error('Calculation Error:', error);
        res.status(500).json({ error: 'Failed to calculate premium' });
    }
});
// --- CALCULATIONS ROUTES ---
/**
 * @swagger
 * /api/calculations:
 *   post:
 *     summary: Zapisz kalkulację
 *     tags: [calculations]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/calculations', auth_1.authenticateToken, async (req, res) => {
    try {
        const { formData, calculation, parentGroupId } = req.body;
        if (!formData || !calculation)
            return res.status(400).json({ error: 'Missing data' });
        let groupId = parentGroupId;
        let version = 1;
        if (groupId) {
            const maxCalc = await prisma_1.prisma.calculation.findFirst({
                where: { groupId },
                orderBy: { version: 'desc' }
            });
            if (maxCalc) {
                version = maxCalc.version + 1;
            }
            else {
                groupId = crypto_1.default.randomUUID();
            }
        }
        else {
            groupId = crypto_1.default.randomUUID();
        }
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 60);
        const newCalc = await prisma_1.prisma.calculation.create({
            data: {
                groupId,
                version,
                daneKlienta: JSON.stringify(formData),
                wynikKalkulacji: JSON.stringify(calculation),
                userId: req.user.id,
                validUntil
            }
        });
        res.json(newCalc);
    }
    catch (error) {
        console.error('Calculation Save Error:', error);
        res.status(500).json({ error: 'Failed to save calculation' });
    }
});
/**
 * @swagger
 * /api/calculations:
 *   get:
 *     summary: Pobierz listę kalkulacji
 *     tags: [calculations]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.get('/api/calculations', auth_1.authenticateToken, async (req, res) => {
    try {
        const isAdminOrBilling = req.user?.role === 'ADMIN' || req.user?.role === 'ROZLICZENIA';
        const whereClause = isAdminOrBilling ? {} : { userId: req.user?.id };
        const calculations = await prisma_1.prisma.calculation.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true } }, certificates: { select: { id: true } } }
        });
        res.json(calculations);
    }
    catch (error) {
        console.error('Fetch calculations error:', error);
        res.status(500).json({ error: 'Failed to fetch calculations' });
    }
});
app.get('/api/calculations/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const calc = await prisma_1.prisma.calculation.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { certificates: true }
        });
        if (!calc)
            return res.status(404).json({ error: 'Not found' });
        // Security check
        const isAdminOrBilling = req.user?.role === 'ADMIN' || req.user?.role === 'ROZLICZENIA';
        if (!isAdminOrBilling && calc.userId !== req.user?.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(calc);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch calculation' });
    }
});
// GET /api/certificates
/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Pobierz listę certyfikatów
 *     tags: [certificates]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.get('/api/certificates', auth_1.authenticateToken, async (req, res) => {
    try {
        const isAdminOrBilling = req.user?.role === 'ADMIN' || req.user?.role === 'ROZLICZENIA';
        const agentId = req.query.agentId ? parseInt(req.query.agentId, 10) : undefined;
        const fromDateStr = req.query.from;
        const toDateStr = req.query.to;
        const whereClause = isAdminOrBilling ? {} : { userId: req.user?.id };
        if (isAdminOrBilling && agentId) {
            whereClause.userId = agentId;
        }
        if (fromDateStr || toDateStr) {
            whereClause.dataWystawienia = {};
            if (fromDateStr) {
                const fd = new Date(fromDateStr);
                fd.setHours(0, 0, 0, 0);
                whereClause.dataWystawienia.gte = fd;
            }
            if (toDateStr) {
                const td = new Date(toDateStr);
                td.setHours(23, 59, 59, 999);
                whereClause.dataWystawienia.lte = td;
            }
        }
        const certificates = await prisma_1.prisma.certificate.findMany({
            where: whereClause,
            orderBy: { dataWystawienia: 'desc' },
            include: { user: { select: { signatureUrl: true, username: true } } }
        });
        res.json(certificates);
    }
    catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});
// POST /api/certificates
app.post('/api/certificates', auth_1.authenticateToken, async (req, res) => {
    try {
        const { formData, calculationId } = req.body;
        if (!formData)
            return res.status(400).json({ error: 'Missing formData' });
        if (calculationId) {
            const calc = await prisma_1.prisma.calculation.findUnique({
                where: { id: Number(calculationId) }
            });
            if (!calc)
                return res.status(404).json({ error: 'Kalkulacja nie znaleziona' });
            if (new Date() > calc.validUntil) {
                return res.status(400).json({ error: 'Kalkulacja straciła ważność (minęło 60 dni). Wygeneruj nową.' });
            }
            const groupCalcs = await prisma_1.prisma.calculation.findMany({
                where: { groupId: calc.groupId },
                include: { certificates: true }
            });
            const hasCert = groupCalcs.some(c => c.certificates.length > 0);
            if (hasCert) {
                return res.status(400).json({ error: 'Certyfikat dla tej historii kalkulacji został już wystawiony.' });
            }
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user?.id } });
        if (!user || !user.signatureUrl) {
            return res.status(403).json({ error: 'Brak dodanego podpisu na Twoim koncie. Skontaktuj się z administratorem, aby móc wystawiać certyfikaty.' });
        }
        const isDoubleTariff = formData.latT6Z > 0 && formData.latT10Z > 0;
        let numerCertyfikatu = '';
        await prisma_1.prisma.$transaction(async (tx) => {
            const allCerts = await tx.certificate.findMany({ select: { numerCertyfikatu: true } });
            let maxNum = 0;
            for (const c of allCerts) {
                const matches = c.numerCertyfikatu.match(/(?:CER0|CER|45789)(\d+)/g);
                if (matches) {
                    for (const m of matches) {
                        const n = parseInt(m.replace(/CER0|CER|45789/, ''), 10);
                        if (n > maxNum)
                            maxNum = n;
                    }
                }
            }
            if (isDoubleTariff) {
                const num1 = maxNum + 1;
                const num2 = maxNum + 2;
                numerCertyfikatu = `45789${String(num1).padStart(5, '0')}, 45789${String(num2).padStart(5, '0')}`;
            }
            else {
                const num1 = maxNum + 1;
                numerCertyfikatu = `45789${String(num1).padStart(5, '0')}`;
            }
            const cert = await tx.certificate.create({
                data: {
                    numerCertyfikatu,
                    numerUmowy: formData.numerUmowy,
                    daneKlienta: JSON.stringify(formData),
                    userId: req.user?.id,
                    calculationId: calculationId ? Number(calculationId) : null
                }
            });
            numerCertyfikatu = cert.numerCertyfikatu; // Get final confirmed
        });
        res.json({ numerCertyfikatu, signatureUrl: user.signatureUrl });
    }
    catch (error) {
        console.error('Certificate Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});
// POST /api/download-xml
/**
 * @swagger
 * /api/download-xml:
 *   post:
 *     summary: Pobierz XML dla certyfikatu
 *     tags: [download-xml]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/download-xml', auth_1.authenticateToken, (req, res) => {
    try {
        const { formData, calculation } = req.body;
        if (!formData?.numerUmowy || !formData?.firmaName) {
            return res.status(400).json({ error: 'Missing data' });
        }
        const xml = (0, xml_generator_1.generateXML)({
            ...formData,
            pojazdVIN: formData.pojazdVIN || 'UNKNOWN',
            dataRozpoczecia: formData.dataOd,
            dataZakonczenia: formData.dataDo,
            wariant: formData.opcjaUbez,
            dataPierwszejRejestracji: formData.pojazdDataRejestracji,
            latT6Z: calculation?.latT6Z,
            latT10Z: calculation?.latT10Z,
            skladkaT6Z: calculation?.skladkaT6Z,
            skladkaT10Z: calculation?.skladkaT10Z,
            skladka: calculation?.skladkaCalkowita
        });
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="Contract_${formData.numerUmowy}.xml"`);
        res.send(xml);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate XML' });
    }
});
// POST /api/send-xml
/**
 * @swagger
 * /api/send-xml:
 *   post:
 *     summary: Wyślij XML na SFTP
 *     tags: [send-xml]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/send-xml', auth_1.authenticateToken, async (req, res) => {
    try {
        const { formData, calculation } = req.body;
        if (!formData?.numerUmowy || !formData?.firmaName) {
            return res.status(400).json({ error: 'Missing data' });
        }
        const xml = (0, xml_generator_1.generateXML)({
            ...formData,
            pojazdVIN: formData.pojazdVIN || 'UNKNOWN',
            dataRozpoczecia: formData.dataOd,
            dataZakonczenia: formData.dataDo,
            wariant: formData.opcjaUbez,
            dataPierwszejRejestracji: formData.pojazdDataRejestracji,
            latT6Z: calculation?.latT6Z,
            latT10Z: calculation?.latT10Z,
            skladkaT6Z: calculation?.skladkaT6Z,
            skladkaT10Z: calculation?.skladkaT10Z,
            skladka: calculation?.skladkaCalkowita
        });
        const fileName = `Declaration_${formData.numerUmowy}_${Date.now()}.xml`;
        await (0, sftp_client_1.uploadFileToSFTP)(fileName, xml);
        res.json({ success: true, fileName });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send XML' });
    }
});
// POST /api/certificates/bulk-xml
/**
 * @swagger
 * /api/certificates/bulk-xml:
 *   post:
 *     summary: Zbiorcze pobranie XML w archiwum ZIP
 *     tags: [certificates]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/certificates/bulk-xml', auth_1.authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }
        const certificates = await prisma_1.prisma.certificate.findMany({
            where: { id: { in: ids } }
        });
        const zip = new jszip_1.default();
        for (const cert of certificates) {
            try {
                const formData = JSON.parse(cert.daneKlienta);
                const xmlData = {
                    ...formData,
                    numerCertyfikatu: cert.numerCertyfikatu,
                    dataRozpoczecia: formData.dataOd,
                    dataZakonczenia: formData.dataDo,
                    wariant: formData.opcjaUbez,
                    dataPierwszejRejestracji: formData.pojazdDataRejestracji,
                    pojazdVIN: formData.pojazdVIN || 'UNKNOWN'
                };
                const xmlContent = (0, xml_generator_1.generateXML)(xmlData);
                const fileName = `Contract_${cert.numerCertyfikatu.replace(/\//g, '_')}.xml`;
                zip.file(fileName, xmlContent);
            }
            catch (e) {
                console.error(`Failed cert ${cert.id}`, e);
            }
        }
        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="certificates_export_${Date.now()}.zip"`);
        res.send(zipContent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate ZIP' });
    }
});
// POST /api/certificates/bulk-send-sftp
/**
 * @swagger
 * /api/certificates/bulk-send-sftp:
 *   post:
 *     summary: Zbiorcza wysyłka XML na SFTP
 *     tags: [certificates]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/certificates/bulk-send-sftp', auth_1.authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }
        const certificates = await prisma_1.prisma.certificate.findMany({
            where: { id: { in: ids } }
        });
        let successCount = 0;
        for (const cert of certificates) {
            try {
                const formData = JSON.parse(cert.daneKlienta);
                const xmlData = {
                    ...formData,
                    numerCertyfikatu: cert.numerCertyfikatu,
                    dataRozpoczecia: formData.dataOd,
                    dataZakonczenia: formData.dataDo,
                    wariant: formData.opcjaUbez,
                    dataPierwszejRejestracji: formData.pojazdDataRejestracji,
                    pojazdVIN: formData.pojazdVIN || 'UNKNOWN'
                };
                const xmlContent = (0, xml_generator_1.generateXML)(xmlData);
                const fileName = `Contract_${cert.numerCertyfikatu.replace(/\//g, '_')}.xml`;
                // Upload via SFTP
                await (0, sftp_client_1.uploadFileToSFTP)(fileName, xmlContent);
                // Mark as sent in DB
                await prisma_1.prisma.certificate.update({
                    where: { id: cert.id },
                    data: { xmlWyslany: true }
                });
                successCount++;
            }
            catch (e) {
                console.error(`Failed cert ${cert.id}`, e);
            }
        }
        res.json({ success: true, count: successCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send to SFTP' });
    }
});
// POST /api/certificates/download-xml
/**
 * @swagger
 * /api/certificates/download-xml:
 *   post:
 *     summary: Pobierz XML z bazy po ID
 *     tags: [certificates]
 *     responses:
 *       200:
 *         description: Sukces
 */
app.post('/api/certificates/download-xml', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return res.status(400).json({ error: 'No ID provided' });
        const cert = await prisma_1.prisma.certificate.findUnique({ where: { id: Number(id) } });
        if (!cert)
            return res.status(404).json({ error: 'Not found' });
        const formData = JSON.parse(cert.daneKlienta);
        const xmlData = {
            ...formData,
            numerCertyfikatu: cert.numerCertyfikatu,
            dataRozpoczecia: formData.dataOd,
            dataZakonczenia: formData.dataDo,
            wariant: formData.opcjaUbez,
            dataPierwszejRejestracji: formData.pojazdDataRejestracji,
            pojazdVIN: formData.pojazdVIN || 'UNKNOWN'
        };
        const xmlContent = (0, xml_generator_1.generateXML)(xmlData);
        const fileName = `Contract_${cert.numerCertyfikatu.replace(/\//g, '_')}.xml`;
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(xmlContent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate XML' });
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
