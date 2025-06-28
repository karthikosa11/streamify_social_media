import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

function testAuth() {
  console.log('🔐 Testing authentication configuration...');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  if (!process.env.JWT_SECRET) {
    console.log('\n❌ JWT_SECRET is not configured!');
    console.log('Please set JWT_SECRET in your .env file');
    return;
  }
  
  try {
    console.log('\n🧪 Testing JWT token creation and verification...');
    
    // Test data
    const testUserId = '507f1f77bcf86cd799439011'; // Sample ObjectId
    const testPayload = { userId: testUserId };
    
    // Create a test token
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ JWT token created successfully');
    console.log('Token length:', token.length);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('Decoded payload:', decoded);
    
    if (decoded.userId === testUserId) {
      console.log('✅ Token payload matches expected data');
    } else {
      console.log('❌ Token payload does not match expected data');
    }
    
    console.log('\n🎉 Authentication configuration is working correctly!');
    
  } catch (error) {
    console.log('\n❌ Authentication test failed:');
    console.error('Error details:', {
      name: error.name,
      message: error.message
    });
    
    if (error.name === 'JsonWebTokenError') {
      console.log('\n💡 This usually means the JWT_SECRET is invalid or corrupted');
    }
  }
}

// Run the test
testAuth(); 