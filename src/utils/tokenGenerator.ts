const jwt = require("jsonwebtoken");
require("dotenv").config();

export const tokenGenerator = (accessToken: string) => {
  const secretKey = process.env.APP_SECRET;

  const payload = { accessToken };

  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

  return token;
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.APP_SECRET);
    return { success: true, decoded };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
