function analyzeText(text) {
  const analysis = {
    characters: extractCharacters(text),
    places: extractPlaces(text),
    events: extractEvents(text),
    items: extractItems(text)
  };
  
  return analysis;
}

function extractCharacters(text) {
  const characters = new Map();
  
  const dialoguePattern = /"([^"]+)"\s+(said|asked|replied|shouted|whispered|exclaimed|muttered|growled|laughed|smiled|frowned|nodded|shook \w+ head)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const actionPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(walked|ran|jumped|sat|stood|looked|turned|grabbed|pushed|pulled|opened|closed)/g;
  
  let match;
  while ((match = dialoguePattern.exec(text)) !== null) {
    const name = match[3];
    const dialogue = match[1];
    if (!characters.has(name)) {
      characters.set(name, { name, dialogues: [], actions: [] });
    }
    characters.get(name).dialogues.push(dialogue);
  }
  
  while ((match = actionPattern.exec(text)) !== null) {
    const name = match[1];
    if (name.split(' ').length <= 3) {
      if (!characters.has(name)) {
        characters.set(name, { name, dialogues: [], actions: [] });
      }
      characters.get(name).actions.push(match[0]);
    }
  }
  
  return Array.from(characters.values()).filter(char => 
    char.dialogues.length > 0 || char.actions.length > 1
  );
}

function extractPlaces(text) {
  const places = new Map();
  
  const placeIndicators = [
    /(?:in|at|to|from|near|inside|outside|behind|beneath|above|below)\s+the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:entered|left|arrived at|departed from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /The\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:was|were|stood|lay|stretched)/g
  ];
  
  placeIndicators.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const place = match[1];
      if (!places.has(place) && place.length > 3) {
        const context = text.substring(
          Math.max(0, match.index - 50),
          Math.min(text.length, match.index + match[0].length + 50)
        );
        places.set(place, { name: place, context });
      }
    }
  });
  
  return Array.from(places.values());
}

function extractEvents(text) {
  const events = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const eventPatterns = [
    /(?:suddenly|then|after|before|when|while|as soon as)/i,
    /(?:discovered|found|realized|learned|understood|saw|heard|felt)/i,
    /(?:attacked|defended|escaped|captured|rescued|saved)/i,
    /(?:arrived|departed|traveled|journeyed|returned)/i,
    /(?:died|born|married|betrayed|revealed)/i
  ];
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    const hasEventPattern = eventPatterns.some(pattern => pattern.test(trimmed));
    const hasCharacter = /[A-Z][a-z]+/.test(trimmed);
    
    if (hasEventPattern && hasCharacter && trimmed.split(' ').length > 5) {
      events.push({
        text: trimmed,
        importance: calculateImportance(trimmed)
      });
    }
  });
  
  return events
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .map(e => e.text);
}

function extractItems(text) {
  const items = new Map();
  
  const itemPatterns = [
    /(?:picked up|grabbed|held|carried|found|discovered)\s+(?:a|an|the)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
    /(?:a|an|the)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:glowed|shimmered|hummed|pulsed|gleamed)/gi,
    /(?:ancient|magical|enchanted|cursed|blessed|legendary)\s+([a-z]+(?:\s+[a-z]+)*)/gi
  ];
  
  itemPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].toLowerCase();
      if (!items.has(item) && item.length > 3) {
        const context = text.substring(
          Math.max(0, match.index - 30),
          Math.min(text.length, match.index + match[0].length + 30)
        );
        items.set(item, { name: item, context });
      }
    }
  });
  
  return Array.from(items.values());
}

function calculateImportance(text) {
  let importance = 0;
  
  const importantWords = [
    'died', 'death', 'born', 'birth', 'married', 'betrayed', 'revealed',
    'discovered', 'destroyed', 'created', 'transformed', 'cursed', 'blessed'
  ];
  
  importantWords.forEach(word => {
    if (text.toLowerCase().includes(word)) importance += 2;
  });
  
  if (/[A-Z][a-z]+/.test(text)) importance += 1;
  if (text.includes('!')) importance += 1;
  
  return importance;
}

module.exports = { analyzeText };