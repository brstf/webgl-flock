var gl;
var gl_program;
var gl_program_loc = {};
var mvmat, projmat;
var vbo;
var indices;
var requestId;
var boids = [];

var HEIGHT = 1.0;
var WIDTH = 1.0;

var CLOSE_THRESH = 0.1;
var SEP_THRESH = 0.05;

var NUM_BOIDS = 100;

/** Function to return the wrap around point of pos2 that is closest
    to the given pos1.
    @param pos1 Anchor point used to calculate closest position
    @param pos2 Point to wrap around and find the closest position of
    @return Closest representation of pos2 to pos1 potentially wrapped 
            around the screen.
*/
function closestPoint( pos1, pos2 ) {
    var dvec = new Vec2( pos2.x - pos1.x, pos2.y - pos1.y );
    var cpos = new Vec2( pos2.x, pos2.y );
    
    // Wrap around the x direction if necessary
    if( dvec.x > WIDTH / 2.0 ) {
        cpos.x -= WIDTH;
    } else if( dvec.x < -WIDTH / 2.0 ) {
        cpos.x += WIDTH;
    }
    
    // Wrap around the y direction if necessary
    if( dvec.y > HEIGHT / 2.0 ) {
        cpos.y -= HEIGHT;
    } else if( dvec.y < -HEIGHT / 2.0 ) {
        cpos.y += HEIGHT;
    }
    
    // Now cpos has the closest wrap around point of c2
    return cpos;
}

function update( time ) {
    // Setup another request
    requestId = requestAnimFrame( update, document.getElementById('c') );
    
    // Loop through each boid
    for( var i = 0; i < boids.length; ++i ) {
        // Coherence, separation, and alignment vectors
        var coherence = new Vec2( 0.0, 0.0 );
        var separate  = new Vec2( 0.0, 0.0 );
        var align     = new Vec2( 0.0, 0.0 );
        
        // count the number of points in close range and sep range
        var count = 0, sepCount = 0;
        
        // Loop through each boid and calculate coherence and separation
        // positions and alignment direction
        for( var j = 0; j < boids.length; ++j ) {
            var cpos = closestPoint( boids[i].pos, boids[j].pos );
            var dist = boids[i].pos.minus( cpos ).magnitude();
            
            // If within the neighborhood threshold
            if( dist < CLOSE_THRESH && dist > 0) {
                coherence.add( cpos );
                align.add( boids[j].vel );
                ++count;
                
                if( dist < SEP_THRESH ) {
                    var sepvec = boids[i].pos.minus( cpos ).normalize();
                    separate = separate.plus( sepvec.multiply( 1.0 / dist ) );
                    ++sepCount;
                }
            }
        }
        
        if( count > 0 ) {
            coherence = coherence.multiply( 1.0 / count );
            align = align.multiply( 1.0 / count );
            
            if( sepCount > 0 ) {
                separate = separate.multiply( 1.0 / sepCount );
            }
        }
        
        // Move the boid's posiiton by its velocity
        boids[i].flock( coherence, align, separate );
        boids[i].move( WIDTH, HEIGHT );
    }
    
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

function generateBoids( num ) {
    // Generate num boids, each with a random position and velocity
    for( var i = 0; i < num; ++i ) {
        pos = [ (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0 ];
        vel = [ (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0 ];
        var boid = new Boid( pos[0], pos[1], vel[0], vel[1] );
        boid.id = i;
        boids.push( boid );
    }
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

    // Generate a number of boids!:
    generateBoids( NUM_BOIDS );
    
    // Reshape the canvas, and setup the viewport and projection
    reshape();
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
    gl_program_loc.uNeighbor = gl.getUniformLocation(gl_program, "uNeighbor");
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

    for( var i = 0; i < boids.length; ++i ) {
        vel_mag = boids[i].vel.magnitude();
        // Set the model-view matrix to the identity
        var cpos = closestPoint( boids[0].pos, boids[i].pos );
        var dist = boids[0].pos.minus( cpos ).magnitude();
        if( dist < CLOSE_THRESH && i > 0 ) {
            gl.uniform1f( gl_program_loc.uNeighbor, 1.0 );
        } else if ( i == 0 ) {
            gl.uniform1f( gl_program_loc.uNeighbor, 2.0 );
        } else {
            gl.uniform1f( gl_program_loc.uNeighbor, 0.0 );
        }
        mat4.identity(mvmat);
        mat4.translate( mvmat, [boids[i].pos.x, boids[i].pos.y, 0.0] ,mvmat );
        mat4.rotateZ( mvmat, Math.acos(boids[i].vel.x / vel_mag) * (boids[i].vel.y > 0.0 ? 1.0 : -1.0),mvmat );
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
