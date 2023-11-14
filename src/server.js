import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import compression from "compression";
import sanitize from "express-mongo-sanitize";
import { rootLimiter } from "./middleware/rate-limit.js";
import { cache } from "./middleware/cache.js";
import posts from "./routes/posts.js";
import comments from "./routes/comments.js";
import sync from "./routes/sync.js";
import search from "./routes/search.js";
const BanModel = mongoose.model('Ban', { ip: String });


const app = express();




app.use(async (req, res, next) => {
  try {
    const banList = await BanModel.find({}, { _id: 0, __v: 0 });

    const ziyaretciIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (banList.some(item => item.ip === ziyaretciIP)) {
      return res.status(200).json({
        status: "error",
        message: `HMM KNK SANIRIM BANLANDIN YA. AH BE`,
        data: null,
      });
    }

    next();
  } catch (error) {
    console.error('Engellenen IP listesi kontrol hatası:', error.message);
    res.sendStatus(500);
  }
});





app.use(express.json());
app.use(cors());
app.use(compression());
app.use(sanitize({ allowDots: true }));
app.use((_req, res, next) => {
  res.header("Connection", "keep-alive");
  next();
});

mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://vhalmedya:vhalmedya@vhal.c5wcmth.mongodb.net/?retryWrites=true&w=majority", { dbName: "confessionsDB" }).then(
  () => {
    console.log("Connected to MongoDB");
  },
  (err) => {
    console.log(err);
  }
);

app.get("/", rootLimiter, cache(259200, 604800), (_req, res) => {
  res.status(200).send("Hello Confessions API");
});

app.get("/api", (_req, res) => {
  res.redirect(303, "/");
});

app.use("/api/posts", posts);
app.use("/api/comments", comments);
app.use("/api/sync", sync);
app.use("/api/search", search);



app.listen(process.env.PORT || 8000, () => {
  console.log("server started");
});










app.post('/ipban', async (req, res) => {
  try {
    const customData = req.headers['ip'];
    const adminKey = req.headers['key']; 

    
    if (adminKey !== '7c853dce-dd4d-4fa1-99db-b63e90161538') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!customData) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    // MongoDB'ye IP adresini ekle
    await BanModel.create({ ip: customData });

    res.sendStatus(200);
  } catch (error) {
    console.error('Hata:', error);
    res.sendStatus(500);
  }
});


app.post('/ipunban', async (req, res) => {
  try {
    const customData = req.headers['ip'];
    const adminKey = req.headers['key']; 

    
    if (adminKey !== '7c853dce-dd4d-4fa1-99db-b63e90161538') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!customData) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    
    await BanModel.deleteOne({ ip: customData });

    res.sendStatus(200);
  } catch (error) {
    console.error('Hata:', error);
    res.sendStatus(500);
  }
});

app.post('/listipban', async (req, res) => {
  try {
    const adminKey = req.headers['key']; 

    
    if (adminKey !== '7c853dce-dd4d-4fa1-99db-b63e90161538') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const banList = await BanModel.find({}, { _id: 0, __v: 0 });

    res.json(banList);
  } catch (error) {
    console.error('Hata:', error);
    res.sendStatus(500);
  }
});
