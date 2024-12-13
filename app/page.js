"use client";
import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { saveAs } from "file-saver";

const FaceRecognitionApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [extractedImages, setExtractedImages] = useState([]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setLoading(false);
    };
    loadModels();
  }, []);

  // Start video feed
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  // Detect faces and draw on canvas
  const detectFaces = async () => {
    if (!videoRef.current) return;

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };

    // Resize canvas to match video dimensions
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Resize detections
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Draw detections on canvas
      const context = canvasRef.current.getContext("2d");
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      ); // Clear canvas
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
    }, 100);

    return () => clearInterval(interval); // Cleanup interval on unmount
  };

  // Extract faces as images
  const extractFaces = async () => {
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detections || detections.length === 0) {
      alert("No faces detected!");
      return;
    }

    const extracted = await Promise.all(
      detections.map((detection) =>
        faceapi.extractFaces(videoRef.current, [detection.detection.box])
      )
    );

    extracted.forEach((faceCanvasArray) => {
      faceCanvasArray.forEach((faceCanvas) => {
        saveExtractedImage(faceCanvas);
      });
    });
  };

  // Save extracted image to state
  const saveExtractedImage = (canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setExtractedImages((prev) => [...prev, url]);

      // Save the image to the user's computer
      saveAs(blob, `extracted_face_${Date.now()}.png`);
    });
  };

  if (loading) return <p>Loading models...</p>;

  return (
    <div>
      <h1>Face Recognition App</h1>

      {/* Video and Canvas in One Layer */}
      <div
        style={{
          display: "flex", // Menggunakan Flexbox
          justifyContent: "center", // Membuat elemen di tengah horizontal
          alignItems: "center", // Membuat elemen di tengah vertikal
          height: "100%", // Tinggi container sesuai viewport
        }}
      >
        <div style={{ position: "relative", width: "720px", height: "560px" }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="720"
            height="560"
            onPlay={detectFaces}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%", // Pastikan video memenuhi container
              height: "100%",
            }}
          />
          <canvas
            ref={canvasRef}
            width="720"
            height="560"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
              width: "100%", // Pastikan canvas memenuhi container
              height: "100%",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          margin: "20px 0",
          justifyContent: "center", // Membuat elemen di tengah horizontal
          alignItems: "center",
        }}
      >
        <button onClick={startVideo} style={{ marginRight: "10px" }}>
          Start Video
        </button>
        <button onClick={extractFaces}>Extract to Image</button>
      </div>

      <h2>Extracted Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {extractedImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Extracted face ${index}`}
            style={{ width: "100px", margin: "10px", border: "1px solid gray" }}
          />
        ))}
      </div>
    </div>
  );
};

export default FaceRecognitionApp;
