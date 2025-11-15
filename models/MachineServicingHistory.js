import mongoose from "mongoose";

const ServiceHistorySchema = new mongoose.Schema({
  machineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Machine", 
    required: true 
  },
  uniqueId: { 
    type: String, 
    required: true, 
    // The machine's unique ID
  },
  
  // নতুন ফিল্ড: কোন পার্ট সার্ভিস করা হয়েছে
  partName: { 
    type: String, 
    required: true 
  },
  partUniqueId: { 
    type: String, 
    required: true, 
    // The unique ID of the part (from the Machine's parts array)
  },

  // পুরনো মেশিন-লেভেল ফিল্ডস (আমরা কিছু রাখলাম, তবে পার্ট-লেভেলে ফোকাস করা উচিত)
  servicedBy: String,
  description: String,
  
  // তারিখ সংক্রান্ত ফিল্ডস
  serviceDate: { 
    type: Date, 
    default: Date.now 
  },
  previousServiceDate: Date,
  nextServiceDate: Date, // এই পার্টের জন্য পরবর্তী সার্ভিস তারিখ

  // আমরা machineName ফিল্ডটি সরিয়ে দিলাম, কারণ uniqueId যথেষ্ট।
});

export default mongoose.models.ServiceHistory ||
  mongoose.model("ServiceHistory", ServiceHistorySchema);
