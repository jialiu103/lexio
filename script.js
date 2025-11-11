// API Configuration - Using secure backend proxy
const API_ENDPOINT = 'https://throbbing-rice-b8d2.liujiauestc.workers.dev';

// Secure API call helper function - Using Responses API format
async function callOpenAI(messages, temperature = 0.7, model = 'gpt-4o-mini', maxTokens = 2000) {
    // Convert messages to Responses API format
    const input = messages.map(msg => ({
        type: 'message',
        role: msg.role,
        content: Array.isArray(msg.content) 
            ? msg.content.map(c => {
                if (typeof c === 'string') return { type: 'input_text', text: c };
                if (c.type === 'text') return { type: 'input_text', text: c.text };
                if (c.type === 'image_url') return c; // Keep image_url as is
                return c;
              })
            : [{ type: 'input_text', text: msg.content }]
    }));

    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            input: input,
            temperature: temperature,
            max_output_tokens: maxTokens
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('Raw API response:', JSON.stringify(data).substring(0, 200));
    
    // Convert Responses API format back to Chat Completions format for compatibility
    const content = data.output?.[0]?.content?.[0]?.text || '';
    
    if (!content) {
        console.error('Failed to extract content from response:', data);
        throw new Error('Invalid API response format');
    }
    
    return {
        choices: [{
            message: {
                role: 'assistant',
                content: content
            }
        }]
    };
}

// State management
let vocabularyList = [];
let vocabularyHistory = loadVocabularyHistory();
let weeklyActivity = loadWeeklyActivity();

// Load data from localStorage
function loadVocabularyHistory() {
    const saved = localStorage.getItem('vocabularyHistory');
    return saved ? JSON.parse(saved) : {};
}

function saveVocabularyHistory() {
    localStorage.setItem('vocabularyHistory', JSON.stringify(vocabularyHistory));
}

function loadWeeklyActivity() {
    const saved = localStorage.getItem('weeklyActivity');
    return saved ? JSON.parse(saved) : getEmptyWeek();
}

function saveWeeklyActivity() {
    localStorage.setItem('weeklyActivity', JSON.stringify(weeklyActivity));
}

function getEmptyWeek() {
    return {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
    };
}

// DOM elements
const vocabInput = document.getElementById('vocab-input');
const addVocabBtn = document.getElementById('add-vocab-btn');
const wordList = document.getElementById('word-list');
const wordCount = document.getElementById('word-count');
const clearListBtn = document.getElementById('clear-list-btn');
const generateDefinitionsBtn = document.getElementById('generate-definitions-btn');
const definitionsOutput = document.getElementById('definitions-output');
const definitionsContent = document.getElementById('definitions-content');

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active states
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Add vocabulary word
function addVocabularyWord(word) {
    word = word.trim().toLowerCase();
    
    if (!word) {
        alert('Please enter a word!');
        return;
    }
    
    if (vocabularyList.includes(word)) {
        alert('This word is already in your list!');
        return;
    }
    
    vocabularyList.push(word);
    updateWordList();
    vocabInput.value = '';
}

// Handle add button click
addVocabBtn.addEventListener('click', () => {
    const input = vocabInput.value;
    
    // Check if input contains commas (multiple words)
    if (input.includes(',')) {
        const words = input.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
        words.forEach(word => {
            if (!vocabularyList.includes(word)) {
                vocabularyList.push(word);
            }
        });
        updateWordList();
        vocabInput.value = '';
    } else {
        addVocabularyWord(input);
    }
});

// Handle Enter key
vocabInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addVocabBtn.click();
    }
});

// Update word list display
function updateWordList() {
    wordList.innerHTML = '';
    wordCount.textContent = vocabularyList.length;
    
    vocabularyList.forEach((word, index) => {
        const li = document.createElement('li');
        li.className = 'word-item';
        li.innerHTML = `
            <span>${word}</span>
            <button class="remove-word" onclick="removeWord(${index})">×</button>
        `;
        wordList.appendChild(li);
    });
}

// Remove word from list
function removeWord(index) {
    vocabularyList.splice(index, 1);
    updateWordList();
}

// Clear all words
clearListBtn.addEventListener('click', () => {
    if (vocabularyList.length === 0) return;
    
    if (confirm('Are you sure you want to clear all words?')) {
        vocabularyList = [];
        updateWordList();
    }
});

// Story generation templates
const storyTemplates = {
    adventure: {
        fun: (words) => generateAdventureStory(words, 'fun'),
        serious: (words) => generateAdventureStory(words, 'serious'),
        inspiring: (words) => generateAdventureStory(words, 'inspiring'),
        educational: (words) => generateAdventureStory(words, 'educational')
    },
    mystery: {
        fun: (words) => generateMysteryStory(words, 'fun'),
        serious: (words) => generateMysteryStory(words, 'serious'),
        inspiring: (words) => generateMysteryStory(words, 'inspiring'),
        educational: (words) => generateMysteryStory(words, 'educational')
    },
    fantasy: {
        fun: (words) => generateFantasyStory(words, 'fun'),
        serious: (words) => generateFantasyStory(words, 'serious'),
        inspiring: (words) => generateFantasyStory(words, 'inspiring'),
        educational: (words) => generateFantasyStory(words, 'educational')
    },
    scifi: {
        fun: (words) => generateSciFiStory(words, 'fun'),
        serious: (words) => generateSciFiStory(words, 'serious'),
        inspiring: (words) => generateSciFiStory(words, 'inspiring'),
        educational: (words) => generateSciFiStory(words, 'educational')
    },
    historical: {
        fun: (words) => generateHistoricalStory(words, 'fun'),
        serious: (words) => generateHistoricalStory(words, 'serious'),
        inspiring: (words) => generateHistoricalStory(words, 'inspiring'),
        educational: (words) => generateHistoricalStory(words, 'educational')
    },
    comedy: {
        fun: (words) => generateComedyStory(words, 'fun'),
        serious: (words) => generateComedyStory(words, 'serious'),
        inspiring: (words) => generateComedyStory(words, 'inspiring'),
        educational: (words) => generateComedyStory(words, 'educational')
    },
    informative: {
        fun: (words) => generateInformativeStory(words, 'fun'),
        serious: (words) => generateInformativeStory(words, 'serious'),
        inspiring: (words) => generateInformativeStory(words, 'inspiring'),
        educational: (words) => generateInformativeStory(words, 'educational')
    }
};

// Story generators - create coherent stories USING the vocabulary words
function generateAdventureStory(words, toneType) {
    let usedWords = [];
    
    // Build a story that actually uses the vocabulary words
    let story = buildDynamicAdventureStory(words, usedWords);
    
    return { content: story, usedWords: usedWords };
}

function buildDynamicAdventureStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentAdventureStory();
    }
    
    const protagonists = ['Maya', 'Alex', 'Sam', 'Jordan', 'Riley'];
    const protagonist = protagonists[Math.floor(Math.random() * protagonists.length)];
    
    let story = '';
    let wordQueue = [...words];
    
    // Build story using vocabulary words in natural contexts
    story += `<p>${protagonist} loved adventure stories. The quest began when ${useWordInContext(wordQueue, usedWords, 'noun', 'an ancient artifact')} was discovered. `;
    story += `The journey would be ${useWordInContext(wordQueue, usedWords, 'adjective', 'challenging')}, requiring ${useWordInContext(wordQueue, usedWords, 'noun', 'courage')} and ${useWordInContext(wordQueue, usedWords, 'noun', 'determination')}. `;
    story += `${protagonist} had to ${useWordInContext(wordQueue, usedWords, 'verb', 'travel')} across distant lands to reach the destination.</p>`;
    
    story += `<p>Along the way, ${protagonist} met ${useWordInContext(wordQueue, usedWords, 'noun', 'a wise guide')} who offered help. `;
    story += `The landscape was ${useWordInContext(wordQueue, usedWords, 'adjective', 'vast')}, and the weather became ${useWordInContext(wordQueue, usedWords, 'adjective', 'unpredictable')}. `;
    story += `Despite these obstacles, ${protagonist} continued to ${useWordInContext(wordQueue, usedWords, 'verb', 'persevere')}, driven by ${useWordInContext(wordQueue, usedWords, 'noun', 'hope')}.</p>`;
    
    story += `<p>Finally, after many trials, the destination was reached. The discovery was ${useWordInContext(wordQueue, usedWords, 'adjective', 'magnificent')}. `;
    story += `${protagonist} found ${useWordInContext(wordQueue, usedWords, 'noun', 'treasure')} beyond imagination. `;
    
    // Use any remaining words
    while (wordQueue.length > 0) {
        story += `Everything seemed ${useWordInContext(wordQueue, usedWords, 'adjective', 'extraordinary')}. `;
    }
    
    story += `This ${useWordInContext(wordQueue, usedWords, 'adjective', 'incredible')} adventure would be remembered forever.</p>`;
    
    return story;
}

// Smart function to use vocabulary words in appropriate contexts
function useWordInContext(wordQueue, usedWords, preferredType, fallback) {
    if (wordQueue.length === 0) {
        return fallback;
    }
    
    // Take the next word and use it
    const word = wordQueue.shift();
    usedWords.push(word);
    
    // Create appropriate grammatical wrapper based on expected type
    if (preferredType === 'noun') {
        // Use it as a noun phrase
        return `<span class="highlight">${word}</span>`;
    } else if (preferredType === 'verb') {
        // Use it as a verb
        return `<span class="highlight">${word}</span>`;
    } else if (preferredType === 'adjective') {
        // Use it as an adjective
        return `<span class="highlight">${word}</span>`;
    }
    
    return `<span class="highlight">${word}</span>`;
}

function createCoherentAdventureStory() {
    const protagonists = ['Maya', 'Alex', 'Sam', 'Jordan', 'Riley'];
    const protagonist = protagonists[Math.floor(Math.random() * protagonists.length)];
    
    let story = `<p>${protagonist} had always dreamed of exploring uncharted territories. One morning, an old map was discovered in the attic, showing the location of an ancient temple deep in the mountains. The map was worn and fragile, but the markings were clear. ${protagonist} knew this was the opportunity of a lifetime.</p>`;
    
    story += `<p>The journey began at dawn. ${protagonist} packed essential supplies and set off into the wilderness. The path was treacherous, winding through dense forests and across rushing rivers. Along the way, a wise guide was encountered who shared knowledge about the region and its hidden dangers. Each step brought ${protagonist} closer to the goal.</p>`;
    
    story += `<p>After many days of travel, the ancient temple finally came into view. Its stone walls were covered in mysterious symbols and carvings from a forgotten civilization. Inside, the chambers were filled with artifacts and treasures beyond imagination. ${protagonist} carefully documented everything, knowing this discovery would rewrite history.</p>`;
    
    story += `<p>Returning home, ${protagonist} felt forever changed by the experience. The adventure had taught valuable lessons about courage, perseverance, and respect for ancient cultures. The story of this incredible journey would inspire others to pursue their own dreams of exploration and discovery.</p>`;
    
    return story;
}

