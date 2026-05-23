import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Direct HTTP API Test for Gemini
 * Calls: https://generativelanguage.googleapis.com/v1beta/models/[model]:generateContent
 * Run: node testGeminiKey.js
 */
async function testGeminiKey() {
  console.log("🔍 Testing Gemini API Key (Direct HTTP Call)...\n");

  // Check if key exists
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.log("❌ ERROR: GEMINI_API_KEY not found in .env file");
    console.log("   Make sure .env file exists in backend folder with GEMINI_API_KEY=your_key\n");
    process.exit(1);
  }

  console.log(`📋 API Key Found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log(`📏 Key Length: ${apiKey.length} characters\n`);

  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.0-flash", 
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  console.log("📚 Testing models (making DIRECT HTTP calls to Google AI)...\n");
  
  let foundWorkingModel = null;
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`   🧪 Testing: ${modelName}...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      
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
        console.log(`   ✅ SUCCESS! ${modelName} works\n`);
        foundWorkingModel = modelName;
        break;
      } else if (data.error?.code === 404 || data.error?.message?.includes("not found")) {
        console.log(`   ❌ Model not available\n`);
      } else {
        console.log(`   ⚠️  Error - trying next model...\n`);
      }
        
    } catch (modelError) {
      console.log(`   ⚠️  Connection error - trying next...\n`);
    }
  }

  if (foundWorkingModel) {
    console.log("═".repeat(60));
    console.log(`✨ Your API Key WORKS with: ${foundWorkingModel}\n`);
    console.log(`📌 Update backend/src/transcribeRoute.js:`);
    console.log(`   Change: model: "gemini-2.5-flash"`);
    console.log(`   To: model: "${foundWorkingModel}"\n`);
    console.log("═".repeat(60) + "\n");
    process.exit(0);
  } else {
    throw new Error("No compatible models found! Requests ARE reaching Google AI Studio.");
  }
    
} 

// Error handler
testGeminiKey().catch(error => {
  console.log("❌ Test Failed!\n");
  console.log("📋 Error Details:");
  console.log("─".repeat(60));
  
  if (error.message) {
    console.log(`Message: ${error.message}\n`);
  }

  console.log("─".repeat(60));
  console.log("\n💡 Note: Direct HTTP calls are now reaching Google AI Studio");
  console.log("   If no models work, check in Google AI Studio console");
  console.log("   for which models are actually available.\n");
  
  process.exit(1);
});
