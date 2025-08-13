import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Message from "../Models/Message.js";

dotenv.config();

await connectDB();

const ZIP_PATH = path.join(process.cwd(), "payloads.zip");
const EXTRACT_PATH = path.join(process.cwd(), "payloads");

function extractZip() {
  console.log("📦 Extracting ZIP...");
  const zip = new AdmZip(ZIP_PATH);
  zip.extractAllTo(EXTRACT_PATH, true);
  console.log("✅ Extraction complete");
}

async function ProcessPayloads() {
  console.log("📄 Processing JSON payloads...");
  const files = fs.readdirSync(EXTRACT_PATH);

  let insertCount = 0;
  let updateCount = 0;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const raw = fs.readFileSync(path.join(EXTRACT_PATH, file), "utf8");
    const data = JSON.parse(raw);

    const entry = data.metaData?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Handle messages
    if (value?.messages?.length) {
      for (const msg of value.messages) {
        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        const name = contact?.profile?.name || "Unknown";

        const result = await Message.updateOne(
          { meta_msg_id: msg.id },
          {
            $setOnInsert: {
              wa_id: msg.from,
              name,
              message: msg.text?.body || "",
              timestamp: new Date(Number(msg.timestamp) * 1000),
              status: "sent",
              meta_msg_id: msg.id,
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          insertCount++;
          console.log(`💬 Inserted new message: ${msg.id}`);
        } else if (result.modifiedCount > 0) {
          updateCount++;
          console.log(`♻ Updated existing message: ${msg.id}`);
        }
      }
    }

    // Handle statuses
    if (value?.statuses?.length) {
      for (const status of value.statuses) {
        const result = await Message.updateOne(
          { meta_msg_id: status.id },
          { $set: { status: status.status } }
        );
        if (result.modifiedCount > 0) {
          console.log(`📌 Updated status: ${status.id} -> ${status.status}`);
        }
      }
    }
  }

  console.log(`✅ All payloads processed. Inserted: ${insertCount}, Updated: ${updateCount}`);
}

extractZip();
await ProcessPayloads();
process.exit();
