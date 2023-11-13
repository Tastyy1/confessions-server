import { Router } from "express";
import { syncLimiter } from "../middleware/rate-limit.js";
import Post from "../models/Post.js";

const router = Router();

router.post("/", syncLimiter, (req, res) => {
  const { t, v } = req.query;
  const { ids } = req.body;

  if (ids && t === "post") {
    let updateField;
    let updateValue;

    switch (v) {
      case "likes":
        updateField = "count.likes";
        updateValue = 1;
        break;
      case "unlikes":
        updateField = "count.likes";
        updateValue = -1;
        break;
      case "dislikes":
        updateField = "count.dislikes";
        updateValue = 1;
        break;
      case "undislikes":
        updateField = "count.dislikes";
        updateValue = -1;
        break;
      case "reports":
        updateField = "meta.reports";
        updateValue = 1;
        break;
      default:
        res
          .status(400)
          .json({ status: "error", message: "Invalid request", data: null });
        return;
    }

    const bulkOperations = ids.map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $inc: { [updateField]: updateValue },
          $currentDate: { updatedAt: true },
        },
      },
    }));

    Post.bulkWrite(bulkOperations, { ordered: false }, (err) => {
      if (err) {
        res.status(500).json({
          status: "error",
          message: `Error while syncing ${v}, please try again later`,
          data: null,
        });
      } else {
        res.status(200).json({
          status: "success",
          message: `${v} synced`,
          data: null,
        });
      }
    });
  } else {
    res
      .status(400)
      .json({ status: "error", message: "Invalid request", data: null });
  }
});

export default router;
