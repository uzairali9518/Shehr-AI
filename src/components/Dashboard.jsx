import React, { useState, useEffect, useRef } from 'react';
import { Award, AlertTriangle, CheckCircle, ShieldAlert, ChevronDown, ChevronUp, Calendar, Trash2, Map, ExternalLink, Sparkles } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Dashboard({ unionCouncils, claimedCollections, reports, trustScores }) {
  const [expandedUcId, setExpandedUcId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Map references
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Compute aggregate stats
  const totalClaims = claimedCollections.length;
  const totalVerifiedDisputes = reports.filter(r => r.ai_verdict === 'VALID DISPUTE').length;
  const avgTrustScore = trustScores.length > 0
    ? trustScores.reduce((sum, ts) => sum + ts.score, 0) / trustScores.length
    : 100;

  // Initialize the dashboard map ONCE with proper cleanup on unmount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([31.4697, 74.3400], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      layersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const initialTimer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(initialTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (layersGroupRef.current) {
        layersGroupRef.current = null;
      }
    };
  }, []);

  // Draw/refresh map layers when data changes
  useEffect(() => {
    if (!layersGroupRef.current || !mapRef.current) return;

    layersGroupRef.current.clearLayers();

    const getTrustColor = (score) => {
      if (score >= 70) return '#0c1b33'; // Deep navy for High Trust
      if (score >= 40) return '#3b82f6'; // Accenting blue for Moderate Trust
      return '#94a3b8'; // Muted gray-blue for Critical Trust
    };

    // A. Draw UC circles
    unionCouncils.forEach((uc) => {
      const scoreObj = trustScores.find(ts => ts.union_council_id === uc.id);
      const score = scoreObj ? scoreObj.score : 100;
      const color = getTrustColor(score);

      const circle = L.circle([uc.center_lat, uc.center_lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        radius: 1200
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size:12px; line-height:1.4; padding:2px;">
          <strong style="font-size:13px; color:#0c1b33;">${uc.name}</strong><br/>
          <span style="font-weight:bold; color:${color};">Trust Index: ${score.toFixed(0)}%</span>
          ${scoreObj?.is_repeat_offender ? '<br/><span style="color:#0c1b33; font-weight:bold; font-size:10px; border:1px solid #0c1b33; padding:1px 3px; display:inline-block; margin-top:4px;">🚨 REPEAT OFFENDER ZONE</span>' : ''}
        </div>
      `;
      circle.bindPopup(popupContent).addTo(layersGroupRef.current);
    });

    // B. Draw Claimed Collections as Blue markers
    claimedCollections.forEach((claim) => {
      const claimIcon = L.divIcon({
        className: 'custom-map-marker claim-marker-blue',
        html: `<div class="marker-pin-blue flex-center">✓</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const uc = unionCouncils.find(u => u.id === claim.union_council_id);

      const popupContent = `
        <div style="font-family: sans-serif; font-size:12px; line-height:1.4;">
          <strong style="color:#3b82f6; font-size: 13px;">Official Clean Claim</strong><br/>
          <strong>UC:</strong> ${uc ? uc.name : 'Unknown'}<br/>
          <strong>Date:</strong> ${claim.claimed_date}<br/>
          <strong>Source:</strong> Suthra Punjab Feed
        </div>
      `;

      L.marker([claim.claimed_lat, claim.claimed_lng], { icon: claimIcon })
        .bindPopup(popupContent)
        .addTo(layersGroupRef.current);
    });

    // C. Draw Disputes as Navy markers
    reports.forEach((dispute) => {
      const isVerified = dispute.ai_verdict === 'VALID DISPUTE';
      
      const disputeIcon = L.divIcon({
        className: `custom-map-marker dispute-marker-navy ${isVerified ? 'animate-pulse' : ''}`,
        html: `<div class="marker-pin-navy flex-center">${isVerified ? '⚠️' : '✓'}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26]
      });

      const uc = unionCouncils.find(u => u.id === dispute.union_council_id);
      const formattedTime = new Date(dispute.created_at).toLocaleDateString();

      const popupContent = `
        <div style="font-family: sans-serif; font-size:12px; line-height:1.4; width: 180px;">
          <strong style="color:#0c1b33; font-size: 13px;">${dispute.ai_verdict}</strong><br/>
          <strong>UC:</strong> ${uc ? uc.name : 'Unknown'}<br/>
          <strong>Date:</strong> ${formattedTime}<br/>
          <p style="margin: 5px 0 0 0; font-style: italic; line-height: 1.2;">"${dispute.ai_reasoning || 'No details'}"</p>
        </div>
      `;

      L.marker([dispute.report_lat, dispute.report_lng], { icon: disputeIcon })
        .bindPopup(popupContent)
        .addTo(layersGroupRef.current);
    });

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);

  }, [unionCouncils, claimedCollections, reports, trustScores]);

  // Rating color utilities matching blue/white spec
  const getScoreRating = (score, isRepeatOffender) => {
    if (isRepeatOffender) {
      return { 
        label: 'Repeat Offender', 
        colorClass: 'trust-critical', 
        icon: <ShieldAlert className="stat-icon text-navy" /> 
      };
    }
    if (score >= 70) {
      return { 
        label: 'High Trust', 
        colorClass: 'trust-high', 
        icon: <CheckCircle className="stat-icon text-navy" /> 
      };
    }
    if (score >= 40) {
      return { 
        label: 'Moderate Trust', 
        colorClass: 'trust-medium', 
        icon: <AlertTriangle className="stat-icon text-blue" /> 
      };
    }
    return { 
      label: 'Low Trust', 
      colorClass: 'trust-low', 
      icon: <ShieldAlert className="stat-icon text-muted" /> 
    };
  };

  const getUcStats = (ucId) => {
    const ucClaims = claimedCollections.filter(c => c.union_council_id === ucId);
    const ucDisputes = reports.filter(r => r.union_council_id === ucId);
    const ucVerified = ucDisputes.filter(r => r.ai_verdict === 'VALID DISPUTE');
    const ucTrust = trustScores.find(ts => ts.union_council_id === ucId);
    
    const score = ucTrust ? ucTrust.score : 100;
    const isRepeatOffender = ucTrust ? ucTrust.is_repeat_offender : false;

    return {
      claimsCount: ucClaims.length,
      disputesCount: ucDisputes.length,
      verifiedCount: ucVerified.length,
      score,
      isRepeatOffender,
      ...getScoreRating(score, isRepeatOffender)
    };
  };

  const handleOpenCase = (dispute) => {
    setSelectedCase(dispute);
  };

  return (
    <div className="dashboard-view">
      {/* Overview Stats Block */}
      <div className="stats-row grid-4">
        <div className="stat-card card-glass text-left">
          <span className="stat-title">Overall Lahore Index</span>
          <div className="stat-value flex-row">
            <span className="num">{avgTrustScore.toFixed(0)}%</span>
            <Award className="icon-main color-primary" />
          </div>
          <p className="stat-desc">Weighted average of all Union Council trust scores.</p>
        </div>

        <div className="stat-card card-glass text-left">
          <span className="stat-title">Verified Disputes</span>
          <div className="stat-value flex-row">
            <span className="num">{totalVerifiedDisputes}</span>
            <Trash2 className="icon-main text-navy" />
          </div>
          <p className="stat-desc">Crowdsourced reports matching claimed collections.</p>
        </div>

        <div className="stat-card card-glass text-left">
          <span className="stat-title">Official Claims Feed</span>
          <div className="stat-value flex-row">
            <span className="num">{totalClaims}</span>
            <Calendar className="icon-main text-info" />
          </div>
          <p className="stat-desc">Waste collections claimed by Suthra Punjab feed.</p>
        </div>

        <div className="stat-card card-glass text-left font-sm">
          <span className="stat-title">Disputed Claims Rate</span>
          <div className="stat-value flex-row">
            <span className="num">
              {totalClaims > 0 ? ((totalVerifiedDisputes / totalClaims) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="stat-desc">Percentage of official collection claims disputed.</p>
        </div>
      </div>

      {/* Embedded Lahore Dashboard Map & UC Standings split view */}
      <h2 className="section-title mt-40">
        <Map className="inline-icon color-primary" /> Lahore Last Mile Dispute Dashboard
      </h2>
      
      <div className="dashboard-split-layout mt-20">
        {/* Leaflet map container (60% width) */}
        <div className="dashboard-map-panel card-glass relative">
          <div ref={mapContainerRef} className="dashboard-embedded-map"></div>
          
          {/* Map Legend Overlay */}
          <div className="dashboard-map-legend text-left font-sm">
            <h4 className="legend-title">Map Status Keys:</h4>
            <div className="legend-item"><span className="legend-symbol blue-tag flex-center">✓</span> Official Clean Claim</div>
            <div className="legend-item"><span className="legend-symbol navy-bin-mini flex-center">⚠️</span> Valid Dispute Verdict</div>
            <div className="legend-divider"></div>
            <div className="legend-item"><span className="legend-circle high"></span> High Trust (score &gt;= 70%)</div>
            <div className="legend-item"><span className="legend-circle medium"></span> Moderate Trust (40% - 69%)</div>
            <div className="legend-item"><span className="legend-circle low"></span> Critical Trust (&lt; 40%)</div>
          </div>
        </div>

        {/* UC list standing cards (40% width) */}
        <div className="dashboard-standings-panel flex-col">
          {unionCouncils.map((uc) => {
            const stats = getUcStats(uc.id);
            const isExpanded = expandedUcId === uc.id;
            const ucRecentDisputes = reports.filter(r => r.union_council_id === uc.id);

            return (
              <div key={uc.id} className={`uc-card card-glass ${stats.colorClass} dashboard-compact-card`}>
                <div className="uc-card-header flex-between">
                  <div className="text-left">
                    <h3 className="uc-name flex-row">
                      {uc.name}
                      {stats.isRepeatOffender && (
                        <span className="repeat-offender-badge">Repeat Offender</span>
                      )}
                    </h3>
                    <div className="rating-tag flex-row">
                      {stats.icon}
                      <span className="rating-label">{stats.label}</span>
                    </div>
                  </div>

                  <div className="score-container flex-col">
                    <div className="score-ring">
                      <span className="score-num">{stats.score.toFixed(0)}</span>
                      <span className="score-pct">%</span>
                    </div>
                  </div>
                </div>

                <div className="uc-card-stats grid-3 compact-grid">
                  <div className="uc-stat-item">
                    <span className="val">{stats.claimsCount}</span>
                    <span className="lbl">Claims</span>
                  </div>
                  <div className="uc-stat-item border-inline">
                    <span className="val">{stats.verifiedCount}</span>
                    <span className="lbl">Disputes</span>
                  </div>
                  <div className="uc-stat-item">
                    <span className="val">{stats.disputesCount - stats.verifiedCount}</span>
                    <span className="lbl">Rejections</span>
                  </div>
                </div>

                <button
                  className="expand-btn flex-center"
                  onClick={() => setExpandedUcId(isExpanded ? null : uc.id)}
                >
                  {isExpanded ? (
                    <>
                      Hide Feed <ChevronUp className="btn-icon" />
                    </>
                  ) : (
                    <>
                      View Feed ({stats.disputesCount}) <ChevronDown className="btn-icon" />
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="uc-audit-feed">
                    {ucRecentDisputes.length === 0 ? (
                      <p className="no-reports-txt">No disputes filed yet.</p>
                    ) : (
                      <div className="audit-logs-list">
                        {ucRecentDisputes.map((dispute) => (
                          <div key={dispute.id} className={`audit-log-item status-${dispute.ai_verdict === 'VALID DISPUTE' ? 'verified' : 'rejected'}`}>
                            <div className="audit-meta flex-between">
                              <span className="audit-date">
                                {new Date(dispute.created_at).toLocaleDateString()}
                              </span>
                              <span className={`status-badge-inline ${dispute.ai_verdict === 'VALID DISPUTE' ? 'verified' : 'rejected'}`}>
                                {dispute.ai_verdict === 'VALID DISPUTE' ? 'VALID DISPUTE' : 'REJECTED DISPUTE'}
                              </span>
                            </div>
                            
                            <div className="audit-content flex-row mt-10">
                              {dispute.citizen_photo_url && (
                                <img
                                  src={dispute.citizen_photo_url}
                                  alt="Evidence"
                                  className="audit-thumb"
                                />
                              )}
                              <div className="audit-details text-left font-sm">
                                <p className="audit-note">"{dispute.ai_reasoning?.substring(0, 80)}..."</p>
                                <button 
                                  onClick={() => handleOpenCase(dispute)} 
                                  className="btn-case-link flex-row text-info mt-5"
                                >
                                  <ExternalLink size={12} /> View Arbitration Case
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DISPUTE CASE DETAIL VIEW MODAL (Signature Moment) */}
      {selectedCase && (
        <div className="modal-backdrop flex-center z-9999" onClick={() => setSelectedCase(null)}>
          <div className="modal-card case-detail-modal card-glass text-left" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <h3 className="modal-title flex-row">
                ⚖️ AI Vision Arbitrator Case File
              </h3>
              <button className="btn-close" onClick={() => setSelectedCase(null)}>×</button>
            </div>

            <div className="modal-body mt-20">
              <div className="dispute-case-metadata grid-3 font-sm border-bottom pb-15 mb-20">
                <div>
                  <span className="meta-lbl block-label text-muted">Union Council</span>
                  <strong className="meta-val font-md text-navy">{unionCouncils.find(u => u.id === selectedCase.union_council_id)?.name}</strong>
                </div>
                <div>
                  <span className="meta-lbl block-label text-muted">Claimed Collection ID</span>
                  <strong className="meta-val font-md text-navy">{selectedCase.claimed_collection_id}</strong>
                </div>
                <div>
                  <span className="meta-lbl block-label text-muted">Dispute Filed Date</span>
                  <strong className="meta-val font-md text-navy">{new Date(selectedCase.created_at).toLocaleString()}</strong>
                </div>
              </div>

              {/* Side-by-Side Photo Comparison */}
              <h4 className="section-subtitle font-sm block-label text-muted mb-10">Side-by-Side Photographic Analysis:</h4>
              <div className="photo-comparison-grid grid-2">
                {/* Image A: Gov Clean Proof */}
                <div className="comparison-pane">
                  <span className="pane-tag tag-gov">Image A: Government Clean Proof</span>
                  <div className="pane-img-wrapper">
                    <img 
                      src={claimedCollections.find(c => c.id === selectedCase.claimed_collection_id)?.gov_photo_url || 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=500&q=80'} 
                      alt="Gov clean proof" 
                      className="comparison-img"
                    />
                  </div>
                </div>

                {/* Image B: Citizen Dispute Proof */}
                <div className="comparison-pane">
                  <span className="pane-tag tag-citizen">Image B: Citizen Dispute Evidence</span>
                  <div className="pane-img-wrapper">
                    <img 
                      src={selectedCase.citizen_photo_url} 
                      alt="Citizen dispute evidence" 
                      className="comparison-img"
                    />
                  </div>
                </div>
              </div>

              {/* AI Verdict Box */}
              <div className={`verdict-display-card mt-25 verdict-style-${selectedCase.ai_verdict === 'VALID DISPUTE' ? 'valid' : 'rejected'}`}>
                <h4 className="verdict-card-title flex-between">
                  <span>AI VERDICT ENGINE: {selectedCase.ai_verdict}</span>
                  <span className="engine-badge font-xs flex-row"><Sparkles size={12} /> Gemini 1.5 Flash</span>
                </h4>
                <p className="verdict-reasoning mt-10">
                  {selectedCase.ai_reasoning}
                </p>
                <div className="verdict-disclaimer font-sm mt-15 text-muted">
                  ⚠️ AI-assisted verdict, subject to human review.
                </div>
              </div>

              {/* EXIF GPS Audit Log */}
              <div className="exif-audit-strip mt-20 font-sm">
                <span className="lbl text-muted">GPS EXIF Verification Status:</span>
                <span className="val">
                  {selectedCase.exif_lat 
                    ? `MATCH VERIFIED (Exif coords: ${selectedCase.exif_lat.toFixed(4)}, ${selectedCase.exif_lng.toFixed(4)})`
                    : 'NO EXIF COORDINATE HEADERS DETECTED (Neutral)'
                  }
                </span>
              </div>
            </div>

            <div className="modal-footer mt-25 flex-end">
              <button className="btn btn-primary" onClick={() => setSelectedCase(null)}>
                Dismiss Case File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
