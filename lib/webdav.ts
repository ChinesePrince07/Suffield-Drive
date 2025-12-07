import { createClient, AuthType } from 'webdav';

export const getWebDAVClient = () => {
    const url = process.env.WEBDAV_URL;
    const username = process.env.WEBDAV_USERNAME;
    const password = process.env.WEBDAV_PASSWORD;

    if (!url || !username || !password) {
        throw new Error('WebDAV credentials not configured');
    }

    return createClient(url, {
        authType: AuthType.Password,
        username,
        password,
    });
};
