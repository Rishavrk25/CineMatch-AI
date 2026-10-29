# CineMatch AI — Free-of-Cost Deployment Guide

Target budget: **₹0 / Month** using official free tiers and local development.

## Service Free Tier Breakdown

| Service | Tier / Plan | Free Allowance | Cold Starts / Limits |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | M0 Shared Cluster | 512 MB storage, shared RAM | No idle sleep, capped throughput |
| **Neo4j AuraDB** | AuraDB Free | 1 instance, 200k nodes, 400k relationships | Pauses after 72h inactivity (resumes via console) |
| **Pinecone** | Starter / Free Tier | 1 index, up to 100k vectors (serverless free unit) | Serverless latency spikes on cold calls |
| **Gemini API** | Free Tier (Google AI Studio) | 15 RPM, 1M TPM, 1,500 RPD for 1.5 Flash | Rate limit handling with exponential backoff required |
| **Backend Hosting** | Render / Railway / Local | 750 free compute hours (Render web service) | Sleeps after 15 mins inactivity (50s cold start) |
| **Frontend Hosting** | Vercel / Netlify | Free hobby tier with custom domain support | Instant CDN delivery |

## Local Prerequisites
- Node.js >= 20 (Tested on Node v22.17.1)
- npm >= 10
- Git
