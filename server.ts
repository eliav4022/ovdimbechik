import express from "express";
import dotenv from 'dotenv';
dotenv.config({ override: true });
import path from "path";
import { createServer as createViteServer } from "vite";
import { rateLimit } from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import cors from "cors";
import admin from 'firebase-admin';

// Initialize Firebase Admin (safe fallback if credentials aren't set)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin Initialization missing credentials");
  }
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Minimal middleware for production stability
  app.use(helmet({ contentSecurityPolicy: false })); // allow Vite's inline scripts
  app.use(cors());
  app.use(express.json({ limit: "5mb" })); 

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  });
  
  app.use("/api/", limiter);

  app.get("/api/health", (req, res) => {
    const envKeys = Object.keys(process.env);
    const keyLikeVars = envKeys.filter(k => k.includes("API") || k.includes("KEY") || k.includes("GEMINI"));
    
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV, 
      time: new Date().toISOString(),
      apiKeyDetected: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.New_Key),
      availableKeyLikeVars: keyLikeVars
    });
  });

  app.post("/api/admin/create-user", async (req, res) => {
    if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin config missing" });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      
      const userDoc = await admin.firestore().collection('users').doc(decodedUser.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const { email, password, displayName, uid } = req.body;
      if (!email || !password || password.length < 6) {
         return res.status(400).json({ error: "Invalid payload or password" });
      }

      const userRecord = await admin.auth().createUser({
          uid,
          email,
          password,
          displayName,
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("Admin Create User Error:", error.message);
      if (error.message.includes("Identity Toolkit API has not been used") || error.message.includes("Credential is") || error.message.includes("PERMISSION_DENIED") || error.message.includes("accessNotConfigured")) {
          return res.status(500).json({ error: "Firebase Admin config missing" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-user-password", async (req, res) => {
    if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin config missing" });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      
      const userDoc = await admin.firestore().collection('users').doc(decodedUser.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const { targetUid, newPassword } = req.body;
      if (!targetUid || !newPassword || newPassword.length < 6) {
         return res.status(400).json({ error: "Invalid payload or password too short (min 6)" });
      }

      await admin.auth().updateUser(targetUid, { password: newPassword });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin Update Password Error:", error.message);
      if (error.message.includes("Identity Toolkit API has not been used") || error.message.includes("Credential is") || error.message.includes("PERMISSION_DENIED") || error.message.includes("accessNotConfigured")) {
          return res.status(500).json({ error: "Firebase Admin config missing" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-user-email", async (req, res) => {
    if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin config missing" });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      
      const userDoc = await admin.firestore().collection('users').doc(decodedUser.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const { targetUid, newEmail } = req.body;
      if (!targetUid || !newEmail || !newEmail.includes('@')) {
         return res.status(400).json({ error: "Invalid payload or email" });
      }

      await admin.auth().updateUser(targetUid, { email: newEmail });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin Update Email Error:", error.message);
      if (error.message.includes("Identity Toolkit API has not been used") || error.message.includes("Credential is") || error.message.includes("PERMISSION_DENIED") || error.message.includes("accessNotConfigured")) {
          return res.status(500).json({ error: "Firebase Admin config missing" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini proxy route
  app.post("/api/gemini/generate", async (req, res) => {
    // 1. Basic body validation
    if (!req.body || !req.body.contents || !Array.isArray(req.body.contents)) {
      return res.status(400).json({ error: "Invalid request body format: 'contents' array is required." });
    }

    // 2. Auth Verification
    if (admin.apps.length) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid authorization token" });
      }
      try {
        const idToken = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(idToken);
      } catch (err) {
        console.warn("Invalid Firebase Token:", err);
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    try {
      const potentialKeys = [
        process.env.GEMINI_API_KEY,
        process.env.VITE_GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.API_KEY,
        process.env.New_Key
      ];
      
      let apiKey = null;
      for (const key of potentialKeys) {
        if (key && typeof key === 'string') {
          const sanitizedKey = key.trim().replace(/^["']|["']$/g, '');
          if (sanitizedKey !== "" && sanitizedKey !== "MY_GEMINI_API_KEY" && sanitizedKey !== "your_api_key_here") {
            apiKey = sanitizedKey;
            break;
          }
        }
      }
      
      if (!apiKey) {
        return res.json({ 
          text: "שמתי לב שמפתח ה-API שהוזן בהגדרות (Settings > Secrets) הוא עדיין טקסט דוגמה (כמו 'MY_GEMINI_API_KEY' או ריק).\nכדי שאוכל לעבוד כאן כמו שצריך, אנא היכנס להגדרות צד ימין (Settings > Secrets), ומלא שם מפתח Gemini API אמיתי (שמתחיל לרוב באותיות AIza...). לאחר מכן רענן את האפליקציה!"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { contents, config } = req.body;
      let model = req.body.model || "gemini-3-flash-preview";

      // Map deprecated models to the current ones
      if (model.includes("gemini-1.5") || model.includes("gemini-2.0")) {
        model = "gemini-3-flash-preview";
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      // text and functionCalls are sometimes getters in the SDK, so we explicitly extract them
      const text = response.text || "";
      const functionCalls = response.functionCalls || [];
      const usageMetadata = response.usageMetadata || null;

      res.json({ text, functionCalls, usageMetadata });
    } catch (error: any) {
      console.error("Gemini Server Proxy Error:", error);
      let errorMessage = error.message || "Failed to contact Gemini API";
      if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("PERMISSION_DENIED")) {
        return res.json({ 
          text: "מפתח ה-API שהוזן קצת שגוי 😅.\nבוא נתקן את זה: לחץ על סמל ההגדרות בפלטפורמה (Settings > Secrets), ערוך את `GEMINI_API_KEY` למפתח תקין וחזור לכאן. אני מחכה לך!"
        });
      }
      res.status(error.status || 500).json({ 
        error: errorMessage,
        status: error.status
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Must use * for Express 4, *all for Express 5. package.json has 4.21.2
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Final error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("GLOBAL SERVER ERROR:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
