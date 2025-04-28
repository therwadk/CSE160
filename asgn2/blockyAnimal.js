// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

var g_lastFrameTime = performance.now(); // time at last frame
var g_frameCount = 0; // how many frames since last FPS update
var g_fps = 0; // current FPS

let g_vertexBuffer = null;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", {preserveDrawingBuffer : true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  g_vertexBuffer = gl.createBuffer();
  if (!g_vertexBuffer) {
    console.log('Failed to create the global buffer');
    return;
  }
}

function connectVariablesToGLSL () {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI
let g_selectedColor = [1.0,1.0,1.0,1.0]
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_AnimalGlobalRotation = 0;
let g_headAngleX = 0;
let g_headAngleY = 0;
let g_headAngleZ = 0;
let g_lEyebrowPos = 5;
let g_rEyebrowPos = 5;
let g_rEyeScaleY = 1.0;    // starting Y scale of right eye
let g_hatSpinAngle = 0;
let g_Animation = true;
let g_isShiftAnimation = false;  // Whether special shift-click animation is happening
let g_shiftAnimProgress = 0;      // Progress from 0 to 1


function addActionsFromHtmlUI () {

  document.getElementById("animationOn").onclick = function() {
    g_Animation = true;
  };
  document.getElementById("animationOff").onclick = function() {
    g_Animation = false;

    document.getElementById('headXslide').value = g_headAngleX;
    sendTextToHtml(Math.round(g_headAngleX), 'headXValue');

    document.getElementById('headYslide').value = g_headAngleY;
    sendTextToHtml(Math.round(g_headAngleY), 'headYValue');
  };

  let angleSlider = document.getElementById('angleslide');
  angleSlider.addEventListener('mousemove', function() {
    g_AnimalGlobalRotation = this.value;
    renderAllShapes();
  });
  angleSlider.addEventListener('mousemove', function() {
    sendTextToHtml(g_AnimalGlobalRotation, 'angleValue');
  });

  let headXSlider = document.getElementById('headXslide');
  headXSlider.addEventListener('mousemove', function() {
    g_headAngleX = this.value
    renderAllShapes();
  });
  headXSlider.addEventListener('mousemove', function() {
    sendTextToHtml(g_headAngleX, 'headXValue');
  });

  let headYSlider = document.getElementById('headYslide');
  headYSlider.addEventListener('mousemove', function() {
    g_headAngleY = this.value
    renderAllShapes();
  });
  headYSlider.addEventListener('mousemove', function() {
    sendTextToHtml(g_headAngleY, 'headYValue');
  });

  let lEyebrowSlider = document.getElementById('lEyebrowslide');
  lEyebrowSlider.addEventListener('mousemove', function() {
    g_lEyebrowPos = this.value
    renderAllShapes();
  });
  lEyebrowSlider.addEventListener('mousemove', function() {
    sendTextToHtml(g_lEyebrowPos, 'lEyebrowValue');
  });

  let rEyebrowSlider = document.getElementById('rEyebrowslide');
  rEyebrowSlider.addEventListener('mousemove', function() {
    g_rEyebrowPos = this.value
    renderAllShapes();
  });
  rEyebrowSlider.addEventListener('mousemove', function() {
    sendTextToHtml(g_rEyebrowPos, 'rEyebrowValue');
  });

}

function handleClick(ev) {
  if (ev.shiftKey) {
    g_headAngleX = 0;
    g_headAngleY = 0;
    g_headAngleZ = 0;
    g_rEyebrowPos = 5;  // Reset to slider value
    g_rEyeScaleY = 1.0; // Reset eye scale
    g_isShiftAnimation = true;
    g_shiftAnimProgress = 0;
    return;
  }
}

function main() {

  // set up canvas and gl variables
  setupWebGL();
  // set up glsl shader program and connect glsl varibales
  connectVariablesToGLSL();

  // setup actions from the HTML UI elements
  addActionsFromHtmlUI();

  canvas.onmousedown = handleClick;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.8, 0.9, 1.0, 1.0);

  // animate
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick () {
  g_seconds = performance.now() / 1000.0;

  // FPS calculation
  let now = performance.now();
  g_frameCount++;
  if (now - g_lastFrameTime >= 1000.0) { // One second passed
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFrameTime = now;
    sendTextToHtml(g_fps, 'fpsValue'); // Update FPS on HTML
  }

  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

var g_shapesList = [];

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var globalRotMat = new Matrix4().rotate(g_AnimalGlobalRotation,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  renderScene();
}

function renderScene() {

  var grey = [0.3,0.3,0.3,1.0];
  var darkgrey = [0.2,0.2,0.2,1];
  var lightgrey = [0.6,0.6,0.6,1];
  var beige = [0.8,0.8,0.4,1];
  var black = [0,0,0,1];
  var green = [0,1,1,1];

  var body = new Cube();
  body.color = grey;
  var bodyMatrix = new Matrix4();
  bodyMatrix.setTranslate(-0.25,-0.6,0);
  // bodyMatrix.rotate(15,0.25,-1,0);
  var bodyChildMatrix = new Matrix4(bodyMatrix);
  bodyMatrix.scale(0.4,0.5,0.25);
  body.drawCube(bodyMatrix);
  
  var head = new Cube();
  head.color = grey
  var headMatrix = new Matrix4(bodyChildMatrix);
  headMatrix.translate(0.025, 0.55, 0);  // Move up to where the head sits
  headMatrix.translate(0.175, 0.175, 0.125);  // Move pivot point to center of head (half of scaled size)
  headMatrix.rotate(g_headAngleZ, 0, 0, 1);   // Rotate around Z first
  headMatrix.rotate(g_headAngleY, 0, 1, 0);   // Rotate around Y axis
  headMatrix.rotate(g_headAngleX, 1, 0, 0);   // Rotate around X axis
  headMatrix.translate(-0.175, -0.175, -0.125);  // Move pivot back
  var headChildMatrix = new Matrix4(headMatrix);
  headMatrix.scale(0.35, 0.35, 0.25);   // Now apply scale
  head.drawCube(headMatrix);

  var tail = new Cube();
  tail.color = darkgrey;
  var tailMatrix = new Matrix4(bodyChildMatrix);
  tailMatrix.translate(0.15,0,0.25);
  tailMatrix.scale(0.07,0.07,0.07);
  tail.drawCube(tailMatrix);

  var leftLeg = new Cube();
  leftLeg.color = darkgrey;
  var leftLegMatrix = new Matrix4(bodyChildMatrix);
  leftLegMatrix.translate(0,-0.1,0.05);
  leftLegMatrix.scale(0.15,0.1,0.2,1);
  leftLeg.drawCube(leftLegMatrix);

  var leftFoot = new Cube();
  leftFoot.color = darkgrey;
  var leftFootMatrix = new Matrix4(bodyChildMatrix);
  leftFootMatrix.translate(0,-0.1,0);
  leftFootMatrix.scale(0.15,0.05,0.2,1);
  leftFoot.drawCube(leftFootMatrix);

  var rightFoot = new Cube();
  rightFoot.color = darkgrey;
  var rightFootMatrix = new Matrix4(bodyChildMatrix);
  rightFootMatrix.translate(0.25,-0.1,0);
  rightFootMatrix.scale(0.15,0.05,0.2,1);
  rightFoot.drawCube(rightFootMatrix);

  var belly = new Cube();
  belly.color = lightgrey;
  var bellyMatrix = new Matrix4(bodyChildMatrix);
  bellyMatrix.translate(0.07,0.02,-0.001);
  bellyMatrix.scale(0.25,0.4,0.1);
  belly.drawCube(bellyMatrix);

  var rightLeg = new Cube();
  rightLeg.color = darkgrey;
  var rightLegMatrix = new Matrix4(bodyChildMatrix);
  rightLegMatrix.translate(0.25,-0.1,0.05);
  rightLegMatrix.scale(0.15,0.1,0.2,1);
  rightLeg.drawCube(rightLegMatrix);

  var snout = new Cube();
  snout.color = beige;
  var snoutMatrix = new Matrix4(headChildMatrix);
  snoutMatrix.translate(0.1,0.05,-0.05);
  snoutMatrix.rotate(10,1,0,0);
  snoutMatrix.scale(0.15,0.2,0.1);
  snout.drawCube(snoutMatrix);

  var nose = new Cube();
  nose.color = darkgrey;
  var noseMatrix = new Matrix4(headChildMatrix);
  noseMatrix.translate(0.125,0.06,-0.07);
  noseMatrix.scale(0.1,0.05,0.2);
  nose.drawCube(noseMatrix);

  var leftEyebrow = new Cube();
  leftEyebrow.color = darkgrey;
  var leftEyebrowMatrix = new Matrix4(headChildMatrix);
  leftEyebrowMatrix.translate(0.02,g_lEyebrowPos/100+0.2,-0.01);
  leftEyebrowMatrix.scale(0.1,0.05,0.2);
  leftEyebrow.drawCube(leftEyebrowMatrix);

  var rightEyebrow = new Cube();
  rightEyebrow.color = darkgrey;
  var rightEyebrowMatrix = new Matrix4(headChildMatrix);
  rightEyebrowMatrix.translate(0.23, g_rEyebrowPos/100 + 0.2, -0.01);
  rightEyebrowMatrix.scale(0.1,0.05,0.2);
  rightEyebrow.drawCube(rightEyebrowMatrix);

  var leftEye = new Cube();
  leftEye.color = black;
  var leftEyeMatrix = new Matrix4(headChildMatrix);
  leftEyeMatrix.translate(0.02,0.15,-0.001);
  leftEyeMatrix.scale(0.05,0.05,0.05);
  leftEye.drawCube(leftEyeMatrix);

  var rightEye = new Cube();
  rightEye.color = black;
  var rightEyeMatrix = new Matrix4(headChildMatrix);
  rightEyeMatrix.translate(0.27, 0.15 + 0.025 * (1 - g_rEyeScaleY), -0.001);
  rightEyeMatrix.scale(0.05, 0.05 * g_rEyeScaleY, 0.05);
  rightEye.drawCube(rightEyeMatrix);  

  var leftEar = new Cube();
  leftEar.color = grey;
  var leftEarMatrix = new Matrix4(headChildMatrix);
  leftEarMatrix.translate(0,0.28,0.05);
  leftEarMatrix.scale(0.1,0.1,0.1);
  leftEarMatrix.rotate(30,0,0,1);
  leftEar.drawCube(leftEarMatrix);

  var rightEar = new Cube();
  rightEar.color = grey;
  var rightEarMatrix = new Matrix4(headChildMatrix);
  rightEarMatrix.translate(0.3,0.3,0.05);
  rightEarMatrix.scale(0.1,0.1,0.1);
  rightEarMatrix.rotate(-20,0,0,1);
  rightEar.drawCube(rightEarMatrix);

  var hat = new Pyramid();
  hat.color = green;
  var hatMatrix = new Matrix4(bodyChildMatrix);
  hatMatrix.translate(0.2, 1.15, 0.1); // Move to center-top first
  hatMatrix.rotate(g_hatSpinAngle, 0, 1, 0); // Spin around Y axis
  hatMatrix.translate(-0.1, -0.1, -0.1); // Undo half size (0.2/2 = 0.1) so scaling happens correctly
  hatMatrix.scale(0.2, 0.3, 0.2); // Then apply scaling
  hat.drawPyramid(hatMatrix);
}

function updateAnimationAngles() {
  if (g_isShiftAnimation) {
    g_shiftAnimProgress += 0.02;

    if (g_shiftAnimProgress < 0.5) {
      g_headAngleZ = -40 * g_shiftAnimProgress;
      g_headAngleX = 0;
      g_headAngleY = 0;

      g_rEyebrowPos = 5 - 6 * g_shiftAnimProgress; // 5 → 2
      g_rEyeScaleY = 1.0 - 0.04 * (g_shiftAnimProgress * 2); // 1.0 → 0.96
    } else if (g_shiftAnimProgress < 1.0) {
      g_headAngleZ = -20 * (1 - (g_shiftAnimProgress - 0.5) * 2);
      g_headAngleX = 0;
      g_headAngleY = 0;

      g_rEyebrowPos = 2 + 6 * (g_shiftAnimProgress - 0.5) * 2; // 2 → 5
      g_rEyeScaleY = 0.96 + 0.04 * ((g_shiftAnimProgress - 0.5) * 2); // 0.96 → 1.0
    } else {
      g_isShiftAnimation = false;
      g_shiftAnimProgress = 0;
      g_rEyebrowPos = 5;
      g_rEyeScaleY = 1.0;
    }

    return;
  }

  // Normal animation
  if (g_Animation) {
    g_headAngleX = 20 * Math.sin(g_seconds * 2);
    g_headAngleY = 20 * Math.sin(g_seconds);
    g_headAngleZ = 0;
    g_rEyeScaleY = 1.0;
    g_hatSpinAngle = (g_seconds * 360) % 360;
  }
}

function sendTextToHtml (text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get" + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
