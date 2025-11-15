// app/api/servicing-check/route.js  (Next.js App Router)
import { connectDB } from "@/lib/db";
import Machine from "@/models/Machine";
import Notification from "@/models/Notification";
import { emitNotification } from "@/lib/socket";

export async function GET() {
  try {
    await connectDB();
    console.log("🔍 Checking for due servicing parts...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueMachines = await Machine.find({
      "parts.nextServiceDate": { $lte: today },
      "parts.isNotificationActive": true,
    });

    if (dueMachines.length > 0) {
      console.log(
        "⚠️ Machines with Parts Needing Servicing:",
        dueMachines.map((m) => m.uniqueId)
      );

      for (const machine of dueMachines) {
        const dueParts = machine.parts.filter(
          (part) =>
            part.nextServiceDate &&
            part.nextServiceDate <= today &&
            part.isNotificationActive
        );

        for (const part of dueParts) {
          const existing = await Notification.findOne({
            uniqueId: machine.uniqueId,
            partName: part.partName,
            seen: false,
          });

          if (!existing) {
            const message = `⚙️ **${part.partName}** of Machine ${machine.uniqueId} servicing due!`;

            const newNotification = await Notification.create({
              machineId: machine._id,
              uniqueId: machine.uniqueId,
              partName: part.partName,
              message: message,
            });

            emitNotification(newNotification);

            console.log(
              `🆕 Notification created and broadcasted for ${machine.uniqueId} - ${part.partName}`
            );
          } else {
            console.log(
              `🔁 Notification already exists for ${machine.uniqueId} - ${part.partName}`
            );
          }
        }
      }
    } else {
      console.log("✅ No parts servicing needed today");
    }

    return new Response(JSON.stringify({ message: "Servicing check complete" }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in servicing check:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
