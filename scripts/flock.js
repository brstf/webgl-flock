var gl;
var mvmat, projmat;
var requestId;
var world;
var view;

var NUM_BOIDS = 100;

function update( time ) {
    // Setup another request
    requestId = requestAnimFrame( update, document.getElementById('c') );
    
    world.update();
    world.move();
    
    // Finally, display
    view.draw( world );
}

/**
 * Initializes all variables, shaders, and WebGL options 
 * needed for this program.
 */ 
function init() {
    // Generate a number of boids:
    world = new World( 1.0, 1.0, NUM_BOIDS );
    view = new Views( gl );
    
    // Reshape the canvas, and setup the viewport and projection
    reshape();
    
    requestId = requestAnimFrame( update, document.getElementById('c') );
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
    
    view.reshape( canvas.width, canvas.height );
    world.setBounds( view.width, view.height );
}

/**
 * Entry point of the application.
 */
function main() {
    // Get the WebGL canvas, and initialize WebGL
    var c = document.getElementById('c');
    gl = WebGLDebugUtils.makeDebugContext( WebGLUtils.setupWebGL( c ) );
    
    // Escape on any error
    if(!gl) {
        return;
    }
    
    // Setup the window's resize function
    window.onresize = reshape;
    
    // Initialize all variables and display the scene
    init();
    view.draw( world );
}  
