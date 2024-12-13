import formidable from "formidable-serverless";
import * as faceapi from "face-api.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "File upload failed" });
      }

      // Add logic for processing uploaded images using faceapi
      res.status(200).json({ message: "Image processed" });
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
