# P.E.K.K.A - Critical User Flow Test Plan

## **Pre-Test Setup**
- [ ] Ensure `EXPO_PUBLIC_GEMINI_KEY` is set in `.env`
- [ ] Run `npx expo start --clear` to start fresh
- [ ] Use a clean simulator/device (or clear app data)
- [ ] Have test data ready: weight ~70kg, height ~175cm, age ~25

---

## **FLOW 1: FIRST LAUNCH & ONBOARDING**

### Test Steps:
1. **Launch App**
   - Expected: Loading state shows "Initializing..."
   - Should transition to onboarding (not dashboard)
   - Check: No crashes, database initializes

2. **Step 1 - Basic Info**
   - Enter empty name, age "999" → Click Next
   - Expected: Validation errors appear
   - Fix inputs, enter: Name "John", Age "25"
   - Click Next
   - Expected: Advances to step 2

3. **Step 2 - Physical Info**
   - Leave height empty → Click Next
   - Expected: Height validation error
   - Enter height "175"
   - Click Next
   - Expected: Advances to step 3

4. **Step 3 - Weight Goals**
   - Leave current weight empty → Click Next
   - Expected: Weight validation error
   - Enter current weight "70", goal weight "68"
   - Click Next
   - Expected: Advances to step 4

5. **Step 4 - Goals & Activity**
   - Select "Lose Fat", "Moderate"
   - Click Finish
   - Expected: Redirects to dashboard
   - Check: Toast notification? (maybe)

6. **Verify DB**
   - Check `users` table has 1 record
   - Check `social_profile` table has 1 record

**PASS CRITERIA:** All validations work, data saves, smooth navigation

---

## **FLOW 2: DASHBOARD & DAILY TRACKING**

### Test Steps:
1. **Load Dashboard**
   - Expected: Shows "Good Morning/Afternoon/Evening, John"
   - Expected: Current date displayed correctly
   - Expected: 3 ring charts (Calories, Protein, Water) at 0/2000, 0/150, 0/3000

2. **AI Summary Card**
   - Expected: Shows AI-generated message or fallback
   - If API key set: Should show personalized summary
   - If not: Shows fallback message "I'm currently resting..."

3. **Offline Banner Test**
   - Turn off network
   - Expected: Orange "Offline Mode" banner appears
   - Turn network back on
   - Expected: Banner disappears

4. **Streak Heatmap**
   - Expected: Shows last 28 days activity (empty initially)
   - Color coding works

5. **Streak Cards**
   - Expected: May show 0s initially or from DB

**PASS CRITERIA:** Dashboard loads without errors, all components render

---

## **FLOW 3: NUTRITION LOGGING**

### Test Steps:
1. **Navigate to Log Tab**
   - Click "Log" tab
   - Expected: Shows daily macro pie chart
   - Expected: 4 meal sections (Breakfast, Lunch, Dinner, Snacks)

2. **Search Food**
   - Click "+ Add Food" on Breakfast
   - Expected: Navigates to food search
   - Type "rice" in search
   - Expected: Debounced search after 300ms
   - Expected: Shows food items from database
   - Tap on "White Rice"
   - Expected: Navigate to food detail

3. **Add Food Entry**
   - Verify pre-filled values (calories, protein, carbs, fat)
   - Enter grams: "150"
   - Tap "Add"
   - Expected: Returns to Log, shows entry in Breakfast
   - Expected: Macro rings update

4. **Water Tracking**
   - Click "+250" or "+500"
   - Expected: Water ring updates
   - Click "Reset Progress"
   - Expected: Water returns to 0

5. **Custom Food**
   - Navigate back to search
   - Tap "+ Custom Food" FAB
   - Expected: Opens custom food form
   - Fill and save

6. **Delete Entry**
   - Swipe or tap delete on food entry
   - Expected: Entry removed, macros update

**PASS CRITERIA:** All food operations work, no crashes in search

---

## **FLOW 4: WORKOUT TRACKING**

### Test Steps:
1. **Navigate to Workout Tab**
   - Click "Workout" tab
   - Expected: Shows workout options screen

2. **Start Template Workout**
   - Tap "Chest/Shoulder" template
   - Expected: Alert "Start Chest & Shoulders?"
   - Tap "Start Timer"
   - Expected: Navigates to active workout
   - Expected: Timer starts immediately
   - Expected: 5 exercises added

