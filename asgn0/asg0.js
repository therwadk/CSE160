// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, 400, 400);        // Fill a rectangle with the color

  document.getElementById("submit").addEventListener('click', handleDrawEvent);

}

function handleDrawOperationEvent(v1, v2, scalar, ctx) {
  var value = document.getElementById("operations").value;
  if (value == "add") {
    let v3 = new Vector3();
    v3.set(v1);
    v3.add(v2);
    console.log(v3);
    drawVector(v3,"mediumseagreen");
  }

  else if (value == "sub") {
    let v3 = new Vector3();
    v3.set(v1);
    v3.sub(v2);
    console.log(v3);
    drawVector(v3,"mediumseagreen");
  }

  else if (value == "mul") {
    if (isNaN(scalar)) {
      alert("Please enter a valid number for scalar.");
      return;
    }

    let v3 = new Vector3();
    let v4 = new Vector3();

    v3.set(v1);
    v4.set(v2);

    v3.mul(scalar);
    v4.mul(scalar);

    console.log(v3);
    console.log(v4);

    drawVector(v3,"mediumseagreen");
    drawVector(v4,"mediumseagreen");
  }

  else if (value == "div") {
    if (isNaN(scalar) || scalar == 0) {
      alert("Please enter a valid number for scalar.");
      return;
    }

    let v3 = new Vector3();
    let v4 = new Vector3();

    v3.set(v1);
    v4.set(v2);

    v3.div(scalar);
    v4.div(scalar);

    console.log(v3);
    console.log(v4);

    drawVector(v3,"mediumseagreen");
    drawVector(v4,"mediumseagreen");
  }

  else if (value == "mag") {
    console.log("Magnitude vector 1: ", v1.magnitude());
    console.log("Magnitude vector 2: ", v2.magnitude());
  }

  else if (value == "nor") {
    v1.normalize();
    v2.normalize();
    drawVector(v1,"mediumseagreen");
    drawVector(v2,"mediumseagreen");
  }

  else if (value == "ang") {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();

    var dot = Vector3.dot(v1,v2);
    console.log("Angle Between: ", Math.acos((dot/mag1)/mag2)*(180/Math.PI) );
  }

  else if (value == "are") {
    var cross = Vector3.cross(v1,v2);
    console.log(cross.elements);
    console.log("Area: ", cross.magnitude()/2);
  }
}

function handleDrawEvent() {
  var v1_1 = parseFloat(document.getElementById("v1_1").value);
  var v1_2 = parseFloat(document.getElementById("v1_2").value);

  var v2_1 = parseFloat(document.getElementById("v2_1").value);
  var v2_2 = parseFloat(document.getElementById("v2_2").value);

  if (isNaN(v1_1) || isNaN(v1_2) || isNaN(v2_1) || isNaN(v2_2)) {
    alert("Please enter valid numbers for vector values.");
    return;
  }

  var v1 = new Vector3([v1_1, v1_2, 0]);
  var v2 = new Vector3([v2_1, v2_2, 0]);

  var canvas = document.getElementById("example");
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  drawVector(v1, "tomato");
  drawVector(v2, "dodgerblue");

  var scalar = parseFloat(document.getElementById("scalar").value);
  handleDrawOperationEvent(v1,v2,scalar,ctx);
}

function drawVector(v, color) {
  var canvas = document.getElementById("example");
  var ctx = canvas.getContext('2d');

  var originX = canvas.width/2;
  var originY = canvas.height/2;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX + v.elements[0] * 20, originY - v.elements[1] * 20);
  ctx.lineWidth = 2;
  ctx.stroke();
}
