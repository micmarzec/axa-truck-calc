import Client from 'ssh2-sftp-client';

export interface SFTPConfig {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    privateKey?: string;
}

export async function uploadFileToSFTP(
    fileName: string,
    content: string,
    config: SFTPConfig = {}
): Promise<boolean> {
    const sftp = new Client();

    // Use env vars or config, fallback to Mock if missing
    const host = config.host || process.env.SFTP_HOST;

    if (!host) {
        console.log(`[MOCK SFTP] Uploading ${fileName} to Mock SFTP...`);
        console.log(`[MOCK SFTP] Content preview: ${content.substring(0, 100)}...`);
        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[MOCK SFTP] Upload success.`);
        return true;
    }

    try {
        await sftp.connect({
            host: host,
            port: config.port || Number(process.env.SFTP_PORT) || 22,
            username: config.username || process.env.SFTP_USER,
            password: config.password || process.env.SFTP_PASS,
            // privateKey: ...
        });

        console.log(`[SFTP] Connected to ${host}`);
        await sftp.put(Buffer.from(content), `/upload/${fileName}`); // Default path assumption
        console.log(`[SFTP] Uploaded ${fileName}`);
        return true;
    } catch (err) {
        console.error('[SFTP] Error:', err);
        throw err;
    } finally {
        sftp.end();
    }
}
