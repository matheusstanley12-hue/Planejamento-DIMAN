window.DIMAN_CONVERSATION_MEMORY = (function() {
  // A memória só vive durante a execução. Descartada no refresh.
  let chatHistory = [];
  const MAX_HISTORY = 10; // Mantém as últimas 10 interações (5 pares)

  function addMessage(role, content) {
    chatHistory.push({ role, content });
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
  }

  function getHistory() {
    return [...chatHistory];
  }

  function clearHistory() {
    chatHistory = [];
  }

  return {
    addMessage,
    getHistory,
    clearHistory
  };
})();
