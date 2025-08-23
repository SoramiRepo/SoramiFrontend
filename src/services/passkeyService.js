import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import config from '../config';

class PasskeyService {
    constructor() {
        this.apiBaseUrl = config.apiBaseUrl;
    }

    // 检查浏览器是否支持passkey
    isSupported() {
        return window.PublicKeyCredential && 
               PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
               PublicKeyCredential.isConditionalMediationAvailable;
    }

    // 检查用户是否支持passkey
    async checkSupport() {
        if (!this.isSupported()) {
            return {
                supported: false,
                reason: 'Browser does not support WebAuthn'
            };
        }

        try {
            const [userVerifyingAvailable, conditionalMediationAvailable] = await Promise.all([
                PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
                PublicKeyCredential.isConditionalMediationAvailable()
            ]);

            return {
                supported: userVerifyingAvailable && conditionalMediationAvailable,
                userVerifyingAvailable,
                conditionalMediationAvailable
            };
        } catch (error) {
            console.error('Error checking passkey support:', error);
            return {
                supported: false,
                reason: 'Error checking support'
            };
        }
    }

    // 注册新的passkey
    async registerPasskey(token) {
        try {
            // 1. 从后端获取注册选项
            const response = await fetch(`${this.apiBaseUrl}/api/passkey/generate-registration-options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate registration options');
            }

            const { options, challenge, rpID, rpOrigin } = await response.json();

            // 2. 调用WebAuthn API开始注册
            const credential = await startRegistration(options);

            // 3. 验证注册响应
            // Send both the credential and the original challenge
            const verificationResponse = await fetch(`${this.apiBaseUrl}/api/passkey/verify-registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    response: credential,
                    challenge: challenge // Send the original challenge for verification
                })
            });

            if (!verificationResponse.ok) {
                const error = await verificationResponse.json();
                throw new Error(error.message || 'Failed to verify registration');
            }

            const result = await verificationResponse.json();
            return result;
        } catch (error) {
            console.error('Error registering passkey:', error);
            throw error;
        }
    }

    // 使用passkey登录
    async authenticateWithPasskey(username) {
        try {
            // 1. 从后端获取认证选项
            const response = await fetch(`${this.apiBaseUrl}/api/passkey/generate-authentication-options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate authentication options');
            }

            const { options, challenge, rpID, rpOrigin } = await response.json();

            // 2. 调用WebAuthn API开始认证
            const credential = await startAuthentication(options);

            // 3. 验证认证响应
            // Send both the credential and the original challenge
            const verificationResponse = await fetch(`${this.apiBaseUrl}/api/passkey/verify-authentication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    response: credential,
                    challenge: challenge // Send the original challenge for verification
                })
            });

            if (!verificationResponse.ok) {
                const error = await verificationResponse.json();
                throw new Error(error.message || 'Failed to verify authentication');
            }

            const result = await verificationResponse.json();
            return result;
        } catch (error) {
            console.error('Error authenticating with passkey:', error);
            throw error;
        }
        }

    // 获取用户的passkeys列表
    async getUserPasskeys(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/passkey/list`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get passkeys');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user passkeys:', error);
            throw error;
        }
    }

    // 删除passkey
    async deletePasskey(passkeyId, token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/passkey/${passkeyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete passkey');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting passkey:', error);
            throw error;
        }
    }

    // 检查用户是否有passkeys
    async checkUserPasskeys(username) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/passkey/check/${username}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to check passkeys');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking user passkeys:', error);
            throw error;
        }
    }

    // 检查是否可以使用passkey登录
    async canUsePasskeyLogin(username) {
        try {
            const result = await this.checkUserPasskeys(username);
            return result.hasPasskeys;
        } catch (error) {
            console.error('Error checking if passkey login is available:', error);
            return false;
        }
    }
}

export default new PasskeyService();
