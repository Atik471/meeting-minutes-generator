import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

async function testSDK() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  
  console.log("🧪 Testing Gemini SDK vs Direct HTTP\n");
  console.log(`📋 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

  // Test 1: Direct HTTP (we know this works)
  console.log("═".repeat(60));
  console.log("Test 1: Direct HTTP Call");
  console.log("═".repeat(60));
  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say 'test successful' in one sentence." }]
        }]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ SUCCESS - Direct HTTP works!");
      console.log(`   Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50)}...`);
    } else {
      console.log("❌ FAILED - Direct HTTP");
      console.log(`   Error: ${data.error?.message}`);
    }
  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }

  console.log("\n" + "═".repeat(60));
  console.log("Test 2: SDK Call");
  console.log("═".repeat(60));
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });
    
    const response = await model.generateContent("Say 'test successful' in one sentence.");
    const text = response.response.text();
    
    console.log("✅ SUCCESS - SDK works!");
    console.log(`   Response: ${text.substring(0, 50)}...`);
  } catch (err) {
    console.log("❌ FAILED - SDK");
    console.log(`   Error: ${err.message}`);
    console.log(`   Code: ${err.code}`);
    
    // Try with verbose logging
    console.log("\n💡 Attempting with detailed error info...");
    console.log(`   Full error: ${JSON.stringify(err, null, 2)}`);
  }
}

testSDK();
