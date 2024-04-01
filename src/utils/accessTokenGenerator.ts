export function generateAccessToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 25;
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Get the current date and time
    const now = new Date();

    // Set the expiration date to 30 days from now
    const expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    return {
        token: token,
        expiration: expirationDate
    };
}

// Example usage
const accessToken = generateAccessToken();
console.log("Access Token:", accessToken.token);
console.log("Expiration Date:", accessToken.expiration);
