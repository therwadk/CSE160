class Cube {
    constructor () {
      this.type = 'cube';
      // this.position = [0.0,0.0,0.0];
      this.color = [1.0,1.0,1.0,1.0];
      // this.size = 5.0;
      // this.segments = 10;
      this.matrix = new Matrix4();
    }
  
    drawCube(matrix) {
      // var xy = this.position;
      var rgba = this.color;
      this.matrix = matrix
      // var size = this.size;
  
      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      //Front of cube
      drawTriangle3D([0,0,0, 1,1,0, 1,0,0]);
      drawTriangle3D([0,0,0, 0,1,0, 1,1,0]);

      var colorScale = 0.9
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

      //Right of cube
      drawTriangle3D([1,0,0, 1,0,1, 1,1,1]);
      drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);

      colorScale = 0.8
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

      //Top of cube
      drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
      drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);
      
      colorScale = 0.7
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

      //Left of cube
      drawTriangle3D([0,0,0, 0,0,1, 0,1,1]);
      drawTriangle3D([0,0,0, 0,1,0, 0,1,1]);

      colorScale = 0.6
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

      //Back of cube
      drawTriangle3D([1,1,1, 0,0,1, 0,1,1]);
      drawTriangle3D([1,1,1, 0,0,1, 1,0,1]);

      colorScale = 0.5
      gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

      //Bottom of cube
      drawTriangle3D([0,0,0, 0,0,1, 1,0,0]);
      drawTriangle3D([0,0,1, 1,0,0, 1,0,1]);
    }

}