// Build adventure narrative using vocabulary words intelligently
function buildAdventureNarrative(words, usedWords) {
    const protagonists = ['Maya', 'Alex', 'Sam', 'Jordan', 'Riley'];
    const protagonist = protagonists[Math.floor(Math.random() * protagonists.length)];
    
    let story = '';
    let wordIndex = 0;
    
    // Helper to get next word
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    // Opening paragraph - introduction
    story += `<p>${protagonist} had always been fascinated by adventure stories. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `One day, while reading a ${word1}, `;
    } else {
        story += `One day, `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `${protagonist} discovered a mysterious ${word2}. `;
    } else {
        story += `${protagonist} discovered something mysterious. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `A ${word3} had left it behind, and it contained incredible secrets. `;
    } else {
        story += `It contained incredible secrets. `;
    }
    
    story += `This discovery would change everything.</p>`;
    
    // Middle paragraph - journey
    story += `<p>The journey began the next morning. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `${protagonist} had to ${word4} across vast distances. `;
    } else {
        story += `${protagonist} traveled across vast distances. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `The terrain was ${word5}, testing every skill possessed. `;
    } else {
        story += `The terrain was challenging. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `Along the way, ${protagonist} met a ${word6} who offered guidance. `;
    } else {
        story += `Along the way, ${protagonist} received helpful guidance. `;
    }
    
    story += `Each day brought new challenges and discoveries.</p>`;
    
    // Climax paragraph - discovery
    story += `<p>After many days of searching, ${protagonist} finally reached the destination. `;
    
    let word7 = getNextWord();
    if (word7) {
        story += `Hidden among ${word7}, there stood an ancient temple. `;
    } else {
        story += `An ancient temple appeared before them. `;
    }
    
    let word8 = getNextWord();
    if (word8) {
        story += `Inside, the walls were covered with ${word8}. `;
    } else {
        story += `Inside, ancient writings covered the walls. `;
    }
    
    let word9 = getNextWord();
    if (word9) {
        story += `The treasure was ${word9} beyond imagination. `;
    } else {
        story += `The treasure was magnificent. `;
    }
    
    story += `This was the moment ${protagonist} had been waiting for.</p>`;
    
    // Resolution paragraph
    story += `<p>Returning home, ${protagonist} felt transformed by the experience. `;
    
    let word10 = getNextWord();
    if (word10) {
        story += `The journey had taught the importance of being ${word10}. `;
    } else {
        story += `The journey had taught valuable lessons. `;
    }
    
    // Use any remaining words
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `Friends described ${protagonist} as ${extraWord} after the adventure. `;
        }
    }
    
    story += `This tale would be shared for generations to come.</p>`;
    
    return story;
}

// Helper function to use vocabulary words or fallback
function useWord(remainingWords, usedWords, fallback) {
    if (remainingWords.length > 0) {
        const word = remainingWords.shift(); // Take the next word
        usedWords.push(word);
        return `<span class="highlight">${word}</span>`;
    }
    return fallback;
}

function generateMysteryStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicMysteryStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicMysteryStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentMysteryStory();
    }
    
    const detectives = ['Detective Parker', 'Inspector Chen', 'Agent Williams', 'Detective Rodriguez'];
    const detective = detectives[Math.floor(Math.random() * detectives.length)];
    let wordQueue = [...words];
    
    let story = `<p>${detective} received a call about ${useWordInContext(wordQueue, usedWords, 'noun', 'a mysterious case')}. `;
    story += `The situation was ${useWordInContext(wordQueue, usedWords, 'adjective', 'puzzling')}, with ${useWordInContext(wordQueue, usedWords, 'noun', 'clues')} scattered everywhere. `;
    story += `${detective} had to ${useWordInContext(wordQueue, usedWords, 'verb', 'investigate')} thoroughly to solve it.</p>`;
    
    story += `<p>At the scene, ${detective} found ${useWordInContext(wordQueue, usedWords, 'noun', 'evidence')} that seemed ${useWordInContext(wordQueue, usedWords, 'adjective', 'unusual')}. `;
    story += `A witness, described as ${useWordInContext(wordQueue, usedWords, 'adjective', 'nervous')}, provided ${useWordInContext(wordQueue, usedWords, 'noun', 'information')}. `;
    story += `The detective continued to ${useWordInContext(wordQueue, usedWords, 'verb', 'search')} for answers.</p>`;
    
    story += `<p>After ${useWordInContext(wordQueue, usedWords, 'adjective', 'careful')} analysis, the truth emerged. `;
    
    while (wordQueue.length > 0) {
        story += `The solution was ${useWordInContext(wordQueue, usedWords, 'adjective', 'surprising')}. `;
    }
    
    story += `${detective} had solved another case.</p>`;
    
    return story;
}

function createCoherentMysteryStory() {
    const detectives = ['Detective Parker', 'Inspector Chen', 'Agent Williams', 'Detective Rodriguez'];
    const detective = detectives[Math.floor(Math.random() * detectives.length)];
    
    let story = `<p>${detective} received an urgent call at 3 AM. A priceless artifact had been stolen from the city museum, and the case was baffling. The security cameras showed nothing, the alarms hadn't been triggered, and there were no signs of forced entry. It was as if the thief had simply vanished into thin air.</p>`;
    
    story += `<p>Arriving at the scene, ${detective} began a meticulous investigation. Every surface was examined for fingerprints, every witness was interviewed, and every detail was recorded. A pattern slowly emerged from the evidence. The butler's testimony contradicted the security guard's account, and a small footprint was discovered near the display case.</p>`;
    
    story += `<p>After hours of analysis, ${detective} pieced together what had happened. The thief had used the old ventilation system to enter the museum, bypassing all modern security. The culprit was caught within 24 hours, and the artifact was recovered undamaged. It was a clever crime, but not clever enough.</p>`;
    
    story += `<p>${detective} filed the final report as dawn broke over the city. Another case solved through careful observation, logical deduction, and persistent investigation. Justice had prevailed once again.</p>`;
    
    return story;
}

function buildMysteryNarrative(words, usedWords) {
    const detectives = ['Detective Parker', 'Inspector Chen', 'Agent Williams', 'Detective Rodriguez'];
    const detective = detectives[Math.floor(Math.random() * detectives.length)];
    
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>${detective} received an urgent call about a mysterious case. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `A valuable ${word1} had gone missing from the museum. `;
    } else {
        story += `Something valuable had gone missing. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `The only witness was a young ${word2} who had been visiting. `;
    } else {
        story += `There was one witness to question. `;
    }
    
    story += `The investigation began immediately.</p>`;
    
    story += `<p>At the crime scene, ${detective} examined every detail. `;
    
    let word3 = getNextWord();
    if (word3) {
        story += `Evidence was found near a ${word3}. `;
    } else {
        story += `Important evidence was discovered. `;
    }
    
    let word4 = getNextWord();
    if (word4) {
        story += `The suspect appeared to be ${word4}. `;
    } else {
        story += `The suspect's behavior was suspicious. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `${detective} decided to ${word5} through the building to gather more clues. `;
    } else {
        story += `More investigation was needed. `;
    }
    
    story += `Slowly, the pieces began to fit together.</p>`;
    
    story += `<p>After careful analysis, the truth emerged. `;
    
    let word6 = getNextWord();
    if (word6) {
        story += `The thief had used a ${word6} to escape undetected. `;
    } else {
        story += `The escape route was discovered. `;
    }
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `The method was quite ${extraWord}. `;
        }
    }
    
    story += `${detective} had solved another challenging case.</p>`;
    
    return story;
}

function generateFantasyStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicFantasyStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicFantasyStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentFantasyStory();
    }
    
    let wordQueue = [...words];
    
    let story = `<p>In a realm of magic, a young apprentice discovered ${useWordInContext(wordQueue, usedWords, 'noun', 'an ancient spellbook')}. `;
    story += `The magic was ${useWordInContext(wordQueue, usedWords, 'adjective', 'powerful')}, requiring ${useWordInContext(wordQueue, usedWords, 'noun', 'skill')} to master. `;
    story += `The apprentice had to ${useWordInContext(wordQueue, usedWords, 'verb', 'study')} for many years.</p>`;
    
    story += `<p>A ${useWordInContext(wordQueue, usedWords, 'adjective', 'wise')} mentor taught ${useWordInContext(wordQueue, usedWords, 'noun', 'lessons')} about magic. `;
    story += `When ${useWordInContext(wordQueue, usedWords, 'noun', 'danger')} threatened the kingdom, the apprentice had to ${useWordInContext(wordQueue, usedWords, 'verb', 'fight')} using newfound powers. `;
    story += `The battle was ${useWordInContext(wordQueue, usedWords, 'adjective', 'intense')}.</p>`;
    
    story += `<p>Through ${useWordInContext(wordQueue, usedWords, 'noun', 'courage')}, victory was achieved. `;
    
    while (wordQueue.length > 0) {
        story += `The outcome was ${useWordInContext(wordQueue, usedWords, 'adjective', 'triumphant')}. `;
    }
    
    story += `Peace returned to the magical realm.</p>`;
    
    return story;
}

function createCoherentFantasyStory() {
    let story = `<p>In the mystical kingdom of Eldoria, where dragons soared through sunset skies and ancient magic pulsed through the very stones, a young apprentice named Luna began her journey. She had been chosen to study at the Tower of Wisdom, where the greatest wizards in the land taught their secrets. Her first day filled her with equal parts excitement and nervousness.</p>`;
    
    story += `<p>Master Aldric, a wizard with silver hair and eyes that sparkled like starlight, became her mentor. He taught her that magic wasn't about power, but about balance, wisdom, and understanding the natural world. Luna practiced tirelessly, learning to summon light, move objects with her mind, and communicate with magical creatures. Each lesson revealed new wonders.</p>`;
    
    story += `<p>When a dark shadow fell over the kingdom, threatening to consume all life and light, Luna faced her greatest test. Though she was still learning, she remembered her training and combined it with courage from her heart. She confronted the darkness not with aggression, but with understanding, discovering it was merely a lost spirit seeking peace. Her compassion broke the curse.</p>`;
    
    story += `<p>Luna's actions saved the kingdom and taught everyone an important lesson: true magic comes not from spells alone, but from kindness, wisdom, and the courage to choose understanding over fear. She became a legend, inspiring future generations of young wizards.</p>`;
    
    return story;
}

function buildFantasyNarrative(words, usedWords) {
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>In a realm of magic and wonder, a young apprentice began training. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `The training required studying an ancient ${word1}. `;
    } else {
        story += `The training required dedication. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `The apprentice had to ${word2} to distant lands. `;
    } else {
        story += `The apprentice traveled to distant lands. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `A wise ${word3} served as mentor and guide. `;
    } else {
        story += `A wise mentor provided guidance. `;
    }
    
    story += `Magic filled the air with possibility.</p>`;
    
    story += `<p>One day, dark forces threatened the kingdom. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `The enemy was ${word4} and powerful. `;
    } else {
        story += `The enemy was formidable. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `The apprentice found a magical ${word5} that could help. `;
    } else {
        story += `The apprentice found a way to help. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `Using spells that were ${word6}, the battle was won. `;
    } else {
        story += `Through clever magic, the battle was won. `;
    }
    
    story += `Peace returned to the realm.</p>`;
    
    story += `<p>The young mage had proven worthy. `;
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `The achievement was ${extraWord}. `;
        }
    }
    
    story += `A new chapter in magical history had begun.</p>`;
    
    return story;
}

function generateSciFiStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicSciFiStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicSciFiStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentSciFiStory();
    }
    
    let wordQueue = [...words];
    
    let story = `<p>In the future, astronauts explored ${useWordInContext(wordQueue, usedWords, 'noun', 'distant planets')}. `;
    story += `The mission was ${useWordInContext(wordQueue, usedWords, 'adjective', 'dangerous')}, requiring ${useWordInContext(wordQueue, usedWords, 'noun', 'advanced technology')}. `;
    story += `The crew had to ${useWordInContext(wordQueue, usedWords, 'verb', 'navigate')} through space.</p>`;
    
    story += `<p>They discovered ${useWordInContext(wordQueue, usedWords, 'noun', 'alien life')} that was ${useWordInContext(wordQueue, usedWords, 'adjective', 'intelligent')}. `;
    story += `Communication required ${useWordInContext(wordQueue, usedWords, 'noun', 'patience')} and ${useWordInContext(wordQueue, usedWords, 'noun', 'understanding')}. `;
    story += `Both species began to ${useWordInContext(wordQueue, usedWords, 'verb', 'collaborate')}.</p>`;
    
    story += `<p>The encounter was ${useWordInContext(wordQueue, usedWords, 'adjective', 'historic')}. `;
    
    while (wordQueue.length > 0) {
        story += `The experience was ${useWordInContext(wordQueue, usedWords, 'adjective', 'remarkable')}. `;
    }
    
    story += `A new chapter for humanity began.</p>`;
    
    return story;
}

function createCoherentSciFiStory() {
    let story = `<p>In the year 2187, Commander Sarah Chen stood on the bridge of the starship Horizon, gazing at a blue-green planet that had never before been seen by human eyes. After three years of faster-than-light travel, her crew had finally reached the Kepler-442 system. Their mission was crucial: find a new home for humanity, as Earth's resources were nearly depleted.</p>`;
    
    story += `<p>As the Horizon entered orbit, the ship's sensors detected something extraordinary. Advanced structures dotted the planet's surface, and energy signatures indicated active technology. They weren't alone. The crew followed first contact protocols, broadcasting messages of peace in mathematical language that any advanced civilization could understand.</p>`;
    
    story += `<p>The response came within hours. Beings of light and energy emerged from the planet, their forms shifting and beautiful. They called themselves the Azuri, and they had been waiting for humanity to reach the stars. Through advanced translation technology, they explained that they had watched Earth for centuries, hoping humans would overcome their divisions and join the galactic community.</p>`;
    
    story += `<p>Commander Chen and the Azuri began historic negotiations. Rather than viewing humans as competitors for resources, the Azuri offered partnership and knowledge. This first contact marked the dawn of a new era for humanity - no longer alone in the cosmos, but part of a vast, interconnected community of civilizations working together among the stars.</p>`;
    
    return story;
}

function buildSciFiNarrative(words, usedWords) {
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>In the distant future, humanity explored beyond Earth. Commander Chen led an important mission. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `The crew studied a mysterious ${word1} they had discovered. `;
    } else {
        story += `The crew made an important discovery. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `They had to ${word2} through uncharted space. `;
    } else {
        story += `They traveled through uncharted space. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `A brilliant ${word3} worked on the research team. `;
    } else {
        story += `The research team worked tirelessly. `;
    }
    
    story += `Every day brought new revelations.</p>`;
    
    story += `<p>They encountered an alien civilization. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `The aliens were ${word4} and advanced. `;
    } else {
        story += `The aliens were advanced. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `Communication was established using a sophisticated ${word5}. `;
    } else {
        story += `Communication was established. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `The meeting was ${word6} for both species. `;
    } else {
        story += `The meeting was historic. `;
    }
    
    story += `A new era of cooperation began.</p>`;
    
    story += `<p>`;
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `The experience was ${extraWord}. `;
        }
    }
    
    story += `Humanity's future among the stars looked bright.</p>`;
    
    return story;
}

function generateHistoricalStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicHistoricalStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicHistoricalStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentHistoricalStory();
    }
    
    let wordQueue = [...words];
    
    let story = `<p>Long ago, ${useWordInContext(wordQueue, usedWords, 'noun', 'a civilization')} created ${useWordInContext(wordQueue, usedWords, 'noun', 'great monuments')}. `;
    story += `Their society was ${useWordInContext(wordQueue, usedWords, 'adjective', 'advanced')}, with ${useWordInContext(wordQueue, usedWords, 'noun', 'innovations')} in many fields. `;
    story += `The people had to ${useWordInContext(wordQueue, usedWords, 'verb', 'work')} together to build their culture.</p>`;
    
    story += `<p>Leaders who were ${useWordInContext(wordQueue, usedWords, 'adjective', 'wise')} guided ${useWordInContext(wordQueue, usedWords, 'noun', 'their people')}. `;
    story += `Through ${useWordInContext(wordQueue, usedWords, 'noun', 'dedication')}, they achieved ${useWordInContext(wordQueue, usedWords, 'noun', 'greatness')}. `;
    story += `Their ${useWordInContext(wordQueue, usedWords, 'adjective', 'remarkable')} accomplishments influenced history.</p>`;
    
    story += `<p>The legacy they left was ${useWordInContext(wordQueue, usedWords, 'adjective', 'enduring')}. `;
    
    while (wordQueue.length > 0) {
        story += `Their contributions were ${useWordInContext(wordQueue, usedWords, 'adjective', 'significant')}. `;
    }
    
    story += `We still learn from their example today.</p>`;
    
    return story;
}

