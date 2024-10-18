import express, { Express, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import { emailServer } from "./src/utils/smtpServer";
import { tokenGenerator, verifyToken } from "./src/utils/tokenGenerator";
import cors from "cors";
import WebSocket from "ws";
import { pinDataOnIPFs } from "./src/utils/pinata";

require("dotenv").config();

let clientId: string;

const app: Express = express();

const port = 7000;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// export const wss = new WebSocket.Server({ server });

// wss.on("connection", function connection(ws) {
//   console.log("Client connected");

//   // WebSocket message handler
//   ws.on("message", function incoming(message) {
//     console.log("received: %s", message);
//     const data = JSON.parse(message.toString());
//     const clientId = data.client;
//   });
// });

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:6500"],
    credentials: true,
  })
);

const upload = multer({ dest: "uploads/" });

app.post("/auth", async (req: Request, res: Response) => {
  console.log(req, "users");
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

      console.log(separatedText, "uie");
      const dataToIpfs = {
        data: separatedText,
      };

      try {
        // const data = await pinDataOnIPFs(dataToIpfs);
        // console.log("Data Pinned:", data);
      } catch (error: any) {
        console.log(error, "error");
      }
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

      console.log(body, "llll");

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
  "/verify",
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

app.post("/email-request", async (req: Request, res: Response) => {
  const body = [
    {
      senderFirstName: "Test",
      senderLastName: "Notification",
      recipientFirstName: "Ridwan",
      recipientLastName: "Ridwan",
      recipientEmail: "hemsworthbookings@gmail.com",
    },
  ];

  const emailData = {
    email: "hemsworthbookings@gmail.com",
    password: "khvl lbxm zltg xmdq",
    subject: "Alert Notification",
    content: JSON.stringify(req.body),
    greetings: "Best Regards",
    origin: "",
    body,
  };

  try {
    const emailSender = await emailServer(emailData);
    res.send(emailSender);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
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
