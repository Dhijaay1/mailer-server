import express, { Express, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import { emailServer } from "./src/utils/smtpServer";
import cors from "cors";

require("dotenv").config();

const app: Express = express();

const port = 7000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(express.json());

app.use(
  cors({
    origin: [process.env.origin],
    credentials: true,
  })
);

const upload = multer({ dest: "uploads/" });

app.get("/api", async (req: Request, res: Response) => {
  res.send("Welcome to bulk-mailer")
});

app.post("/api/auth", async (req: Request, res: Response) => {
  const { token } = req.body;
  const generatedToken = process.env.ACCESS_TOKEN;

  if (generatedToken === token) {
    res.send({
      canProceed: true,
    });
  } else {
    res.send({
      canProceed: false,
    });
  }
});

app.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      if (fileExtension !== "txt") {
        return res
          .status(400)
          .send("Unsupported file type. Only .txt files are allowed.");
      }

      const data = await readFileAsync(req.file.path);

      const text = data.toString();
      const separatedText = text.split(/\s+/).filter(Boolean);

      const body = [];
      let i = 0;
      while (i < separatedText.length) {
        const senderFirstName = separatedText[i] || "";
        const senderLastName = separatedText[i + 1] || "";
        const recipientFirstName = separatedText[i + 2] || "";
        const recipientLastName = separatedText[i + 3] || "";
        const recipientEmail = separatedText[i + 4] || "";

        body.push({
          senderFirstName,
          senderLastName,
          recipientFirstName,
          recipientLastName,
          recipientEmail,
        });

        i += 5;
      }

      const emailData = {
        ...req.body,
        body,
      };

      try {
        const emailSender = await emailServer(emailData);
        res.send(emailSender);
      } catch (error: any) {
        res.status(500).send({ message: error.message });
      }
    } catch (error) {
      console.error("Error:", error.Error);
      res.status(501).send("Internal server error.");
    } finally {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully.");
        }
      });
    }
  }
);

app.post(
  "/api/verify",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      if (fileExtension !== "txt") {
        return res
          .status(400)
          .send("Unsupported file type. Only .txt files are allowed.");
      }

      const data = await readFileAsync(req.file.path);

      const text = data.toString();
      const separatedText = text.split(/\s+/).filter(Boolean);
      const body = [];
      let i = 0;
      while (i < separatedText.length) {
        const senderFirstName = separatedText[i] || "";
        const senderLastName = separatedText[i + 1] || "";
        const recipientFirstName = separatedText[i + 2] || "";
        const recipientLastName = separatedText[i + 3] || "";
        const recipientEmail = separatedText[i + 4] || "";

        body.push({
          senderFirstName,
          senderLastName,
          recipientFirstName,
          recipientLastName,
          recipientEmail,
        });

        i += 5;
      }
      for (const emailBody of body) {
        if (
          typeof emailBody.recipientEmail !== "string" ||
          emailBody.recipientEmail.trim() === "" ||
          !emailBody.recipientEmail.includes("@")
        ) {
          return res.status(400).json({
            message: `Invalid format detected for the provided credential: ${emailBody.recipientEmail} or ${emailBody.recipientFirstName}. Please ensure they are in the correct format.`,
          });
        }
      }

      return res.json({ verified: true });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send("Internal server error.");
    } finally {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully.");
        }
      });
    }
  }
);

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
