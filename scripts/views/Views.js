/*
 * Views.js - Singleton class to handle all base views.
 */

/**
 * Constructor that takes in a WebGL context to initialize all base
 * views with.
 * @param gl WebGL context associated with the views object.
 */
function Views( gl ) { 
    this.gl = gl;
    this.gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    this.gl.disable(gl.BLEND);
    this.projmat = mat4.create();
    this.boidview = new BoidView( this.gl );
    this.circobsview = new CircleObstacleView( this.gl );
    
    this.initShaders();
}

/**
 * Re-initializes all views.
 */
Views.prototype.init = function() {
    this.boidview.init();
    
    this.initShaders();
}

Views.prototype.reshape = function( width, height ) {
    // Set the WebGL viewport based on this new width and height
    this.gl.viewport( 0, 0, width, height );
    this.width = width / height;
    this.height = 1.0;
    
    // Get the aspect ratio, and use this to setup the projection matrix
    mat4.ortho( 0.0, this.width, 0.0, this.height, -10.0, 10.0, this.projmat);
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
Views.prototype.initShaders = function() {
    var gl = this.gl;
    
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
    gl_program_loc = {};
    gl_program_loc.uMVMatrix = gl.getUniformLocation(gl_program, "uMVMatrix");
    gl_program_loc.uPMatrix  = gl.getUniformLocation(gl_program, "uPMatrix");
    gl_program_loc.aPosition = gl.getAttribLocation(gl_program, "aPosition");
    
    this.prog_loc = gl_program_loc;
    this.prog = gl_program;
}

/**
 * Draws the entire flocking scene.
 * @param world World object to draw
 */
Views.prototype.draw = function( world ) {
    var gl = this.gl;
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    // Use the created shader program
    gl.useProgram( this.prog );
    
    // Upload the projection matrix to the shader
    gl.uniformMatrix4fv( this.prog_loc.uPMatrix, false, this.projmat );
    
    // Bind the boid vbo to be the current array buffer
    gl.bindBuffer( gl.ARRAY_BUFFER, this.boidview.getVBO() );
    gl.enableVertexAttribArray( this.prog_loc.aPosition );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 12, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.boidview.getIndexBuffer() );
    for( var i = 0; i < world.boids.length; ++i ) {
        this.boidview.draw( world.boids[i], 0.01, this.prog_loc.uMVMatrix );
    }
    
    // Bind the circle obstacle vbo to draw the circle obstacles
    gl.bindBuffer( gl.ARRAY_BUFFER, this.circobsview.getVBO() );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 12, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.circobsview.getIndexBuffer() );
    for( var i = 0; i < world.obs.length; ++i ) {
        this.circobsview.draw( world.obs[i], this.prog_loc.uMVMatrix );
    }
}