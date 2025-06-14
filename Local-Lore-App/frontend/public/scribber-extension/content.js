let mcpConnection = null;

window.addEventListener('message', async (event) => {
  if (event.data.type === 'SCRIBBER_AI_REQUEST') {
    const { prompt, context, selectedText } = event.data;
    
    const fullPrompt = `
      You are helping write a novel. Here's the context:
      
      Characters: ${JSON.stringify(context.characters)}
      Places: ${JSON.stringify(context.places)}
      Recent Events: ${JSON.stringify(context.events)}
      
      ${selectedText ? `Selected text to rewrite: "${selectedText}"` : 'Continue from where the text ends.'}
      
      User request: ${prompt}
      
      Please provide creative, engaging prose that fits the story's tone and style.
    `;
    
    try {
      const response = await navigator.clipboard.writeText(fullPrompt);
      
      window.postMessage({
        type: 'SCRIBBER_AI_RESPONSE',
        text: 'Prompt copied to clipboard! Paste it in Claude Desktop and copy the response back here.',
        needsManualPaste: true
      }, '*');
      
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }
});

document.addEventListener('paste', (event) => {
  if (document.activeElement.classList.contains('editor-content')) {
    return;
  }
  
  const pastedText = event.clipboardData.getData('text');
  if (pastedText && pastedText.length > 100) {
    window.postMessage({
      type: 'SCRIBBER_AI_RESPONSE',
      text: pastedText
    }, '*');
  }
});