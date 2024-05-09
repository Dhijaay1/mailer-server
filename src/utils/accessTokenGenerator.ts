export default function generateAccessToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 25;
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const now = new Date();

    const expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    return {
        token: token,
        expiration: expirationDate
    };
}
const accessToken = generateAccessToken();
console.log("Access Token:", accessToken.token);
console.log("Expiration Date:", accessToken.expiration);
