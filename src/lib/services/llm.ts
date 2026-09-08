export async function callLLM(prompt: string, maxTokens: number = 800): Promise<string> {
  const hfToken = process.env.HUGGINGFACE_API_KEY;
  if (!hfToken) {
    throw new Error("Missing HUGGINGFACE_API_KEY");
  }

  // We use Mistral or Meta-Llama for fast text generation via Hugging Face Inference API
  // Using mistralai/Mistral-7B-Instruct-v0.2 as a reliable, fast, free-tier accessible model
  const model = 'mistralai/Mistral-7B-Instruct-v0.2';
  
  try {
    let response;
    let data;
    let retries = 2;
    
    while (retries >= 0) {
      response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.1,
            return_full_text: false
          }
        })
      });

      if (response.ok) {
        data = await response.json();
        return data[0]?.generated_text?.trim() || "";
      }

      const errorData = await response.json().catch(() => ({}));
      
      // If model is loading, wait and retry
      if (response.status === 503 && errorData.estimated_time && retries > 0) {
        const waitTime = Math.ceil(errorData.estimated_time) * 1000;
        console.log(`Model is loading. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 15000))); // wait max 15s to avoid Render timeout
        retries--;
        continue;
      }
      
      throw new Error(errorData.error || `Hugging Face API error: ${response.statusText}`);
    }
    throw new Error("Max retries reached waiting for Hugging Face model to load.");

  } catch (error: any) {
    console.error("LLM Call Error:", error);
    throw new Error(`LLM Failed: ${error.message}`);
  }
}

export async function extractClaims(text: string): Promise<string[]> {
  const prompt = `You are a forensic verification system. Extract the core factual claims from the following text. 
Return ONLY a JSON array of strings, where each string is a single distinct factual claim. Do not include markdown formatting or explanations.
Text: "${text}"`;

  const result = await callLLM(prompt, 500);
  
  try {
    // Attempt to parse the JSON array from the response
    const jsonMatch = result.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback parsing if LLM didn't format perfectly
    return result.split('\n')
      .map(line => line.replace(/^[-*0-9.]+\s*/, '').replace(/["']/g, '').trim())
      .filter(line => line.length > 5);
  } catch (e) {
    console.error("Failed to parse claims:", result);
    return [text]; // Fallback to treating the whole text as one claim
  }
}