3. **Log Sets**
   - For first exercise, edit weight: "40"
   - Edit reps: "10"
   - Tap checkbox to mark set done
   - Expected: Set highlights as done
   - Add another set: tap "+ ADD SET"
   - Expected: New set appears

4. **Add Exercise**
   - Tap "Add Exercise" FAB
   - Expected: Navigates to exercise search
   - Search "squat", select one
   - Expected: Exercise added to workout

5. **Complete Workout**
   - Tap "Finish" button
   - Expected: Modal with RPE 1-10 appears
   - Select RPE 8
   - Tap "Complete Workout"
   - Expected: Saves to DB, navigates to summary
   - Expected: Achievement may trigger (first workout)

6. **Validation Test**
   - Start workout but don't add any exercises
   - Try to finish
   - Expected: Alert "Add at least one exercise"
   - Add exercise but don't mark any sets done
   - Try to finish
   - Expected: Alert "Mark at least one set as done"

7. **Pause/Resume**
   - During workout, tap pause icon
   - Expected: Timer pauses
   - Tap play
   - Expected: Timer resumes

**PASS CRITERIA:** Full workout lifecycle works, validation prevents invalid saves

---

## **FLOW 5: BARCODE SCANNER**

### Test Steps:
1. **Navigate to Food Search → Scan**
   - Tap "📷 Scan" in food search header
   - Expected: Camera permission prompt (first time)
   - Grant permission
   - Expected: Camera view with viewfinder frame

2. **Scan Barcode**
   - Use test barcode: `012345678901` (or any real product)
   - Point camera at barcode
   - Expected: Scans automatically
   - Expected: Loading indicator shows
   - Expected: Navigates to food detail with product data
   - OR: If product not found, navigates to custom food with barcode filled

3. **Rescan Test**
   - After scan, navigate back to scanner
   - Expected: Scanner is ready immediately (fixed!)
   - Scan another barcode
   - Expected: Works again

4. **Error Handling**
   - Scan invalid barcode
   - Expected: Still navigates to custom food (graceful)

**PASS CRITERIA:** Scanner works repeatedly, handles errors gracefully

---

## **FLOW 6: SOCIAL FEATURES**

### Test Steps:
1. **Setup Social Profile**
   - Navigate to Settings → Profile tab
   - Scroll to Social Identity
   - Enter username: "john_doe"
   - Display name: "John Doe"
   - Bio: "Fitness journey"
   - Select avatar icon
   - Toggle "Public Profile" ON
   - Toggle sharing options as desired
   - Tap "Save"
   - Expected: Success alert

2. **Feed Navigation**
   - Navigate to Social → Feed tab
   - Expected: Shows empty state initially
   - Expected: Stories section at top with "Your Story"

3. **Create Post**
   - Tap "+" button in header
   - Expected: Create Post screen
   - Enter text: "Great workout today!"
   - Optionally add image
   - Optionally attach workout
   - Select visibility: Public
   - Tap "Post"
   - Expected: Returns to feed, post appears
   - Expected: Shows correct category badge

4. **Interact with Post**
   - Tap heart icon
   - Expected: Count increments, heart fills red
   - Tap again
   - Expected: Count decrements, heart outline
   - Tap comment icon
   - Expected: Comment section appears
   - Type comment, submit
   - Expected: Comment appears

5. **Stories**
   - In Social → Feed, tap "Your Story"
   - Expected: Camera/gallery to create story
   - (Skip actual creation for speed)

6. **Error State**
   - Turn off network
   - Refresh feed
   - Expected: Error message with retry button
   - Tap "Retry"
   - Expected: Attempts load again

**PASS CRITERIA:** Social features work, posts show, interactions persist

---

## **FLOW 7: PROGRESS TRACKING**

### Test Steps:
1. **Weight Log**
   - Navigate to Progress tab
   - Expected: Shows weight chart
   - Tap "+" to add weight entry
   - Enter: 70.5 kg
   - Add note: "Morning weight"
   - Save
   - Expected: Chart updates with new point

2. **Achievements**
   - Navigate to Achievements screen
   - Expected: Shows empty or some achievements from workouts
   - Should show "First Step" if did workout

3. **Progress Photos**
   - Navigate to Progress Photos
   - Tap to add photo
   - Expected: Camera/gallery opens
   - Select photo
   - Expected: Photo saved with date

**PASS CRITERIA:** Progress data saves and displays correctly

---

## **FLOW 8: SETTINGS & NOTIFICATIONS**

