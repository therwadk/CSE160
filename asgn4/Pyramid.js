class Pyramid {
    constructor() {
      this.type = 'pyramid';
      this.color = [1.0, 1.0, 1.0, 1.0]; // default white
      this.matrix = new Matrix4();
    }
  
    drawPyramid(matrix) {
      var rgba = this.color;
      this.matrix = matrix;
  
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // Base of pyramid
      drawTriangle3D([0,0,0, 0,0,1, 1,0,0]);
      drawTriangle3D([0,0,1, 1,0,0, 1,0,1]);
  
      var apex = [0.5, 1, 0.5]; // Tip at center top
  
      var colorScale = 0.9;
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);
  
      // Front face
      drawTriangle3D([0,0,0, 1,0,0, apex[0], apex[1], apex[2]]);
  
      colorScale = 0.8;
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);
  
      // Right face
      drawTriangle3D([1,0,0, 1,0,1, apex[0], apex[1], apex[2]]);
  
      colorScale = 0.7;
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);
  
      // Back face
      drawTriangle3D([1,0,1, 0,0,1, apex[0], apex[1], apex[2]]);
  
      colorScale = 0.6;
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);
  
      // Left face
      drawTriangle3D([0,0,1, 0,0,0, apex[0], apex[1], apex[2]]);
    }
  }
  