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
    this.gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
    this.gl.disable(gl.BLEND);
    this.projmat = mat4.create();
    this.boidview = new BoidView( this.gl );
    this.circobsview = new CircleObstacleView( this.gl );
    this.circleview = new CircleView( this.gl );
    
    this.select = {};
    this.select.i = null;
    this.select.hover = false;
    this.select.edge = false;
    
    this.initShaders();
    this.initQuad();
}

/**
 * Re-initializes all views.
 */
Views.prototype.init = function() {
    this.boidview.init();
    this.circobsview.init();
    this.circleview.init();
    
    this.initShaders();
    this.initQuad();
    this.initRTT( 512, 512 );
}

/**
 * Initializes buffers for a simple quad.
 */
Views.prototype.initQuad = function() {
    var gl = this.gl;
    
    // Create the quad buffers
    this.quadvbo = gl.createBuffer();
    this.quadind = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, this.quadvbo );
    var verts = new Float32Array( [ 0.0, 1.0, 0.0, 0.0, 1.0,
                                    1.0, 1.0, 0.0, 1.0, 1.0,
                                    0.0, 0.0, 0.0, 0.0, 0.0,
                                    1.0, 0.0, 0.0, 1.0, 0.0 ] );
    gl.bufferData( gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.quadind );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,3]), gl.STATIC_DRAW );
}

Views.prototype.initRTT = function( w, h ) {
    var wi = Math.pow( 2, Math.ceil( Math.log( w ) / Math.log( 2 ) ) );
    var hi = Math.pow( 2, Math.ceil( Math.log( h ) / Math.log( 2 ) ) );
    
    var gl = this.gl;
    this.rttFramebuffer = gl.createFramebuffer();
    this.rttFramebuffer.width = wi;
    this.rttFramebuffer.height = hi;
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.rttFramebuffer );
    
    this.rttTexture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, this.rttTexture );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, wi, hi, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
    
    this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, this.renderbuffer );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, wi, hi );
    
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0 );
    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer );
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.bindTexture( gl.TEXTURE_2D, null );
    gl.bindRenderbuffer( gl.RENDERBUFFER, null );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
}

Views.prototype.reshape = function( width, height ) {
    // Set the WebGL viewport based on this new width and height
    this.gl.viewport( 0, 0, width, height );
    this.width = width;//width / height;
    this.height = height;//1.0;
    
    // Get the aspect ratio, and use this to setup the projection matrix
    mat4.ortho( 0.0, this.width, 0.0, this.height, -10.0, 10.0, this.projmat);
    
    this.initRTT( width, height );
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
    gl_program_loc.uColor    = gl.getUniformLocation(gl_program, "uColor");
    gl_program_loc.uTexture  = gl.getUniformLocation(gl_program, "uTexture");
    gl_program_loc.uUseTexture = gl.getUniformLocation(gl_program, "uUseTexture");
    gl_program_loc.aPosition = gl.getAttribLocation(gl_program, "aPosition");
    gl_program_loc.aTexCoord = gl.getAttribLocation(gl_program, "aTexCoord");
    
    this.prog_loc = gl_program_loc;
    this.prog = gl_program;
}

/**
 * Sets a selected obstacle for the view to draw differently.
 * @param sel_obs Index of the selected obstacle from the world
 * @param hover Boolean indicating if this is hovered over or selected
 *              true if there is hover, false otherwise
 * @param edge Boolean indicating if only an edge is selected
 */
Views.prototype.selectObstacle = function( sel_obs, hover, edge ) {
    this.select.i = sel_obs;
    this.select.hover = hover;
    this.select.edge = edge;
}

/**
 * Deselects any obstacle that may be selected.
 */
Views.prototype.deselectObstacle = function() {
    this.select.i = null;
    this.select.edge = false;
}

/**
 * Draws the entire flocking scene.
 * @param world World object to draw
 */
Views.prototype.draw = function( world ) {
    var gl = this.gl;
    
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.rttFramebuffer );
    
    // Use the created shader program
    gl.useProgram( this.prog );
    
    this.drawQuad( 2 );
    
    gl.uniform1i( this.prog_loc.uUseTexture, 0 );
    gl.disableVertexAttribArray( this.prog_loc.aTexCoord );
    
    // Bind the boid vbo to be the current array buffer
    gl.bindBuffer( gl.ARRAY_BUFFER, this.circleview.getVBO() );
    gl.enableVertexAttribArray( this.prog_loc.aPosition );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 12, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.circleview.getIndexBuffer() );
    gl.uniform4fv( this.prog_loc.uColor, this.circleview.getColor() );
    for( var i = 0; i < world.boids.length; ++i ) {
        this.circleview.draw( world.boids[i].pos, 0.0015, this.height, this.prog_loc.uMVMatrix );
    }
    
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    this.drawQuad( 1 );
    
    gl.uniform1i( this.prog_loc.uUseTexture, 0 );
    gl.disableVertexAttribArray( this.prog_loc.aTexCoord );
    
    
    // Bind the circle obstacle vbo to draw the circle obstacles
    gl.bindBuffer( gl.ARRAY_BUFFER, this.circobsview.getVBO() );
    gl.enableVertexAttribArray( this.prog_loc.aPosition );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 12, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.circobsview.getIndexBuffer() );
    for( var i = 0; i < world.obs.length; ++i ) {
        var select = 0; 
        if( i == this.select.i ) {
            select = 1;
            if( this.select.hover ) {
                select += 1;
            }
        }
        for( var x = -1; x <= 1; ++x ) {
            for( var y = -1; y <= 1; ++y ) {
                var temp_obs = new CircleObstacle( world.obs[i].pos.x + x * world.width,
                        world.obs[i].pos.y + y * world.height, world.obs[i].rad );
                this.circobsview.draw( temp_obs, select, this.select.edge, 
                    this.height, this.prog_loc );
            }
        }
    }
    
    // Bind the boid vbo to be the current array buffer
    gl.bindBuffer( gl.ARRAY_BUFFER, this.boidview.getVBO() );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 12, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.boidview.getIndexBuffer() );
    gl.uniform4fv( this.prog_loc.uColor, this.boidview.getColor() );
    for( var i = 0; i < world.boids.length; ++i ) {
        this.boidview.draw( world.boids[i], this.height, this.prog_loc.uMVMatrix );
    }
}

Views.prototype.drawQuad = function( ver ) {
    var gl = this.gl;
    
    // Bind the rtt texture
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, this.rttTexture );
    gl.uniform1i( this.prog_loc.uTexture, 0 );
    
    // Upload the projection matrix to the shader
    gl.uniformMatrix4fv( this.prog_loc.uPMatrix, false, this.projmat );
    gl.uniform1i( this.prog_loc.uUseTexture, ver );
    var mvmat = mat4.create();
    mat4.identity( mvmat );
    mat4.scale( mvmat, [ this.rttFramebuffer.width, this.rttFramebuffer.height, 1.0 ], mvmat );
    gl.uniformMatrix4fv( this.prog_loc.uMVMatrix, false, mvmat );
    gl.bindBuffer( gl.ARRAY_BUFFER, this.quadvbo );
    gl.enableVertexAttribArray( this.prog_loc.aPosition );
    gl.vertexAttribPointer( this.prog_loc.aPosition, 3, gl.FLOAT, false, 20, 0 );
    gl.enableVertexAttribArray( this.prog_loc.aTexCoord );
    gl.vertexAttribPointer( this.prog_loc.aTexCoord, 2, gl.FLOAT, false, 20, 12 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.quadind );
    gl.drawElements( gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0 );
}