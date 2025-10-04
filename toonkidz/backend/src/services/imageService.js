const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Safety prompts
const SAFETY_PROMPT = "";
const NEGATIVE_PROMPT = "violence, weapons, blood, gore, scary, horror, frightening, inappropriate, adult content, sad, depressing, dark, menacing, dangerous, harmful, unsafe, fighting, arguing, crying";

class ImageService {
  static async generateImage(prompt, steps = 20, numImages = 4, keywords = []) {
    const keywordsText = Array.isArray(keywords) && keywords.length > 0
    ? ` Keywords: ${keywords.join(', ')}.`
    : '';
    // Combine user prompt with safety guidelines
    const enhancedPrompt = `${SAFETY_PROMPT}. ${prompt}${keywordsText}`;
    
    console.log(`Generating ${numImages} images for prompt: "${enhancedPrompt}" with ${steps} steps`);
    console.log(`Using negative prompt: "${NEGATIVE_PROMPT}"`);
    
    // Verify script exists
    const scriptPath = path.join(__dirname, '../../../gpu/scripts/generate.py');
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Image generation script not found');
    }
    
    // Verify generated directory exists
    const generatedDir = path.join(__dirname, '../../../storage/images/generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // Find Python executable
    const pythonCmd = await this.findPythonExecutable();
    console.log(`Using Python command: ${pythonCmd}`);
    
    // Execute Python script with safety prompts
    const python = spawn(pythonCmd, [scriptPath, enhancedPrompt, steps.toString(), numImages.toString(), NEGATIVE_PROMPT], {
      cwd: generatedDir
    });
    
    const output = await this.handlePythonProcess(python);
    
    // Parse Python output
    const filenames = this.parsePythonOutput(output);
    console.log(`Generated images: ${filenames.join(', ')}`);
    
    // Check Cloudinary configuration
    this.checkCloudinaryConfig();
    
    // Upload images to Cloudinary
    return await this.uploadToCloudinary(filenames, generatedDir);
  }
  
  static async findPythonExecutable() {
    const pythonCommands = ['python', 'python3', 'py'];
    
    for (const cmd of pythonCommands) {
      try {
        const testPython = spawn(cmd, ['--version']);
        await new Promise((resolve, reject) => {
          testPython.on('close', (code) => {
            if (code === 0) resolve();
            else reject();
          });
          testPython.on('error', reject);
        });
        return cmd;
      } catch (e) {
        console.log(`${cmd} not available, trying next...`);
      }
    }
    
    throw new Error('Python not found on server');
  }
  
  static handlePythonProcess(python) {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`Python stderr: ${data}`);
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}. Error: ${error}`));
        } else {
          resolve(output);
        }
      });
      
      python.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }
  
  static parsePythonOutput(output) {
    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    
    try {
      const filenames = JSON.parse(jsonLine);
      if (!Array.isArray(filenames)) {
        throw new Error('Expected an array of filenames');
      }
      return filenames;
    } catch (e) {
      throw new Error(`Failed to parse JSON from Python output: ${jsonLine}`);
    }
  }
  
  static checkCloudinaryConfig() {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary not configured');
    }
  }
  
  static async uploadToCloudinary(filenames, generatedDir) {
    const imageUrls = [];
    const uploadErrors = [];
    
    for (const filename of filenames) {
      const filepath = path.join(generatedDir, filename);
      
      if (fs.existsSync(filepath)) {
        try {
          console.log(`Uploading ${filename} to Cloudinary...`);
          const result = await cloudinary.uploader.upload(filepath, {
            folder: 'generated-images',
            public_id: `generated_${Date.now()}_${filename}`,
            resource_type: 'image'
          });
          imageUrls.push(result.secure_url);
          
          // Delete local file after successful upload
          fs.unlinkSync(filepath);
          console.log(`Uploaded and deleted: ${filename}`);
        } catch (uploadError) {
          console.error(`Error uploading ${filename}:`, uploadError);
          uploadErrors.push(filename);
        }
      } else {
        console.error(`File not found: ${filepath}`);
        uploadErrors.push(filename);
      }
    }
    
    if (uploadErrors.length > 0) {
      if (imageUrls.length > 0) {
        return {
          imageUrls,
          warning: `Some images failed to upload: ${uploadErrors.join(', ')}`
        };
      } else {
        throw new Error(`Failed to upload images: ${uploadErrors.join(', ')}`);
      }
    }
    
    return { imageUrls };
  }
}

module.exports = ImageService;