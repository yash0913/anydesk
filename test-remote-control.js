#!/usr/bin/env node

/**
 * Remote Control Test Script
 * Tests the fixed mouse click implementation
 */

const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('🧪 ===== REMOTE CONTROL TEST SCRIPT =====');

// Test configuration
const TEST_CONFIG = {
  agentPort: 17600,
  testClicks: [
    { type: 'click', x: 0.5, y: 0.5, button: 'left' },
    { type: 'click', x: 0.3, y: 0.3, button: 'left' },
    { type: 'click', x: 0.7, y: 0.7, button: 'right' }
  ]
};

async function testAgentHealth() {
  console.log('🔍 Testing agent health...');
  
  try {
    const response = await fetch(`http://localhost:${TEST_CONFIG.agentPort}/device-id`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Agent is healthy:', data.deviceId);
      return true;
    }
  } catch (error) {
    console.log('❌ Agent not responding:', error.message);
    return false;
  }
  
  return false;
}

async function testClickInjection() {
  console.log('🖱️ Testing click injection...');
  
  // Test 1: Check if we can open Notepad and click inside it
  console.log('📝 Opening Notepad for testing...');
  
  const notepad = spawn('notepad.exe');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for notepad to open
  
  console.log('🎯 Please ensure Notepad is visible and focused...');
  console.log('⏱️ Testing clicks in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Send test clicks to agent
  for (const click of TEST_CONFIG.testClicks) {
    console.log(`🖱️ Sending click: ${click.button} at (${click.x}, ${click.y})`);
    
    try {
      const response = await fetch(`http://localhost:${TEST_CONFIG.agentPort}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(click)
      });
      
      if (response.ok) {
        console.log('✅ Click sent successfully');
      } else {
        console.log('❌ Click failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Click error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between clicks
  }
  
  console.log('🔍 Check if Notepad received the clicks...');
  console.log('⏱️ Closing Notepad in 5 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Close notepad
  notepad.kill();
  
  console.log('✅ Click injection test completed');
}

async function testWebRTCConnection() {
  console.log('🌐 Testing WebRTC data channel...');
  
  // This would require a full WebRTC setup
  // For now, just test the agent's WebSocket endpoint
  console.log('📡 WebRTC test requires full remote session setup');
  console.log('🔗 Please test through the web interface');
}

async function main() {
  console.log('🚀 Starting remote control tests...\n');
  
  // Test 1: Agent health
  const agentHealthy = await testAgentHealth();
  if (!agentHealthy) {
    console.log('❌ Agent is not running. Please start the agent first.');
    console.log('💡 Run: npm run electron (or start the agent directly)');
    return;
  }
  
  // Test 2: Click injection
  await testClickInjection();
  
  // Test 3: WebRTC (placeholder)
  await testWebRTCConnection();
  
  console.log('\n🎉 ===== TEST COMPLETED =====');
  console.log('📋 Results:');
  console.log('  ✅ Agent health: PASSED');
  console.log('  ✅ Click injection: TESTED');
  console.log('  ⏳ WebRTC data channel: Requires web interface');
  console.log('\n📖 Check agent logs for detailed click injection results');
  console.log('🔍 Look for "[MouseKeyboardController]" and "[Mouse]" log entries');
}

// Run tests
main().catch(console.error);
