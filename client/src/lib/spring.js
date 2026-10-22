/**
 * Momentum projection from Apple's Designing Fluid Interfaces sample code.
 * Given a release velocity in px/s, returns the additional distance travelled.
 */
export function projectMomentum(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * (decelerationRate / (1 - decelerationRate));
}

/** Progressive resistance at a soft edge. */
export function rubberBand(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
