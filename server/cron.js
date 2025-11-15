// server/cron.js
import cron from "node-cron";
import Machine from "../models/Machine.js";
import Notification from "../models/Notification.js";
import { connectDB } from "../lib/db.js";

// ✅ MongoDB connection
await connectDB();
console.log("✅ MongoDB connected, starting cron jobs...");

// 🔹 Cron job: প্রতি 10 সেকেন্ডে চেক করবে
cron.schedule("*/10  * * *", async () => {
  console.log("🔍 Checking for due servicing parts...");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // MongoDB থেকে due machines খুঁজে বের করা
    const dueMachines = await Machine.find({
      "parts.nextServiceDate": { $lte: today },
      "parts.isNotificationActive": true,
    });

    if (dueMachines.length === 0) {
      console.log("✅ No parts servicing needed today");
      return;
    }

    console.log("⚠️ Machines with Parts Needing Servicing:", dueMachines.map(m => m.uniqueId));

    // প্রতিটি machine এ due parts চেক
    for (const machine of dueMachines) {
      const dueParts = machine.parts.filter(
        (part) =>
          part.nextServiceDate &&
          part.nextServiceDate <= today &&
          part.isNotificationActive
      );

      for (const part of dueParts) {
        // duplicate notification check
        const existing = await Notification.findOne({
          uniqueId: machine.uniqueId,
          partName: part.partName,
          seen: false,
        });

        if (!existing) {
          const message = `⚙️ **${part.partName}** of Machine ${machine.uniqueId} servicing due!`;

          // save notification
          const newNotification = await Notification.create({
            machineId: machine._id,
            uniqueId: machine.uniqueId,
            partName: part.partName,
            message,
          });

          console.log(`🆕 Notification created for ${machine.uniqueId} - ${part.partName}`);
          // এখানে চাইলে socket.emit দিয়ে live notification পাঠাতে পারো
          // emitNotification(newNotification);
        } else {
          console.log(`🔁 Notification already exists for ${machine.uniqueId} - ${part.partName}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Cron job error:", error);
  }
});
