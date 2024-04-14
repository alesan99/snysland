// Player object
import { PhysicsObject } from './object.js'
import { Shape } from '../shape.js'
import Assets from '../assets.js'
import { vec2Unit, vec2Norm } from '../vec2.js'
import world from '../world.js'
import AudioSystem from '../audio.js'

export class Snake extends PhysicsObject {
	constructor (spatialHash, scene, id, x, y, angle=0, pivot_360, clockwise, start_angle = null, end_angle = null, path) {

        super(spatialHash, x, y)
        this.scene = scene;
        
		// Initialize all parameters
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = 1;

        this.angle = ((angle) * (Math.PI / 180)); // Convert degrees to radians

        this.pivot_360 = pivot_360;
        this.clockwise = clockwise;
        this.end_angle = start_angle ? ((start_angle+90) * (Math.PI / 180)) : null; // Convert degrees to radians
        this.start_angle = end_angle ? ((end_angle+90) * (Math.PI / 180)) : null; // Convert degrees to radians


		this.walking = false;
        // collision true
		this.active = true; 
        // if they don't move it is static
		this.static = false;

		this.speed = 20;

		this.turnSpeed = 3;

		this.size = 8.5;
        // shape of the hit box dont delete
		this.shape = new Shape(
			-this.size/2,-this.size/2,
			this.size/2,-this.size/2,
			this.size/2,this.size/2,
			-this.size/2,this.size/2
		);
        
		this.model = Assets.mesh.snake.clone();
        this.model.position.x = this.x;
		this.model.position.y = this.z;
		this.model.position.z = -this.y;

		//Path
		this.path = path;
		if (this.path) {
			this.turning = false;
			this.pathLength = Math.floor(path.length / 2);
			this.pathTimer = 0;
			this.pathDir = y || 1;
			this.pathLoop = x;
			this.realAngle = this.angle
			this.setStage(1, "initial");
		// if snake is not rotating 360: then start at given angle, else: start at this.angle
		} else if (!this.pivot_360) {
			this.angle = this.start_angle;
			this.turnSpeed = 5;

			this.turnDir = -1;
			if (this.clockwise) {
				this.turnDir = 1;
			}

			this.turnStage = 2;
			if (this.start_angle > this.end_angle) {
				this.turnStage = 1;
			}

			this.turnTimer = false;
			this.turnTime = 1;
			this.static = true;
		} else {
			this.static = true;
		}
		this.model.rotation.y = this.angle;

		this.stopped = false;
		
		scene.add(this.model);

		this.setPosition(this.x, this.y);
        
	}
	compareAngles(a1, a2) {
		let an1 = (a1%(Math.PI*2))-Math.PI
		let an2 = (a2%(Math.PI*2))-Math.PI
		let diff = an1-an2
		if (Math.abs(diff) < Math.PI) { return an1 > an2 }
		else { return diff < 0 }
	}
	largestAngleBetweenAnglesInRadians(angle1, angle2) {
		// Ensure angles are between 0 and 2π radians
		angle1 = angle1 % (2 * Math.PI);
		angle2 = angle2 % (2 * Math.PI);
	
		// Calculate absolute difference between the angles
		let absoluteDifference = Math.abs(angle1 - angle2);
	
		// Consider the absolute difference in both clockwise and counterclockwise directions
		let clockwiseDifference = Math.abs(2 * Math.PI - absoluteDifference);
	  
		// Choose the larger of the two differences
		return Math.max(absoluteDifference, clockwiseDifference);
	}

