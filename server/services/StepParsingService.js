const Tesseract = require('tesseract.js');
const fs = require('fs');

class StepParsingService {
  // Extract step count from image using OCR
  static async extractStepsFromImage(imagePath) {
    try {
      console.log('Starting OCR processing...');
      
      const result = await Tesseract.recognize(
        imagePath,
        'eng', // English language
        {
          logger: m => console.log(m) // Optional: log progress
        }
      );

      const text = result.data.text;
      console.log('Extracted text:', text);

      // Parse step count from the text
      const stepCount = this.parseStepCount(text);
      
      // Clean up the uploaded file
      fs.unlinkSync(imagePath);
      
      return stepCount;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  // Parse step count from OCR text
  static parseStepCount(text) {
    // Common patterns for step counts in fitness apps
    const patterns = [
      /(\d{1,3}(?:,\d{3})*)\s*steps?/i,           // "10,250 steps"
      /steps?\s*(\d{1,3}(?:,\d{3})*)/i,           // "steps 10,250"
      /(\d{1,3}(?:,\d{3})*)\s*st/i,               // "10,250 st"
      /(\d{1,3}(?:,\d{3})*)\s*count/i,            // "10,250 count"
      /(\d{1,3}(?:,\d{3})*)\s*$/m,                // Just a number at end of line
      /(\d{1,3}(?:,\d{3})*)/                      // Any large number (fallback)
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const stepCount = parseInt(match[1].replace(/,/g, ''));
        if (stepCount > 0 && stepCount < 100000) { // Reasonable step range
          return stepCount;
        }
      }
    }

    throw new Error('Could not find step count in image');
  }
}

module.exports = StepParsingService;