function createCoherentHistoricalStory() {
    let story = `<p>In Renaissance Florence, 1503, Leonardo da Vinci stood before a blank canvas, commissioned to paint the portrait of Lisa Gherardini, wife of a wealthy silk merchant. Little did he know that this painting would become one of the most famous artworks in human history - the Mona Lisa. Leonardo approached every painting as both an artist and a scientist, studying light, anatomy, and perspective with meticulous care.</p>`;
    
    story += `<p>Leonardo developed a revolutionary technique called sfumato, creating soft, almost imperceptible transitions between colors and tones. This gave his subjects an ethereal, lifelike quality never before achieved. He studied Lisa's features for months, capturing not just her physical appearance but something deeper - a mysterious expression that seemed to hold secrets, wisdom, and a hint of amusement.</p>`;
    
    story += `<p>The painting took years to complete. Leonardo was a perfectionist who would sometimes spend entire days contemplating a single detail. He applied thin layers of oil paint, building up depth and luminosity. The background landscape, with its winding paths and distant mountains, added mystery and drew the viewer's eye to Lisa's enigmatic smile.</p>`;
    
    story += `<p>When finally completed, the Mona Lisa demonstrated Leonardo's genius and changed the course of Western art. For over 500 years, people have gazed at her smile, each generation finding new meaning. The painting now resides in the Louvre Museum in Paris, where millions visit annually to witness this timeless masterpiece that bridges art and science, past and present.</p>`;
    
    return story;
}

function buildHistoricalNarrative(words, usedWords) {
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>Long ago, a great civilization flourished. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `The people created magnificent ${word1} that amazed all who saw them. `;
    } else {
        story += `The people created magnificent monuments. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `They had to ${word2} great distances to trade goods. `;
    } else {
        story += `They traveled to trade goods. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `Every ${word3} contributed to building their society. `;
    } else {
        story += `Everyone contributed to society. `;
    }
    
    story += `Their achievements were remarkable.</p>`;
    
    story += `<p>The civilization was known for innovation. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `Their inventions were ${word4} for that time period. `;
    } else {
        story += `Their inventions were advanced. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `They developed systems using ${word5}. `;
    } else {
        story += `They developed sophisticated systems. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `The culture was ${word6} and influential. `;
    } else {
        story += `The culture was influential. `;
    }
    
    story += `Their legacy endures today.</p>`;
    
    story += `<p>`;
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `Historians describe them as ${extraWord}. `;
        }
    }
    
    story += `We continue to learn from their example.</p>`;
    
    return story;
}

function generateComedyStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicComedyStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicComedyStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentComedyStory();
    }
    
    let wordQueue = [...words];
    
    let story = `<p>Bob had ${useWordInContext(wordQueue, usedWords, 'noun', 'a wild idea')} to start something new. `;
    story += `His plan was ${useWordInContext(wordQueue, usedWords, 'adjective', 'ridiculous')}, but he wanted to ${useWordInContext(wordQueue, usedWords, 'verb', 'try')} anyway. `;
    story += `Friends thought he was ${useWordInContext(wordQueue, usedWords, 'adjective', 'crazy')}.</p>`;
    
    story += `<p>Everything went wrong immediately. Bob tried to ${useWordInContext(wordQueue, usedWords, 'verb', 'fix')} ${useWordInContext(wordQueue, usedWords, 'noun', 'the problem')}, but made it worse. `;
    story += `The situation became ${useWordInContext(wordQueue, usedWords, 'adjective', 'chaotic')} and ${useWordInContext(wordQueue, usedWords, 'adjective', 'hilarious')}. `;
    story += `Everyone was ${useWordInContext(wordQueue, usedWords, 'verb', 'laughing')}.</p>`;
    
    story += `<p>Despite the ${useWordInContext(wordQueue, usedWords, 'noun', 'disaster')}, people loved it. `;
    
    while (wordQueue.length > 0) {
        story += `The whole thing was ${useWordInContext(wordQueue, usedWords, 'adjective', 'amusing')}. `;
    }
    
    story += `Bob's comedy of errors became legendary!</p>`;
    
    return story;
}

function createCoherentComedyStory() {
    let story = `<p>When Bob announced he was opening "Chez Bob's Fine Dining," his friends tried their best to be supportive. The problem was obvious: Bob couldn't cook. His idea of gourmet cuisine was adding ketchup to instant ramen and calling it "pasta with artisanal tomato reduction." But Bob was determined, and he had somehow convinced investors to fund his dream restaurant.</p>`;
    
    story += `<p>Opening night arrived, and twenty brave souls had made reservations. Within ten minutes of the kitchen opening, chaos erupted. Bob attempted to flambé dessert and triggered every fire alarm in the building. The fire department arrived just as he was serving the main course - something that resembled a science experiment gone wrong, bubbling ominously on plates.</p>`;
    
    story += `<p>The customers were initially horrified, but then one person started laughing. Then another. Soon the entire restaurant was in hysterics. Bob's earnest attempts at fancy cuisine, combined with spectacular failures, were genuinely hilarious. People began taking videos, and by morning, Chez Bob's had gone viral. News crews showed up to film "the world's worst chef."</p>`;
    
    story += `<p>Bob made a brilliant decision: he leaned into the chaos. He renamed it "Disaster Dining" and marketed it as dinner theater featuring "culinary catastrophes." Customers now came for the entertainment, fully expecting terrible food and loving every minute. Bob had accidentally created the world's first successful comedy restaurant. Sometimes failure is the recipe for unexpected success!</p>`;
    
    return story;
}

function buildComedyNarrative(words, usedWords) {
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>Bob decided to try something completely new. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `He found an old ${word1} with instructions for a wild idea. `;
    } else {
        story += `He had a wild idea. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `Bob tried to ${word2} but forgot the most important step. `;
    } else {
        story += `Bob tried his best but made mistakes. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `His friend, a ${word3}, tried to help but made things worse. `;
    } else {
        story += `His friend tried to help but made things worse. `;
    }
    
    story += `Chaos erupted immediately.</p>`;
    
    story += `<p>Everything that could go wrong did. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `The situation became ${word4} in the most unexpected way. `;
    } else {
        story += `The situation became ridiculous. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `Someone found a ${word5} that solved nothing. `;
    } else {
        story += `Nothing seemed to help. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `Everyone watching was ${word6} with laughter. `;
    } else {
        story += `Everyone was laughing. `;
    }
    
    story += `It was hilarious!</p>`;
    
    story += `<p>`;
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `The whole experience was ${extraWord}. `;
        }
    }
    
    story += `Bob's misadventure became a legendary story.</p>`;
    
    return story;
}

function generateInformativeStory(words, toneType) {
    let usedWords = [];
    let story = buildDynamicInformativeStory(words, usedWords);
    return { content: story, usedWords: usedWords };
}

function buildDynamicInformativeStory(words, usedWords) {
    if (words.length === 0) {
        return createCoherentInformativeStory();
    }
    
    let wordQueue = [...words];
    
    let story = `<p>Understanding ${useWordInContext(wordQueue, usedWords, 'noun', 'science')} requires ${useWordInContext(wordQueue, usedWords, 'noun', 'observation')} and ${useWordInContext(wordQueue, usedWords, 'noun', 'study')}. `;
    story += `The process is ${useWordInContext(wordQueue, usedWords, 'adjective', 'important')} for learning about our world. `;
    story += `Researchers must ${useWordInContext(wordQueue, usedWords, 'verb', 'investigate')} carefully.</p>`;
    
    story += `<p>Scientists use ${useWordInContext(wordQueue, usedWords, 'noun', 'tools')} that are ${useWordInContext(wordQueue, usedWords, 'adjective', 'sophisticated')}. `;
    story += `Their ${useWordInContext(wordQueue, usedWords, 'noun', 'work')} helps us ${useWordInContext(wordQueue, usedWords, 'verb', 'understand')} complex topics. `;
    story += `The ${useWordInContext(wordQueue, usedWords, 'noun', 'results')} are ${useWordInContext(wordQueue, usedWords, 'adjective', 'valuable')}.</p>`;
    
    story += `<p>Through ${useWordInContext(wordQueue, usedWords, 'adjective', 'careful')} research, knowledge grows. `;
    
    while (wordQueue.length > 0) {
        story += `Each discovery is ${useWordInContext(wordQueue, usedWords, 'adjective', 'significant')}. `;
    }
    
    story += `Education empowers us all.</p>`;
    
    return story;
}

function createCoherentInformativeStory() {
    let story = `<p>Photosynthesis is one of the most important biological processes on Earth, and understanding it is fundamental to comprehending how life functions. This remarkable process allows plants, algae, and certain bacteria to convert sunlight into chemical energy, forming the foundation of nearly all food chains on our planet. Without photosynthesis, life as we know it would not exist.</p>`;
    
    story += `<p>The process occurs primarily in the leaves of plants, within specialized structures called chloroplasts. These organelles contain chlorophyll, the green pigment that gives plants their color and absorbs light energy. When sunlight hits a leaf, chlorophyll molecules capture photons and initiate a complex series of chemical reactions known as the light-dependent and light-independent reactions.</p>`;
    
    story += `<p>During photosynthesis, plants take in carbon dioxide from the air through tiny pores called stomata, and water from the soil through their roots. Using the energy from sunlight, they convert these simple molecules into glucose (a type of sugar) and oxygen. The chemical equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. The glucose provides energy for the plant's growth and metabolism, while oxygen is released into the atmosphere as a byproduct.</p>`;
    
    story += `<p>This process is crucial for maintaining Earth's atmosphere and supporting life. Plants remove carbon dioxide, a greenhouse gas, while producing the oxygen that humans and animals need to breathe. Scientists study photosynthesis to develop sustainable energy solutions, improve crop yields, and address climate change. Understanding this natural process helps us appreciate the vital role that plants play in our ecosystem and underscores the importance of protecting our planet's green spaces.</p>`;
    
    return story;
}

function buildInformativeNarrative(words, usedWords) {
    let story = '';
    let wordIndex = 0;
    
    const getNextWord = () => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            usedWords.push(word);
            wordIndex++;
            return `<span class="highlight">${word}</span>`;
        }
        return null;
    };
    
    story += `<p>Learning about our world requires curiosity and observation. `;
    
    let word1 = getNextWord();
    if (word1) {
        story += `Scientists often use a ${word1} as a tool for research. `;
    } else {
        story += `Scientists use various tools for research. `;
    }
    
    let word2 = getNextWord();
    if (word2) {
        story += `They must ${word2} to gather data from different locations. `;
    } else {
        story += `They gather data from many locations. `;
    }
    
    let word3 = getNextWord();
    if (word3) {
        story += `Every ${word3} can contribute to scientific understanding. `;
    } else {
        story += `Everyone can contribute to understanding. `;
    }
    
    story += `Knowledge grows through shared effort.</p>`;
    
    story += `<p>The scientific method helps us discover truth. `;
    
    let word4 = getNextWord();
    if (word4) {
        story += `Observations must be ${word4} to be reliable. `;
    } else {
        story += `Observations must be reliable. `;
    }
    
    let word5 = getNextWord();
    if (word5) {
        story += `Researchers document findings in a ${word5}. `;
    } else {
        story += `Researchers document their findings. `;
    }
    
    let word6 = getNextWord();
    if (word6) {
        story += `New discoveries can be ${word6} and exciting. `;
    } else {
        story += `New discoveries are exciting. `;
    }
    
    story += `Science advances through careful study.</p>`;
    
    story += `<p>`;
    
    while (wordIndex < words.length) {
        let extraWord = getNextWord();
        if (extraWord) {
            story += `The process is ${extraWord}. `;
        }
    }
    
    story += `Education empowers us to understand our world better.</p>`;
    
    return story;
}

// Helper function - no longer needed but kept for compatibility
function useWord(remainingWords, usedWords, fallback) {
    if (remainingWords.length > 0) {
        const word = remainingWords.shift();
        usedWords.push(word);
        return `<span class="highlight">${word}</span>`;
    }
    return fallback;
}

// Create vocabulary practice section with proper example sentences
function createVocabularyPracticeSection(words, usedWords, genre) {
    if (words.length === 0) return '';
    
    let section = '<div class="vocab-integration">';
    section += '<h3>📝 Vocabulary Practice</h3>';
    section += '<p class="vocab-intro">Now practice using your vocabulary words! Here are example sentences showing how to use each word correctly:</p>';
    
    words.forEach(word => {
        usedWords.push(word);
        section += `<div class="vocab-word-section">`;
        section += `<p class="vocab-word-title">Word: <span class="highlight">${word}</span></p>`;
        
        // Create contextually appropriate example sentences
        const examples = createSmartExamples(word, genre);
        examples.forEach(example => {
            section += `<p class="vocab-example">• ${example}</p>`;
        });
        
        section += `</div>`;
    });
    
    section += '</div>';
    return section;
}

