import configData from '../config.json';

const config = {
    apiBaseUrl: configData.apiBaseUrl,
    passkey: {
        rpId: configData.passkey?.rpId || 'localhost',
        rpOrigin: configData.passkey?.rpOrigin || window.location.origin
    }
};

export default config;
