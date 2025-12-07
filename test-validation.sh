#!/bin/bash
# SmarterOS Runtime Validator - Quick Test Script

echo "🚀 SmarterOS Runtime Validation Test"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f /root/smarteros-runtime-validator/.env ]; then
    echo "❌ .env file not found"
    echo "Please configure /root/smarteros-runtime-validator/.env first"
    exit 1
fi

# Test Supabase connectivity
echo "🔍 Testing Supabase connectivity..."
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL /root/smarteros-runtime-validator/.env | cut -d'=' -f2)
if curl -s --head --max-time 5 "$SUPABASE_URL" | head -n 1 | grep "HTTP" > /dev/null; then
    echo "✅ Supabase is reachable"
else
    echo "❌ Supabase is NOT reachable: $SUPABASE_URL"
    echo "Please verify the project URL and credentials"
    exit 1
fi

# Test Firecrawl API
echo "🔍 Testing Firecrawl API..."
FIRECRAWL_KEY=$(grep FIRECRAWL_API_KEY /root/smarteros-runtime-validator/.env | cut -d'=' -f2)
if [ -z "$FIRECRAWL_KEY" ]; then
    echo "❌ Firecrawl API key not configured"
    exit 1
else
    echo "✅ Firecrawl API key present"
fi

# Run validation
echo ""
echo "🎯 Executing validation for smarterbot.cl..."
echo ""

cd /root/smarteros-runtime-validator
node smarteros-adapter.js https://smarterbot.cl 76123456-7

echo ""
echo "✅ Test completed"
echo ""
echo "Check results in Supabase:"
echo "- runtime_executions"
echo "- runtime_link_failures"
echo "- runtime_url_deltas"
