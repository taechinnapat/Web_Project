require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// โหลดไฟล์ Service Account ของ Firebase
const serviceAccount = require("./firebase_credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// 📌 ดึงข้อมูลจาก Firestore และแปลง `image_url`
app.get("/api/alerts", async (req, res) => {
  try {
    const snapshot = await db.collection("alerts").orderBy("timestamp", "desc").get();
    
    if (snapshot.empty) {
      return res.json([]);
    }

    const alerts = snapshot.docs.map((doc) => {
      const data = doc.data();

      // ✅ แปลง image_url เป็นแบบ thumbnail
      let fileId = "";
      const match = data.image_url.match(/id=([\w-]+)/);
      if (match) {
        fileId = match[1];
      }

      return {
        id: doc.id,
        alert_type: data.alert_type,
        image_url:  data.image_url,
        timestamp: data.timestamp,
      };
    });

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts from Firestore:", error);
    res.status(500).json({ error: "Error fetching alerts" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
