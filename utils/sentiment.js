function getSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'love', 'best', 'nice', 'tasty'];
    const negativeWords = ['bad', 'cold', 'slow', 'terrible', 'overpriced', 'underwhelming', 'soggy', 'disappointed'];
  
    let score = 0;
    const words = text.toLowerCase().split(/\W+/);
  
    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });
  
    return score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
  }
  
  module.exports = getSentiment;
  