// Create smart example sentences based on the word
function createSmartExamples(word, genre) {
    const examples = [];
    
    // Example 1: Use the word in a simple descriptive sentence
    examples.push(`The adventure was full of moments that could be described as <span class="highlight">${word}</span>.`);
    
    // Example 2: Use the word in a narrative context
    if (genre === 'adventure') {
        examples.push(`During the journey, the explorer encountered something <span class="highlight">${word}</span>.`);
    } else if (genre === 'mystery') {
        examples.push(`The detective found the clue to be quite <span class="highlight">${word}</span>.`);
    } else if (genre === 'fantasy') {
        examples.push(`The wizard's spell was remarkably <span class="highlight">${word}</span>.`);
    } else {
        examples.push(`The experience taught them about <span class="highlight">${word}</span>.`);
    }
    
    // Example 3: Encourage students to create their own
    examples.push(`<em>Now you try: Write your own sentence using "<span class="highlight">${word}</span>"</em>`);
    
    return examples;
}

// Generate grammatically correct example sentences for any vocabulary word
function generateSmartExampleSentences(word, genre, characterName) {
    const wordLower = word.toLowerCase();
    
    // Detect word type and generate appropriate sentences
    let sentence1, sentence2;
    
    // Adjectives - words that describe (sleepy, hungry, beautiful, mysterious, ancient, etc.)
    if (isLikelyAdjective(wordLower)) {
        const adjectiveTemplates = [
            {
                s1: `The explorer felt <span class="highlight">${word}</span> after the long journey.`,
                s2: `It was a <span class="highlight">${word}</span> moment that left a lasting impression.`
            },
            {
                s1: `The <span class="highlight">${word}</span> atmosphere made everyone pause and take notice.`,
                s2: `She described the experience as truly <span class="highlight">${word}</span>.`
            },
            {
                s1: `The discovery revealed something remarkably <span class="highlight">${word}</span>.`,
                s2: `Everyone agreed that the results were quite <span class="highlight">${word}</span>.`
            }
        ];
        const template = adjectiveTemplates[Math.floor(Math.random() * adjectiveTemplates.length)];
        sentence1 = template.s1;
        sentence2 = template.s2;
    }
    // Verbs - action words
    else if (isLikelyVerb(wordLower)) {
        const verbTemplates = [
            {
                s1: `The team decided to <span class="highlight">${word}</span> despite the challenges ahead.`,
                s2: `Learning to <span class="highlight">${word}</span> takes practice and dedication.`
            },
            {
                s1: `She began to <span class="highlight">${word}</span> with confidence and skill.`,
                s2: `They watched as the expert continued to <span class="highlight">${word}</span>.`
            }
        ];
        const template = verbTemplates[Math.floor(Math.random() * verbTemplates.length)];
        sentence1 = template.s1;
        sentence2 = template.s2;
    }
    // Nouns - people, places, things
    else {
        const nounTemplates = [
            {
                s1: `The <span class="highlight">${word}</span> was carefully examined by the researchers.`,
                s2: `She pointed to the <span class="highlight">${word}</span> with great interest.`
            },
            {
                s1: `They discovered an ancient <span class="highlight">${word}</span> hidden in the chamber.`,
                s2: `The <span class="highlight">${word}</span> revealed secrets about the past.`
            },
            {
                s1: `Everyone gathered around to observe the <span class="highlight">${word}</span>.`,
                s2: `The <span class="highlight">${word}</span> played a crucial role in the story.`
            },
            {
                s1: `A detailed <span class="highlight">${word}</span> was found among the artifacts.`,
                s2: `The <span class="highlight">${word}</span> helped them navigate through unknown territory.`
            },
            {
                s1: `The young <span class="highlight">${word}</span> showed remarkable courage and determination.`,
                s2: `Every <span class="highlight">${word}</span> has a unique story to tell.`
            }
        ];
        const template = nounTemplates[Math.floor(Math.random() * nounTemplates.length)];
        sentence1 = template.s1;
        sentence2 = template.s2;
    }
    
    return { sentence1, sentence2 };
}

// Helper function to detect if a word is likely an adjective
function isLikelyAdjective(word) {
    const commonAdjectives = ['happy', 'sad', 'angry', 'excited', 'tired', 'sleepy', 'hungry', 'thirsty', 
                              'brave', 'scared', 'beautiful', 'ugly', 'smart', 'clever', 'difficult', 'easy', 
                              'hard', 'soft', 'bright', 'dark', 'quick', 'slow', 'hot', 'cold', 'big', 'small', 
                              'tall', 'short', 'long', 'wide', 'narrow', 'deep', 'shallow', 'loud', 'quiet',
                              'ancient', 'modern', 'old', 'new', 'young', 'mysterious', 'strange', 'wonderful'];
    
    if (commonAdjectives.includes(word)) return true;
    
    // Check common adjective endings
    if (word.endsWith('ful') || word.endsWith('less') || word.endsWith('ous') || 
        word.endsWith('ive') || word.endsWith('able') || word.endsWith('ible') ||
        word.endsWith('al') || word.endsWith('ic') || word.endsWith('ical') ||
        word.endsWith('ant') || word.endsWith('ent')) {
        return true;
    }
    
    // Words ending in 'y' (but not very short words)
    if (word.endsWith('y') && word.length > 4 && !word.endsWith('ly')) {
        return true;
    }
    
    return false;
}

// Helper function to detect if a word is likely a verb
function isLikelyVerb(word) {
    const commonVerbs = ['run', 'walk', 'jump', 'swim', 'fly', 'read', 'write', 'think', 'dream', 
                         'explore', 'discover', 'learn', 'teach', 'create', 'build', 'destroy', 
                         'help', 'support', 'study', 'work', 'play', 'eat', 'drink', 'sleep',
                         'talk', 'speak', 'listen', 'watch', 'see', 'hear', 'feel', 'touch'];
    
    if (commonVerbs.includes(word)) return true;
    
    // Check verb endings (but be careful - many words end in 'ed' or 'ing')
    if (word.endsWith('ate') || word.endsWith('ify') || word.endsWith('ize') || word.endsWith('ise')) {
        return true;
    }
    
    return false;
}

// Legacy function - keeping for backwards compatibility
function generateExampleSentences(word, genre, characterName) {
    const result = generateSmartExampleSentences(word, genre, characterName);
    return result.sentence1;
}

// Helper function to build sentences with vocabulary words contextually
function buildSentenceWithWords(words, usedWords, prefix, targetWords, suffix) {
    // Try to find a matching vocabulary word
    for (let word of words) {
        if (!usedWords.includes(word)) {
            // Check if the word fits contextually
            for (let target of targetWords) {
                if (word.toLowerCase().includes(target) || target.includes(word.toLowerCase()) || 
                    word.toLowerCase() === target || areSynonyms(word, target)) {
                    usedWords.push(word);
                    return `${prefix} <span class="highlight">${word}</span>${suffix}`;
                }
            }
        }
    }
    
    // If no exact match, use the word in a grammatically correct way
    for (let word of words) {
        if (!usedWords.includes(word)) {
            usedWords.push(word);
            return `${prefix} <span class="highlight">${word}</span>${suffix}`;
        }
    }
    
    // Fallback to target word if no vocabulary words available
    return `${prefix} ${targetWords[0]}${suffix}`;
}

// Simple synonym checker (can be expanded)
function areSynonyms(word1, word2) {
    const synonymGroups = [
        ['difficult', 'hard', 'challenging', 'arduous', 'demanding'],
        ['mysterious', 'enigmatic', 'cryptic', 'puzzling', 'strange'],
        ['beautiful', 'stunning', 'gorgeous', 'magnificent', 'spectacular'],
        ['happy', 'joyful', 'elated', 'jubilant', 'delighted'],
        ['important', 'significant', 'crucial', 'vital', 'essential'],
        ['smart', 'intelligent', 'clever', 'brilliant', 'wise']
    ];
    
    word1 = word1.toLowerCase();
    word2 = word2.toLowerCase();
    
    for (let group of synonymGroups) {
        if (group.includes(word1) && group.includes(word2)) {
            return true;
        }
    }
    return false;
}

// ========== VOCABULARY QUIZ SYSTEM ==========

let currentQuizData = [];

// Generate vocabulary quiz using AI
async function generateVocabularyQuiz(words) {
    console.log('🎮 Starting quiz generation for words:', words);
    
    if (words.length === 0) {
        console.warn('No words provided for quiz');
        return;
    }
    
    const quizSection = document.getElementById('vocabulary-quiz');
    const quizContainer = document.getElementById('quiz-container');
    
    if (!quizSection) {
        console.error('Quiz section not found!');
        return;
    }
    if (!quizContainer) {
        console.error('Quiz container not found!');
        return;
    }
    
    console.log('✓ Quiz elements found, showing quiz section');
    
    // Hide round indicator if this is initial quiz (not a retry)
    const roundInfo = document.getElementById('quiz-round-info');
    if (roundInfo && wordsToRetry.length === 0) {
        roundInfo.classList.add('hidden');
    }
    
    // Show loading state
    quizContainer.innerHTML = '<p style="text-align: center; color: #667eea; font-size: 1.2em; padding: 20px;">🎮 Generating quiz questions...</p>';
    quizSection.classList.remove('hidden');
    
    try {
        const data = await callOpenAI([
            {
                role: 'system',
                content: 'You are a teacher creating engaging multiple-choice vocabulary questions for students.'
            },
            {
                role: 'user',
                content: `Create DIVERSE and FUN vocabulary quiz questions for these words: ${words.join(', ')}

CRITICAL RULES:
1. For EACH word, create 2-3 questions using VARIED question types
2. Mix these question types:
   a) DEFINITION: "What does [word] mean?" (multiple choice)
   b) USAGE: "Which sentence uses [word] correctly?" (multiple choice)
   c) FILL_BLANK: "Complete: The ___ situation required..." (multiple choice options to fill blank)
   d) MATCH: "Match [word] with its meaning" (4 word-definition pairs as options)
   e) SYNONYM/ANTONYM: "Which word means the same/opposite?" (multiple choice)

3. Question difficulty matches word complexity:
   - Simple words: 2 questions
   - Complex words: 3 questions

4. For FILL_BLANK: Provide sentence with ONE blank (use ___) and 4 word options
5. For MATCH: Show a word and 4 possible definitions (only one correct)
6. Make wrong options plausible but clearly incorrect
7. Explanations must teach the concept clearly

Format as JSON array:
[
  {
    "word": "vocabulary word",
    "questionType": "definition|usage|fill_blank|match|synonym|antonym",
    "question": "The question text (for fill_blank, include ___ where word goes)",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "Clear explanation of correct answer with example usage",
    "wrongAnswerExplanations": ["why option 0 is wrong if not correct", "why option 1 is wrong", "why option 2 is wrong", "why option 3 is wrong"],
    "sentenceWithAnswer": "For fill_blank only: the complete sentence with correct word filled in"
  }
]

IMPORTANT: For wrongAnswerExplanations array, explain why each wrong option is incorrect. Set the correct answer's explanation to empty string "".

Example variety:
- "resilient" → definition (MC), fill_blank ("Despite setbacks, she remained ___ and kept trying."), match (pair word with definition)
- "arduous" → usage (MC), synonym (MC), fill_blank ("The ___ journey took three days.")`
            }
        ], 0.7, 'gpt-4o-mini');
        const content = data.choices[0].message.content.trim();
        
        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            currentQuizData = JSON.parse(jsonMatch[0]);
            console.log('✓ Quiz data generated:', currentQuizData.length, 'questions');
            displayQuiz(currentQuizData);
            console.log('✓ Quiz displayed successfully');
        } else {
            throw new Error('Invalid quiz format');
        }
        
    } catch (error) {
        console.error('❌ Error generating quiz:', error);
        quizContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Failed to generate quiz. Please try again.</p>';
    }
}

