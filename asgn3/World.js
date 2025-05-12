// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    }
    else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_whichTexture == -3) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }
    else {
      gl_FragColor = vec4(1,0.2,0.2,1);
    }
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_whichTexture;
let u_Sampler1;
let g_texture1;

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

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
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

let g_mouseDown = false;
let g_lastX = null; // for panning the camera on mousemove

let g_blockStack = 0; // Number of blocks currently in the stack
const g_maxBlocks = 5; // Max height of the column



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

  document.getElementById("addBlockBtn").onclick = function () {
    if (g_blockStack < g_maxBlocks) {
      g_blockStack++;
      renderAllShapes();
    }
  };

  document.getElementById("removeBlockBtn").onclick = function () {
    if (g_blockStack > 0) {
      g_blockStack--;
      renderAllShapes();
    }
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

function initTextures() {
  const image0 = new Image();
  const image1 = new Image();
  image0.onload = function () {
    g_texture0 = loadTexture(image0, 0);
  };
  image1.onload = function () {
    g_texture1 = loadTexture(image1, 1);
  };
  image0.src = 'flowertile.png';  // textureNum = 0
  image1.src = 'wood.png';       // textureNum = -3
}

function loadTexture(image, unit) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  if (unit === 0) gl.uniform1i(u_Sampler0, 0);
  if (unit === 1) gl.uniform1i(u_Sampler1, 1);
  return texture;
}

function sendTextureToGLSL(image) {
  const texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Upload the image to WebGL
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Set up mipmapping and texture filtering
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Set wrap modes (repeat or clamp-to-edge depending on your use case)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.uniform1i(u_Sampler0, 0);

  console.log('Texture with mipmapping loaded:', image.width, 'x', image.height);
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

  canvas.onmousedown = function (ev) {
    g_mouseDown = true;
    g_lastX = ev.clientX;
  };
  
  canvas.onmouseup = function () {
    g_mouseDown = false;
  };
  
  canvas.onmousemove = function (ev) {
    onMove(ev);
  };  

  // setup actions from the HTML UI elements
  addActionsFromHtmlUI();

  document.onkeydown = keydown;

  initTextures(gl,0);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.8, 0.9, 1.0, 1.0);

  // animate
  requestAnimationFrame(tick);
}

function onMove(ev) {
  if (!g_mouseDown) return;

  let deltaX = ev.clientX - g_lastX;
  g_lastX = ev.clientX;

  // Calculate horizontal angle in radians
  let angle = deltaX * 0.01; // adjust sensitivity here

  // Direction vector from eye to at
  let dir = new Vector3().set(camera.at).sub(camera.eye);

  let x = dir.elements[0];
  let z = dir.elements[2];

  // Rotate around the Y axis
  let cosA = Math.cos(angle);
  let sinA = Math.sin(angle);
  let newX = x * cosA - z * sinA;
  let newZ = x * sinA + z * cosA;

  dir.elements[0] = newX;
  dir.elements[2] = newZ;

  camera.at = new Vector3().set(camera.eye).add(dir);
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

const camera = new Camera([0, 0, -1], [0, 0, 0], [0, 1, 0]);

function keydown(ev) {
  if (ev.keyCode == 87) camera.forward();   // W
  else if (ev.keyCode == 83) camera.backward(); // S
  else if (ev.keyCode == 65) camera.left();     // A
  else if (ev.keyCode == 68) camera.right();    // D
  else if (ev.keyCode == 81) camera.panLeft();  // Q
  else if (ev.keyCode == 69) camera.panRight(); // E
}


// Use Vector3 instead of raw arrays
// var g_eye = new Vector3([0, 0, -1]);
// var g_at  = new Vector3([0, 0,  0]);
// var g_up  = new Vector3([0, 1,  0]);

var g_shapesList = [];

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Setup projection matrix (perspective)
  let projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100); 
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Setup view matrix using Vector3 values
  let viewMat = new Matrix4();
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0],  camera.at.elements[1],  camera.at.elements[2],
    camera.up.elements[0],  camera.up.elements[1],  camera.up.elements[2]
  );  
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_AnimalGlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  renderScene();
}

var g_map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// const g_map = Array.from({ length: 32 }, (_, row) =>
//   Array.from({ length: 32 }, (_, col) =>
//     (row === 0 || row === 31 || col === 0 || col === 31) ? 1 : 0
//   )
// );

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (g_map[x][y] === 1) {
        const map = new Cube();
        map.color = [0.2, 0.5, 0.2, 1.0];
        map.textureNum = -3;
        const mapMatrix = new Matrix4();
        mapMatrix.translate(x - 16, -0.75, y - 16); // center it
        mapMatrix.scale(1, 1, 1);
        map.drawCube(mapMatrix);
      }
    }
  }
}



function renderScene() {

  var grey = [0.3,0.3,0.3,1.0];
  var darkgrey = [0.2,0.2,0.2,1];
  var lightgrey = [0.6,0.6,0.6,1];
  var beige = [0.8,0.8,0.4,1];
  var black = [0,0,0,1];
  var green = [0,1,1,1];

  drawMap();

  // var floor = new Cube();
  // floor.textureNum = 0;
  // var floorMatrix = new Matrix4();
  // floorMatrix.translate(0,-0.75,0.0);
  // floorMatrix.scale(10,0,10);
  // floorMatrix.translate(-0.5,0,-0.5);
  // floor.drawCube(floorMatrix);

  var floor = new Cube();
  floor.color = [0.5,0.5,0.1,1.0]
  floor.textureNum = 0;
  var floorMatrix = new Matrix4();
  floorMatrix.translate(0, -0.75, 0);
  floorMatrix.scale(32, 0, 32);
  floorMatrix.translate(-0.5, 0, -0.5);
  floor.drawCube(floorMatrix);


  var sky = new Cube();
  sky.textureNum = -1;
  var skyMatrix = new Matrix4();
  skyMatrix.scale(50,50,50);
  skyMatrix.translate(-0.5,-0.5,-0.5);
  sky.drawCube(skyMatrix);

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

  var couchMain = new Cube();
  couchMain.color = green;
  var couchMainMatrix = new Matrix4();
  couchMainMatrix.translate(0,-0.75,-1.5);
  couchMainMatrix.scale(1,0.25,0.75);
  couchMain.drawCube(couchMainMatrix);

  // var couchLeftArm = new Cube();
  // couchLeftArm.color = green;
  // var couchLeftArmMatrix = new Matrix4


  for (let i = 0; i < g_blockStack; i++) {
    const block = new Cube();
    block.color = [0.0, 0.4, 1.0, 1.0]; // blue
    block.textureNum = -3;
    const blockMatrix = new Matrix4();
    blockMatrix.translate(0.5, -0.75 + i*0.25, 0);
    blockMatrix.scale(0.25, 0.25, 0.25);
    block.drawCube(blockMatrix);
  }

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