### Test Steps:
1. **Edit Profile in Settings**
   - Navigate to Settings
   - Verify profile data loaded from DB
   - Change weight: "75"
   - Change activity: "Active"
   - Change goal: "gain"
   - Tap "Save"
   - Expected: Success alert
   - Navigate to dashboard
   - Expected: TDEE recalculated with new values

2. **Notifications Tab**
   - In Settings, tap "Notifications"
   - Toggle "Meal Reminders" ON
   - Expected: Time pickers appear
   - Adjust times if needed
   - Toggle "Water Reminder" ON
   - Expected: No crash

3. **Image Upload**
   - In Settings → Profile, tap camera icon
   - Select image from gallery
   - Expected: Avatar updates in UI immediately

**PASS CRITERIA:** Settings save correctly, notifications configured without crashes

---

## **FLOW 9: ERROR & EDGE CASES**

### Test Steps:
1. **Database Out of Space** (unlikely but test graceful errors)
   - Not easily testable, but code should handle

2. **Network Failures**
   - Turn off network, try AI summary
   - Expected: No crash, shows fallback or cached data
   - Turn off network, create post with image
   - Expected: Should still save locally (check DB)
   - Turn off network, scan barcode
   - Expected: Error handling, returns to previous screen

3. **Missing Data**
   - Try to view feed without social profile
   - Expected: Graceful handling, prompts to create profile

4. **Rapid Navigation**
   - Rapidly switch between tabs
   - Expected: No crashes, may show loading states

5. **Orientation Changes** (if applicable)
   - Rotate device during workout
   - Expected: UI adjusts, timer continues

**PASS CRITERIA:** App handles all errors gracefully, no crashes

---

## **FLOW 10: PERFORMANCE CHECKS**

### Test Steps:
1. **Load Times**
   - Cold start: < 3 seconds to dashboard
   - Tab navigation: < 200ms
   - Search results: < 500ms after debounce

2. **Memory**
   - Run through 5+ workouts
   - Check memory doesn't grow unbounded (use dev tools)
   - No memory leak alerts

3. **Database Queries**
   - Load dashboard with 100+ food entries
   - Expected: Loads in < 500ms
   - Load feed with 50+ posts
   - Expected: Smooth scrolling

4. **Image Handling**
   - Upload multiple images
   - Expected: No crashes, images display correctly in feed/avatar

**PASS CRITERIA:** App feels responsive, no jank, memory stable

---

## **AUTOMATED CHECKLIST**

Run these commands:

```bash
# Type checking
npx tsc --noEmit

# Linting (if configured)
npm run lint

# Test build
npx expo export --platform ios
npx expo export --platform android
```

---

## **CRITICAL FIXES TO VERIFY**

- [ ] Dashboard no `require()` dynamic import
- [ ] Food search timeout uses correct type
- [ ] AchievementProvider no memory leak (check console, no repeated timeout errors)
- [ ] Onboarding validation prevents invalid data
- [ ] Image picker never crashes on cancel
- [ ] Settings NaN issue fixed (can save with validators)
- [ ] Barcode scanner resets properly
- [ ] Error boundary catches crashes
- [ ] Workout finish validation works
- [ ] AI service handles missing API key
- [ ] Social feed shows errors with retry

---

## **POST-TEST VALIDATION**

After testing all flows:

1. **Data Integrity Check**
```sql
-- Run in SQLite browser or use app DB viewer
SELECT * FROM users;
SELECT * FROM workout_sessions;
SELECT * FROM food_entries WHERE date = '2025-03-19';
SELECT * FROM feed_posts;
```
All data should be valid, no NULL in required fields

2. **Edge Cases**
   - What happens if user skips profile setup?
   - What if network drops during save?
   - What if Gemini API rate limits?

3. **Regression**
   - Did any fix break something else?
   - Check all modified screens still work

---

## **DEPLOYMENT DECISION**

If **ALL** of these pass:
- ✅ All 10 flows complete without crashes
- ✅ Error cases handled gracefully
- ✅ No console errors (except expected warnings)
- ✅ Data persists correctly
- ✅ Performance acceptable

**→ APP IS READY FOR DEPLOYMENT**

If any fail:
- 🔴 Critical crash → DO NOT DEPLOY, fix immediately
- 🟡 Minor UI issue → Can deploy with known issue noted
- 🟢 Cosmetic → Deploy, fix in v1.0.5

---

**Test Execution Time Estimate:** 45-60 minutes for thorough testing
**Ready to begin testing?** Start with Flow 1 and report results.
