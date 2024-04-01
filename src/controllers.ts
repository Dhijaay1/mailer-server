import express, { Express, Request, Response } from "express"; // Import express module
import multer from "multer";
import fs from "fs";
import { emailServer } from "../src/utils/smtpServer";
import { tokenGenerator, verifyToken } from "../src/utils/tokenGenerator";
import cors from "cors";

require("dotenv").config();

const app: Express = express(); // Initialize Express application
const port = 5000;
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const upload = multer({ dest: "uploads/" });
app.post("/auth", async (req: Request, res: Response) => {
  const { token } = req.body;
  const generatedToken = process.env.ACCESS_TOKEN;

  if (generatedToken === token) {
    const clientToken = tokenGenerator(token);

    res.send({
      canProceed: true,
      clientToken: clientToken,
    });
  } else {
    res.send({
      canProceed: false,
    });
  }
});

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    console.log(req,'kk')
    const token = verifyToken(req.headers.token as string);
    console.log(token,"ll")
    // if (token.success) {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }

        const fileExtension = req.file.originalname
          .split(".")
          .pop()
          .toLowerCase();

        if (fileExtension !== "txt") {
          return res.status(400).send("Unsupported file type. Only .txt files are allowed.");
        }

        const data = await readFileAsync(req.file.path);

        const text = data.toString();
        console.log(text, "jeu");

        // Process the text data as needed

        // Example: Send email with the text data
        const emailData = {
          ...req.body,
          text,
        };

        try {
          const emailSender = await emailServer(emailData);
          res.send(emailSender);
        } catch (error: any) {
          console.error("Error sending email:", error);
          res.status(500).send("Error sending email.");
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal server error.");
      } finally {
        // Always delete the uploaded file after processing
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully.");
          }
        });
      }
    // } else {
    //   res.status(401).send("Unauthorized users");
    // }
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function readFileAsync(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
