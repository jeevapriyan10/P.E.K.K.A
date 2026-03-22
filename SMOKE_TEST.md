# 🔥 **SMOKE TEST - 15 Minute Quick Check**

**Run this BEFORE full test plan to catch showstoppers**

---

## **PREP**
```bash
# Clear any old cache
npx expo start --clear
# Use iOS simulator or Android emulator
```

---

## **TEST 1: ONBOARDING (3 min)**

1. Fresh launch → Should see onboarding (not dashboard)
2. Click Next with empty name → Should show error
3. Fill: John, 25 → Next
4. Step 2: Left height empty → Next → Error
5. Fill height: 175 → Next
6. Step 3: Leave weight empty → Next → Error
7. Fill weight: 70, goal: 68 → Next
8. Step 4: Select "Lose Fat", "Moderate" → Finish
9. ✅ Should land on dashboard with greeting "Good..., John"

**CHECK:** No crashes, validation works

---

## **TEST 2: DASHBOARD (1 min)**

1. Wait for dashboard to load
2. ✅ Should see:
   - Greeting with name
   - Date
   - 3 ring charts (calories, protein, water)
   - AI Summary card
   - Streak heatmap
   - Streak cards (maybe 0s)
3. Pull down to refresh
4. ✅ Should reload without crash

**CHECK:** All components render

---

## **TEST 3: FOOD LOGGING (3 min)**

1. Tap "Log" tab
2. Tap "+ Add Food" on Breakfast
3. Search "rice"
4. ✅ Results appear after ~300ms
5. Tap result
6. ✅ Food detail opens
7. Enter 150g, tap Add
8. ✅ Returns to Log, entry shows in Breakfast
9. Ring charts update

**CHECK:** Search works, no crashes, data saves

---

## **TEST 4: WORKOUT (4 min)**

1. Tap "Workout" tab
2. Tap "Chest/Shoulder" template
3. Tap "Start Timer"
4. ✅ Active workout screen, timer running
5. See exercises loaded (5 total)
6. For first set: weight 40, reps 10, tap checkbox
7. Tap "+ ADD SET" → New set appears
8. Tap "Finish"
9. ✅ RPE modal appears
10. Select 8, tap "Complete Workout"
11. ✅ Summary screen shows, stats saved

**CHECK:** Full workout flow, no crashes

---

## **TEST 5: BARCODE SCANNER (2 min)**

1. In food search, tap "📷 Scan"
2. Grant camera permission if asked
3. ✅ Camera view with frame
4. Scan any barcode (use test: 012345678901)
5. ✅ Loading shows, then food detail or custom food
6. Tap back
7. ✅ Scanner ready again (not stuck)

**CHECK:** Scanner resets properly

---

## **TEST 6: SOCIAL FEATURES (2 min)**

1. Go to Settings → Profile tab
2. Enter username: "test_user_$(date +%s)" (make unique)
3. Display name: "Test User"
4. Toggle Public Profile ON
5. Tap Save → Success alert
6. Go to Social tab → Feed
7. ✅ Shows "Your Story" and empty feed
8. Tap + in header → Create post
9. Enter text, tap Post
10. ✅ Post appears in feed
11. Tap heart → Should toggle
12. Tap comment → Comment section opens
13. Type comment, submit → Shows

**CHECK:** Social features work

---

## **TEST 7: EDGE CASES (3 min)**

1. **Turn OFF network**
2. Go to Dashboard → Should see "Offline Mode" banner
3. Try AI Summary → Should show fallback or cached
4. Try create post → Should still save locally
5. Turn network back ON → Banner gone

6. **Rapid actions:**
   - Spam tap Next in onboarding → Should not crash
   - Rapidly switch tabs → Should handle gracefully

**CHECK:** Error handling works

---

## **TEST 8: SETTINGS VALIDATION (2 min)**

1. Go to Settings
2. In Profile tab:
   - Clear name → Save → Should show error alert
   - Set name: "Test", age: "abc" → Save → Error
   - Set age: "200" → Save → Error
   - Set valid data → Save → Success

**CHECK:** Validation prevents NaN/invalid data

---

## **RESULTS**

**If ALL ✅:** App is deployment-ready

**If any ❌:**
- Note which test failed
- Check console for errors
- File bug report with steps to reproduce

---

## **CRITICAL REGRESSIONS TO WATCH**

- ❌ Dashboard crashes on load (dynamic require issue)
- ❌ Food search shows `[object Object]` (timeout type issue)
- ❌ Onboarding skips validation (can save empty data)
- ❌ Scanner gets stuck on first scan (barcode reset issue)
- ❌ Settings save with age="" → NaN in DB
- ❌ Social feed blank with no error on network fail
- ❌ Memory growth after many achievements (timeout leak)

**None of these should happen!** If any do, DO NOT DEPLOY.

---

## **NEXT STEPS AFTER SMOKE TEST**

1. ✅ All passed → Run full TEST_PLAN.md (45 min)
2. ✅ Full plan passed → Check build:
   ```bash
   eas build --platform all --profile production
   ```
3. ✅ Build succeeds → Deploy to stores

**Time estimate:** 1 hour for smoke + full test = ~1.5 hours total

**Ready to start?** Begin TEST 1 and report results!
