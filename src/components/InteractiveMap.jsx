import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function InteractiveMap({ unionCouncils, claimedCollections, reports, trustScores }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize map if not already created
    if (!mapRef.current) {
      // Centered around Model Town / Lahore center
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([31.4855, 74.3441], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      layersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // 2. Clear previous layers to update dynamically
    if (layersGroupRef.current) {
      layersGroupRef.current.clearLayers();

      // Get trust color function
      const getTrustColor = (score) => {
        if (score >= 70) return '#10b981'; // Green
        if (score >= 40) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
      };

      // 3. Draw Union Councils as circles
      unionCouncils.forEach((uc) => {
        const scoreObj = trustScores.find(ts => ts.union_council_id === uc.id);
        const score = scoreObj ? scoreObj.score : 100;
        const color = getTrustColor(score);

        const ucClaims = claimedCollections.filter(c => c.union_council_id === uc.id);
        const ucDisputes = reports.filter(r => r.union_council_id === uc.id && r.status === 'verified');

        const circle = L.circle([uc.center_lat, uc.center_lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: 800 // 800m radius circle
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size:13px; line-height:1.4; padding:5px;">
            <h4 style="margin:0 0 5px 0; color:#1f2937; font-size:14px;">${uc.name}</h4>
            <div style="margin-bottom: 8px;">
              <span style="font-weight:bold; color:${color}; font-size:15px;">Trust Score: ${score.toFixed(0)}%</span>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tr>
                <td style="color:#6b7280; padding:2px 0;">Official Claims:</td>
                <td style="font-weight:bold; text-align:right; padding:2px 0;">${ucClaims.length}</td>
              </tr>
              <tr>
                <td style="color:#6b7280; padding:2px 0;">Verified Disputes:</td>
                <td style="font-weight:bold; text-align:right; color:#ef4444; padding:2px 0;">${ucDisputes.length}</td>
              </tr>
            </table>
          </div>
        `;

        circle.bindPopup(popupContent).addTo(layersGroupRef.current);
      });

      // 4. Draw Official Claimed Collections (Blue markers)
      claimedCollections.forEach((claim) => {
        const claimIcon = L.divIcon({
          className: 'custom-map-marker claim-marker',
          html: `<div class="marker-pin blue"><span class="marker-label">Claim</span></div>`,
          iconSize: [40, 24],
          iconAnchor: [20, 12]
        });

        const uc = unionCouncils.find(u => u.id === claim.union_council_id);

        const popupContent = `
          <div style="font-family: sans-serif; font-size:12px; line-height:1.4;">
            <strong style="color:#0ea5e9;">Official Collection Claim</strong><br/>
            <strong>UC:</strong> ${uc ? uc.name : 'Unknown'}<br/>
            <strong>Date:</strong> ${claim.claimed_date}<br/>
            <strong>Source:</strong> ${claim.source}<br/>
            <strong>Coords:</strong> ${claim.claimed_lat.toFixed(5)}, ${claim.claimed_lng.toFixed(5)}
          </div>
        `;

        L.marker([claim.claimed_lat, claim.claimed_lng], { icon: claimIcon })
          .bindPopup(popupContent)
          .addTo(layersGroupRef.current);
      });

      // 5. Draw Verified Disputes (Red markers)
      reports.forEach((report) => {
        // Only draw verified disputes (active uncollected trash proof)
        if (report.status !== 'verified') return;

        const trashIcon = L.divIcon({
          className: 'custom-map-marker report-marker-map animate-bounce',
          html: '<div class="marker-pin red-warning">🗑️</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const uc = unionCouncils.find(u => u.id === report.union_council_id);

        const popupContent = `
          <div style="font-family: sans-serif; font-size:12px; line-height:1.4; max-width: 200px;">
            <strong style="color:#ef4444;">Verified Citizen Dispute</strong><br/>
            <strong>UC:</strong> ${uc ? uc.name : 'Unknown'}<br/>
            <strong>Date Submitted:</strong> ${new Date(report.created_at).toLocaleDateString()}<br/>
            <strong>Note:</strong> "${report.note || 'No note attached'}"<br/>
            ${report.photo_url ? `<img src="${report.photo_url}" style="width:100%; border-radius:4px; margin-top:5px; max-height:80px; object-fit:cover;" />` : ''}
          </div>
        `;

        L.marker([report.report_lat, report.report_lng], { icon: trashIcon })
          .bindPopup(popupContent)
          .addTo(layersGroupRef.current);
      });
    }

    // Adjust leaflet viewport sizes
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

  }, [unionCouncils, claimedCollections, reports, trustScores]);

  return (
    <div className="map-view-card card-glass">
      <div className="map-view-header text-left">
        <h2 className="section-title">Lahore last-mile dispute map</h2>
        <p className="form-sub-desc">
          Interactive municipal view of Lahore. Circles represent Union Councils (colored by trust status). Blue tags represent Suthra Punjab collection claims. Red bins represent verified disputes.
        </p>
      </div>

      <div className="map-dashboard-container mt-20 relative">
        <div ref={mapContainerRef} className="dashboard-leaflet-map"></div>
        
        {/* Map Legend */}
        <div className="map-legend-box card-glass font-sm text-left">
          <h4 className="legend-title">Legend:</h4>
          <div className="legend-item"><span className="legend-color high"></span> High Trust (score &gt;= 70)</div>
          <div className="legend-item"><span className="legend-color medium"></span> Moderate Trust (40 - 69)</div>
          <div className="legend-item"><span className="legend-color low"></span> Critical Trust (&lt; 40)</div>
          <div className="legend-divider"></div>
          <div className="legend-item"><span className="legend-symbol blue-tag">Claim</span> Official Collection Claim</div>
          <div className="legend-item"><span className="legend-symbol red-bin">🗑️</span> Verified Trash Dispute</div>
        </div>
      </div>
    </div>
  );
}
