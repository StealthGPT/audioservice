import express, { Express, Request, Response } from "express";
import * as dotenv from 'dotenv'
import { UTApi } from "uploadthing/server"
import path from "node:path"
import { exec } from 'node:child_process'
import fs from 'node:fs'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const utapi = new UTApi()

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

interface UploadRequestBody {
  url: string;
  name: string;
  key: string;
}

app.post("/compress", async (req: Request<{}, {}, UploadRequestBody>, res) => {
  const audioUrl = req.body.url
  const name = `${req.body.name.replace(/\s/g, '_').toLowerCase()}_${nanoid()}`

  try {
    const response = await fetch(audioUrl)

    if (!response.ok) {
      throw new Error("Failed to fetch audio file");
    }

    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    const tmpDir = path.join(__dirname, '..', 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(__dirname, '..', 'tmp', `${name}.mp3`);

    await fs.promises.writeFile(filePath, buffer);

    const outputFilePath = path.join(__dirname, '..', 'tmp', `${name}.ogg`);
    const command = `ffmpeg -i ${filePath} -vn -map_metadata -1 -ac 1 -c:a libopus -b:a 12k -application voip ${outputFilePath}`;

    exec(command, async (error) => {
      if (error) {
        return res.status(500).send({ success: false, error: error.message });
      }

      const file = new File([await fs.promises.readFile(outputFilePath)], `${name}.ogg`, { type: 'audio/ogg' });
      const uploadResponse = await utapi.uploadFiles([file])

      await fs.promises.unlink(filePath);
      await fs.promises.unlink(outputFilePath);
      await utapi.deleteFiles(req.body.key);

      res.status(200).send({ success: true, outputFile: uploadResponse });
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, error });
  }
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});