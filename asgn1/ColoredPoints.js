// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
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

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer : true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI
let g_selectedColor = [1.0,1.0,1.0,1.0]
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;

function addActionsFromHtmlUI () {
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('clear').onclick = function() {g_shapesList = []; renderAllShapes()};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT};
  document.getElementById('triangleButton').onclick = function() {g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType = CIRCLE};
  
  document.getElementById('drawPicture').onclick = drawPicture;

  let redSlider = document.getElementById('redslide');
  redSlider.addEventListener('mouseup', function() {
    g_selectedColor[0] = this.value / 100;
  });
  redSlider.addEventListener('mousemove', function() {
    sendTextToHtml(Math.round(this.value / 100 * 255), 'redValue');
  });

  let greenSlider = document.getElementById('greenslide');
  greenSlider.addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value / 100;
  });
  greenSlider.addEventListener('mousemove', function() {
    sendTextToHtml(Math.round(this.value / 100 * 255), 'greenValue');
  });

  let blueSlider = document.getElementById('blueslide');
  blueSlider.addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value / 100;
  });
  blueSlider.addEventListener('mousemove', function() {
    sendTextToHtml(Math.round(this.value / 100 * 255), 'blueValue');
  });

  let sizeSlider = document.getElementById('sizeslide');
  sizeSlider.addEventListener('mouseup', function() {
    g_selectedSize = this.value;
  });
  sizeSlider.addEventListener('mousemove', function() {
    sendTextToHtml(Math.round(this.value), 'sizeValue');
  });

  let segmentSlider = document.getElementById('segmentslide');
  segmentSlider.addEventListener('mouseup', function() {
    g_selectedSegments = this.value;
  });
  segmentSlider.addEventListener('mousemove', function() {
    sendTextToHtml(Math.round(this.value), 'segmentValue');
  });
}

function drawPicture() {

  document.getElementById('referenceImage').style.display = 'block';

  var lightgray = [132/255,139/255,144/255, 1.0];
  var medgray = [82/255,82/255,82/255,1.0];
  var meddarkgray = [60/255,60/255,60/255,1.0];
  var darkgray = [47/255,47/255,47/255, 1.0];

  var brightgreen = [0,1,0,1]

  drawCustomTriangle([-9,2,6,-14,-13,-14], medgray);
  drawCustomTriangle([5,14,5,6,1,6], lightgray);
  drawCustomTriangle([5,14,3,14,1,6], lightgray);
  drawCustomTriangle([-9,2,6,-14,1,2], medgray);
  drawCustomTriangle([-3,14,1,2,-9,2], medgray);
  drawCustomTriangle([10,-4,13,-11,10,-12], medgray);
  drawCustomTriangle([5,16,5,6,9,9], medgray);
  drawCustomTriangle([5,16,8,16,8,10], medgray);
  drawCustomTriangle([7,11,9,9,9,11], medgray);
  drawCustomTriangle([8,14,9,14,8,16], medgray);
  drawCustomTriangle([8,14,9,14,7,10], medgray);
  drawCustomTriangle([9,11,9,14,7,10], medgray);
  drawCustomTriangle([5,16,8,16,9,17], medgray);
  drawCustomTriangle([5,16,6,18,9,17], medgray);
  drawCustomTriangle([0,16,5,16,5,14], medgray);
  drawCustomTriangle([0,16,3,14,5,14], medgray);
  drawCustomTriangle([0,16,3,14,-3,14], medgray);
  drawCustomTriangle([1,6,3,14,-3,14], medgray);
  drawCustomTriangle([0,16,0,17,-3,14], medgray);
  drawCustomTriangle([-3.5,14,0,17,-3,14], medgray);
  drawCustomTriangle([-3.5,14,0,17,-4,16], medgray);
  drawCustomTriangle([-3,17,0,17,-4,16], medgray);
  drawCustomTriangle([2,7,4,7,4.5,8], medgray);
  drawCustomTriangle([2,7,2,8,4.5,8], medgray);
  drawCustomTriangle([-6,9,-5,9,-6,8], medgray);
  drawCustomTriangle([-7,8,-7,6,-6,8], medgray);
  drawCustomTriangle([-3,14,6,-14,12,-11], meddarkgray);
  drawCustomTriangle([-1,15,-2,15.5,-2,14], lightgray);
  drawCustomTriangle([-3,15,-2,15.5,-2,14], lightgray);
  drawCustomTriangle([7,17,7,16,7.5,16.5], lightgray);
  drawCustomTriangle([7,17,6,16,6.5,17], lightgray);
  drawCustomTriangle([7,17,6,16,7,16], lightgray);
  drawCustomTriangle([1,13,1.5,12.5,1,11.5], darkgray);
  drawCustomTriangle([1,13,0.5,12,1,11.5], darkgray);
  drawCustomTriangle([7.25,13.25,6.5,12,7.25,12], darkgray);
  drawCustomTriangle([6.75,13.25,6.5,12,7.25,13.25], darkgray);
  drawCustomTriangle([-13,-12,-10,-14,-12,-15], darkgray);
  drawCustomTriangle([-13,-12,-14,-14,-12,-15], darkgray);
}


function main() {

  // set up canvas and gl variables
  setupWebGL();
  // set up glsl shader program and connect glsl varibales
  connectVariablesToGLSL();

  // setup actions from the HTML UI elements
  addActionsFromHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = handleClick;
  canvas.onmousemove = function(ev) {if (ev.buttons == 1) {handleClick(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];
// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];

function handleClick(ev) {

  // extract the event click and return the webGL coords
  let [x,y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  }
  else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  }
  else if (g_selectedType == CIRCLE) {
    point = new Circle();
    point.segments = g_selectedSegments;
  }
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();

}

function convertCoordinatesEventToGL (ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
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
