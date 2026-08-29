import React, { useState, useEffect, useRef } from 'react';
import { db } from '../supabaseClient';
import { Upload, MapPin, Loader, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function GovAdmin({ unionCouncils, onClaimSubmitted }) {
  const [selectedUcId, setSelectedUcId] = useState(unionCouncils[0]?.id || '');
  const [claimedLat, setClaimedLat] = useState('');
  const [claimedLng, setClaimedLng] = useState('');
  const [claimedDate, setClaimedDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const selectedUC = unionCouncils.find(uc => uc.id === selectedUcId);

  // Initialize browser GPS or UC center on load
  useEffect(() => {
    if (selectedUC) {
      setClaimedLat(selectedUC.center_lat);
      setClaimedLng(selectedUC.center_lng);
    }
  }, [selectedUcId, unionCouncils]);

  // Initialize Leaflet Map ONCE with proper cleanup on unmount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = selectedUC ? selectedUC.center_lat : 31.4697;
    const initialLng = selectedUC ? selectedUC.center_lng : 74.2800;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      const claimIcon = L.divIcon({
        className: 'custom-map-marker claim-marker-setup',
        html: '<div class="marker-pin blue"><span class="marker-dot"></span></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: claimIcon
      }).addTo(mapRef.current);

      markerRef.current.on('dragend', () => {
        const position = markerRef.current.getLatLng();
        setClaimedLat(position.lat);
        setClaimedLng(position.lng);
      });

      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        setClaimedLat(lat);
        setClaimedLng(lng);
      });
    }

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, []);

  // Update map view/marker when selected UC changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !selectedUC) return;

    mapRef.current.setView([selectedUC.center_lat, selectedUC.center_lng], 14);
    markerRef.current.setLatLng([selectedUC.center_lat, selectedUC.center_lng]);
    setClaimedLat(selectedUC.center_lat);
    setClaimedLng(selectedUC.center_lng);

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedUcId, unionCouncils]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!claimedLat || !claimedLng) {
      alert("Please select a location on the map.");
      return;
    }
    if (!photo) {
      alert("Please upload a collection proof photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const claimPayload = {
        union_council_id: selectedUcId,
        claimed_lat: parseFloat(claimedLat),
        claimed_lng: parseFloat(claimedLng),
        claimed_date: claimedDate,
        source: 'suthra_punjab_mock'
      };

      await db.createClaimedCollection(claimPayload, photo);
      
      setSuccessMsg(true);
      setPhoto(null);
      setPhotoPreview('');
      
      // Notify parent to load data
      if (onClaimSubmitted) {
        onClaimSubmitted();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit government clean claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gov-admin-container card-glass text-left">
      <h2 className="section-title">
        <Upload className="inline-icon text-info" /> Log Suthra Punjab Waste Collection Claim
      </h2>
      <p className="form-sub-desc">
        Internal portal for municipal workers. Log a street waste collection claim by pinning the coordinates and uploading proof of cleaning.
      </p>

      {successMsg && (
        <div className="alert alert-success flex-row mt-15">
          <CheckCircle className="alert-icon text-success" />
          <div>
            <strong>Success:</strong> Official collection claim successfully logged into Suthra Punjab node.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-body mt-20">
        <div className="form-grid">
          <div className="form-fields-column">
            {/* 1. UC Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="gov-uc-select">Union Council</label>
              <select
                id="gov-uc-select"
                className="form-input"
                value={selectedUcId}
                onChange={(e) => setSelectedUcId(e.target.value)}
                required
              >
                {unionCouncils.map((uc) => (
                  <option key={uc.id} value={uc.id}>{uc.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Photo Uploader */}
            <div className="form-group">
              <label className="form-label">Proof of Collection Photo</label>
              <div className="file-uploader-box">
                <input
                  type="file"
                  id="gov-photo-input"
                  className="hidden-file-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required
                />
                <label htmlFor="gov-photo-input" className="file-uploader-label">
                  {photoPreview ? (
                    <div className="upload-preview-container">
                      <img src={photoPreview} alt="Collection preview" className="upload-preview" />
                      <div className="upload-meta">
                        <span className="file-name">{photo.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="uploader-placeholder flex-col">
                      <Upload className="upload-icon color-primary" />
                      <span className="upload-title">Upload Clean Street Photo</span>
                      <span className="upload-subtitle">Proof of collection (JPG, PNG)</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* 3. Claim Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="claimed-date">Claimed Date</label>
              <input
                id="claimed-date"
                type="date"
                className="form-input"
                value={claimedDate}
                onChange={(e) => setClaimedDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="map-picker-column flex-col">
            {/* 4. Map Coordinates */}
            <div className="form-group no-margin">
              <label className="form-label">Select Claim Location coordinates</label>
              
              <div className="map-picker-wrapper mt-10">
                <div ref={mapContainerRef} className="form-map-container"></div>
                <div className="map-overlay-tip font-sm">
                  <span>ℹ️ Click map or drag the blue marker to pinpoint where cleaning occurred.</span>
                </div>
              </div>

              <div className="coords-readout mt-10 flex-row font-sm">
                <span>📍 Lat: <strong>{claimedLat ? parseFloat(claimedLat).toFixed(5) : 'Loading...'}</strong></span>
                <span className="ml-20">📍 Lng: <strong>{claimedLng ? parseFloat(claimedLng).toFixed(5) : 'Loading...'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary submit-btn flex-center mt-30"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="spin btn-icon" /> Registering Claim...
            </>
          ) : (
            'Publish Collection Claim'
          )}
        </button>
      </form>
    </div>
  );
}
