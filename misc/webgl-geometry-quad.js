// Nick Hinds and Jason Moon
// texture-transparency
// 4-7-20
/*
 * A simple object to encapsulate the data and operations of object rasterization
 */
function WebGLGeometryQuad(gl) {
	this.gl = gl;
    this.worldMatrix = new Matrix4();

    this.textures = []; // Bonus todo #2
	// -----------------------------------------------------------------------------
	this.create = function(rawImage1, rawImage2) {
        var verts = [
            -1.0,   -1.0,   0.0,
            1.0,    -1.0,   0.0,
            -1.0,   1.0,    0.0,
            1.0,    1.0,    0.0
        ];

        var normals = [
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0,
        ];

        var uvs = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];

        var indices = [0, 1, 2, 2, 1, 3];
        this.indexCount = indices.length;

        // create the position and color information for this object and send it to the GPU
        this.vertexBuffer = gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        this.texCoordsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        if (rawImage1) { // Bonus todo #2
            // 1. create the texture (uncomment when ready)
            this.textures[0] = this.gl.createTexture();

            // 2. todo bind the texture
            this.gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);

            // needed for the way browsers load images, ignore this
            this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            // 3. todo set wrap modes (for s and t) for the texture
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            // 4. todo set filtering modes (magnification and minification)
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // 5. send the image WebGL to use as this texture
            this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rawImage1);

            // We're done for now, unbind
            this.gl.bindTexture(gl.TEXTURE_2D, null);
        }
        if (rawImage2) { // Bonus todo #2
            // 1. create the texture (uncomment when ready)
            this.textures[1] = this.gl.createTexture();

            // 2. todo bind the texture
            this.gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);

            // needed for the way browsers load images, ignore this
            this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            // 3. todo set wrap modes (for s and t) for the texture
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            // 4. todo set filtering modes (magnification and minification)
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // 5. send the image WebGL to use as this texture
            this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rawImage2);

            // We're done for now, unbind
            this.gl.bindTexture(gl.TEXTURE_2D, null);
        }
	}

	// -------------------------------------------------------------------------
	this.render = function(camera, projectionMatrix, shaderProgram) {
        this.gl.useProgram(shaderProgram);

        var attributes = shaderProgram.attributes;
        var uniforms = shaderProgram.uniforms;

        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            attributes.vertexPositionAttribute,
            3,
            gl.FLOAT,
            gl.FALSE,
            0,
            0
        );
        this.gl.enableVertexAttribArray(attributes.vertexPositionAttribute);

        if (attributes.hasOwnProperty('vertexNormalsAttribute')) {
            this.gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            this.gl.vertexAttribPointer(
                attributes.vertexNormalsAttribute,
                3,
                this.gl.FLOAT,
                this.gl.FALSE,
                0,
                0
            );
            this.gl.enableVertexAttribArray(attributes.vertexNormalsAttribute);
        }

        if (attributes.hasOwnProperty('vertexTexcoordsAttribute')) {
            this.gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
            this.gl.vertexAttribPointer(
                attributes.vertexTexcoordsAttribute,
                2,
                gl.FLOAT,
                gl.FALSE,
                0,
                0
            );
            this.gl.enableVertexAttribArray(attributes.vertexTexcoordsAttribute);
        }

        // Bonus todo #2
        gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uTexture"), 0);
        gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uTextureBonus"), 1);
        // Bonus todo #2
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
        // Bonus todo #2
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);

        // Send our matrices to the shader
        this.gl.uniformMatrix4fv(uniforms.worldMatrixUniform, false, this.worldMatrix.clone().transpose().elements);
        this.gl.uniformMatrix4fv(uniforms.viewMatrixUniform, false, camera.getViewMatrix().clone().transpose().elements);
        this.gl.uniformMatrix4fv(uniforms.projectionMatrixUniform, false, projectionMatrix.clone().transpose().elements);
        this.gl.uniform1f(uniforms.timeUniform, time.secondsElapsedSinceStart);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.disableVertexAttribArray(attributes.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(attributes.vertexNormalsAttribute);

        if (attributes.hasOwnProperty('vertexTexcoordsAttribute')) {
            this.gl.disableVertexAttribArray(attributes.vertexTexcoordsAttribute);
        }
	}
}