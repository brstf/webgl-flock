/*
 * Vec2.js - Contains an implementation of a 2-component vector
 */
 
/**
 * Default constructor, sets x and y to 0
 */
function Vec2() {
    return Vec2( 0, 0 );
}

/**
 * Constructor that accepts an x and y component for this vector.
 * @param x x-component of the vector
 * @param y y-component of the vector
 */
function Vec2( x, y ) {
    this.x = x;
    this.y = y;
}

/**
 * Adds this vector to the other vector. 
 * [ this + other ]
 * @param other Another Vec2 to add to this one
 */
Vec2.prototype.plus = function( other ) {
    return new Vec2( this.x + other.x, this.y + other.y );
}

/**
 * Subtracts another vector from this vector. 
 * [ this - other ]
 * @param other Another Vec2 to subtract from this one
 */
Vec2.prototype.minus = function( other ) {
    return new Vec2( this.x - other.x, this.y - other.y );
}

/**
 * Gets the magnitude of this Vec2.
 */
Vec2.prototype.magnitude = function() {
    return Math.sqrt( this.x * this.x + this.y * this.y );
}
 
/**
 * Normalizes this vector to length 1.
 */
Vec2.prototype.normalize = function() {
    var m = this.magnitude();
    this.x = this.x / m;
    this.y = this.y / m;
}
 
/**
 * Returns this vector multiplied by a passed in scalar.
 * @param s Scalar to multiply this vector by
 */
Vec2.prototype.scalarProd = function( s ) {
    return new Vec2( this.x * s, this.y * s );
}

/**
 * Returns the dot product between this Vec2 and the passed in Vec2.
 * @param other Another Vec2 to dot with this Vec2
 */
Vec2.prototype.dot = function( other ) {
    return this.x * other.x + this.y * other.y;
}