// Helper to get formatted dates relative to today
export function getDateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const UC_IDS = {
  JOHAR_TOWN: 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5',
  DHA_5: '3f6b9bb7-4b53-43ef-bf64-3be865b25ad7',
  MODEL_TOWN: 'b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b',
  GULBERG_3: '6f9c464c-35df-4d51-a20c-c603b573e351'
};

export const initialUnionCouncils = [
  {
    id: UC_IDS.JOHAR_TOWN,
    name: 'Johar Town Block G',
    center_lat: 31.4697,
    center_lng: 74.2800
  },
  {
    id: UC_IDS.DHA_5,
    name: 'DHA Phase 5',
    center_lat: 31.4621,
    center_lng: 74.4087
  },
  {
    id: UC_IDS.MODEL_TOWN,
    name: 'Model Town',
    center_lat: 31.4855,
    center_lng: 74.3262
  },
  {
    id: UC_IDS.GULBERG_3,
    name: 'Gulberg III',
    center_lat: 31.5102,
    center_lng: 74.3441
  }
];

export const initialClaimedCollections = [
  // Johar Town Block G (4 claims)
  {
    id: 'c-johar-1',
    union_council_id: UC_IDS.JOHAR_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4699,
    claimed_lng: 74.2798,
    claimed_date: getDateOffset(0),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-johar-2',
    union_council_id: UC_IDS.JOHAR_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4690,
    claimed_lng: 74.2812,
    claimed_date: getDateOffset(-1),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-johar-3',
    union_council_id: UC_IDS.JOHAR_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4705,
    claimed_lng: 74.2805,
    claimed_date: getDateOffset(-2),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-johar-4',
    union_council_id: UC_IDS.JOHAR_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4688,
    claimed_lng: 74.2790,
    claimed_date: getDateOffset(-3),
    source: 'suthra_punjab_mock'
  },

  // DHA Phase 5 (3 claims)
  {
    id: 'c-dha-1',
    union_council_id: UC_IDS.DHA_5,
    gov_photo_url: 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4625,
    claimed_lng: 74.4080,
    claimed_date: getDateOffset(0),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-dha-2',
    union_council_id: UC_IDS.DHA_5,
    gov_photo_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4615,
    claimed_lng: 74.4095,
    claimed_date: getDateOffset(-1),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-dha-3',
    union_council_id: UC_IDS.DHA_5,
    gov_photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4630,
    claimed_lng: 74.4085,
    claimed_date: getDateOffset(-2),
    source: 'suthra_punjab_mock'
  },

  // Model Town (2 claims)
  {
    id: 'c-model-1',
    union_council_id: UC_IDS.MODEL_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4860,
    claimed_lng: 74.3255,
    claimed_date: getDateOffset(0),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-model-2',
    union_council_id: UC_IDS.MODEL_TOWN,
    gov_photo_url: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.4850,
    claimed_lng: 74.3270,
    claimed_date: getDateOffset(-1),
    source: 'suthra_punjab_mock'
  },

  // Gulberg III (2 claims)
  {
    id: 'c-gulberg-1',
    union_council_id: UC_IDS.GULBERG_3,
    gov_photo_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.5105,
    claimed_lng: 74.3435,
    claimed_date: getDateOffset(0),
    source: 'suthra_punjab_mock'
  },
  {
    id: 'c-gulberg-2',
    union_council_id: UC_IDS.GULBERG_3,
    gov_photo_url: 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80',
    claimed_lat: 31.5098,
    claimed_lng: 74.3448,
    claimed_date: getDateOffset(-1),
    source: 'suthra_punjab_mock'
  }
];

