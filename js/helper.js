function loadOBJ(url, callback) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load OBJ file: ${response.statusText}`);
      }
      return response.text();
    })
    .then((data) => {
      const vertices = [];
      const indices = [];
      const normals = [];
      const textureCoords = [];

      const lines = data.split("\n");
      for (let line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 1) continue; // Skip empty lines

        if (parts[0] === "v") {
          // Vertex position (x, y, z)
          if (parts.length >= 4) {
            vertices.push(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            );
          }
        } else if (parts[0] === "vn") {
          // Vertex normal (nx, ny, nz)
          if (parts.length >= 4) {
            normals.push(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            );
          }
        } else if (parts[0] === "vt") {
          // Texture coordinate (u, v)
          if (parts.length >= 3) {
            textureCoords.push(parseFloat(parts[1]), parseFloat(parts[2]));
          }
        } else if (parts[0] === "f") {
          // Face (vertices/indices)
          if (parts.length >= 4) {
            const faceIndices = parts.slice(1).map((part) => {
              const indices = part.split("/");
              return parseInt(indices[0]) - 1; // Ambil indeks vertex, kurangi 1 untuk 0-index
            });

            // Handle quad (4 vertices) by splitting into two triangles
            if (faceIndices.length === 4) {
              indices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
              indices.push(faceIndices[0], faceIndices[2], faceIndices[3]);
            } else if (faceIndices.length === 3) {
              indices.push(...faceIndices); // For triangles
            } else {
              console.warn(
                "Face with unsupported number of vertices:",
                faceIndices.length
              );
            }
          }
        }
      }

      callback(vertices, indices, normals, textureCoords);
    })
    .catch((error) => console.error("Error loading OBJ:", error));
}

function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
    /* eslint brace-style:0 */
    Ns(parts) {
      material.shininess = parseFloat(parts[0]);
    },
    Ka(parts) {
      material.ambient = parts.map(parseFloat);
    },
    Kd(parts) {
      material.diffuse = parts.map(parseFloat);
    },
    Ks(parts) {
      material.specular = parts.map(parseFloat);
    },
    Ke(parts) {
      material.emissive = parts.map(parseFloat);
    },
    Ni(parts) {
      material.opticalDensity = parseFloat(parts[0]);
    },
    d(parts) {
      material.opacity = parseFloat(parts[0]);
    },
    illum(parts) {
      material.illum = parseInt(parts[0]);
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}

function loadOBJWithMTL(objUrl, mtlUrl, callback) {
  fetch(mtlUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load MTL file: ${response.statusText}`);
      }
      return response.text();
    })
    .then((mtlData) => {
      const materials = parseMTL(mtlData);

      fetch(objUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load OBJ file: ${response.statusText}`);
          }
          return response.text();
        })
        .then((objData) => {
          const vertices = [];
          const indices = [];
          const normals = [];
          const textureCoords = [];

          const lines = objData.split("\n");
          for (let line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 1) continue; // Skip empty lines

            if (parts[0] === "v") {
              if (parts.length >= 4) {
                vertices.push(
                  parseFloat(parts[1]),
                  parseFloat(parts[2]),
                  parseFloat(parts[3])
                );
              }
            } else if (parts[0] === "vn") {
              if (parts.length >= 4) {
                normals.push(
                  parseFloat(parts[1]),
                  parseFloat(parts[2]),
                  parseFloat(parts[3])
                );
              }
            } else if (parts[0] === "vt") {
              if (parts.length >= 3) {
                textureCoords.push(parseFloat(parts[1]), parseFloat(parts[2]));
              }
            } else if (parts[0] === "f") {
              if (parts.length >= 4) {
                const faceIndices = parts.slice(1).map((part) => {
                  const indices = part.split("/");
                  return parseInt(indices[0]) - 1;
                });

                if (faceIndices.length === 4) {
                  indices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
                  indices.push(faceIndices[0], faceIndices[2], faceIndices[3]);
                } else if (faceIndices.length === 3) {
                  indices.push(...faceIndices);
                } else {
                  console.warn(
                    "Face with unsupported number of vertices:",
                    faceIndices.length
                  );
                }
              }
            }
          }

          callback(vertices, indices, normals, textureCoords, materials);
        })
        .catch((error) => console.error("Error loading OBJ:", error));
    })
    .catch((error) => console.error("Error loading MTL:", error));
}

export default {
  loadOBJ,
  loadOBJWithMTL,
};
