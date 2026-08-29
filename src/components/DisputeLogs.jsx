import React, { useState } from 'react';
import { Filter, Calendar, MapPin, Eye, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

export default function DisputeLogs({ reports, unionCouncils, claimedCollections }) {
  const [selectedUc, setSelectedUc] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);

  const getUcName = (ucId) => {
    const uc = unionCouncils.find(u => u.id === ucId);
    return uc ? uc.name : 'Unknown Union Council';
  };

  const getStatusBadge = (verdict, isDuplicate, isGpsMismatch) => {
    if (verdict === 'VALID DISPUTE') {
      return <span className="status-badge-inline verified">VALID DISPUTE</span>;
    }
    if (isDuplicate) {
      return <span className="status-badge-inline duplicate">REJECTED: DUPLICATE</span>;
    }
    if (isGpsMismatch) {
      return <span className="status-badge-inline gps-mismatch">REJECTED: GPS MISMATCH</span>;
    }
    return <span className="status-badge-inline rejected">REJECTED DISPUTE</span>;
  };

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const ucMatch = selectedUc === 'all' || r.union_council_id === selectedUc;
    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'verified' && r.ai_verdict === 'VALID DISPUTE') ||
      (selectedStatus === 'rejected_duplicate' && r.is_duplicate) ||
      (selectedStatus === 'rejected_gps' && r.is_gps_mismatch) ||
      (selectedStatus === 'rejected_standard' && r.ai_verdict === 'REJECTED DISPUTE' && !r.is_duplicate && !r.is_gps_mismatch);
    return ucMatch && statusMatch;
  });

  return (
    <div className="dispute-logs-view card-glass text-left">
      <div className="view-header flex-between flex-wrap">
        <div>
          <h2 className="section-title">
            <Filter className="inline-icon color-primary" /> Last Mile Verification Feed
          </h2>
          <p className="form-sub-desc">
            Browse the transparent public register of crowdsourced disputes, duplicates, and verification audits.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls flex-row flex-wrap mt-10">
          <div className="filter-group">
            <label className="font-sm block-label">Filter Union Council:</label>
            <select
              className="filter-select"
              value={selectedUc}
              onChange={(e) => setSelectedUc(e.target.value)}
            >
              <option value="all">All Councils</option>
              {unionCouncils.map(uc => (
                <option key={uc.id} value={uc.id}>{uc.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group ml-10">
            <label className="font-sm block-label">Filter Verification Verdict:</label>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Verdicts</option>
              <option value="verified">Valid Disputes</option>
              <option value="rejected_duplicate">Rejected: Duplicates</option>
              <option value="rejected_gps">Rejected: GPS Mismatch</option>
              <option value="rejected_standard">Rejected Disputes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Grid */}
      <div className="logs-feed-container mt-20">
        {filteredReports.length === 0 ? (
          <div className="empty-state text-center mt-30 mb-30 flex-col">
            <ShieldAlert className="icon-large text-muted" />
            <p className="mt-10 font-lg">No audit records match your active filters.</p>
          </div>
        ) : (
          <div className="logs-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className={`log-row-card border-${report.ai_verdict === 'VALID DISPUTE' ? 'verified' : 'rejected'}`}>
                <div className="log-row-header flex-between flex-wrap">
                  <div className="text-left">
                    <h3 className="log-uc-name">{getUcName(report.union_council_id)}</h3>
                    <div className="meta-row font-sm text-muted flex-row">
                      <span className="flex-row"><Calendar size={13} /> {new Date(report.created_at).toLocaleString()}</span>
                      <span className="flex-row ml-20"><MapPin size={13} /> {report.report_lat.toFixed(4)}, {report.report_lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(report.ai_verdict, report.is_duplicate, report.is_gps_mismatch)}
                  </div>
                </div>

                <div className="log-row-content flex-row mt-15 flex-wrap">
                  {report.citizen_photo_url && (
                    <div className="image-preview-wrapper relative">
                      <img src={report.citizen_photo_url} alt="Dispute Waste" className="log-thumbnail" />
                      <button
                        onClick={() => setSelectedCase(report)}
                        className="zoom-overlay flex-center"
                        title="Click to view arbitration file"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  )}

                  <div className="log-row-details text-left flex-grow">
                    <div className="note-card">
                      <span className="note-label flex-row"><Sparkles size={13} className="text-info" /> AI Arbitrator Reasoning:</span>
                      <p className="note-text">"{report.ai_reasoning || 'No reasoning analysis available.'}"</p>
                    </div>

                    <div className="audit-readout-strip mt-10 grid-3 font-sm">
                      <div className="audit-val">
                        <span className="lbl">Duplicate Check:</span>
                        <span className={`val ${report.is_duplicate ? 'text-navy font-bold text-underline' : 'text-muted'}`}>
                          {report.is_duplicate ? 'Duplicate Flagged' : 'Passed'}
                        </span>
                      </div>
                      <div className="audit-val">
                        <span className="lbl">GPS Exif Match:</span>
                        <span className={`val ${report.is_gps_mismatch ? 'text-navy font-bold text-underline' : report.exif_lat ? 'text-muted' : 'text-muted'}`}>
                          {report.is_gps_mismatch 
                            ? 'Mismatch (&gt;200m)' 
                            : report.exif_lat 
                              ? `Verified (${report.exif_lat.toFixed(4)})` 
                              : 'No EXIF'
                          }
                        </span>
                      </div>
                      <div className="audit-val text-right">
                        <button
                          onClick={() => setSelectedCase(report)}
                          className="btn-case-link flex-row text-info"
                        >
                          <ExternalLink size={13} /> View Full Arbitration
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISPUTE CASE DETAIL VIEW MODAL (Copy of Dashboard Modal for consistency) */}
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