// Display quiz questions
function displayQuiz(quizData) {
    const quizContainer = document.getElementById('quiz-container');
    const totalEl = document.getElementById('quiz-total');
    
    if (!quizContainer || !totalEl) return;
    
    totalEl.textContent = quizData.length;
    document.getElementById('quiz-score').textContent = '0';
    
    quizContainer.innerHTML = '';
    
    quizData.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.dataset.questionIndex = index;
        
        const questionType = question.questionType || 'general';
        const typeLabel = {
            'definition': '📖 Definition',
            'usage': '✍️ Usage',
            'fill_blank': '✏️ Fill in Blank',
            'match': '🎯 Match',
            'synonym': '🔄 Synonym',
            'antonym': '↔️ Antonym',
            'general': '📝 General'
        }[questionType];
        
        // For fill-in-the-blank, highlight the blank
        let questionText = question.question;
        if (questionType === 'fill_blank') {
            questionText = questionText.replace(/___/g, '<span class="blank-highlight">___</span>');
        }
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Question ${index + 1}</span>
                <span class="question-type-badge">${typeLabel}</span>
                <span class="question-result"></span>
            </div>
            <div class="question-text">
                <span class="question-word clickable-word" onclick="showWordDetails('${question.word}')" title="Click to see definition">${question.word}</span>: ${questionText}
            </div>
            <div class="quiz-options">
                ${question.options.map((option, optIndex) => `
                    <div class="quiz-option" data-option-index="${optIndex}">
                        <input type="radio" name="question-${index}" id="q${index}-opt${optIndex}" value="${optIndex}">
                        <label for="q${index}-opt${optIndex}">${option}</label>
                    </div>
                `).join('')}
            </div>
            <div class="question-explanation">
                <strong>✓ Correct!</strong> ${question.explanation}
            </div>
        `;
        
        // Add click handlers for options - show immediate feedback
        questionDiv.querySelectorAll('.quiz-option').forEach(optionDiv => {
            optionDiv.addEventListener('click', () => {
                const radio = optionDiv.querySelector('input[type="radio"]');
                const selectedIndex = parseInt(radio.value);
                const isCorrect = selectedIndex === question.correctIndex;
                
                // Check if already answered
                if (radio.disabled) return;
                
                radio.checked = true;
                
                // Remove selected class from siblings
                questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionDiv.classList.add('selected');
                
                // Disable all options after selection
                questionDiv.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
                questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.style.cursor = 'default';
                    opt.style.pointerEvents = 'none';
                });
                
                // Show immediate feedback
                const resultSpan = questionDiv.querySelector('.question-result');
                const explanation = questionDiv.querySelector('.question-explanation');
                const options = questionDiv.querySelectorAll('.quiz-option');
                
                if (isCorrect) {
                    questionDiv.classList.add('correct');
                    resultSpan.textContent = '✓ Correct!';
                    resultSpan.className = 'question-result correct';
                    options[selectedIndex].classList.add('correct-answer');
                    
                    let explainText = `<strong>✓ Correct!</strong> ${question.explanation}`;
                    if (question.questionType === 'fill_blank' && question.sentenceWithAnswer) {
                        explainText += `<br><br><em>Complete sentence: "${question.sentenceWithAnswer}"</em>`;
                    }
                    explanation.innerHTML = explainText;
                } else {
                    questionDiv.classList.add('incorrect');
                    resultSpan.textContent = '✗ Incorrect';
                    resultSpan.className = 'question-result incorrect';
                    options[selectedIndex].classList.add('wrong-answer');
                    options[question.correctIndex].classList.add('correct-answer');
                    
                    // Generate explanation for why their choice was wrong
                    let wrongChoiceExplanation = '';
                    if (question.wrongAnswerExplanations && question.wrongAnswerExplanations[selectedIndex]) {
                        wrongChoiceExplanation = `<br><br><strong>Why "${question.options[selectedIndex]}" is wrong:</strong> ${question.wrongAnswerExplanations[selectedIndex]}`;
                    }
                    
                    let explainText = `<strong>✗ Incorrect.</strong> The correct answer is: <strong>${question.options[question.correctIndex]}</strong>${wrongChoiceExplanation}<br><br><strong>Explanation:</strong> ${question.explanation}`;
                    if (question.questionType === 'fill_blank' && question.sentenceWithAnswer) {
                        explainText += `<br><br><em>Complete sentence: "${question.sentenceWithAnswer}"</em>`;
                    }
                    explanation.innerHTML = explainText;
                }
                
                explanation.classList.add('show');
                
                // Update score
                updateQuizScore();
            });
        });
        
        quizContainer.appendChild(questionDiv);
    });
    
    // Setup buttons (hide check button since feedback is immediate)
    const checkBtn = document.getElementById('check-answers-btn');
    const retryBtn = document.getElementById('retry-quiz-btn');
    
    if (checkBtn) {
        checkBtn.classList.add('hidden'); // Hide check button - feedback is immediate
    }
    
    if (retryBtn) {
        retryBtn.classList.add('hidden'); // Initially hide retry button
        retryBtn.textContent = '🔄 Try Again';
    }
    
    // Reset retry words for new quiz
    wordsToRetry = [];
}

// Track words that were answered incorrectly
let wordsToRetry = [];

// Update quiz score as questions are answered
function updateQuizScore() {
    const questions = document.querySelectorAll('.quiz-question');
    let score = 0;
    let answered = 0;
    const incorrectWords = new Set();
    
    questions.forEach((questionDiv, index) => {
        if (questionDiv.classList.contains('correct')) {
            score++;
            answered++;
        } else if (questionDiv.classList.contains('incorrect')) {
            answered++;
            // Track which word was incorrect
            if (currentQuizData[index]) {
                incorrectWords.add(currentQuizData[index].word);
            }
        }
    });
    
    document.getElementById('quiz-score').textContent = score;
    
    // Check if all questions answered
    if (answered === questions.length) {
        const retryBtn = document.getElementById('retry-quiz-btn');
        
        if (score === questions.length) {
            // Perfect score!
            setTimeout(() => {
                const quizSection = document.getElementById('vocabulary-quiz');
                const roundInfo = document.getElementById('quiz-round-info');
                const isRetryRound = roundInfo && !roundInfo.classList.contains('hidden');
                
                let congratsDiv = quizSection.querySelector('.quiz-congrats');
                if (!congratsDiv) {
                    congratsDiv = document.createElement('div');
                    congratsDiv.className = 'quiz-congrats';
                    
                    if (isRetryRound) {
                        // Special message for mastering retry words
                        congratsDiv.innerHTML = `
                            <h3>� Excellent! You've Mastered Those Words!</h3>
                            <p>You've successfully learned all the vocabulary words you initially missed. Keep up the great work! 🎓</p>
                        `;
                    } else {
                        // Regular perfect score message
                        congratsDiv.innerHTML = `
                            <h3>�🎉 Perfect Score!</h3>
                            <p>You've mastered all the vocabulary words on the first try! Outstanding! 🏆</p>
                        `;
                    }
                    
                    quizSection.insertBefore(congratsDiv, quizSection.querySelector('.quiz-actions'));
                }
                
                // Hide round indicator after successful retry
                if (roundInfo) roundInfo.classList.add('hidden');
            }, 500);
            
            // Hide retry button and reset retry list when perfect
            if (retryBtn) retryBtn.classList.add('hidden');
            wordsToRetry = [];
        } else {
            // Some mistakes - prepare retry with wrong words
            wordsToRetry = Array.from(incorrectWords);
            
            if (retryBtn) {
                retryBtn.classList.remove('hidden');
                retryBtn.innerHTML = `🔄 Practice ${wordsToRetry.length} word${wordsToRetry.length > 1 ? 's' : ''} you missed`;
                retryBtn.onclick = () => retryIncorrectWords();
            }
        }
    }
}

// Generate new questions for words student got wrong
async function retryIncorrectWords() {
    if (wordsToRetry.length === 0) return;
    
    const quizSection = document.getElementById('vocabulary-quiz');
    const quizContainer = document.getElementById('quiz-container');
    const roundInfo = document.getElementById('quiz-round-info');
    
    // Remove congrats if exists
    const congratsDiv = quizSection.querySelector('.quiz-congrats');
    if (congratsDiv) congratsDiv.remove();
    
    // Show round indicator
    if (roundInfo) {
        roundInfo.classList.remove('hidden');
        roundInfo.innerHTML = `📚 Practice Round: Focusing on <strong>${wordsToRetry.length}</strong> word${wordsToRetry.length > 1 ? 's' : ''} you missed`;
    }
    
    // Show loading
    quizContainer.innerHTML = '<p style="text-align: center; color: #667eea; font-size: 1.2em; padding: 20px;">🎯 Generating new practice questions...</p>';
    quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('🎯 Retrying words:', wordsToRetry);
    
    // Generate new questions for incorrect words
    await generateVocabularyQuiz(wordsToRetry);
}

// ========== END QUIZ SYSTEM ==========

// Generate definitions with AI
generateDefinitionsBtn.addEventListener('click', async () => {
    if (vocabularyList.length === 0) {
        alert('Please add at least one vocabulary word!');
        return;
    }
    
    // Show loading state
    generateDefinitionsBtn.disabled = true;
    generateDefinitionsBtn.innerHTML = '<span class="loading">🤖 Getting definitions...</span>';
    
    try {
        // Get definitions for all words
        const definitions = await getVocabularyDefinitions(vocabularyList);
        
        // Display the definitions
        definitionsContent.innerHTML = definitions.map(def => `
            <div class="definition-card">
                <div class="definition-word">${def.word}</div>
                <div class="definition-pronunciation">${def.pronunciation || ''}</div>
                <div class="definition-pos">${def.partOfSpeech}</div>
                <div class="definition-meaning">${def.definition}</div>
                <div class="definition-example">"${def.example}"</div>
                ${def.synonyms ? `<div class="definition-synonyms"><strong>Synonyms:</strong> ${def.synonyms}</div>` : ''}
            </div>
        `).join('');
        
        // Track vocabulary usage
        trackVocabularyUsage(vocabularyList);
        
        // Show output
        definitionsOutput.classList.remove('hidden');
        definitionsOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Error getting definitions:', error);
        alert('❌ Error getting definitions: ' + error.message);
    } finally {
        // Reset button
        generateDefinitionsBtn.disabled = false;
        generateDefinitionsBtn.innerHTML = '📖 Get Definitions';
    }
});

// Get vocabulary definitions using AI
async function getVocabularyDefinitions(words) {
    const prompt = `Provide clear, student-friendly definitions for these vocabulary words: ${words.join(', ')}

For each word, provide:
1. The word itself
2. Part of speech (noun, verb, adjective, etc.)
3. Clear definition (one sentence)
4. An example sentence using the word
5. 2-3 common synonyms
6. Pronunciation guide (if helpful)

Format as JSON array with this structure:
[
  {
    "word": "example",
    "partOfSpeech": "noun",
    "definition": "a thing serving as a pattern or model",
    "example": "She set a good example for her classmates.",
    "synonyms": "model, specimen, illustration",
    "pronunciation": "ig-ZAM-puhl"
  }
]

Return ONLY the JSON array, no other text.`;

    const response = await callOpenAI([
        {
            role: 'user',
            content: prompt
        }
    ], 0.3, 'gpt-4o-mini', 1500);

    const content = response.choices[0].message.content.trim();
    
    // Extract JSON from response (handle if wrapped in code blocks)
    let jsonText = content;
    if (content.includes('```json')) {
        jsonText = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
        jsonText = content.split('```')[1].split('```')[0].trim();
    }
    
    const definitions = JSON.parse(jsonText);
    return definitions;
}

// Generate story using Groq AI API
async function generateAIStory(vocabularyWords, storyType, length, tone) {
    const lengthMap = {
        'short': '3-4 paragraphs',
        'medium': '5-6 paragraphs',
        'long': '7-8 paragraphs'
    };
    
    const prompt = `Write a ${tone} ${storyType} story that is ${lengthMap[length]} long.

CRITICAL REQUIREMENT: You MUST naturally incorporate ALL of these vocabulary words into the story: ${vocabularyWords.join(', ')}

Instructions:
1. Use EVERY vocabulary word in a grammatically correct and meaningful way
2. Make the story engaging, creative, and flow naturally
3. Ensure vocabulary words fit seamlessly into the narrative context
4. Make it appropriate for students learning vocabulary
5. The story should make complete sense and be enjoyable to read

Write ONLY the story text with paragraphs separated by double newlines. No explanations or notes.`;

    const data = await callOpenAI([
        {
            role: 'system',
            content: 'You are an expert creative writing teacher. Write grammatically perfect, coherent stories that help students learn vocabulary words through engaging narratives.'
        },
        {
            role: 'user',
            content: prompt
        }
    ], 0.7, 'gpt-4o-mini', 1500);
    let storyText = data.choices[0].message.content.trim();
    
    // Track which words were used
    let usedWords = [];
    
    // Highlight vocabulary words in the story (case-insensitive) and make them clickable
    vocabularyWords.forEach(word => {
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        if (regex.test(storyText)) {
            usedWords.push(word);
            storyText = storyText.replace(regex, '<span class="highlight clickable-word" data-word="$1" onclick="showWordDetails(\'$1\')">$1</span>');
        }
    });
    
    // Convert to HTML paragraphs
    const paragraphs = storyText.split('\n\n').filter(p => p.trim());
    const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    
    return { 
        content: htmlContent, 
        usedWords: usedWords
    };
}

// Copy story
copyStoryBtn.addEventListener('click', () => {
    const text = storyContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
        copyStoryBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyStoryBtn.innerHTML = '📋 Copy';
        }, 2000);
    });
});

// Save story
saveStoryBtn.addEventListener('click', () => {
    const text = storyContent.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary-story-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    saveStoryBtn.textContent = '✓ Saved!';
    setTimeout(() => {
        saveStoryBtn.innerHTML = '💾 Save';
    }, 2000);
});

// ========== VOCABULARY TRACKING & DASHBOARD ==========

// Track vocabulary usage when a story is generated
function trackVocabularyUsage(usedWords) {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Update weekly activity
    weeklyActivity[dayName] = (weeklyActivity[dayName] || 0) + usedWords.length;
    saveWeeklyActivity();
    
    // Update vocabulary history
    usedWords.forEach(word => {
        if (!vocabularyHistory[word]) {
            vocabularyHistory[word] = {
                word: word,
                usageCount: 0,
                firstUsed: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                definition: null,
                synonyms: null,
                antonyms: null,
                example: null
            };
        }
        vocabularyHistory[word].usageCount++;
        vocabularyHistory[word].lastUsed = new Date().toISOString();
    });
    
    saveVocabularyHistory();
    updateDashboard();
}

// Update dashboard statistics
function updateDashboard() {
    const totalWords = Object.keys(vocabularyHistory).length;
    const thisWeek = Object.values(weeklyActivity).reduce((a, b) => a + b, 0);
    const storiesGenerated = parseInt(localStorage.getItem('storiesGenerated') || '0');
    
    document.getElementById('total-words').textContent = totalWords;
    document.getElementById('this-week').textContent = thisWeek;
    document.getElementById('stories-generated').textContent = storiesGenerated;
    
    renderWeeklyChart();
    renderVocabularyGrid();
}

