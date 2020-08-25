// Nick Hinds and Jason Moon
// texture-transparency
// 4-7-20

'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var sphereGeometryList = []; // this will be created after loading from a file
var groundGeometry = null;   // this will be procedurally created

var projectionMatrix = new Matrix4();

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var textureShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
// all of this is stored in memory on the CPU side and must be fed to the GPU
var loadedAssets = {
    textureTextVS: null, textureTextFS: null, // our textured shader code text
    sphereJSON: null,                         // the raw JSON for our sphere model
    uvGridImage: null, texture2Image:null     // a basic test image and added image Bonus todo #2
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl", { alpha: false });
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        // todo enable depth test (z-buffering)
        gl.enable(gl.DEPTH_TEST);
        // todo enable backface culling
        gl.enable(gl.CULL_FACE);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    // a list of data to fetch from the "server" (our hard drive)
    var filePromises = [
        fetch('./shaders/unlit.textured.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/unlit.textured.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/uvgrid.png'),
        loadImage('./data/texture2.png') // Bonus todo #2
    ];

    // once all files are downloaded, this promise function will execute
    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.textureTextVS = values[0]; // from 1st fetch
        loadedAssets.textureTextFS = values[1]; // from 2nd fetch
        loadedAssets.sphereJSON = values[2];    // from 3rd fetch
        loadedAssets.uvGridImage = values[3];   // from loadImage
        loadedAssets.texture2Image = values[4];  // From loadImage for Bonus Todo #2
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    textureShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.textureTextVS, loadedAssets.textureTextFS);

    textureShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(textureShaderProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(textureShaderProgram, "aTexcoords")
    };

    textureShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uProjectionMatrix"),
        alphaUniform: gl.getUniformLocation(textureShaderProgram, "uAlpha"),
        timeUniform: gl.getUniformLocation(textureShaderProgram, "uTime"), // Bonus todo #1
    };
}

// -------------------------------------------------------------------------
function createScene() {
    groundGeometry = new WebGLGeometryQuad(gl, textureShaderProgram);
    groundGeometry.create(loadedAssets.uvGridImage, loadedAssets.texture2Image); // Bonus todo #2

    // make it bigger
    var scale = new Matrix4().scale(10.0, 10.0, 10.0);

    // compensate for the model being flipped on its side
    var rotation = new Matrix4().setRotationX(-90);

    groundGeometry.worldMatrix.multiplyRightSide(rotation);
    groundGeometry.worldMatrix.multiplyRightSide(scale);

    for (var i = 0; i < 3; ++i) {
        var sphereGeometry = new WebGLGeometryJSON(gl, textureShaderProgram);
        sphereGeometry.create(loadedAssets.sphereJSON, loadedAssets.uvGridImage, loadedAssets.texture2Image); // Bonus todo #2

        // Scale it down so that the diameter is 3 (model is at 100x scale)
        var scale = new Matrix4().scale(0.03, 0.03, 0.03);

        sphereGeometry.worldMatrix.setIdentity();
        sphereGeometry.worldMatrix.multiplyRightSide(scale);

        // raise it by the radius to make it sit on the ground
        sphereGeometry.worldMatrix.translate(0, 1.5, -5 + i * 5);
        sphereGeometry.alpha = 0.2 + 0.8 * (i / 2);

        sphereGeometryList.push(sphereGeometry);
    }
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    camera.update(time.deltaTime, time.secondsElapsedSinceStart);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projectionMatrix.setPerspective(45, aspectRatio, 0.1, 1000);

    groundGeometry.render(camera, projectionMatrix, textureShaderProgram);

    // todo
    //   1. enable blending
    gl.enable(gl.BLEND);
    //   2. set blend mode source to gl.SRC_ALPHA and destination to gl.ONE_MINUS_SRC_ALPHA
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const orderdSpereGeometryList = sphereGeometryList.sort(function(a,b) {
        const lastSphere = a.getPosition().length();
        const nextSphere = b.getPosition().length();

        return lastSphere > nextSphere ? -1 : 1;
    });

    // uncomment when directed by guide
    for (var i = 0; i < orderdSpereGeometryList.length; ++i) {
        orderdSpereGeometryList[i].render(camera, projectionMatrix, textureShaderProgram);
    }

    // todo - disable blending
    gl.disable(gl.BLEND);
}
