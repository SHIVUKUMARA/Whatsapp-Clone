import fetch from "node-fetch";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Message from "../Models/Message.js";

dotenv.config();
await connectDB();

// Google Drive ZIP link
const GDRIVE_LINK =
  "https://drive.google.com/uc?export=download&id=1pWZ9HaHLza8k080pP_GhvKIl8j2voy-U";

const TEMP_ZIP_PATH = path.join(process.cwd(), "payloads.zip");
const EXTRACT_PATH = path.join(process.cwd(), "payloads");

async function downloadZip() {
  console.log("⬇️ Downloading payload ZIP...");
  const res = await fetch(GDRIVE_LINK);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(TEMP_ZIP_PATH, Buffer.from(buffer));
  console.log("✅ Download complete");
}

function extractZip() {
  console.log("📦 Extracting ZIP...");
  const zip = new AdmZip(TEMP_ZIP_PATH);
  zip.extractAllTo(EXTRACT_PATH, true);
  console.log("✅ Extraction complete");
}

async function processPayloads() {
  console.log("📄 Processing JSON payloads...");
  const files = fs.readdirSync(EXTRACT_PATH);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const data = JSON.parse(
        fs.readFileSync(path.join(EXTRACT_PATH, file), "utf8")
      );

      if (data.type === "message") {
        await Message.updateOne(
          { meta_msg_id: data.meta_msg_id },
          {
            $setOnInsert: {
              wa_id: data.wa_id,
              name: data.name,
              message: data.message,
              timestamp: new Date(data.timestamp),
              status: "sent",
              meta_msg_id: data.meta_msg_id,
            },
          },
          { upsert: true }
        );
      } else if (data.type === "status") {
        await Message.updateOne(
          { meta_msg_id: data.meta_msg_id },
          { $set: { status: data.status } }
        );
      }
    }
  }

  console.log("✅ All payloads processed.");
}

async function run() {
  await downloadZip();
  extractZip();
  await processPayloads();
  console.log("🎉 Done! You can now run your backend normally.");
  process.exit();
}

run();
