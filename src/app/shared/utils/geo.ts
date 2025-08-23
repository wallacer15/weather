export function windSegmentFromBearing(
  lon: number,
  lat: number,
  bearingDeg: number,
  lenKm: number
): [number, number][] {
  const R = 6371;
  const br = (bearingDeg * Math.PI) / 180;
  const dR = lenKm / R;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(br)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(br) * Math.sin(dR) * Math.cos(lat1),
      Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [
    [lon, lat],
    [(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI],
  ];
}
