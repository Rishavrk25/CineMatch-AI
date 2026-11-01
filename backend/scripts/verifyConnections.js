import { checkMongoHealth, connectMongoDB, closeMongoDB } from '../src/config/mongodb.js';
import { checkNeo4jHealth, getNeo4jDriver, closeNeo4j } from '../src/config/neo4j.js';
import { checkPineconeHealth, getPineconeClient } from '../src/config/pinecone.js';
import { env } from '../src/config/env.js';

async function verifyAllConnections() {
  console.log('====================================================');
  console.log('🔌 CineMatch AI — Comprehensive Connection Verification');
  console.log('====================================================\n');

  let allSuccess = true;

  // 1. MongoDB Verification
  console.log('--- [1/4] Verifying MongoDB Connection ---');
  try {
    const mongoConn = await connectMongoDB();
    if (mongoConn) {
      const health = await checkMongoHealth();
      console.log('✅ MongoDB: CONNECTED');
      console.log(`   Host: ${health.host || 'local'}`);
      console.log(`   Database: ${health.database}`);
    } else {
      console.error('❌ MongoDB: FAILED to connect');
      allSuccess = false;
    }
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    allSuccess = false;
  }

  // 2. Neo4j Verification
  console.log('\n--- [2/4] Verifying Neo4j Connection ---');
  try {
    const neoHealth = await checkNeo4jHealth();
    if (neoHealth.status === 'connected') {
      console.log('✅ Neo4j: CONNECTED');
      console.log(`   Address: ${neoHealth.address}`);
      console.log(`   Server Agent: ${neoHealth.agent}`);

      const driver = getNeo4jDriver();
      const session = driver.session();
      try {
        const result = await session.run('RETURN 1 AS test');
        const record = result.records[0];
        console.log(`   Query Test: SUCCESS (RETURN ${record.get('test')})`);
      } finally {
        await session.close();
      }
    } else {
      console.error('❌ Neo4j: FAILED - Status:', neoHealth.status, neoHealth.error || '');
      allSuccess = false;
    }
  } catch (err) {
    console.error('❌ Neo4j Error:', err.message);
    allSuccess = false;
  }

  // 3. Pinecone Verification
  console.log('\n--- [3/4] Verifying Pinecone Vector Database ---');
  let pineconeDimension = null;
  try {
    const pineHealth = await checkPineconeHealth();
    if (pineHealth.status === 'connected') {
      console.log('✅ Pinecone Client: CONNECTED');
      const client = getPineconeClient();
      const indexList = await client.listIndexes();
      console.log(`   Available Indexes: ${indexList.indexes?.map(i => `${i.name} (dim: ${i.dimension}, metric: ${i.metric})`).join(', ') || 'None'}`);

      const targetFound = indexList.indexes?.find(i => i.name === env.PINECONE_INDEX_NAME);
      if (targetFound) {
        pineconeDimension = targetFound.dimension;
        console.log(`   Target Index "${env.PINECONE_INDEX_NAME}": FOUND`);
        console.log(`   Target Index Dimension: ${targetFound.dimension}`);
        console.log(`   Target Index Metric: ${targetFound.metric}`);
        console.log(`   Target Index Status: ${targetFound.status?.state}`);
      } else {
        console.log(`   Target Index "${env.PINECONE_INDEX_NAME}": NOT FOUND`);
      }
    } else {
      console.error('❌ Pinecone: FAILED -', pineHealth.error || 'Connection failed');
      allSuccess = false;
    }
  } catch (err) {
    console.error('❌ Pinecone Error:', err.message);
    allSuccess = false;
  }

  // 4. Gemini API Verification
  console.log('\n--- [4/4] Verifying Google Gemini API ---');
  try {
    if (!env.GEMINI_API_KEY) {
      console.error('❌ Gemini: GEMINI_API_KEY is not set');
      allSuccess = false;
    } else {
      // Test generation model via Google AI Studio API
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_GENERATION_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      const genStart = Date.now();
      const genRes = await fetch(genUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond in 3 words: CineMatch is active.' }] }]
        }),
        signal: AbortSignal.timeout(10000)
      });
      const genData = await genRes.json();
      const genElapsed = Date.now() - genStart;

      if (genData.candidates && genData.candidates[0]) {
        console.log('✅ Gemini Generation API: CONNECTED');
        console.log(`   Model: ${env.GEMINI_GENERATION_MODEL} (${genElapsed}ms)`);
        console.log(`   Output: "${genData.candidates[0].content.parts[0].text.trim()}"`);
      } else {
        console.error('❌ Gemini Generation API error:', genData.error ? genData.error.message : JSON.stringify(genData));
        allSuccess = false;
      }

      // Test embedding model
      const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`;
      const embedPayload = {
        content: { parts: [{ text: 'CineMatch AI test embedding' }] }
      };
      if (pineconeDimension) {
        embedPayload.outputDimensionality = pineconeDimension;
      }

      const embedStart = Date.now();
      const embedRes = await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedPayload),
        signal: AbortSignal.timeout(10000)
      });
      const embedData = await embedRes.json();
      const embedElapsed = Date.now() - embedStart;

      if (embedData.embedding && embedData.embedding.values) {
        const valuesLength = embedData.embedding.values.length;
        console.log('✅ Gemini Embedding API: CONNECTED');
        console.log(`   Embedding Model: ${env.GEMINI_EMBEDDING_MODEL} (${embedElapsed}ms)`);
        console.log(`   Embedding Dimension: ${valuesLength}`);
        if (pineconeDimension && valuesLength === pineconeDimension) {
          console.log(`   Dimension Match: PERFECT (${valuesLength} matches Pinecone ${pineconeDimension})`);
        } else if (pineconeDimension) {
          console.warn(`   ⚠️ Dimension Mismatch: Embedding has ${valuesLength}, but Pinecone expects ${pineconeDimension}`);
          allSuccess = false;
        }
      } else {
        console.error('❌ Gemini Embedding API error:', embedData.error ? embedData.error.message : JSON.stringify(embedData));
        allSuccess = false;
      }
    }
  } catch (err) {
    console.error('❌ Gemini API Error:', err.message);
    allSuccess = false;
  }

  // Cleanup
  await closeMongoDB();
  await closeNeo4j();

  console.log('\n====================================================');
  if (allSuccess) {
    console.log('🎉 ALL INTEGRATIONS VERIFIED & READY FOR PIPELINE!');
  } else {
    console.log('⚠️ SOME INTEGRATIONS FAILED OR REQUIRE ATTENTION');
  }
  console.log('====================================================');
}

verifyAllConnections().catch(console.error);