// Render weekly activity chart (simple bar chart using canvas)
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const values = days.map(day => weeklyActivity[day] || 0);
    const maxValue = Math.max(...values, 10);
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    const barWidth = canvas.width / days.length;
    const padding = 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * (canvas.height - 40);
        const x = index * barWidth + padding;
        const y = canvas.height - barHeight - 20;
        
        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - 20);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - padding * 2, barHeight);
        
        // Draw day label
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(days[index].substring(0, 3), x + (barWidth - padding * 2) / 2, canvas.height - 5);
        
        // Draw value
        if (value > 0) {
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(value, x + (barWidth - padding * 2) / 2, y - 5);
        }
    });
}

// Render vocabulary grid
function renderVocabularyGrid() {
    const grid = document.getElementById('vocabulary-grid');
    if (!grid) return;
    
    const words = Object.values(vocabularyHistory);
    const sortBy = document.getElementById('sort-words')?.value || 'recent';
    
    // Sort words
    words.sort((a, b) => {
        if (sortBy === 'alpha') return a.word.localeCompare(b.word);
        if (sortBy === 'frequency') return b.usageCount - a.usageCount;
        return new Date(b.lastUsed) - new Date(a.lastUsed);
    });
    
    grid.innerHTML = '';
    
    if (words.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No vocabulary words practiced yet. Generate a story to get started!</p>';
        return;
    }
    
    words.forEach(wordData => {
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.onclick = () => showWordDetails(wordData.word);
        
        const preview = wordData.definition ? wordData.definition.substring(0, 60) + '...' : 'Click to view details';
        
        card.innerHTML = `
            <div class="vocab-card-word">${wordData.word}</div>
            <div class="vocab-card-preview">${preview}</div>
            <div class="vocab-card-stats">
                <span>Used ${wordData.usageCount}x</span>
                <span>${new Date(wordData.lastUsed).toLocaleDateString()}</span>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Show word details in modal
async function showWordDetails(word) {
    const modal = document.getElementById('word-modal');
    const wordData = vocabularyHistory[word];
    
    document.getElementById('modal-word').textContent = word;
    document.getElementById('modal-usage-count').textContent = wordData.usageCount;
    document.getElementById('modal-first-used').textContent = new Date(wordData.firstUsed).toLocaleDateString();
    
    modal.classList.add('active');
    
    // Setup pronunciation button
    const pronunciationBtn = document.getElementById('pronunciation-btn');
    pronunciationBtn.onclick = () => speakWord(word);
    
    // If we don't have word data or missing Chinese translation, fetch it
    if (!wordData.definition || !wordData.chinese) {
        document.getElementById('modal-pronunciation').textContent = 'Loading...';
        document.getElementById('modal-part-of-speech').textContent = 'Loading...';
        document.getElementById('modal-definition').textContent = 'Loading...';
        document.getElementById('modal-chinese').textContent = 'Loading...';
        document.getElementById('modal-example').textContent = 'Loading...';
        document.getElementById('modal-synonyms').textContent = 'Loading...';
        document.getElementById('modal-antonyms').textContent = 'Loading...';
        document.getElementById('modal-stems').textContent = 'Loading...';
        
        try {
            const details = await fetchWordDetails(word);
            
            // Update local storage
            vocabularyHistory[word].pronunciation = details.pronunciation;
            vocabularyHistory[word].partOfSpeech = details.partOfSpeech;
            vocabularyHistory[word].definition = details.definition;
            vocabularyHistory[word].chinese = details.chinese;
            vocabularyHistory[word].example = details.example;
            vocabularyHistory[word].synonyms = details.synonyms;
            vocabularyHistory[word].antonyms = details.antonyms;
            vocabularyHistory[word].stems = details.stems;
            saveVocabularyHistory();
            
            // Update modal
            document.getElementById('modal-pronunciation').textContent = details.pronunciation;
            document.getElementById('modal-part-of-speech').textContent = details.partOfSpeech;
            document.getElementById('modal-definition').textContent = details.definition;
            document.getElementById('modal-chinese').textContent = details.chinese;
            document.getElementById('modal-example').textContent = details.example;
            document.getElementById('modal-synonyms').textContent = details.synonyms;
            document.getElementById('modal-antonyms').textContent = details.antonyms;
            document.getElementById('modal-stems').innerHTML = formatStems(details.stems);
        } catch (error) {
            document.getElementById('modal-definition').textContent = 'Error loading details';
            console.error(error);
        }
    } else {
        document.getElementById('modal-pronunciation').textContent = wordData.pronunciation || 'N/A';
        document.getElementById('modal-part-of-speech').textContent = wordData.partOfSpeech || 'N/A';
        document.getElementById('modal-definition').textContent = wordData.definition;
        document.getElementById('modal-chinese').textContent = wordData.chinese || '暂无中文释义';
        document.getElementById('modal-example').textContent = wordData.example || 'No example available';
        document.getElementById('modal-synonyms').textContent = wordData.synonyms || 'None';
        document.getElementById('modal-antonyms').textContent = wordData.antonyms || 'None';
        document.getElementById('modal-stems').innerHTML = formatStems(wordData.stems || 'No stem information available');
    }
}

// Speak the word using Web Speech API
function speakWord(word) {
    const btn = document.getElementById('pronunciation-btn');
    
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // Slower for clarity
        utterance.pitch = 1.0;
        
        // Visual feedback
        btn.classList.add('playing');
        btn.textContent = '🔊 Playing...';
        
        utterance.onend = () => {
            btn.classList.remove('playing');
            btn.textContent = '🔊 Play';
        };
        
        utterance.onerror = () => {
            btn.classList.remove('playing');
            btn.textContent = '🔊 Play';
            console.error('Speech synthesis error');
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Sorry, your browser does not support text-to-speech.');
    }
}

// Fetch word image by searching online with direct, literal approach
async function fetchWordImage(word) {
    const imageEl = document.getElementById('modal-image');
    const loadingEl = document.getElementById('modal-image-loading');
    
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Searching for image...';
    imageEl.style.display = 'none';
    
    try {
        // Use OpenAI to get a direct, literal visual representation
        const data = await callOpenAI([
            {
                role: 'system',
                content: 'You provide direct, literal search queries for images. If the word is a noun, use the noun itself. If abstract, provide the most concrete, literal visual representation.'
            },
            {
                role: 'user',
                content: `For the word "${word}", what is the MOST DIRECT and LITERAL thing to search for an image?
- If it's a concrete noun (like "royalty"), respond with what represents it (e.g., "king queen crown")
- If it's a verb (like "running"), respond with the action (e.g., "person running")
- If it's an adjective (like "beautiful"), respond with something that exemplifies it (e.g., "beautiful landscape")
- Keep it simple, concrete, and visual. 2-3 words maximum.
Just respond with the search query, nothing else.`
            }
        ], 0.2, 'gpt-4o-mini', 20);
        const searchQuery = data.choices[0].message.content.trim().replace(/['"]/g, '');
        
        console.log(`Image search - Word: "${word}", Query: "${searchQuery}"`);
        
        // Create a canvas-based visual representation
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Generate color based on word
        const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue1 = hash % 360;
        const hue2 = (hash + 60) % 360;
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 400);
        gradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${hue2}, 70%, 45%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 400);
        
        // Add search query text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(searchQuery.toUpperCase(), 400, 200);
        
        // Add word in smaller text below
        ctx.font = '32px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`(${word})`, 400, 260);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log('Created visual representation');
        imageEl.src = dataUrl;
        imageEl.alt = `Visual representation of ${word}`;
        imageEl.style.display = 'block';
        loadingEl.style.display = 'none';
        
        // Add attribution
        const attribution = document.createElement('p');
        attribution.className = 'image-attribution';
        attribution.innerHTML = `Generated visual aid for learning`;
        
        const container = document.getElementById('modal-image-container');
        const existingAttribution = container.querySelector('.image-attribution');
        if (existingAttribution) {
            existingAttribution.remove();
        }
        container.appendChild(attribution);
        
    } catch (error) {
        console.error('Error fetching word image:', error);
        loadingEl.textContent = '📷 Image unavailable';
        loadingEl.style.color = '#888';
    }
}

// Format stems text to highlight key terms
function formatStems(stemsText) {
    if (!stemsText || stemsText === 'No stem information available') {
        return stemsText;
    }
    
    // Bold important keywords
    let formatted = stemsText
        .replace(/\b(root|stem|prefix|suffix|base|related words?|pattern)\b/gi, '<strong>$1</strong>')
        .replace(/\b([a-z]+-)\b/gi, '<strong>$1</strong>') // Highlight prefixes like "re-", "un-"
        .replace(/\b(-[a-z]+)\b/gi, '<strong>$1</strong>'); // Highlight suffixes like "-tion", "-ness"
    
    return formatted;
}

// Fetch comprehensive word details using OpenAI
async function fetchWordDetails(word) {
    const data = await callOpenAI([
        {
            role: 'system',
            content: 'You are an expert vocabulary teacher and linguist. Provide comprehensive, educational word information that helps students deeply understand and remember vocabulary.'
        },
        {
            role: 'user',
            content: `Provide complete information for the word "${word}":

1. PRONUNCIATION: Phonetic spelling (e.g., /ˈwɜːrd/) 
2. PART OF SPEECH: (noun, verb, adjective, etc.)
3. DEFINITION: Clear, student-friendly definition in English
4. CHINESE: Chinese translation/definition (简体中文)
5. EXAMPLE: One excellent example sentence showing proper usage
6. SYNONYMS: 3-5 synonyms (comma-separated)
7. ANTONYMS: 3-5 antonyms if applicable (comma-separated, or "None")
8. STEMS & PATTERNS: Identify the root/stem, prefix, suffix if any. Explain the pattern and provide 2-3 related words that follow the same pattern to help expand vocabulary learning.

Format your response EXACTLY as:
Pronunciation: [pronunciation]
Part of Speech: [part of speech]
Definition: [definition]
Chinese: [中文释义]
Example: [sentence]
Synonyms: [synonyms]
Antonyms: [antonyms]
Stems: [detailed explanation of word stems, prefixes, suffixes, and related words with the same pattern]`
        }
    ], 0.3, 'gpt-4o-mini', 500);
    const text = data.choices[0].message.content.trim();
    
    console.log('AI Response for word details:', text);
    
    // Parse response
    const lines = text.split('\n');
    const pronunciation = lines.find(l => l.startsWith('Pronunciation:'))?.replace('Pronunciation:', '').trim() || 'N/A';
    const partOfSpeech = lines.find(l => l.startsWith('Part of Speech:'))?.replace('Part of Speech:', '').trim() || 'N/A';
    const definition = lines.find(l => l.startsWith('Definition:'))?.replace('Definition:', '').trim() || 'No definition available';
    const chinese = lines.find(l => l.startsWith('Chinese:'))?.replace('Chinese:', '').trim() || '暂无中文释义';
    const example = lines.find(l => l.startsWith('Example:'))?.replace('Example:', '').trim() || 'No example available';
    const synonyms = lines.find(l => l.startsWith('Synonyms:'))?.replace('Synonyms:', '').trim() || 'None';
    const antonyms = lines.find(l => l.startsWith('Antonyms:'))?.replace('Antonyms:', '').trim() || 'None';
    
    console.log('Parsed Chinese:', chinese);
    
    // Parse stems - might span multiple lines
    const stemsIndex = lines.findIndex(l => l.startsWith('Stems:'));
    let stems = 'No stem information available';
    if (stemsIndex !== -1) {
        stems = lines.slice(stemsIndex).join('\n').replace('Stems:', '').trim();
    }
    
    return { pronunciation, partOfSpeech, definition, chinese, example, synonyms, antonyms, stems };
}

// Modal close functionality
document.querySelector('.close-modal')?.addEventListener('click', () => {
    document.getElementById('word-modal').classList.remove('active');
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('word-modal');
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Search and filter functionality
document.getElementById('search-words')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.vocab-card');
    
    cards.forEach(card => {
        const word = card.querySelector('.vocab-card-word').textContent.toLowerCase();
        card.style.display = word.includes(searchTerm) ? 'block' : 'none';
    });
});

document.getElementById('sort-words')?.addEventListener('change', () => {
    renderVocabularyGrid();
});

// Update story count when generating
const originalGenerateBtn = generateStoryBtn.onclick;
generateStoryBtn.addEventListener('click', () => {
    const currentCount = parseInt(localStorage.getItem('storiesGenerated') || '0');
    localStorage.setItem('storiesGenerated', currentCount + 1);
});

// Initialize dashboard when tab is clicked
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'review') {
            updateDashboard();
        }
    });
});

// Initialize on page load
updateDashboard();

// ========== WRITING PRACTICE & FEEDBACK ==========

const writingInput = document.getElementById('writing-input');
const analyzeWritingBtn = document.getElementById('analyze-writing-btn');
const clearWritingBtn = document.getElementById('clear-writing-btn');
const wordCounter = document.getElementById('word-counter');
const feedbackArea = document.getElementById('feedback-area');
const copyRevisedBtn = document.getElementById('copy-revised-btn');

// Input method switching
document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const method = tab.dataset.method;
        
        // Update active tab
        document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding input method
        document.querySelectorAll('.input-method').forEach(m => m.classList.remove('active'));
        document.getElementById(`${method}-input-method`).classList.add('active');
        
        // Hide feedback when switching
        feedbackArea?.classList.add('hidden');
        
        // Stop camera if switching away from camera tab
        if (method !== 'camera' && cameraStream) {
            stopCamera();
        }
    });
});

// Camera elements
const cameraVideo = document.getElementById('camera-video');
const cameraCanvas = document.getElementById('camera-canvas');
const startCameraBtn = document.getElementById('start-camera-btn');
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const cameraPreviewContainer = document.getElementById('camera-preview-container');
const cameraPreview = document.getElementById('camera-preview');
const retakePhotoBtn = document.getElementById('retake-photo-btn');
const analyzeCameraBtn = document.getElementById('analyze-camera-btn');
let cameraStream = null;
let capturedImageBase64 = null;

// Start camera
startCameraBtn?.addEventListener('click', async () => {
    try {
        // Check if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('❌ Camera is not supported on this device or browser.');
            return;
        }
        
        // Request camera access with preference for back camera on mobile
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (cameraVideo) {
            cameraVideo.srcObject = cameraStream;
        }
        
        // Update UI
        startCameraBtn?.classList.add('hidden');
        capturePhotoBtn?.classList.remove('hidden');
        stopCameraBtn?.classList.remove('hidden');
        cameraPreviewContainer?.classList.add('hidden');
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        const errorMsg = error.name === 'NotAllowedError' 
            ? '❌ Camera access denied. Please grant camera permissions in your browser settings.'
            : error.name === 'NotFoundError'
            ? '❌ No camera found on this device.'
            : '❌ Unable to access camera. Please try again.';
        alert(errorMsg);
    }
});

// Stop camera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        if (cameraVideo) {
            cameraVideo.srcObject = null;
        }
        cameraStream = null;
        
        // Update UI
        startCameraBtn?.classList.remove('hidden');
        capturePhotoBtn?.classList.add('hidden');
        stopCameraBtn?.classList.add('hidden');
    }
}

stopCameraBtn?.addEventListener('click', stopCamera);

// Capture photo
capturePhotoBtn?.addEventListener('click', () => {
    if (!cameraStream || !cameraVideo || !cameraCanvas) return;
    
    // Set canvas size to match video
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = cameraCanvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(cameraVideo, 0, 0);
        
        // Convert to base64
        capturedImageBase64 = cameraCanvas.toDataURL('image/jpeg', 0.9);
        
        // Show preview
        if (cameraPreview) {
            cameraPreview.src = capturedImageBase64;
        }
        cameraPreviewContainer?.classList.remove('hidden');
        
        // Stop camera
        stopCamera();
    }
});

// Retake photo
retakePhotoBtn?.addEventListener('click', () => {
    capturedImageBase64 = null;
    cameraPreviewContainer.classList.add('hidden');
    feedbackArea?.classList.add('hidden');
    startCameraBtn.click();
});

// Analyze camera photo
analyzeCameraBtn?.addEventListener('click', async () => {
    if (!capturedImageBase64) {
        alert('Please capture a photo first!');
        return;
    }
    
    // Show loading state
    analyzeCameraBtn.disabled = true;
    analyzeCameraBtn.innerHTML = '🔄 Analyzing Photo...';
    feedbackArea?.classList.remove('hidden');
    
    const scoreEl = document.getElementById('overall-score');
    const strengthsEl = document.getElementById('strengths-list');
    const improvementsEl = document.getElementById('improvements-list');
    const grammarEl = document.getElementById('grammar-feedback');
    const suggestionsEl = document.getElementById('suggestions-feedback');
    const revisedEl = document.getElementById('revised-version');
    
    if (scoreEl) scoreEl.textContent = '...';
    if (strengthsEl) strengthsEl.innerHTML = '<li>Loading...</li>';
    if (improvementsEl) improvementsEl.innerHTML = '<li>Loading...</li>';
    if (grammarEl) grammarEl.textContent = 'Analyzing...';
    if (suggestionsEl) suggestionsEl.textContent = 'Analyzing...';
    if (revisedEl) revisedEl.textContent = 'Generating...';
    
    try {
        const feedback = await analyzeImageWriting(capturedImageBase64);
        displayFeedback(feedback);
        
        feedbackArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error analyzing photo:', error);
        alert('❌ Error analyzing photo: ' + error.message);
    } finally {
        analyzeCameraBtn.disabled = false;
        analyzeCameraBtn.innerHTML = '🔍 Analyze Photo';
    }
});

// Image upload elements
const uploadZone = document.getElementById('upload-zone');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const analyzeImageBtn = document.getElementById('analyze-image-btn');
let currentImageBase64 = null;

// Click to upload
uploadZone?.addEventListener('click', () => {
    imageInput.click();
});

// Drag and drop handlers
uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone?.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
});

// File input change
imageInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
    }
});

// Handle image file
function handleImageFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG, etc.)');
        return;
    }
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('Image is too large. Please upload an image smaller than 20MB.');
        return;
    }
    
    // Read and display image
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result;
        imagePreview.src = currentImageBase64;
        uploadZone.style.display = 'none';
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Remove image
removeImageBtn?.addEventListener('click', () => {
    currentImageBase64 = null;
    imagePreview.src = '';
    imageInput.value = '';
    uploadZone.style.display = 'block';
    imagePreviewContainer.classList.add('hidden');
    feedbackArea?.classList.add('hidden');
});

// Analyze image
analyzeImageBtn?.addEventListener('click', async () => {
    if (!currentImageBase64) {
        alert('Please upload an image first!');
        return;
    }
    
    // Show loading state
    analyzeImageBtn.disabled = true;
    analyzeImageBtn.innerHTML = '🔄 Analyzing Image...';
    feedbackArea?.classList.remove('hidden');
    
    const scoreEl = document.getElementById('overall-score');
    const strengthsEl = document.getElementById('strengths-list');
    const improvementsEl = document.getElementById('improvements-list');
    const grammarEl = document.getElementById('grammar-feedback');
    const suggestionsEl = document.getElementById('suggestions-feedback');
    const revisedEl = document.getElementById('revised-version');
    
    if (scoreEl) scoreEl.textContent = '...';
    if (strengthsEl) strengthsEl.innerHTML = '<li>Loading...</li>';
    if (improvementsEl) improvementsEl.innerHTML = '<li>Loading...</li>';
    if (grammarEl) grammarEl.textContent = 'Analyzing...';
    if (suggestionsEl) suggestionsEl.textContent = 'Analyzing...';
    if (revisedEl) revisedEl.textContent = 'Generating...';
    
    try {
        const feedback = await analyzeImageWriting(currentImageBase64);
        displayFeedback(feedback);
        
        feedbackArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error analyzing image:', error);
        alert('❌ Error analyzing image: ' + error.message);
    } finally {
        analyzeImageBtn.disabled = false;
        analyzeImageBtn.innerHTML = '🔍 Analyze Image';
    }
});

// Word counter
writingInput?.addEventListener('input', () => {
    const text = writingInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCounter.textContent = `${words} word${words !== 1 ? 's' : ''}`;
});

// Clear writing
clearWritingBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your writing?')) {
        writingInput.value = '';
        wordCounter.textContent = '0 words';
        feedbackArea.classList.add('hidden');
    }
});

// Analyze writing
analyzeWritingBtn?.addEventListener('click', async () => {
    const text = writingInput.value.trim();
    
    if (!text) {
        alert('Please write something first!');
        return;
    }
    
    if (text.split(/\s+/).length < 3) {
        alert('Please write at least 3 words for meaningful feedback.');
        return;
    }
    
    // Show loading state
    analyzeWritingBtn.disabled = true;
    analyzeWritingBtn.innerHTML = '🔄 Analyzing...';
    feedbackArea?.classList.remove('hidden');
    
    const scoreEl = document.getElementById('overall-score');
    const strengthsEl = document.getElementById('strengths-list');
    const improvementsEl = document.getElementById('improvements-list');
    const grammarEl = document.getElementById('grammar-feedback');
    const suggestionsEl = document.getElementById('suggestions-feedback');
    const revisedEl = document.getElementById('revised-version');
    
    if (scoreEl) scoreEl.textContent = '...';
    if (strengthsEl) strengthsEl.innerHTML = '<li>Loading...</li>';
    if (improvementsEl) improvementsEl.innerHTML = '<li>Loading...</li>';
    if (grammarEl) grammarEl.textContent = 'Analyzing...';
    if (suggestionsEl) suggestionsEl.textContent = 'Analyzing...';
    if (revisedEl) revisedEl.textContent = 'Generating...';
    
    try {
        const feedback = await analyzeWriting(text);
        displayFeedback(feedback);
        
        feedbackArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error analyzing writing:', error);
        alert('❌ Error analyzing writing: ' + error.message);
    } finally {
        analyzeWritingBtn.disabled = false;
        analyzeWritingBtn.innerHTML = '🔍 Get Feedback';
    }
});

// Analyze image writing using AI Vision with detailed error correction
async function analyzeImageWriting(imageBase64) {
    const data = await callOpenAI([
        {
            role: 'system',
            content: 'You are an expert writing teacher. Carefully read the text in the image and identify ALL errors (spelling, grammar, punctuation, word choice, etc.). List each error with its correction and explanation. Be thorough and educational.'
        },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `Please analyze the student writing in this image and provide comprehensive feedback:

STEP 1: First, transcribe the EXACT text you see in the image (including all errors).

STEP 2: Identify and correct EVERY error from top to bottom. For each error, provide:

FORMAT:
TRANSCRIBED_TEXT: [Write the exact text from the image here]

ERRORS_FOUND:
Error 1: "[incorrect text]" → "[corrected text]"
Type: [spelling/grammar/punctuation/word choice/etc.]
Explanation: [Why this is wrong and how to fix it]

Error 2: "[incorrect text]" → "[corrected text]"
Type: [type]
Explanation: [explanation]

[Continue for ALL errors found]

SCORE: [Give a score from 0-100]

STRENGTHS:
- [Strength 1]
- [Strength 2]
- [Strength 3]

IMPROVEMENTS:
- [Improvement 1]
- [Improvement 2]
- [Improvement 3]

GRAMMAR: [Comment on grammar, punctuation, spelling, and mechanics. If handwritten, also comment on legibility]

SUGGESTIONS: [Specific suggestions for making the writing better]

REVISED: [Provide an improved version of their writing, keeping their voice but fixing issues]`
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageBase64
                    }
                }
            ]
        }
    ], 0.5, 'gpt-4o', 1500);
    const feedbackText = data.choices[0].message.content.trim();
    
    return parseFeedback(feedbackText);
}

// Analyze writing using AI
async function analyzeWriting(text) {
    const data = await callOpenAI([
        {
            role: 'system',
            content: 'You are a helpful writing teacher providing constructive feedback to students. Be encouraging but honest. Focus on grammar, style, clarity, and structure.'
        },
        {
            role: 'user',
            content: `Please analyze this student writing and provide detailed feedback in the following format:

STUDENT WRITING:
"${text}"

Please provide your feedback in this exact format:

SCORE: [Give a score from 0-100]

STRENGTHS:
- [Strength 1]
- [Strength 2]
- [Strength 3]

IMPROVEMENTS:
- [Improvement 1]
- [Improvement 2]
- [Improvement 3]

GRAMMAR: [Comment on grammar, punctuation, and mechanics]

SUGGESTIONS: [Specific suggestions for making the writing better]

REVISED: [Provide an improved version of their writing, keeping their voice but fixing issues]`
        }
    ], 0.5, 'gpt-4o-mini', 1000);
    const feedbackText = data.choices[0].message.content.trim();
    
    return parseFeedback(feedbackText);
}

// Parse AI feedback response with error corrections
function parseFeedback(text) {
    const lines = text.split('\n').filter(l => l.trim());
    
    const feedback = {
        transcribedText: '',
        errors: [],
        score: 0,
        strengths: [],
        improvements: [],
        grammar: '',
        suggestions: '',
        revised: ''
    };
    
    let currentSection = '';
    let currentError = null;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        // Parse transcribed text
        if (trimmed.startsWith('TRANSCRIBED_TEXT:')) {
            currentSection = 'transcribed';
            feedback.transcribedText = trimmed.replace('TRANSCRIBED_TEXT:', '').trim();
        }
        // Parse errors section
        else if (trimmed === 'ERRORS_FOUND:') {
            currentSection = 'errors';
        }
        // Parse individual errors
        else if (trimmed.match(/^Error \d+:/)) {
            if (currentError) {
                feedback.errors.push(currentError);
            }
            const errorMatch = trimmed.match(/"([^"]+)" → "([^"]+)"/);
            if (errorMatch) {
                currentError = {
                    incorrect: errorMatch[1],
                    correct: errorMatch[2],
                    type: '',
                    explanation: ''
                };
            }
        }
        else if (trimmed.startsWith('Type:') && currentError) {
            currentError.type = trimmed.replace('Type:', '').trim();
        }
        else if (trimmed.startsWith('Explanation:') && currentError) {
            currentError.explanation = trimmed.replace('Explanation:', '').trim();
        }
        // Regular sections
        else if (trimmed.startsWith('SCORE:')) {
            if (currentError) {
                feedback.errors.push(currentError);
                currentError = null;
            }
            const scoreMatch = trimmed.match(/\d+/);
            feedback.score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
        } else if (trimmed === 'STRENGTHS:') {
            currentSection = 'strengths';
        } else if (trimmed === 'IMPROVEMENTS:') {
            currentSection = 'improvements';
        } else if (trimmed.startsWith('GRAMMAR:')) {
            currentSection = 'grammar';
            feedback.grammar = trimmed.replace('GRAMMAR:', '').trim();
        } else if (trimmed.startsWith('SUGGESTIONS:')) {
            currentSection = 'suggestions';
            feedback.suggestions = trimmed.replace('SUGGESTIONS:', '').trim();
        } else if (trimmed.startsWith('REVISED:')) {
            currentSection = 'revised';
            feedback.revised = trimmed.replace('REVISED:', '').trim();
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            const item = trimmed.replace(/^[-•]\s*/, '');
            if (currentSection === 'strengths') {
                feedback.strengths.push(item);
            } else if (currentSection === 'improvements') {
                feedback.improvements.push(item);
            }
        } else if (currentSection === 'transcribed' && trimmed) {
            feedback.transcribedText += ' ' + trimmed;
        } else if (currentSection === 'grammar' && trimmed && !trimmed.includes(':')) {
            feedback.grammar += ' ' + trimmed;
        } else if (currentSection === 'suggestions' && trimmed && !trimmed.includes(':')) {
            feedback.suggestions += ' ' + trimmed;
        } else if (currentSection === 'revised' && trimmed && !trimmed.includes(':')) {
            feedback.revised += ' ' + trimmed;
        } else if (currentError && !trimmed.startsWith('Error')) {
            // Continue multi-line explanation
            currentError.explanation += ' ' + trimmed;
        }
    });
    
    // Don't forget the last error
    if (currentError) {
        feedback.errors.push(currentError);
    }
    
    return feedback;
}

// Display feedback with error corrections and games
function displayFeedback(feedback) {
    // Show transcribed text
    const transcribedEl = document.getElementById('transcribed-text');
    const transcribedSection = document.getElementById('transcribed-section');
    if (transcribedEl && feedback.transcribedText) {
        transcribedEl.textContent = feedback.transcribedText;
        transcribedSection?.classList.remove('hidden');
    } else {
        transcribedSection?.classList.add('hidden');
    }
    
    // Display errors with corrections
    const errorsListEl = document.getElementById('errors-list');
    const errorsSection = document.getElementById('errors-section');
    if (errorsListEl && feedback.errors && feedback.errors.length > 0) {
        errorsListEl.innerHTML = '';
        feedback.errors.forEach((error, index) => {
            const errorCard = document.createElement('div');
            errorCard.className = 'error-card';
            errorCard.innerHTML = `
                <div class="error-header">
                    <span class="error-number">Error ${index + 1}</span>
                    <span class="error-type">${error.type || 'Error'}</span>
                </div>
                <div class="error-text">
                    <span class="incorrect-text">"${error.incorrect}"</span>
                    <span class="arrow">→</span>
                    <span class="correct-text">"${error.correct}"</span>
                </div>
                <div class="error-explanation">
                    <div class="explanation-label">Why this is wrong:</div>
                    <p>${error.explanation}</p>
                </div>
            `;
            
            errorCard.addEventListener('click', () => {
                errorCard.classList.toggle('expanded');
            });
            
            errorsListEl.appendChild(errorCard);
        });
        errorsSection?.classList.remove('hidden');
    } else {
        errorsSection?.classList.add('hidden');
    }
    
    // Score
    const scoreEl = document.getElementById('overall-score');
    if (scoreEl) scoreEl.textContent = feedback.score;
    
    // Strengths
    const strengthsList = document.getElementById('strengths-list');
    if (strengthsList) {
        strengthsList.innerHTML = '';
        if (feedback.strengths && feedback.strengths.length > 0) {
            feedback.strengths.forEach(strength => {
                const li = document.createElement('li');
                li.textContent = strength;
                strengthsList.appendChild(li);
            });
        } else {
            strengthsList.innerHTML = '<li>Keep practicing!</li>';
        }
    }
    
    // Improvements
    const improvementsList = document.getElementById('improvements-list');
    if (improvementsList) {
        improvementsList.innerHTML = '';
        if (feedback.improvements && feedback.improvements.length > 0) {
            feedback.improvements.forEach(improvement => {
                const li = document.createElement('li');
                li.textContent = improvement;
                improvementsList.appendChild(li);
            });
        } else {
            improvementsList.innerHTML = '<li>Great work! No major improvements needed.</li>';
        }
    }
    
    // Grammar
    const grammarEl = document.getElementById('grammar-feedback');
    if (grammarEl) grammarEl.textContent = feedback.grammar || 'No grammar issues found.';
    
    // Suggestions
    const suggestionsEl = document.getElementById('suggestions-feedback');
    if (suggestionsEl) suggestionsEl.textContent = feedback.suggestions || 'Keep up the good work!';
    
    // Revised version
    const revisedEl = document.getElementById('revised-version');
    if (revisedEl) revisedEl.textContent = feedback.revised || 'Your writing looks good!';
    
    // Generate practice games
    if (feedback.errors && feedback.errors.length > 0) {
        generatePracticeGames(feedback.errors);
    }
}

// Copy revised version
copyRevisedBtn?.addEventListener('click', () => {
    const revisedText = document.getElementById('revised-version').textContent;
    navigator.clipboard.writeText(revisedText).then(() => {
        copyRevisedBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyRevisedBtn.textContent = '📋 Copy Revised Version';
        }, 2000);
    });
});

// ========== PRACTICE GAMES GENERATION ==========

function generatePracticeGames(errors) {
    const gamesContainer = document.getElementById('games-container');
    const gamesSection = document.getElementById('games-section');
    
    if (!gamesContainer || errors.length === 0) return;
    
    gamesContainer.innerHTML = '';
    gamesSection?.classList.remove('hidden');
    
    // Game 1: Multiple Choice - Correct the Error
    generateMultipleChoiceGame(errors, gamesContainer);
    
    // Game 2: Fill in the Blanks
    generateFillInBlanksGame(errors, gamesContainer);
    
    // Game 3: Match Correct and Incorrect
    generateMatchingGame(errors, gamesContainer);
}

// Game 1: Multiple Choice Quiz
function generateMultipleChoiceGame(errors, container) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    
    const gameContent = document.createElement('div');
    gameContent.className = 'game-content';
    
    let currentQuestion = 0;
    let score = 0;
    
    function showQuestion() {
        if (currentQuestion >= errors.length) {
            gameContent.innerHTML = `
                <div class="game-score">
                    🎉 Quiz Complete! 
                    <br>Your Score: ${score}/${errors.length}
                    <br>${score === errors.length ? 'Perfect! 🌟' : 'Keep practicing!'}
                </div>
            `;
            return;
        }
        
        const error = errors[currentQuestion];
        const options = [error.correct];
        
        // Add wrong options (other incorrect words from the list)
        const otherErrors = errors.filter((_, i) => i !== currentQuestion);
        while (options.length < Math.min(4, errors.length + 1)) {
            if (otherErrors.length > 0) {
                const randomError = otherErrors.splice(Math.floor(Math.random() * otherErrors.length), 1)[0];
                options.push(randomError.incorrect);
            } else {
                break;
            }
        }
        
        // Shuffle options
        options.sort(() => Math.random() - 0.5);
        
        gameContent.innerHTML = `
            <div class="game-question">
                Question ${currentQuestion + 1}/${errors.length}: 
                <br>What is the correct version of: <strong>"${error.incorrect}"</strong>?
            </div>
            <div class="game-options">
                ${options.map(option => `
                    <div class="game-option" data-answer="${option}">${option}</div>
                `).join('')}
            </div>
            <div class="game-feedback"></div>
        `;
        
        const optionEls = gameContent.querySelectorAll('.game-option');
        const feedbackEl = gameContent.querySelector('.game-feedback');
        
        optionEls.forEach(opt => {
            opt.addEventListener('click', () => {
                if (opt.classList.contains('disabled')) return;
                
                optionEls.forEach(o => o.classList.add('disabled'));
                
                const isCorrect = opt.dataset.answer === error.correct;
                opt.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                if (isCorrect) {
                    score++;
                    feedbackEl.textContent = '✅ Correct! ' + error.explanation;
                    feedbackEl.className = 'game-feedback correct show';
                } else {
                    feedbackEl.textContent = '❌ Incorrect. The correct answer is: ' + error.correct;
                    feedbackEl.className = 'game-feedback incorrect show';
                    // Highlight correct answer
                    optionEls.forEach(o => {
                        if (o.dataset.answer === error.correct) {
                            o.classList.add('correct');
                        }
                    });
                }
                
                setTimeout(() => {
                    currentQuestion++;
                    showQuestion();
                }, 2500);
            });
        });
    }
    
    gameCard.innerHTML = '<h5>🎯 Game 1: Multiple Choice Quiz</h5>';
    gameCard.appendChild(gameContent);
    container.appendChild(gameCard);
    
    showQuestion();
}

// Game 2: Fill in the Blanks
function generateFillInBlanksGame(errors, container) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    
    gameCard.innerHTML = `
        <h5>✏️ Game 2: Fill in the Blanks</h5>
        <div class="game-content" id="fill-blanks-content"></div>
    `;
    
    const gameContent = gameCard.querySelector('.game-content');
    
    let currentQuestion = 0;
    let score = 0;
    
    function showQuestion() {
        if (currentQuestion >= Math.min(5, errors.length)) {
            gameContent.innerHTML = `
                <div class="game-score">
                    🎉 Fill in the Blanks Complete!
                    <br>Your Score: ${score}/${Math.min(5, errors.length)}
                </div>
            `;
            return;
        }
        
        const error = errors[currentQuestion];
        
        gameContent.innerHTML = `
            <div class="game-question">
                Question ${currentQuestion + 1}: Type the correct word
                <br>Incorrect: "${error.incorrect}"
                <br>Hint: ${error.type} error - ${error.explanation.substring(0, 50)}...
            </div>
            <div style="text-align: center; margin: 20px 0;">
                The correct word is: <input type="text" class="fill-blank-input" id="blank-input" placeholder="Type here...">
            </div>
            <button class="btn btn-primary" id="check-answer-btn">Check Answer</button>
            <div class="game-feedback"></div>
        `;
        
        const inputEl = gameContent.querySelector('#blank-input');
        const checkBtn = gameContent.querySelector('#check-answer-btn');
        const feedbackEl = gameContent.querySelector('.game-feedback');
        
        const checkAnswer = () => {
            const userAnswer = inputEl.value.trim().toLowerCase();
            const correctAnswer = error.correct.toLowerCase();
            
            if (userAnswer === correctAnswer) {
                score++;
                inputEl.classList.add('correct');
                feedbackEl.textContent = '✅ Correct!';
                feedbackEl.className = 'game-feedback correct show';
            } else {
                inputEl.classList.add('incorrect');
                feedbackEl.textContent = `❌ Incorrect. The correct answer is: "${error.correct}"`;
                feedbackEl.className = 'game-feedback incorrect show';
            }
            
            checkBtn.disabled = true;
            inputEl.disabled = true;
            
            setTimeout(() => {
                currentQuestion++;
                showQuestion();
            }, 2500);
        };
        
        checkBtn.addEventListener('click', checkAnswer);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
    }
    
    container.appendChild(gameCard);
    showQuestion();
}

// Game 3: Matching Game
function generateMatchingGame(errors, container) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    
    gameCard.innerHTML = `
        <h5>🔗 Game 3: Match Incorrect to Correct</h5>
        <div class="game-content">
            <div class="game-question">Match each incorrect word with its correction</div>
            <div id="matching-game-content"></div>
        </div>
    `;
    
    const gameContent = gameCard.querySelector('#matching-game-content');
    
    const gameErrors = errors.slice(0, Math.min(5, errors.length));
    const incorrectWords = gameErrors.map(e => e.incorrect);
    const correctWords = [...gameErrors.map(e => e.correct)].sort(() => Math.random() - 0.5);
    
    let selected = null;
    let matches = 0;
    
    gameContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div>
                <h6 style="text-align: center; margin-bottom: 10px;">Incorrect</h6>
                ${incorrectWords.map((word, i) => `
                    <div class="game-option" data-type="incorrect" data-index="${i}" style="margin-bottom: 10px;">
                        ${word}
                    </div>
                `).join('')}
            </div>
            <div>
                <h6 style="text-align: center; margin-bottom: 10px;">Correct</h6>
                ${correctWords.map((word, i) => `
                    <div class="game-option" data-type="correct" data-value="${word}" style="margin-bottom: 10px;">
                        ${word}
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="game-feedback"></div>
    `;
    
    const options = gameContent.querySelectorAll('.game-option');
    const feedbackEl = gameContent.querySelector('.game-feedback');
    
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.classList.contains('correct') || opt.classList.contains('incorrect')) return;
            
            if (!selected) {
                selected = opt;
                opt.style.background = '#e0e7ff';
            } else {
                if (selected === opt) {
                    selected.style.background = '';
                    selected = null;
                } else if (selected.dataset.type !== opt.dataset.type) {
                    const incorrectOpt = selected.dataset.type === 'incorrect' ? selected : opt;
                    const correctOpt = selected.dataset.type === 'correct' ? selected : opt;
                    
                    const incorrectIndex = parseInt(incorrectOpt.dataset.index);
                    const correctValue = correctOpt.dataset.value;
                    
                    if (gameErrors[incorrectIndex].correct === correctValue) {
                        incorrectOpt.classList.add('correct');
                        correctOpt.classList.add('correct');
                        matches++;
                        
                        if (matches === gameErrors.length) {
                            feedbackEl.textContent = '🎉 Perfect! All matched correctly!';
                            feedbackEl.className = 'game-feedback correct show';
                        }
                    } else {
                        incorrectOpt.classList.add('incorrect');
                        correctOpt.classList.add('incorrect');
                        setTimeout(() => {
                            incorrectOpt.classList.remove('incorrect');
                            correctOpt.classList.remove('incorrect');
                        }, 1000);
                    }
                    
                    selected.style.background = '';
                    selected = null;
                }
            }
        });
    });
    
    if (checkBtn) checkBtn.classList.add('hidden');
    if (retryBtn) retryBtn.classList.remove('hidden');
    
    container.appendChild(gameCard);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
