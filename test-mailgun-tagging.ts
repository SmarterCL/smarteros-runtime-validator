// Test Mailgun with proper tagging
import { createMailgunAdapter } from './lib/mailgun-adapter';

async function testMailgunTagging() {
  try {
    console.log('🧪 Testing Mailgun adapter with tagging...\n');

    const mailer = createMailgunAdapter();

    // Test 1: Scout Alert
    console.log('📧 Sending scout alert...');
    const result1 = await mailer.sendScoutAlert({
      to: process.env.MAILGUN_TO || 'smarterbotcl@gmail.com',
      scoutTitle: 'Test Scout - API Monitoring',
      scoutGoal: 'Monitor api.smarterbot.cl availability',
      content: '<p>API is responding correctly. All endpoints are operational.</p>',
      severity: 'info',
      tenantRut: '76123456-7',
      scoutId: 'scout_test_001'
    });
    console.log('✅ Scout alert sent:', result1.id);
    console.log('   Tags: smarteros, runtime-validator, alert, severity:info, scout-alert, tenant:76123456-7\n');

    // Test 2: Validation Alert
    console.log('📧 Sending validation alert...');
    const result2 = await mailer.sendValidationAlert({
      to: process.env.MAILGUN_TO || 'smarterbotcl@gmail.com',
      domain: 'smarterbot.cl',
      failureType: 'link',
      details: 'Detected 2 broken links in checkout flow',
      tenantRut: '76123456-7'
    });
    console.log('✅ Validation alert sent:', result2.id);
    console.log('   Tags: smarteros, runtime-validator, alert, validation-failure, failure:link, tenant:76123456-7\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Check Mailgun dashboard:');
    console.log('   https://app.mailgun.com/mg/sending/domains/smarterbot.store');
    console.log('\n   You should see tags for tracking and filtering messages.');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMailgunTagging();