    update(dt) {
		if (this.stopped) {
			return;
		}
        this.model.position.set(this.x, this.z, -this.y);
		// Pivot 360 (Spin in circle)
		if (this.turnTimer) {
			this.turnTimer -= dt;
			if (this.turnTimer < 0) {
				this.turnTimer = false;
			}
		// Wait before turning
		} else if (this.path) {
			let oldx = this.x;
			let oldy = this.y;
			if (!this.turning) {
				this.pathTimer += this.speed * dt;
				if (this.pathTimer > this.pathTime) {
					this.pathTimer = 0;
					if (!this.pathLoop) {
						if (this.pathDir > 0 && this.stage + 1 >= this.pathLength) {
							this.pathDir = -1;
							this.stage += 2;
						} else if (this.pathDir < 0 && this.stage - 1 <= 1) {
							this.pathDir = 1;
							this.stage -= 2;
						}
					}
					this.setStage(this.getStage(this.pathDir));
					this.turning = true;
				}
			}

			let x1 = this.path[this.stage * 2 - 1 - 1];
			let y1 = this.path[this.stage * 2 - 0 - 1];
			let x2 = this.path[this.getStage(this.pathDir) * 2 - 1 - 1];
			let y2 = this.path[this.getStage(this.pathDir) * 2 - 0 - 1];
			if (this.turning) {
				let targetAngle = (Math.atan2(-(y1 - y2), x2 - x1)) % (Math.PI * 2);
				let turnDir1 = this.compareAngles(this.realAngle, targetAngle);
				if (turnDir1) {
					this.realAngle = (this.realAngle - this.turnSpeed * dt) % (Math.PI * 2);
				} else {
					this.realAngle = (this.realAngle + this.turnSpeed * dt) % (Math.PI * 2);
				}
				let turnDir2 = this.compareAngles(this.realAngle, targetAngle);
				this.angle = this.realAngle;
				if (turnDir1 !== turnDir2) {
					this.realAngle = targetAngle;
					this.angle = targetAngle;
					this.turning = false;
				}
			} else {
				let v = this.pathTimer / this.pathTime;
				this.x = (x1 + (x2 - x1) * (this.pathTimer / this.pathTime))*10;
				this.y = (y1 + (y2 - y1) * (this.pathTimer / this.pathTime))*10;
				this.setPosition(this.x, this.y);
				this.sx = 0;
				this.sy = 0;

			}
		// Turn from angle to angle
		} else if (!this.pivot_360) {
			if (this.turnStage === 1) {
				let turnDir1 = this.angle > this.end_angle;
				this.angle = (this.angle + this.turnSpeed * this.turnDir * 0.5 * dt);
				let turnDir2 = this.angle > this.end_angle;
				if (turnDir1 != turnDir2) {
					this.angle = this.end_angle;
					this.turnStage = 2;
					this.turnTimer = this.turnTime;
				}
			} else if (this.turnStage === 2) {
				let turnDir1 = this.angle < this.start_angle;
				this.angle = (this.angle - this.turnSpeed * this.turnDir * 0.5 * dt);
				let turnDir2 = this.angle < this.start_angle;
				if (turnDir1 != turnDir2) {
					this.angle = this.start_angle;
					this.turnStage = 1;
					this.turnTimer = this.turnTime;
				}
			}
		} else {
			if (this.clockwise) {
				this.angle += this.turnSpeed * dt;
			} else {
				this.angle -= this.turnSpeed * dt;
			}
		}

		this.model.rotation.y = this.angle+Math.PI/2;

		// Check if player is in spotlight
		// spotlight is a circle with radius 10, 15 units infront of snake
		let player = world.player;
		let playerr = player.size/2;
		let spotr = 10;
		let spotx = this.x + Math.cos(this.angle) * 15;
		let spoty = this.y + Math.sin(this.angle) * 15;
		let dist = Math.sqrt((player.x-spotx)**2 + (player.y-spoty)**2);
		if (dist < spotr) {
			if (!player.dead) {
				this.stopped = true;
				let soundi = Math.floor(Math.random()*3)+1;
				if (soundi === 1) {
					AudioSystem.playSound(Assets.sfx.stopone);
				} else if (soundi === 2) {
					AudioSystem.playSound(Assets.sfx.stoptwo);
				} else if (soundi === 3) {
					AudioSystem.playSound(Assets.sfx.wompwomp);
				}
	
				// player is in spotlight
				player.die()
			}
		}
    }

	setStage(i, initial) {
		this.stage = i;
		let x1, y1, x2, y2;
		x1 = this.path[(this.stage * 2) - 1 - 1];
		y1 = this.path[this.stage * 2 - 1];
		x2 = this.path[(this.getStage(this.pathDir) * 2) - 1 - 1];
		y2 = this.path[this.getStage(this.pathDir) * 2 - 1];
		this.pathTime = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) * 10;
		if (initial) {
			this.angle = Math.atan2(-(y1 - y2), x2 - x1) % (Math.PI * 2);
		}
	}

	getStage(dir) {
		return ((this.stage - 1 + dir) % this.pathLength + 1);
	}

	render(scene, camera, renderer) {

	}

	// Collision
	collide(name, obj, nx, ny) {
		return true
	}

	startCollide(name, obj) {

	}

	stopCollide(name, obj) {

	}
}