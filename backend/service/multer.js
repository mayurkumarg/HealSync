import multer from "multer";
import CustomError from "../utils/customError.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 20, // 20 MB max
  },
  fileFilter: function (req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "application/pdf", 
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError(400, "Only images, mp4, and PDF files are allowed."));
    }
  },
});

export default upload;