export const initialDisputes = [
  // Johar Town dispute on Yesterday's claim (c-johar-2)
  {
    id: 'r-johar-1',
    claimed_collection_id: 'c-johar-2',
    union_council_id: UC_IDS.JOHAR_TOWN,
    citizen_photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    report_lat: 31.4691,
    report_lng: 74.2810,
    exif_lat: 31.4691,
    exif_lng: 74.2810,
    is_duplicate: false,
    is_gps_mismatch: false,
    ai_verdict: 'VALID DISPUTE',
    ai_reasoning: 'Image B shows multiple green trash bags and scattered plastic cups piled on the pavement, which are not present in the clean government photo. The dispute is verified as valid.',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },

  // Model Town dispute on Yesterday's claim (c-model-2)
  {
    id: 'r-model-1',
    claimed_collection_id: 'c-model-2',
    union_council_id: UC_IDS.MODEL_TOWN,
    citizen_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    report_lat: 31.4852,
    report_lng: 74.3268,
    exif_lat: 31.4853,
    exif_lng: 74.3269,
    is_duplicate: false,
    is_gps_mismatch: false,
    ai_verdict: 'VALID DISPUTE',
    ai_reasoning: 'Image B clearly shows a pile of loose cardboard, packaging waste, and leaves near the wall that was absent in Image A. The dispute is verified as valid.',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  },

  // Gulberg III dispute on Today's claim (c-gulberg-1)
  {
    id: 'r-gulberg-1',
    claimed_collection_id: 'c-gulberg-1',
    union_council_id: UC_IDS.GULBERG_3,
    citizen_photo_url: 'https://images.unsplash.com/photo-1605600611283-c48c6f66dd36?auto=format&fit=crop&w=800&q=80',
    report_lat: 31.5107,
    report_lng: 74.3433,
    exif_lat: null, // Test neutral EXIF case
    exif_lng: null,
    is_duplicate: false,
    is_gps_mismatch: false,
    ai_verdict: 'VALID DISPUTE',
    ai_reasoning: 'Image B contains multiple pieces of litter and discarded waste scattered across the walkway, indicating incomplete collection compared to Image A. The dispute is valid.',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },

  // Gulberg III dispute on Yesterday's claim (c-gulberg-2)
  {
    id: 'r-gulberg-2',
    claimed_collection_id: 'c-gulberg-2',
    union_council_id: UC_IDS.GULBERG_3,
    citizen_photo_url: 'https://images.unsplash.com/photo-1574974265409-508c96f01c1b?auto=format&fit=crop&w=800&q=80',
    report_lat: 31.5097,
    report_lng: 74.3450,
    exif_lat: 31.5096,
    exif_lng: 74.3451,
    is_duplicate: false,
    is_gps_mismatch: false,
    ai_verdict: 'VALID DISPUTE',
    ai_reasoning: 'Image B clearly shows black garbage bags piled against the wall on the side of the road, contradicting the clean photo in Image A. The dispute is valid.',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  }
];

// Initial precalculated trust scores:
// score = 100 - (valid_disputes / total_claims * 100)
// Johar Town: 4 claims, 1 dispute = 75%
// DHA 5: 3 claims, 0 disputes = 100%
// Model Town: 2 claims, 1 dispute = 50%
// Gulberg III: 2 claims, 2 disputes = 0% (repeat offender)
export const initialTrustScores = [
  {
    union_council_id: UC_IDS.JOHAR_TOWN,
    score: 75.0,
    is_repeat_offender: false,
    updated_at: new Date().toISOString()
  },
  {
    union_council_id: UC_IDS.DHA_5,
    score: 100.0,
    is_repeat_offender: false,
    updated_at: new Date().toISOString()
  },
  {
    union_council_id: UC_IDS.MODEL_TOWN,
    score: 50.0,
    is_repeat_offender: false,
    updated_at: new Date().toISOString()
  },
  {
    union_council_id: UC_IDS.GULBERG_3,
    score: 0.0,
    is_repeat_offender: true,
    updated_at: new Date().toISOString()
  }
];

export function getFullInitialData() {
  return {
    unionCouncils: initialUnionCouncils,
    claimedCollections: initialClaimedCollections,
    disputes: initialDisputes,
    trustScores: initialTrustScores
  };
}
