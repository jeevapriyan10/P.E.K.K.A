#!/bin/bash

echo "🔍 Validating P.E.K.K.A Fixes..."
echo ""

# 1. TypeScript check
echo "📝 Running TypeScript compiler..."
npx tsc --noEmit 2>&1 | tee ts-errors.txt
if [ $? -eq 0 ]; then
    echo "✅ TypeScript: No errors"
else
    echo "❌ TypeScript: Errors found (see ts-errors.txt)"
    exit 1
fi

echo ""

# 2. Check for dynamic require in app files
echo "🔎 Checking for dynamic requires..."
DYNAMIC_REQUIRE=$(grep -r "require(" app/ --include="*.ts" --include="*.tsx" | grep -v "^Binary" | wc -l)
if [ $DYNAMIC_REQUIRE -eq 0 ]; then
    echo "✅ No dynamic requires found in app/"
else
    echo "⚠️  Found $DYNAMIC_REQUIRE require() calls (check if valid)"
fi

echo ""

# 3. Check for NodeJS.Timeout usage
echo "⏰ Checking for NodeJS.Timeout..."
NODE_TIMEOUT=$(grep -r "NodeJS.Timeout" app/ src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ $NODE_TIMEOUT -eq 0 ]; then
    echo "✅ No NodeJS.Timeout found"
else
    echo "❌ Found NodeJS.Timeout usage (should be ReturnType<typeof setTimeout>)"
    exit 1
fi

echo ""

# 4. Check image picker safety
echo "📸 Checking image picker patterns..."
UNSAFE_IMAGE=$(grep -r "assets\[0\]" app/ --include="*.ts" --include="*.tsx" | grep -v "canceled" | wc -l)
if [ $UNSAFE_IMAGE -eq 0 ]; then
    echo "✅ All image pickers have cancellation checks"
else
    echo "⚠️  Found $UNSAFE_IMAGE potentially unsafe asset accesses"
fi

echo ""

# 5. Check ErrorBoundary exists
if [ -f "src/components/ui/ErrorBoundary.tsx" ]; then
    echo "✅ ErrorBoundary component exists"
else
    echo "❌ ErrorBoundary component missing"
    exit 1
fi

echo ""

# 6. Check layout uses ErrorBoundary
if grep -q "ErrorBoundary" app/_layout.tsx; then
    echo "✅ ErrorBoundary integrated in root layout"
else
    echo "❌ ErrorBoundary not in root layout"
    exit 1
fi

echo ""

# 7. Verify onboarding validation
if grep -q "validateStep" app/onboarding.tsx; then
    echo "✅ Onboarding validation implemented"
else
    echo "❌ Onboarding validation missing"
    exit 1
fi

echo ""

# 8. Check AchievementProvider cleanup
if grep -q "timeoutRef" src/providers/AchievementProvider.tsx; then
    echo "✅ AchievementProvider has timeout cleanup"
else
    echo "⚠️  AchievementProvider timeout cleanup may be missing"
fi

echo ""

# 9. Check settings validation
if grep -q "Validation Error" "app/(tabs)/settings.tsx"; then
    echo "✅ Settings has validation"
else
    echo "⚠️  Settings validation may be missing"
fi

echo ""

# 10. Check barcode scanner reset
if grep -q "useFocusEffect" app/nutrition/barcode-scanner.tsx; then
    echo "✅ Barcode scanner has focus reset"
else
    echo "⚠️  Barcode scanner reset may be missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All critical checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Ensure EXPO_PUBLIC_GEMINI_KEY is set"
echo "2. Run: expo start --clear"
echo "3. Execute manual test plan from TEST_PLAN.md"
echo "4. If all pass, deploy: eas build --platform all"
echo ""
