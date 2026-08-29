// Haversine distance formula to calculate distance in meters between two lat/lng coordinates
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Duplicate detection: checks for existing reports in the same Union Council within the last 3 days and within 50 meters
export function isDuplicate(newLat, newLng, unionCouncilId, existingReports, thresholdMeters = 50, daysLimit = 3) {
  const timeLimitMs = daysLimit * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  return existingReports.some((r) => {
    // Only check reports within the same Union Council
    if (r.union_council_id !== unionCouncilId) return false;

    // Only check reports submitted within the days limit
    const reportTime = new Date(r.created_at).getTime();
    if (now - reportTime > timeLimitMs) return false;

    // Check spatial distance
    const dist = haversineDistance(newLat, newLng, r.report_lat, r.report_lng);
    return dist < thresholdMeters;
  });
}

// Cross-check against claimed_collections:
// If a report is within 200 meters of an official collection claim on the same date,
// return that claim (which means it's a verified dispute). Otherwise return null.
export function findMatchingCollectionClaim(reportLat, reportLng, unionCouncilId, reportDateStr, claimedCollections, thresholdMeters = 200) {
  return claimedCollections.find((c) => {
    if (c.union_council_id !== unionCouncilId) return false;
    
    // Check if the claim date matches the report date
    if (c.claimed_date !== reportDateStr) return false;

    // Check distance
    const dist = haversineDistance(reportLat, reportLng, c.claimed_lat, c.claimed_lng);
    return dist < thresholdMeters;
  });
}
