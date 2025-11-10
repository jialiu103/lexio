# 🚀 AI Story Generation Setup

Your vocabulary website now uses **Groq AI** to generate intelligent, coherent stories that naturally incorporate your vocabulary words!

## How to Get Your Free API Key

### Option 1: Groq (Recommended - FREE!)

1. Go to **https://console.groq.com**
2. Sign up for a free account (no credit card required)
3. Navigate to **API Keys** in the dashboard
4. Click **"Create API Key"**
5. Copy your API key
6. Open `script.js` in your editor
7. Replace `YOUR_GROQ_API_KEY_HERE` on **line 1** with your actual API key:
   ```javascript
   const GROQ_API_KEY = 'gsk_xxxxxxxxxxxxxxxxxxxxx';
   ```

**Groq offers:**
- ✅ Completely FREE
- ✅ Fast AI responses (Llama 3.1 70B model)
- ✅ No credit card required
- ✅ Generous free tier

### Option 2: OpenAI (Paid Alternative)

If you prefer OpenAI's GPT models:

1. Go to **https://platform.openai.com**
2. Sign up and add payment method
3. Get your API key
4. Modify the fetch URL in `script.js` from:
   ```javascript
   'https://api.groq.com/openai/v1/chat/completions'
   ```
   to:
   ```javascript
   'https://api.openai.com/v1/chat/completions'
   ```
5. Change the model from `'llama-3.1-70b-versatile'` to `'gpt-4o-mini'` or `'gpt-4'`

## What This Fixes

❌ **Before (Template-based):**
```
"The journey would be run, requiring useful and determination."
"when dog was discovered"
```

✅ **After (AI-powered):**
```
"Riley's dog barked excitedly as they began their run through the forest.
The adventure proved to be incredibly useful for building determination."
```

## Features

- 🎯 Grammatically correct sentences
- 📚 Natural vocabulary usage
- 🎨 Creative and engaging stories
- ✨ Highlights your vocabulary words
- 🎭 Multiple genres and tones
- 📏 Adjustable story length

## Testing

1. Add your API key to `script.js`
2. Open `index.html` in your browser
3. Add vocabulary words: `dog`, `run`, `useful`
4. Click **Generate Story**
5. Watch AI create a coherent story! 🎉

## Troubleshooting

**Error: API request failed**
- Check that your API key is correct
- Ensure you have internet connection
- Verify your API key has not expired

**Words not highlighted**
- The AI will try to use all words, but may occasionally miss one
- Try regenerating the story for different results

## Privacy & Security

⚠️ **Important:** Keep your API key private! Don't share your `script.js` file publicly with the API key in it.

For production use, consider:
- Using environment variables
- Implementing a backend server to hide the API key
- Rate limiting to prevent abuse
