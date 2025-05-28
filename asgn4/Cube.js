class Cube {
    constructor () {
      this.type = 'cube';
      // this.position = [0.0,0.0,0.0];
      this.color = [1.0,1.0,1.0,1.0];
      // this.size = 5.0;
      // this.segments = 10;
      this.matrix = new Matrix4();
      this.textureNum = -2;
    }
  
    drawCube(matrix) {
      var rgba = this.color;
      this.matrix = matrix;
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

      // Front face (Z-)
      drawTriangle3DUVNormal(
        [0,0,0, 1,1,0, 1,0,0],
        [0,0, 1,1, 1,0],
        [0,0,-1, 0,0,-1, 0,0,-1]
      );
      drawTriangle3DUVNormal(
        [0,0,0, 0,1,0, 1,1,0],
        [0,0, 0,1, 1,1],
        [0,0,-1, 0,0,-1, 0,0,-1]
      );

      // Right face (X+)
      drawTriangle3DUVNormal(
        [1,0,0, 1,0,1, 1,1,1],
        [0,0, 1,0, 1,1],
        [1,0,0, 1,0,0, 1,0,0]
      );
      drawTriangle3DUVNormal(
        [1,0,0, 1,1,0, 1,1,1],
        [0,0, 0,1, 1,1],
        [1,0,0, 1,0,0, 1,0,0]
      );

      // Top face (Y+)
      drawTriangle3DUVNormal(
        [0,1,0, 0,1,1, 1,1,1],
        [0,0, 0,1, 1,1],
        [0,1,0, 0,1,0, 0,1,0]
      );
      drawTriangle3DUVNormal(
        [0,1,0, 1,1,1, 1,1,0],
        [0,0, 1,1, 1,0],
        [0,1,0, 0,1,0, 0,1,0]
      );

      // Left face (X-)
      drawTriangle3DUVNormal(
        [0,0,0, 0,0,1, 0,1,1],
        [0,0, 1,0, 1,1],
        [-1,0,0, -1,0,0, -1,0,0]
      );
      drawTriangle3DUVNormal(
        [0,0,0, 0,1,0, 0,1,1],
        [0,0, 0,1, 1,1],
        [-1,0,0, -1,0,0, -1,0,0]
      );

      // Back face (Z+)
      drawTriangle3DUVNormal(
        [1,1,1, 0,0,1, 0,1,1],
        [1,1, 0,0, 0,1],
        [0,0,1, 0,0,1, 0,0,1]
      );
      drawTriangle3DUVNormal(
        [1,1,1, 0,0,1, 1,0,1],
        [1,1, 0,0, 1,0],
        [0,0,1, 0,0,1, 0,0,1]
      );

      // Bottom face (Y-)
      drawTriangle3DUVNormal(
        [0,0,0, 0,0,1, 1,0,0],
        [0,0, 0,1, 1,0],
        [0,-1,0, 0,-1,0, 0,-1,0]
      );
      drawTriangle3DUVNormal(
        [0,0,1, 1,0,0, 1,0,1],
        [0,1, 1,0, 1,1],
        [0,-1,0, 0,-1,0, 0,-1,0]
      );
    }

}
