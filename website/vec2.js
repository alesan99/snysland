// 2d Vector operations

// Length
export function vec2Len(x, y) {
	return Math.sqrt(x*x + y*y)
}

// Normalize
export function vec2Unit(x, y) {
	const length = vec2Len(x, y)
	if (length == 0) { return [0, 0] };
	return [x / length, y / length]
}

// Get normal from edge vector
export function vec2Norm(ex, ey) {
	return [ey, -ex]
}

// Dot Product
export function vec2Dot(x1, y1, x2, y2) {
	return x1*x2 + y1*y2
}