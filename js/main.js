import helper from "./helper.js";

function main() {
  const canvas = document.getElementById("myCanvas");
  const gl = canvas.getContext("webgl");
  const obj_path = "../data/sepatu_super_riyalcoba1.obj";
  const mtl_path = "../data/sepatu_super_riyalcoba1.mtl";

  if (!gl) {
    console.error("WebGL tidak didukung!");
    return;
  }

  const vertexShaderCode = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
          vNormal = aNormal;
          vPosition = vec3(uModel * vec4(aPosition, 1.0));
          gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
      }
  `;
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderCode);
  gl.compileShader(vertexShader);

  const fragmentShaderCode = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 uDiffuseColor;
    uniform vec3 uAmbientColor; // Warna ambient

    void main() {
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        vec3 normal = normalize(vNormal);
        float lightIntensity = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = uDiffuseColor * lightIntensity;
        vec3 ambient = uAmbientColor; // Tambahkan ambient
        vec3 color = diffuse + ambient; // Gabungkan diffuse dan ambient
        gl_FragColor = vec4(color, 1.0);
    }

  `;
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderCode);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Inisialisasi Matrix
  const Pmatrix = gl.getUniformLocation(program, "uProj");
  const Vmatrix = gl.getUniformLocation(program, "uView");
  const Mmatrix = gl.getUniformLocation(program, "uModel");

  const projMatrix = glMatrix.mat4.create();
  const modMatrix = glMatrix.mat4.create();
  const viewMatrix = glMatrix.mat4.create();

  glMatrix.mat4.perspective(
    projMatrix,
    glMatrix.glMatrix.toRadian(90), // fov
    canvas.width / canvas.height, // aspect
    0.5, // near
    10.0 // far
  );

  glMatrix.mat4.lookAt(
    viewMatrix,
    [0.0, 4.0, 7.0], // posisi kamera
    [0.0, 2.0, -2.0], // arah pandang kamera
    [0.0, 2.0, 3.0] // arah atas kamera
  );
  let angle = 0; // Sudut rotasi awal
  let freeze = false; // Variabel untuk mengontrol rotasi
  let vertexBuffer, normalBuffer, indexBuffer;

  // Memuat dan Parsing File .obj
  // helper.loadOBJ(obj_path, (vertices, indices, normals) => {
  helper.loadOBJWithMTL(
    obj_path,
    mtl_path,
    (vertices, indices, normals, textureCoords, materials) => {
      const diffuseColor = materials["Material"].diffuse || [0.8, 0.8, 0.8];
      const uDiffuseColor = gl.getUniformLocation(program, "uDiffuseColor");
      gl.uniform3fv(uDiffuseColor, new Float32Array(diffuseColor));

      // Buffer Vertex
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
      );

      const aPos = gl.getAttribLocation(program, "aPosition");
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPos);

      // Buffer Normal
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

      const aNormal = gl.getAttribLocation(program, "aNormal");
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aNormal);

      // Buffer Indeks
      indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
      );

      // Fungsi Render
      function render(time) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!freeze) {
          angle += 0.005; // Menambah sudut rotasi setiap frame
          glMatrix.mat4.identity(modMatrix); // Reset matriks model
          glMatrix.mat4.rotateY(modMatrix, modMatrix, angle); // Rotasi pada sumbu Y
        }

        gl.uniformMatrix4fv(Pmatrix, false, projMatrix);
        gl.uniformMatrix4fv(Vmatrix, false, viewMatrix);
        gl.uniformMatrix4fv(Mmatrix, false, modMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        window.requestAnimationFrame(render);
      }
      render(1);
    }
  );
}

main();
