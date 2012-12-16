/*
 * Boid.js - Contains the implementation of the Boid class
 */
 
/**
 * Default constructor, initializes a boid with position ( 0, 0 )
 * and velocity ( 0, 0 )
 */
function Boid() {
    return Boid( 0, 0 );
}

/**
 * Constructor that accepts parameters for starting position, 
 * initializes starting velocity to ( 0, 0 ).
 * @param x x-position of boid
 * @param y y-position of boid
 */
function Boid( x, y ) {
    return Boid( x, y, 0.0, 0.0 );
}

/**
 * Constructor that accepts parameters for both starting 
 * position and starting velocity.
 * @param x x-position of boid
 * @param y y-position of boid
 * @param vx x-compnent of starting velocity
 * @param vy y-compnent of starting velocity
 */
function Boid( x, y, vx, vy ) {
    this.pos  = new Vec2(  x,  y );
    this.vel  = new Vec2( vx, vy );
}

/**
 * Moves the boid by its current velocity.
 */
Boid.prototype.move = function() {
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