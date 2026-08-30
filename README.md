# 🏛️ Shehr AI — AI-Powered Civic Arbitration Engine
**Built for the Code for Pakistan Smart City Hackathon Lahore 2026**  
**Theme:** Clean City | **Problem Statement 1:** Verifying Waste Collection Claims at the Last Mile

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Project-blue?style=for-the-badge)](https://shehrai.vercel.app/)

---

## 📌 The Problem: "Ghost Cleaning"
Despite the Rs. 150 Billion investment in the *Suthra Punjab Programme*, there is currently no independent, citizen-verifiable mechanism to confirm if waste collection actually took place. Official dashboards often show areas as "Cleaned" (green), but citizens on the ground still see uncollected waste. 

Existing citizen apps act as simple "complaint boxes" with no trust layer, leading to duplicate spam and unresolved disputes between government contractors and residents.

## 💡 Our Solution: The Digital Jury
Shehr AI is not just another reporting app—it is an **independent mathematical and AI audit layer**. 

When a government worker claims an area is cleaned, and a citizen disputes that claim with their own photo, Shehr AI acts as an impartial "Digital Jury." It cross-examines both photos, verifies the metadata, and uses a Vision AI model to issue an objective verdict. Verified disputes dynamically lower the Union Council's "Public Trust Score" and flag chronic hotspots.

## ⚙️ How It Works (The Verification Pipeline)

1. **The Official Claim (Mock Govt Portal):** A simulated Suthra Punjab admin marks a Union Council as cleaned and uploads a proof photo.
2. **The Citizen Dispute:** A citizen uploads a photo proving the waste is still there. The system captures their browser GPS.
3. **Duplicate Agent (Haversine Formula):** Before proceeding, a JS-based Haversine distance algorithm checks if a verified dispute already exists within 50 meters in the last few days, preventing spam.
4. **Authenticity Agent (EXIF Data):** The system extracts GPS metadata from the citizen's photo to verify it was actually taken at the claimed location.
5. **AI Vision Arbitrator (Gemini 1.5):** Both the government's photo and the citizen's photo are sent to a Vision AI. The AI acts as an auditor, visually comparing the images to determine if the citizen's dispute is valid, returning a JSON verdict and explanation.
6. **Repeat Offender & Trust Score Logic:** Validated disputes lower the Union Council's Trust Score. If a UC gets 2+ valid disputes in 30 days, it receives a strict **"⚠️ CHRONIC HOTSPOT"** badge.

## 🛠️ Tech Stack (100% Zero-Budget Architecture)

* **Frontend:** React.js (Vite), styled with Tailwind CSS (Custom Civic Blue/White Palette)
* **Backend & Database:** Supabase (PostgreSQL, Storage Buckets, PostGIS logic)
* **Maps:** React-Leaflet with OpenStreetMap (Free Tiles)
* **AI Engine:** Google Gemini 3.5 Flash Vision API
* **Client-Side Processing:** `exif-js` (Metadata extraction), `browser-image-compression`
* **Hosting:** Vercel

## 🚀 Local Setup & Installation

To run Shehr AI locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/uzairali9518/Shehr-AI)
