var gl;
var gl_program;
var gl_program_loc = {};
var mvmat, projmat;
var vbo;
var indices;
var requestId;
var boidc;

var HEIGHT = 1.0;
var WIDTH = 1.0;

var NUM_BOIDS = 100;

function update( time ) {
    // Setup another request
    requestId = requestAnimFrame( update, document.getElementById('c') );
    
    boidc.update();
    boidc.move();
    
    // Finally, display
    display();
}

function initBuffers() {
    vbo = gl.createBuffer();
    indices = gl.createBuffer();

    // Bind and set the data of the vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0,  0.5, 0.0, 
                                                     -1.0, -0.5, 0.0,
                                                      1.0,  0.0, 0.0]),
                                                      gl.STATIC_DRAW);
    
    // Bind and set the data of the lineIndices buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2]), gl.STATIC_DRAW);
}

/**
 * Initializes all variables, shaders, and WebGL options 
 * needed for this program.
 */ 
function init() {
    // Set the clear color to fully transparent black
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    gl.disable(gl.BLEND);
    
    // Create the model-view matrix and projection matrix
    mvmat = mat4.create();
    projmat = mat4.create();
    nmat = mat3.create();
    
    // Create all buffer objects
    initBuffers();
    
    // Initialize the shaders
    initShaders();
    
    // Reshape the canvas, and setup the viewport and projection
    reshape();
    
    // Generate a number of boids:
    boidc = new BoidController( WIDTH, HEIGHT, NUM_BOIDS );
    
    requestId = requestAnimFrame( update, document.getElementById('c') );
}

/**
 * Loads and compiles a given shader as the given type.
 * @param type WebGL shader type to load (gl.VERTEX_SHADER | gl.FRAGMENT_SHADER)
 * @param shaderSrc String source of the shader to load
 * @return Fully compiled shader, or null on error
 */
function loadShader(type, shaderSrc) {
    var shader = gl.createShader(type);
    
    // Load the shader source
    gl.shaderSource(shader, shaderSrc);
    
    // Compile the shader
    gl.compileShader(shader);
    
    // Check the compile status
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
        !gl.isContextLost()) {
        var infoLog = gl.getShaderInfoLog(shader);
        window.console.log("Error compiling shader:\n" + infoLog);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * Initializes the shaders used for the program
 */
function initShaders() {
    // Load the shaders and compile them (shaders are located in the HTML)
    var vertexShader   = loadShader(   gl.VERTEX_SHADER, document.getElementById('vshader').innerHTML );
    var fragmentShader = loadShader( gl.FRAGMENT_SHADER, document.getElementById('fshader').innerHTML );
    
    // Create the program object
    var programObject = gl.createProgram();
    gl.attachShader(programObject, vertexShader);
    gl.attachShader(programObject, fragmentShader);
    gl_program = programObject;
    
    // link the program
    gl.linkProgram(gl_program);
    
    // verify link
    var linked = gl.getProgramParameter(gl_program, gl.LINK_STATUS);
    if( !linked && !gl.isContextLost()) {
        var infoLog = gl.getProgramInfoLog(gl_program);
        window.console.log("Error linking program:\n" + infoLog);
        gl.deleteProgram(gl_program);
        return;
    }
    
    // Get the uniform/attribute locations
    gl_program_loc.uMVMatrix = gl.getUniformLocation(gl_program, "uMVMatrix");
    gl_program_loc.uPMatrix  = gl.getUniformLocation(gl_program, "uPMatrix");
    gl_program_loc.aPosition = gl.getAttribLocation(gl_program, "aPosition");
}

/**
 * Reshape function, reshapes the WebGL viewport and sets up the 
 * projection matrix based on current zoom level.
 */
var reshape = function() {
    // Get the WebGl canvas
    var canvas = document.getElementById('c');
    
    // Resize the canvas based on the window size
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    
    // Set the WebGL viewport based on this new width and height
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    // Get the aspect ratio, and use this to setup the projection matrix
    WIDTH = canvas.width / canvas.height;
    mat4.ortho( 0.0, WIDTH, 0.0, HEIGHT, -10.0, 10.0, projmat);
}

/**
 * Display function, sets up various matrices, binds data to the GPU,
 * and displays it.
 */
function display() {
    // Clear the color buffer
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    // Use the created shader program
    gl.useProgram(gl_program);
    
    // Upload the projection matrix and the model-view matrix to the shader
    gl.uniformMatrix4fv(gl_program_loc.uPMatrix,  false, projmat);
    gl.uniformMatrix4fv(gl_program_loc.uMVMatrix, false, mvmat);

    // Bind vbo to be the current array buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    
    // Enables a vertex attribute array for vertex positions
    gl.enableVertexAttribArray(gl_program_loc.aPosition);
    
    // Setup the pointer to the position data
    gl.vertexAttribPointer(gl_program_loc.aPosition, 3, gl.FLOAT, false, 12,  0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);

    for( var i = 0; i < boidc.boids.length; ++i ) {
        vel_mag = boidc.boids[i].vel.magnitude();
        mat4.identity(mvmat);
        mat4.translate( mvmat, [ boidc.boids[i].pos.x, boidc.boids[i].pos.y, 0.0] ,mvmat );
        mat4.rotateZ( mvmat, Math.acos(boidc.boids[i].vel.x / vel_mag) * (boidc.boids[i].vel.y > 0.0 ? 1.0 : -1.0),mvmat );
        mat4.scale( mvmat, [0.01, 0.01, 1.0], mvmat )
        gl.uniformMatrix4fv(gl_program_loc.uMVMatrix, false, mvmat);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * Entry point of the application.
 */
function main() {
    // Get the WebGL canvas, and initialize WebGL
    var c = document.getElementById('c');
    gl = WebGLUtils.setupWebGL( c );
    
    // Escape on any error
    if(!gl) {
        return;
    }
    
    // Setup the window's resize function
    window.onresize = reshape;
    
    // Initialize all variables and display the scene
    init();
    display();
}  
