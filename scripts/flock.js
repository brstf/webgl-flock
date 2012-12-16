var gl;
var gl_program;
var gl_program_loc = {};
var mvmat, projmat;
var vbo;
var indices;
var zoomval = 1.0;
var requestId;
var boids = [];

var CLOSE_THRESH = 0.2;
var SEP_THRESH = 0.1;
var COHERE_COEFF = 0;
var ALIGN_COEFF = 1;
var SEP_COEFF = 2;
var MAX_VEL = 1.0;

var NUM_BOIDS = 100;

/** Function to return distance between 2 positions
    @return distance between 2 positions
*/
function distance( pos1, pos2 ) {
    // dist keeps track of the shortest distance in both the x and y direction
    var dist = [ pos1.x, pos1.y ];

    // cpos keeps track of what the modified position of pos2 is to obtain
    // the min distance ( this is necessary for wrap around )
    var cpos = [ pos2.x, pos2.y ];

    // If the x coordinate is passed 0.0 ( on the right half )
    if( pos2.x > 0 ) { 
        // The dist is min of the distance to current position and dist to 
        // position - 2.0
        if( Math.abs( pos1.x - pos2.x ) < Math.abs( pos1.x - pos2.x + 2.0 ) ) {
            dist[0] = Math.abs( pos1.x - pos2.x );
        } else {
            dist[0] = Math.abs( pos1.x - pos2.x + 2.0 );

            // If we used pos2 - 2.0, update the closest position
            cpos[0] -= 2.0;
        }
    } else {
        // If position is on the left half, check normal position and pos2 + 2.0
        if( Math.abs( pos1.x - pos2.x ) < Math.abs( pos1.x - pos2.x - 2.0 ) ) {
            dist[0] = Math.abs( pos1.x - pos2.x );
        } else {
            dist[0] = Math.abs( pos1.x - pos2.x - 2.0 );

            // If we used pos2 + 2.0, update closest position
            cpos[0] += 2.0;
        }
    }

    // Do similar checks for the y position
    if( pos2.y > 0 ) { 
        if( Math.abs( pos1.y - pos2.y ) < Math.abs( pos1.y - pos2.y + 2.0 ) ) {
            dist[1] = Math.abs( pos1.y - pos2.y );
        } else {
            dist[1] = Math.abs(pos1.y - pos2.y + 2.0 );
            cpos[1] -= 2.0;
        }
    } else {
        if( Math.abs( pos1.y - pos2.y ) < Math.abs( pos1.y - pos2.y - 2.0 ) ) {
            dist[1] = Math.abs( pos1.y - pos2.y );
        } else {
            dist[1] = Math.abs( pos1.y - pos2.y - 2.0 );
            cpos[1] += 2.0;
        }
    }

    // Return the sqaured distance and closest position
    return [ Math.sqrt( Math.pow( dist[0], 2.0 ) + Math.pow( dist[1], 2.0 ) ), new Vec2( cpos[0], cpos[1] ) ];
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
        
        // Loop through each boid in each adjacent bin
        for( var j = 0; j < boids.length; ++j ) {
            if( j == i ) {
                continue;
            }
            
            // Calculate the min dist from this boid to the one we are checking
            var dist = distance( boids[i].pos, boids[j].ppos );

            // If this min dist is less than the "close" threshold
            if( dist[0] < CLOSE_THRESH ) {
                // Increment count and update coherence/alignment vectors
                count += 1;
                coherence = coherence.plus( dist[1] );
                align = align.plus( boids[j].pvel );
                
                // If min dist is less than "sep" threshold
                if( dist[0] < SEP_THRESH ) {
                    // update separation vector and increment sepcount
                    var sepVec = boids[i].pos.minus( dist[1] );
                    sepVec.normalize();
                    separate = separate.plus( sepVec );
                    sepCount += 1;
                }
            }
        }
        
        // If there were a non-zero number of boids 
        if( count > 0 ) { 
            // Average coherence and alignment
            coherence = coherence.scalarProd( 1/count );
            align = align.scalarProd( 1/count );
            
            // Steer to coherence point
            var desired = coherence.minus( boids[i].pos );
            if( desired.magnitude() > 0.0 ) {
                desired.normalize();
                desired = desired.scalarProd( MAX_VEL );
                coherence = desired.minus( boids[i].vel );
            } else {
                coherence = new Vec2( 0.0, 0.0 );
            }
            
            // Calculate desired position from coherence
            var desired_pos = coherence.minus( boids[i].pos );
            
            // Add to this boid's velocity desired position and alignment
            // so it will trend towards flying to the center of the close 
            // boids and facing the same way as close boids
            boids[i].vel = boids[i].vel.plus( desired_pos.scalarProd( COHERE_COEFF ) );
            boids[i].vel = boids[i].vel.plus( align.scalarProd( ALIGN_COEFF ) );

            // If there were a non-zero number of boids close enough for separation
            if( sepCount > 0 ) {
                // average separation vector
                separate = separate.scalarProd( 1/sepCount );

                // Calculate position to avoid
                var avoid_pos = separate.minus( boids[i].ppos );

                // change the boid's velocity to avoid the center of very close
                // boids
                boids[i].vel = boids[i].vel.minus( avoid_pos.scalarProd( SEP_COEFF ) );
            }
            
            // Calculate velocity magnitude, and normalize it to MAX_VEL, so that
            // the boids do not accelerate uncontrollably
            if( boids[i].vel.magnitude() > MAX_VEL ) {
                boids[i].vel = boids[i].vel.scalarProd( MAX_VEL / boids[i].vel.magnitude() );
            }
        }
        
        // Move the boid's posiiton by it's velocity
        boids[i].move();

        // Do wrap around X
        if( boids[i].pos.x >  1.0 ) {
            boids[i].pos.x -= 2.0;
        } else if( boids[i].pos.x < -1.0 ) {
            boids[i].pos.x += 2.0;
        }
        
        // Do wrap around Y
        if( boids[i].pos.y >  1.0 ) {
            boids[i].pos.y -= 2.0;
        } else if( boids[i].pos.y < -1.0 ) {
            boids[i].pos.y += 2.0;
        }
    }
    
    // Finally, display
    display();
    
    // Loop through each boid and set previous position and velocity
    for( var i = 0; i < boids.length; ++i ) {
        boids[i].ppos = new Vec2( boids[i].pos.x, boids[i].pos.y );
        boids[i].pvel = new Vec2( boids[i].vel.x, boids[i].vel.y );
    }
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
    var aspect_ratio = canvas.width / canvas.height;
    mat4.ortho((-1.0 * aspect_ratio / zoomval), (1.0 * aspect_ratio / zoomval), 
        -1.0 / zoomval, 1.0 / zoomval, -10.0, 10.0, projmat);
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
        mat4.identity(mvmat);
        mat4.translate( mvmat, [boids[i].pos.x, boids[i].pos.y, 0.0] ,mvmat );
        console.log( boids[i].vel.x / vel_mag );
        mat4.rotateZ( mvmat, Math.acos(boids[i].vel.x / vel_mag) * (boids[i].vel.y > 0.0 ? 1.0 : -1.0),mvmat );
        mat4.scale( mvmat, [0.02, 0.02, 1.0], mvmat )
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
    
    // On key presses, zoom in or out
    window.onkeydown = keyFunction;
    
    // Initialize all variables and display the scene
    init();
    display();
}  

keyFunction = function(event) {
    // If '+' is pressed, zoom in, '-' zoom out
    if( event.keyCode == 107 || event.keyCode == 187 ) {
        zoomval += 0.1;
        reshape();
    } else if( event.keyCode == 109 || event.keyCode == 189 ) {
        zoomval -= 0.1;
        reshape();
    }
} 
