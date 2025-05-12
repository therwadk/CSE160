class Triangle {
    constructor () {
      this.type = 'triangle';
      this.position = [0.0,0.0,0.0];
      this.color = [1.0,1.0,1.0,1.0];
      this.size = 5.0;
    }
  
    render() {
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;
  
      // Pass the position of a point to a_Position variable
    //   gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      gl.uniform1f(u_Size,size);
      // Draw
      // gl.drawArrays(gl.POINTS, 0, 1);
      var d = this.size/200.0
      drawTriangle( [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d] );
    }
}

function drawTriangle(vertices) {
  var n = 3; // The number of vertices

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer); // use global buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawCustomTriangle(coords20, color) {
  // Convert from -20..20 coordinates to clip space (-1..1)
  let coordsClip = coords20.map(v => v / 20);

  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsClip), gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// function drawTriangle3D(vertices) {
//   var n = 3; // The number of vertices

//   gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer); // use the global buffer
//   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

//   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
//   gl.enableVertexAttribArray(a_Position);

//   gl.drawArrays(gl.TRIANGLES, 0, n);
// }

function drawTriangle3D(vertices) {
  const n = 3;

  // Upload vertex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawTriangle3DUV(vertices, uv) {
  var n = 3; // The number of vertices

  // upload vertex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer); // use the global buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // pass uv coordinates
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);

  // gl.deleteBuffer(uvBuffer); // Optional: clean up temporary buffer
}