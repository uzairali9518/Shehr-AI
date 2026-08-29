import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are configured
const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL');

// Initialize real Supabase client if configured
export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// LocalStorage keys
const KEYS = {
  UNION_COUNCILS: 'shehr_ai_union_councils',
  CLAIMED_COLLECTIONS: 'shehr_ai_claimed_collections',
  DISPUTES: 'shehr_ai_disputes',
  TRUST_SCORES: 'shehr_ai_trust_scores',
  MODE: 'shehr_ai_db_mode'
};

// Database Service Interface
export const db = {
  isConfigured() {
    return isConfigured;
  },

  getMode() {
    if (!isConfigured) return 'sandbox';
    return localStorage.getItem(KEYS.MODE) || 'supabase';
  },

  setMode(mode) {
    if (!isConfigured && mode === 'supabase') {
      console.warn("Cannot switch to Supabase mode: environment variables not configured.");
      return false;
    }
    localStorage.setItem(KEYS.MODE, mode);
    return true;
  },

  async getUnionCouncils() {
    if (this.getMode() === 'supabase') {
      const { data, error } = await supabase.from('union_councils').select('*');
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem(KEYS.UNION_COUNCILS) || '[]');
    }
  },

  async getClaimedCollections() {
    if (this.getMode() === 'supabase') {
      const { data, error } = await supabase.from('claimed_collections').select('*');
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem(KEYS.CLAIMED_COLLECTIONS) || '[]');
    }
  },

  async createClaimedCollection(claimData, imageFile) {
    let govPhotoUrl = '';

    if (this.getMode() === 'supabase') {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `claims/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('disputes')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload failed, attempting with public placeholder:", uploadError);
          govPhotoUrl = 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=500&q=80';
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('disputes')
            .getPublicUrl(filePath);
          govPhotoUrl = publicUrlData.publicUrl;
        }
      } else {
        govPhotoUrl = claimData.gov_photo_url || '';
      }

      const { data, error } = await supabase
        .from('claimed_collections')
        .insert([{
          union_council_id: claimData.union_council_id,
          gov_photo_url: govPhotoUrl || null,
          claimed_lat: parseFloat(claimData.claimed_lat),
          claimed_lng: parseFloat(claimData.claimed_lng),
          claimed_date: claimData.claimed_date,
          source: claimData.source || 'suthra_punjab_mock'
        }])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      if (imageFile) {
        govPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      } else {
        govPhotoUrl = claimData.gov_photo_url || '';
      }

      const collections = JSON.parse(localStorage.getItem(KEYS.CLAIMED_COLLECTIONS) || '[]');
      const newClaim = {
        id: crypto.randomUUID(),
        union_council_id: claimData.union_council_id,
        gov_photo_url: govPhotoUrl,
        claimed_lat: parseFloat(claimData.claimed_lat),
        claimed_lng: parseFloat(claimData.claimed_lng),
        claimed_date: claimData.claimed_date,
        source: claimData.source || 'suthra_punjab_mock'
      };
      collections.unshift(newClaim);
      localStorage.setItem(KEYS.CLAIMED_COLLECTIONS, JSON.stringify(collections));
      return newClaim;
    }
  },

  async getDisputes() {
    if (this.getMode() === 'supabase') {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem(KEYS.DISPUTES) || '[]');
    }
  },

  async getTrustScores() {
    if (this.getMode() === 'supabase') {
      const { data, error } = await supabase.from('trust_scores').select('*');
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem(KEYS.TRUST_SCORES) || '[]');
    }
  },

  async createDispute(disputeData, imageFile) {
    let citizenPhotoUrl = '';

    if (this.getMode() === 'supabase') {
      // 1. Upload file if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `disputes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('disputes')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload failed, attempting with public placeholder:", uploadError);
          citizenPhotoUrl = 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=500&q=80';
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('disputes')
            .getPublicUrl(filePath);
          citizenPhotoUrl = publicUrlData.publicUrl;
        }
      } else {
        citizenPhotoUrl = disputeData.citizen_photo_url || '';
      }

      // 2. Insert row into disputes table
      const newDispute = {
        claimed_collection_id: disputeData.claimed_collection_id,
        union_council_id: disputeData.union_council_id,
        citizen_photo_url: citizenPhotoUrl || null,
        report_lat: parseFloat(disputeData.report_lat),
        report_lng: parseFloat(disputeData.report_lng),
        exif_lat: disputeData.exif_lat !== null ? parseFloat(disputeData.exif_lat) : null,
        exif_lng: disputeData.exif_lng !== null ? parseFloat(disputeData.exif_lng) : null,
        is_duplicate: !!disputeData.is_duplicate,
        is_gps_mismatch: !!disputeData.is_gps_mismatch,
        ai_verdict: disputeData.ai_verdict || 'REJECTED DISPUTE',
        ai_reasoning: disputeData.ai_reasoning || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('disputes')
        .insert([newDispute])
        .select();

      if (error) throw error;
      return data[0];
    } else {
      // Sandbox Mode: Write to LocalStorage
      if (imageFile) {
        // Read file as base64 for persistent preview in browser sandbox
        citizenPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      } else {
        citizenPhotoUrl = disputeData.citizen_photo_url || '';
      }

      const newDispute = {
        id: crypto.randomUUID(),
        claimed_collection_id: disputeData.claimed_collection_id,
        union_council_id: disputeData.union_council_id,
        citizen_photo_url: citizenPhotoUrl,
        report_lat: parseFloat(disputeData.report_lat),
        report_lng: parseFloat(disputeData.report_lng),
        exif_lat: disputeData.exif_lat !== null ? parseFloat(disputeData.exif_lat) : null,
        exif_lng: disputeData.exif_lng !== null ? parseFloat(disputeData.exif_lng) : null,
        is_duplicate: !!disputeData.is_duplicate,
        is_gps_mismatch: !!disputeData.is_gps_mismatch,
        ai_verdict: disputeData.ai_verdict || 'REJECTED DISPUTE',
        ai_reasoning: disputeData.ai_reasoning || '',
        created_at: new Date().toISOString()
      };

      const disputes = JSON.parse(localStorage.getItem(KEYS.DISPUTES) || '[]');
      disputes.unshift(newDispute);
      localStorage.setItem(KEYS.DISPUTES, JSON.stringify(disputes));
      return newDispute;
    }
  },

  async recalculateTrustScore(unionCouncilId) {
    // 1. Fetch claims and disputes for this UC
    const allClaims = await this.getClaimedCollections();
    const allDisputes = await this.getDisputes();

    const ucClaims = allClaims.filter(c => c.union_council_id === unionCouncilId);
    const ucDisputes = allDisputes.filter(d => d.union_council_id === unionCouncilId);
    
    // Count valid disputes (both overall and in last 30 days)
    const validDisputes = ucDisputes.filter(d => d.ai_verdict === 'VALID DISPUTE');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const validDisputesLast30Days = validDisputes.filter(d => {
      const disputeDate = new Date(d.created_at);
      return disputeDate >= thirtyDaysAgo;
    });

    const totalClaimsCount = ucClaims.length;
    const validDisputesCount = validDisputes.length;

    // Trust score formula: score = 100 - (valid_disputes_count / total_claimed_collections_count * 100)
    let score = 100;
    if (totalClaimsCount > 0) {
      score = 100 - (validDisputesCount / totalClaimsCount * 100);
    }
    score = Math.max(0, Math.min(100, score)); // Clamp

    // Repeat offender check: 2+ validated disputes in the last 30 days
    const isRepeatOffender = validDisputesLast30Days.length >= 2;

    const scorePayload = {
      union_council_id: unionCouncilId,
      score: parseFloat(score.toFixed(2)),
      is_repeat_offender: isRepeatOffender,
      updated_at: new Date().toISOString()
    };

    if (this.getMode() === 'supabase') {
      const { data, error } = await supabase
        .from('trust_scores')
        .upsert(scorePayload)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      const scores = JSON.parse(localStorage.getItem(KEYS.TRUST_SCORES) || '[]');
      const index = scores.findIndex(s => s.union_council_id === unionCouncilId);

      if (index > -1) {
        scores[index] = scorePayload;
      } else {
        scores.push(scorePayload);
      }

      localStorage.setItem(KEYS.TRUST_SCORES, JSON.stringify(scores));
      return scorePayload;
    }
  },

  // Save the full seed data to localStorage (Sandbox mode only)
  seedSandboxData(data) {
    localStorage.setItem(KEYS.UNION_COUNCILS, JSON.stringify(data.unionCouncils));
    localStorage.setItem(KEYS.CLAIMED_COLLECTIONS, JSON.stringify(data.claimedCollections));
    localStorage.setItem(KEYS.DISPUTES, JSON.stringify(data.disputes));
    localStorage.setItem(KEYS.TRUST_SCORES, JSON.stringify(data.trustScores));
  },

  isSeeded() {
    return !!localStorage.getItem(KEYS.UNION_COUNCILS);
  }
};
