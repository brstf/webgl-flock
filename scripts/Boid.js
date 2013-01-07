/*
 * Boid.js - Contains the implementation of the Boid class
 */
 
/**
 * Global properties across all Boids
 */
var MAX_VEL = 0.5;
var MAX_FORCE = 0.025;

var COHERE_COEFF = 0.5;
var ALIGN_COEFF = 0.5;
var SEP_COEFF = 0.75;

/**
 * Constructor that accepts parameters for both starting 
 * position and starting velocity.
 * @param x x-position of boid
 * @param y y-position of boid
 * @param vx x-compnent of starting velocity
 * @param vy y-compnent of starting velocity
 */
function Boid( x, y, vx, vy ) {
    // Assign default values if none were provided
    if( x === undefined ) {
        x = 0;
    }
    if( y === undefined ) {
        y = 0;
    }
    if( vx === undefined ) {
        vx = 0;
    }
    if( vy === undefined ) {
        vy = 0;
    }
    
    this.pos  = new Vec2(  x,  y );
    this.vel  = new Vec2( vx, vy );
    this.vel.limit( MAX_VEL );
}

/**
 * Moves the boid by its current velocity.  If both width and height
 * are given, the boid will wrap around when it reaches a barrier.
 * @param width Width of the box this boid is being drawn in
 * @param height Height of the box this boid is being drawn in
 */
Boid.prototype.move = function( width, height ) {
    this.pos = this.pos.plus( this.vel.multiply( 0.01 ) );
}

/**
 * Function to return the vector that will steer this boid
 * toward a given point.
 * @param pos Location to steer this boid toward
 * @return Steer vector that would guide this boid toward pos
 */
Boid.prototype.steerTo = function( pos ) {
    var desired = pos.minus( this.pos );
    
    if( desired.magnitude() > 0.0 ) {
        desired.normalize();
        desired = desired.minus( this.vel );
    }
    
    return desired;
}

/**
 * Function to modify the velocity of this Boid based on the given
 * coherence point, alignment direction, and separation point.
 * @param coherence Point of cohesion for this Boid to steer toward
 * @param align Direction that this Boid should turn to face
 * @param separate Point of separation that this Boid should move away from
 */
Boid.prototype.flock = function( coherence, align, separate ) {
    // Steer towards the coherence point and the alignment direction
    var steer = this.steerTo( coherence );
    var alignDir = new Vec2( align.x, align.y );
    
    // Limit the cohesion and alignment force
    alignDir.limit( MAX_FORCE );
    steer.limit( MAX_FORCE );
    
    // Compute the acceleration by steer + align + separate:
    var accel = steer.multiply( COHERE_COEFF ).plus( 
                  alignDir.multiply( ALIGN_COEFF ) ).plus( 
                  separate.multiply( SEP_COEFF * MAX_FORCE * 0.15) );
    
    // Change the velocity by the acceleration and limit it to MAX_VEL
    this.vel.add( accel );
    this.vel.limit( MAX_VEL );
}