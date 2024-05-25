import './App.css';
import './Rules.css';
import React from 'react';
import spaceImage from './signs/SPACE.png';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backspaceImage from './signs/BACKSPACE.png';

const generateImageArray = () => {
  const imageArray = [];
  imageArray.push('A');
  imageArray.push('C');
  imageArray.push('E');
  imageArray.push('F');
  imageArray.push('I');
  imageArray.push('M');
  imageArray.push('N');
  imageArray.push('O');
  return imageArray;
};

const generateImageArray1 = () => {
  const imageArray = [];
  imageArray.push('B');
  imageArray.push('D');
  imageArray.push('K');
  imageArray.push('L');
  imageArray.push('P');
  imageArray.push('R');
  imageArray.push('U');
  imageArray.push('V');
  imageArray.push('W');
  return imageArray;
};

const generateImageArray2 = () => {
  const imageArray = [];
  imageArray.push('G');
  imageArray.push('H');
  return imageArray;
};

const generateImageArray3 = () => {
  const imageArray = [];
  imageArray.push('Q');
  imageArray.push('S');
  imageArray.push('T');
  imageArray.push('X');
  imageArray.push('J');
  imageArray.push('Y');
  imageArray.push('Z');
  return imageArray;
};


const importImages = async (charArray) => {
  const images = [];
  const imageArray = charArray;
  for (let char of imageArray) {
    const imageUrl = (await import(`./signs/${char}.png`)).default;
    images.push(imageUrl);
  }
  return images;
};

function Rules() {

  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [images1, setImages1] = useState([]);
  const [images2, setImages2] = useState([]);
  const [images3, setImages3] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      const importedImages = await importImages(generateImageArray());
      setImages(importedImages);
      const importedImages1 = await importImages(generateImageArray1());
      setImages1(importedImages1);
      const importedImages2 = await importImages(generateImageArray2());
      setImages2(importedImages2);
      const importedImages3 = await importImages(generateImageArray3());
      setImages3(importedImages3);
    };
    fetchImages();
  }, []);

  return (
    <div className="rules-container">
      <div className="dashboard">
        <div className='button-box'>
          <span onClick={() => navigate("/SR_SignLanguageRecognition")}>Home</span>
        </div>
        <div className='button-box'>
          <span onClick={() => navigate("/SR_SignLanguageRules")}>Rules</span>
        </div>
      </div>
      <div className="full-rule">
        <div className="rule">Before every sign, until the button turns green, you have to show a:</div>
        <div className="img-container"> </div>
      </div>
      <div className="full-rule">
        <div className="rule">For a SPACE betweend signs, show : </div>
        <div className="img-container" style={{ backgroundImage: `url(${spaceImage})` }}> </div>
        <div className="rule">To delete the latest sign predicted, show : </div>
        <div className="img-container" style={{ width: '120px', backgroundImage: `url(${backspaceImage})` }}> </div>
      </div>
      <div className="full-rule" style={{ height: '70px', flexDirection: 'column', marginTop: '3%' }}>
        <div className="rule" style={{ borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' }}>Sign Alphabet</div>
      </div>
      <div className='alphabet-box'>
        <div className="full-rule" style={{ marginTop: '2%', marginBottom: '3%' }}>
          {images.map((url, index) => (
            <div key={index} className="imgRule" >
              <div key={index} className="img-container" style={{ marginLeft: '2%', backgroundImage: `url(${url})` }}> </div>
              <div className='letter' >{generateImageArray()[index]}</div>
            </div>
          ))}
        </div>
        <div className="full-rule" style={{ marginTop: '2%', marginBottom: '3%', height: '140px' }}>
          {images1.map((url, index) => (
            <div key={index} className="imgRule" >
              <div key={index} className="img-container" style={{ height: '140px', backgroundImage: `url(${url})` }}> </div>
              <div className='letter'  >{generateImageArray1()[index]}</div>
            </div>
          ))}
        </div>
        <div className="full-rule" style={{ marginTop: '2%', marginBottom: '6%' }}>
          {images2.map((url, index) => (
            <div key={index} className="imgRule" >
              <div className="img-container" style={{ height: '100px', width: '150px', backgroundImage: `url(${url})` }}> </div>
              <div className='letter'  >{generateImageArray2()[index]}</div>
            </div>
          ))}
          {images3.map((url, index) => (
            <div key={index} className="imgRule" >
              <div key={index} className="img-container" style={{ backgroundImage: `url(${url})` }}> </div>
              <div className='letter' >{generateImageArray3()[index]}</div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );

}
export default Rules;
