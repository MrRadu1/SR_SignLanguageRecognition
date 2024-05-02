import './App.css';
import Webcam from "react-webcam";
import React, { useRef } from 'react';
import Starfield from './Starfield';
import { Camera } from "@mediapipe/camera_utils";
import * as tf from '@tensorflow/tfjs';
import { useEffect, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'



function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const model = useRef(null);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [predictionCount, setPredictionCount] = useState(0);
  const [globalPredictionsArray, setGlobalPredictionsArray] = useState([]);
  const actions = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i))
    .concat(['next', 'space', 'backspace']);

  const initialFramesBuffer = Array.from({ length: 45 }, () => Array.from({ length: 63 }, () => 0));
  const [framesBuffer, setFramesBuffer] = useState(initialFramesBuffer);

  const extractKeyPoints = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      if (results.multiHandedness[0].label === 'Left') {
        const arr = landmarks.flatMap((res) => [res.x, res.y, res.z]);
        return arr;

      } else {
        const arr = landmarks.flatMap((res) => [0.5 - (res.x - 0.5), res.y, res.z]);
        return arr;
      }
    } else {
      return Array(21 * 3).fill(0);
    }
  };



  useEffect(() => {
    async function loadModel() {
      try {
        model.current = await tf.loadLayersModel(`https://storage.googleapis.com/sr_sign_language_recognition_model/model.json`);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    }
    loadModel();
    return () => {
    };
  }, []);

  const predict = async (input) => {
    const data = [input]
    const inputTensor = tf.tensor3d(data);
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
      if (prevBuffer.length < 45) {
        return [...prevBuffer, keypoints];
      } else {
        const newBuffer = [...prevBuffer.slice(1), keypoints];
        return newBuffer;
      }
    });
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
      color: '#000000', lineWidth: 3
    });
    drawLandmarks(canvasCtx, landmarks,
      { color: '#000000', fillColor: '#6B289F', lineWidth: 2 });
    canvasCtx.restore();
  }

  useEffect(() => {
    const hands = new Hands({
      locateFile: function (file) {
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
        onFrame: async function () {
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


  const handleFinalPrediction = (prediction) => {
    if (prediction !== undefined) {
      if (prediction === 26 || (globalPredictionsArray.length > 0 && globalPredictionsArray[globalPredictionsArray.length - 1] === 26)) {
        setGlobalPredictionsArray(prevPredictions => {
          if (prediction === 28) {
            return prevPredictions.slice(0, -3);
          } else {
            return [...prevPredictions, prediction];
          }
        });
      }
    }
  };


  useEffect(() => {
    if (framesBuffer.length === 45 && model.current) {
      const allFramesZero = framesBuffer.every(frame => frame.every(value => value === 0));
      if (!allFramesZero) {
        predict(framesBuffer)
          .then(result => {
            if (result === 26) {
              handleFinalPrediction(result);
            }
            if (result !== lastPrediction) {
              setLastPrediction(result);
              setPredictionCount(1);
            } else {
              setPredictionCount(prevCount => prevCount + 1);
            }
            if (predictionCount >= 1 && result === lastPrediction) {
              handleFinalPrediction(result);
              setPredictionCount(0);
            }
            setFramesBuffer(prevBuffer => {
              return prevBuffer.slice(25);
            });
          })
          .catch(error => {
            console.error('Prediction error:', error);
          });
      } else {
        setFramesBuffer([]);
      }
    }
  }, [framesBuffer, lastPrediction, predictionCount]);


  return (

    <div className="container">
      <div className="camera-container">
        <Webcam
          ref={webcamRef}
          style={{
            position: 'absolute',
            textAlign: "center",
            width: 640,
            height: 480,
            borderRadius: '15px',
            zIndex: 1
          }}
          width={640}
          height={480}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            textAlign: "center",
            borderRadius: '15px',
            width: 640,
            height: 480,
            zIndex: 1
          }}
        />
      </div>
      <div className='point-container'>
        {globalPredictionsArray.length > 0 && globalPredictionsArray[globalPredictionsArray.length - 1] === 26 ? (
          <div style={{ width: '30px', height: '30px', backgroundColor: 'green', borderRadius: '50%', marginRight: '10px' }}></div>
        ) : (
          <div style={{ width: '30px', height: '30px', backgroundColor: 'red', borderRadius: '50%', marginRight: '10px' }}></div>
        )}</div>
      <div className="boxes-container">
        <div className="box2"> Latest Predict: {actions[globalPredictionsArray[globalPredictionsArray.length - 1]]}  </div>

        <div className="line"></div>
        <div className="box"> {globalPredictionsArray.map(prediction => {
          if (prediction === 27) {
            return ' ';
          } else if (prediction === 26) {
            return '';
          } else {
            return actions[prediction].toString();
          }
        }).join('')} </div>

      </div>
    </div>
  );


}

export default App;
