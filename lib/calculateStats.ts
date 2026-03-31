/**
 * Calculates typing accuracy as a percentage.
 */
export function calculateAccuracy(originalText: string, typedText: string): number {
  if (typedText.length === 0) return 100;
  
  let correctChars = 0;
  for (let i = 0; i < typedText.length; i++) {
    if (typedText[i] === originalText[i]) {
      correctChars++;
    }
  }
  
  return Math.round((correctChars / typedText.length) * 100);
}

/**
 * Calculates Words Per Minute (WPM).
 * Standard typing metrics assume 5 characters = 1 word.
 */
export function calculateWPM(typedText: string, startTime: number, endTime: number): number {
  const timeInMinutes = (endTime - startTime) / 60000; // Convert milliseconds to minutes
  
  if (timeInMinutes <= 0) return 0;
  
  const wordsTyped = typedText.length / 5;
  return Math.round(wordsTyped / timeInMinutes);
}