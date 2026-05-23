/**
 * Ray-casting point-in-polygon test.
 * @param point [lng, lat]
 * @param polygon Closed or open ring of [lng, lat] vertices
 */
export function pointInPolygon(
  point: [number, number],
  polygon: [number, number][],
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

/** Close a polygon ring if the first and last vertices differ. */
export function closeRing(
  ring: [number, number][],
): [number, number][] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}
