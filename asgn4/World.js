// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform vec3 u_lightColor;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    }
    else if (u_whichTexture == 0) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
    }
    else if (u_whichTexture == -3) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else {
      gl_FragColor = vec4(1,0.2,0.2,1);
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);

    // Red Green Visualization
    // if (r < 1.0) {
    //   gl_FragColor = vec4(1,0,0,1);
    // }
    // else if (r < 2.0) {
    //   gl_FragColor = vec4(0,1,0,1);
    // }

    // R^2 Visualization
    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r),1);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float NDotL = max(dot(N,L), 0.0);

    vec3 R = reflect(-L,N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // float specular = 0.0;
    // if (u_whichTexture == -1) {
    //   specular = pow(max(dot(E, R), 0.0), 3.0);

    // }

    vec3 specular = vec3(0.0);
    if (u_whichTexture == -1) {
      float specIntensity = pow(max(dot(E, R), 0.0), 3.0);
      specular = u_lightColor * specIntensity;
    }

    vec3 diffuse = vec3(gl_FragColor) * NDotL * 0.7 * u_lightColor;
    vec3 ambient = vec3(gl_FragColor) * 0.4 * u_lightColor;


    if (u_lightOn) {
      if (u_whichTexture == -1) {
        gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
      }
      else {
        gl_FragColor = vec4(diffuse+ambient, 1.0);
      }
    }
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_whichTexture;
let u_lightPos;
let u_cameraPos;
let g_texture1;
let u_lightOn;
let u_lightColor;


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

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
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

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return false;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return false;
  }

  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  if (!u_lightColor) {
    console.log('Failed to get the storage location of u_lightColor');
    return false;
  }


  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
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
let g_normalOn = false;
let g_lightOn = true;
let g_lightPos = [0,1,-2];
let g_lightColor = [1.0, 1.0, 1.0];


let g_mouseDown = false;
let g_lastX = null; // for panning the camera on mousemove




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

  document.getElementById("normalOn").onclick = function() {
    g_normalOn = true;
    console.log("normals on");
  };
  document.getElementById("normalOff").onclick = function() {
    g_normalOn = false;
    console.log("normals off");
  };

  document.getElementById("lightsOn").onclick = function() {
    g_lightOn = true;
    renderAllShapes();
  };
  document.getElementById("lightsOff").onclick = function() {
    g_lightOn = false;
    renderAllShapes();
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

  let lightXSlider = document.getElementById("lightSlideX");
  lightXSlider.addEventListener("input", function () {
    g_lightPos[0] = this.value/100;
    renderAllShapes();
    sendTextToHtml(this.value, "lightXValue");
  });

  let lightYSlider = document.getElementById("lightSlideY");
  lightYSlider.addEventListener("input", function () {
    g_lightPos[1] = this.value/100;
    renderAllShapes();
    sendTextToHtml(this.value, "lightYValue");
  });

  let lightZSlider = document.getElementById("lightSlideZ");
  lightZSlider.addEventListener("input", function () {
    g_lightPos[2] = this.value/100;
    renderAllShapes();
    sendTextToHtml(this.value, "lightZValue");
  });

  let lightColorSlider = document.getElementById("lightColorSlide");
  lightColorSlider.addEventListener("input", function () {
    let hue = (this.value / 100) * 300;  // red (0°) to purple (300°)
    g_lightColor = hslToRgb(hue);       // returns [r, g, b] in 0–1 range
    sendTextToHtml(this.value, "lightColorValue");
    renderAllShapes();
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

const camera = new Camera([0, 2, -6], [0, 0, 0], [0, 1, 0]);

function keydown(ev) {
  if (ev.keyCode == 87) camera.forward();   // W
  else if (ev.keyCode == 83) camera.backward(); // S
  else if (ev.keyCode == 65) camera.left();     // A
  else if (ev.keyCode == 68) camera.right();    // D
  else if (ev.keyCode == 81) camera.panLeft();  // Q
  else if (ev.keyCode == 69) camera.panRight(); // E
}

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
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  gl.uniform1i(u_lightOn, g_lightOn);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);


  renderScene();
}

function hslToRgb(h, s = 1.0, l = 0.8) {
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60)      [r, g, b] = [c, x, 0];
  else if (h < 120)[r, g, b] = [x, c, 0];
  else if (h < 180)[r, g, b] = [0, c, x];
  else if (h < 240)[r, g, b] = [0, x, c];
  else if (h < 300)[r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];

  return [r + m, g + m, b + m];
}



function renderScene() {

  var grey = [0.3,0.3,0.3,1.0];
  var darkgrey = [0.2,0.2,0.2,1];
  var lightgrey = [0.6,0.6,0.6,1];
  var beige = [0.8,0.8,0.4,1];
  var black = [0,0,0,1];
  var green = [0,1,1,1];

  var floor = new Cube();
  floor.color = [0.5,0.5,0.1,1.0]
  floor.textureNum = -3;
  var floorMatrix = new Matrix4();
  floorMatrix.translate(0, -0.75, 0);
  floorMatrix.scale(32, 1, 32);
  floorMatrix.translate(-0.5, -1, -0.5);
  floor.drawCube(floorMatrix);

  var sky = new Cube();
  sky.color = lightgrey;
  sky.textureNum = -2;
  if (g_normalOn) sky.textureNum = 0;
  var skyMatrix = new Matrix4();
  skyMatrix.scale(-15,-15,-15);
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

  // var cube = new Cube();
  // cube.color = green;
  // if (g_normalOn) cube.textureNum = 0;
  // var cubeMatrix = new Matrix4();
  // cubeMatrix.scale(0.5,0.5,0.5);
  // cubeMatrix.translate(1,1,-1);
  // cube.drawCube(cubeMatrix);

  var sphere = new Sphere();
  sphere.color = [0.5,0.9,0.2];
  sphere.textureNum = -1;
  if (g_normalOn) sphere.textureNum = 0;
  var sphereMatrix = new Matrix4();
  sphereMatrix.translate(1.5,0,-2);
  sphereMatrix.scale(0.75,0.75,0.75);
  sphere.drawSphere(sphereMatrix);

  var light = new Cube();
  light.color = [1,1,0,1];
  var lightMatrix = new Matrix4();
  lightMatrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  lightMatrix.scale(-0.1,-0.1,-0.1);
  lightMatrix.translate(-0.5,-0.5,-0.5);
  light.drawCube(lightMatrix);

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
    g_lightPos[0] = 3 * Math.sin(g_seconds*1.5);
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
