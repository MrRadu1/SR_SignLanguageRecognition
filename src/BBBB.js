import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";
import React, { useRef } from 'react';
import Starfield from './Starfield';
import {Camera} from "@mediapipe/camera_utils";
import * as tf from '@tensorflow/tfjs';
import { useEffect, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import {drawConnectors, drawLandmarks} from '@mediapipe/drawing_utils'


function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const model = useRef(null);
  const actions = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i))
    .concat(['next', 'space', 'backspace']);

  // Maintain a buffer of 45 frames
  const [framesBuffer, setFramesBuffer] = useState(Array.from({ length: 45 }, () => []));

  const extractKeyPoints = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]; 
      const arr = landmarks.flatMap((res) => [res.x, res.y, res.z]);
      return arr;
    } else {
      return Array(21 * 3).fill(0);
    }
  };

  useEffect(() => {
    async function loadModel() {
      try {
        model.current = await tf.loadLayersModel(`/model/model.json`);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    }
    loadModel();
    return () => {
    };
  }, []);

  const predict = async (input) => {
    const inputTensor = tf.tensor3d(input);
    const outputTensor = await model.current.predict(inputTensor);
    const predictionss = await outputTensor.data();
    const maxIndex = predictionss.indexOf(Math.max(...predictionss));
    return maxIndex;
  };

  const onResults = async (results) => {
    if (!webcamRef.current?.video || !canvasRef.current) return
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    if (canvasCtx == null) throw new Error('Could not get context');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';

    const keypoints = extractKeyPoints(results);

    setFramesBuffer(prevBuffer => {
        // If buffer is not full, just add the new frame
        if (prevBuffer.length < MAX_BUFFER_LENGTH) {
          return [...prevBuffer, keypoints];
        } else {
          // If buffer is full, remove the oldest frame and add the new one
          const newBuffer = [...prevBuffer.slice(1), keypoints];
          return newBuffer;
        }
      });

      const landmarks = results.multiHandLandmarks[0];
    
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
      color: '#FF0000', lineWidth: 2  
    });
    drawLandmarks(canvasCtx, landmarks, 
      {color: '#ffff29', lineWidth: 2});

    canvasCtx.restore();
  }

  useEffect(() => {
    const hands = new Hands({
      locateFile: function(file) {
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file;
      }
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      if (!webcamRef.current.video) return;
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async function() {
          if (!webcamRef.current.video) return;
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = webcamRef.current.video.videoWidth;
          canvas.height = webcamRef.current.video.videoHeight;
          
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);
          
          await hands.send({ image: canvas });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }    
  }, []);

  // Predict on frames buffer
  useEffect(() => {
    if (framesBuffer.length === 45 && model.current) {
        console.log(framesBuffer);
      predict(framesBuffer)
        .then(result => {
          console.log(result);
        })
        .catch(error => {
          console.error('Prediction error:', error);
        });
    }
  }, [framesBuffer]);

  return (
    <div style={{ position: 'relative' }}>
      <Webcam
        ref={webcamRef}
        style={{
          position: 'absolute',
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right : 0,
          textAlign : "center",
          width: 640, 
          height: 480,
          zIndex: 1
        }}
        width={640}
        height={480}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right : 0,
          textAlign : "center",
          width: 640, 
          height: 480,
          zIndex: 1
        }}
      />
    </div>
  );
}

export default App;
