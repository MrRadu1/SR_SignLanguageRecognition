import './App.css';
import Webcam from "react-webcam";
import React, { useRef } from 'react';
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
  const [correctedText, setCorrectedText] = useState('');
  const actions = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i))
    .concat(['next', 'space', 'backspace']);
  const initialFramesBuffer = Array.from({ length: 30 }, () => Array.from({ length: 63 }, () => 0));
  const [framesBuffer, setFramesBuffer] = useState(initialFramesBuffer);
  const labelMap = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 
    'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25, 'next': 26, 
    'space': 27, 'backspace': 28
  };


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
      if (prevBuffer.length < 30) {
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

  const sliceArray = (arr) => {
    let secondNot26Index = -1;
    for (let i = arr.length - 1, count = 0; i >= 0; i--) {
      if (arr[i] !== 26) {
        count++;
        if (count === 2) {
          secondNot26Index = i;
          break;
        }
      }
    }
    return arr.slice(0, secondNot26Index + 1);
  }


  const handleFinalPrediction = (prediction) => {
    if (prediction !== undefined) {
      if ( (globalPredictionsArray.length === 0 &&  prediction === 26) || (globalPredictionsArray.length > 0 && globalPredictionsArray[globalPredictionsArray.length - 1] !== 26 && prediction === 26) || (globalPredictionsArray.length > 0 && globalPredictionsArray[globalPredictionsArray.length - 1] === 26)) {
        setGlobalPredictionsArray(prevPredictions => {
          if (prediction === 28) {
            return sliceArray(prevPredictions);
          } else {
            return [...prevPredictions, prediction];
          }
        });
      }
    }
  };

  const handleSpeak = () => {
    const text = globalPredictionsArray.map(prediction => {
      if (prediction === 27) {
        return ' ';
      } else if (prediction === 26) {
        return '';
      } else {
        return actions[prediction].toString();
      }
    }).join('');
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser doesn't support speech synthesis.");
    }
  };

  useEffect(() => {
    if (framesBuffer.length === 30 && model.current) {
      const allFramesZero = framesBuffer.every(frame => frame.every(value => value === 0));
      if (!allFramesZero) {
        const lastValue = framesBuffer[framesBuffer.length - 1];
        const extendedArray = [...framesBuffer, ...Array(15).fill(lastValue)];
        predict(extendedArray)
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
            if (predictionCount >= 1 && result === lastPrediction && result !== 2) {
              handleFinalPrediction(result);
              setPredictionCount(0);
            }
            if (predictionCount >= 1 && result === lastPrediction && result === 2) {
              setPredictionCount(2);
            }
            if (predictionCount >= 2 && result === lastPrediction && result === 2 ) {
              handleFinalPrediction(result);
              setPredictionCount(0);
            }
            setFramesBuffer(prevBuffer => {
              return prevBuffer.slice(10);
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

  const convertStringToArray = (input) => {
    const result = [];
    const upperInput = input.toUpperCase();
  
    for (let i = 0; i < upperInput.length; i++) {
      if (upperInput[i] === ' ') {
        result.push(labelMap['space']);
      } else if (labelMap.hasOwnProperty(upperInput[i])) {
        result.push(labelMap[upperInput[i]]);
      }
    }
  
    return result;
  };

  const ArrayToString = (input) => { 
    const result = globalPredictionsArray.map(prediction => {
          
      if (prediction === 27) {
        return ' ';
      } else if (prediction === 26) {
        return '';
      } else {
        return actions[prediction].toString();
      }
    }).join('')
    return result;
  };
  

  useEffect(() => {
    const correctSpelling = async () => {
      if (globalPredictionsArray.length===0) return; // Prevent unnecessary requests
       const inputText = globalPredictionsArray.map(prediction => {
        if (prediction === 27) {
          return ' ';
        } else if (prediction === 26) {
          return '';
        } else {
          return actions[prediction].toString();
        }
      }).join('');
      try {

        const response = await fetch('http://127.0.0.1:5000/correct_spelling', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: inputText.toLowerCase() }),
        });
        const data = await response.json();
        const data_temp = data.corrected_text;
        if (data.corrected_text.toUpperCase() !== ArrayToString(globalPredictionsArray)) { 
          console.log("da");
           setCorrectedText(data.corrected_text);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    correctSpelling();
  }, [globalPredictionsArray]);

  const handleConvert = () => {
    setGlobalPredictionsArray(convertStringToArray(correctedText));
    setCorrectedText('');
  };

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
      <div style={{marginBottom: '20px', width: '440px', height: '180px', border: '#ffffff 1px solid' , borderRadius: '15px', display: 'flex', flexDirection: 'column'}}>
      <div className="box2"> Latest Predict: {actions[globalPredictionsArray[globalPredictionsArray.length - 1]]}  </div>
      <div className="line"></div>
      <div className="box3">
          Have you meant: 
          {correctedText && (correctedText.toUpperCase() !== ArrayToString(globalPredictionsArray)) && (<button className="overlay-button" onClick={handleConvert}>{correctedText}</button> )}
        </div>
        </div>
         <div className="box"> {globalPredictionsArray.map(prediction => {
          
          if (prediction === 27) {
            return ' ';
          } else if (prediction === 26) {
            return '';
          } else {
            return actions[prediction].toString();
          }
        }).join('')} </div>
         <button className="gradientButton" onClick={handleSpeak}>Hear the text</button>

      </div>
    </div>
  );

}
export default App;
