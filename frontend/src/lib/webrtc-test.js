/**
 * WebRTC Test Utility
 * Run this in the browser console to test WebRTC connectivity
 */

export async function testWebRTCConnectivity() {
  // console.log('🧪 Testing WebRTC connectivity...');
  
  const iceServers = [
    // Google STUN servers (most reliable)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Single reliable TURN server
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ];

  try {
    // Create a test RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // console.log('✅ RTCPeerConnection created with ICE servers');

    // Create a dummy data channel to trigger ICE gathering
    const dc = pc.createDataChannel('test');
    
    // Set up event listeners
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // console.log('🧊 ICE Candidate:', {
        //   type: event.candidate.type,
        //   protocol: event.candidate.protocol,
        //   address: event.candidate.address,
        //   port: event.candidate.port,
        //   serverUrl: event.candidate.relatedAddress
        // });
      } else {
        // console.log('✅ ICE gathering completed');
      }
    };

    pc.onicegatheringstatechange = () => {
      // console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      // console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      // console.log('🔗 Connection state:', pc.connectionState);
    };

    // Create an offer to start ICE gathering
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // console.log('✅ ICE connectivity test started');

    // Wait for ICE gathering to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        // console.log('🧪 ICE test completed');
        pc.close();
        resolve(true);
      }, 5000); // Wait 5 seconds for ICE gathering
    });

  } catch (error) {
    // console.error('❌ WebRTC connectivity test failed:', error);
    return false;
  }
}

// Test specific ICE server
export function testSpecificIceServer(url, username = null, credential = null) {
  // console.log(`🔍 Testing specific ICE server: ${url}`);
  
  const iceServers = [{
    urls: url,
    ...(username && { username }),
    ...(credential && { credential })
  }];
  
  const pc = new RTCPeerConnection({ iceServers });
  
  pc.onicecandidateerror = (e) => {
    // console.error(`❌ ICE error for ${url}:`, e.errorText);
  };
  
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      // console.log(`✅ ICE candidate for ${url}:`, e.candidate.type);
    }
  };
  
  const dc = pc.createDataChannel('test');
  
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer))
    .then(() => {
      setTimeout(() => {
        // console.log(`🔍 ${url} test complete. State:`, pc.iceConnectionState);
        pc.close();
      }, 5000);
    })
    .catch(err => {
      // console.error(`❌ ${url} test failed:`, err);
    });
}

// Auto-run if this file is loaded directly
if (typeof window !== 'undefined') {
  window.testWebRTCConnectivity = testWebRTCConnectivity;
  window.testSpecificIceServer = testSpecificIceServer;
  // console.log('WebRTC test utility loaded. Run testWebRTCConnectivity() to test connectivity.');
  // console.log('Or run testSpecificIceServer("stun:stun.l.google.com:19302") to test a specific server.');
} 