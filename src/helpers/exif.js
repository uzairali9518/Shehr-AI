import EXIF from 'exif-js';

/**
 * Extracts GPS latitude and longitude from an image file's EXIF metadata.
 * Resolves with { lat: number, lng: number } if successful, otherwise null.
 */
export function getExifGPS(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    
    try {
      EXIF.getData(file, function () {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");
        
        if (!lat || !lng) return resolve(null);

        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

        const toDecimal = (dms, ref) => {
          if (!dms || dms.length < 3) return 0;
          // Handles both numeric values and objects depending on how exif-js parses it
          const degrees = typeof dms[0] === 'object' ? dms[0].numerator / dms[0].denominator : dms[0];
          const minutes = typeof dms[1] === 'object' ? dms[1].numerator / dms[1].denominator : dms[1];
          const seconds = typeof dms[2] === 'object' ? dms[2].numerator / dms[2].denominator : dms[2];

          let dec = degrees + minutes / 60 + seconds / 3600;
          if (ref === "S" || ref === "W") dec *= -1;
          return dec;
        };

        const decimalLat = toDecimal(lat, latRef);
        const decimalLng = toDecimal(lng, lngRef);

        if (isNaN(decimalLat) || isNaN(decimalLng)) {
          resolve(null);
        } else {
          resolve({ lat: decimalLat, lng: decimalLng });
        }
      });
    } catch (error) {
      console.error("Error reading EXIF data:", error);
      resolve(null);
    }
  });
}
