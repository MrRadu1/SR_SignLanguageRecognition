return (
  <div style={{ position: 'relative', width: '640px', height: '630px' , left: '25%'}}>
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
    <div style={{ position: 'absolute', bottom: 0, left: '30%', zIndex: 2, backgroundColor: 'white', fontSize: '15px' }}>
      <h2>Global Predictions</h2>
      <h2>
        {globalPredictionsArray.map(prediction => {
          if (prediction === 27) {
            return ' ';
          } else if (prediction === 26) {
            return '';
          } else {
            return actions[prediction].toString();
          }
        }).join('')}
      </h2>
      {globalPredictionsArray.length > 0 && globalPredictionsArray[globalPredictionsArray.length - 1] === 26 ? (
        <div style={{ width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '50%', marginTop: '5px' }}></div>
      ) : (
        <div style={{ width: '10px', height: '10px', backgroundColor: 'red', borderRadius: '50%', marginTop: '5px' }}></div>
      )}
    </div>
  </div>
);